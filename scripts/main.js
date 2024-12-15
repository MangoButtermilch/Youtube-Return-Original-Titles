var ReturnYoutubeOriginalTitles = (function () {

    const runningRequests = new Set();
    const parser = new DOMParser();
    const defaultIntervalMs = 500;
    const pathChangedEvent = "path-changed";
    const cachePrefix = "return-org-titles";

    function addToCache(videoId, videoTitle) {
        window.localStorage.setItem(cachePrefix.concat(videoId), videoTitle);
    }

    function getFromCache(videoId) {
        return window.localStorage.getItem(cachePrefix.concat(videoId));
    }

    /**
     * Observes changes in path and dispatches an event if change occoured.
     * Example: recognizes switch from /shorts to /feed/trends, ...
     */
    function observePathChanges() {
        let path = window.location.pathname;
        let oldPath = path;

        setInterval(() => {
            path = window.location.pathname;

            if (path !== oldPath) {
                oldPath = path;
                window.dispatchEvent(new CustomEvent(pathChangedEvent));
            }

        }, defaultIntervalMs);
    }

    async function getYouTubeTitle(watchId) {
        const url = `https://www.youtube.com${watchId}`;

        try {
            const response = await fetch(url);
            const text = await response.text();
            const doc = parser.parseFromString(text, 'text/html');
            const metaTitle = doc.querySelector('meta[property="og:title"]');
            return metaTitle ? metaTitle.content : '';
        } catch (error) {
            return "";
        }
    }

    /**
     * Creates interval for updating titles in views containing multiple videos (view could be something like sidebar, playlists, ...).
     * @param {string} videoSelector Selector for all videos in given view.
     * @param {string} titleSelector Selector for a title of a single video.
     * @returns {number} interval ID
     */
    async function createUpdateMultiViewTitlesInterval(videoSelector, titleSelector) {

        const interval = setInterval(async () => {
            const videos = document.querySelectorAll(videoSelector);

            for (let video of videos) {
                const anchor = video.querySelector("a");
                if (!anchor) continue;

                const videoId = anchor.getAttribute("href");
                const titleElement = video.querySelector(titleSelector);
                if (!titleElement) {
                    continue;
                }

                const cachedTitle = getFromCache(videoId);
                if (cachedTitle !== null) {
                    titleElement.removeAttribute("is-empty");//can happen for trends

                    titleElement.innerText = cachedTitle;
                    continue;
                }

                if (runningRequests.has(videoId)) continue;
                runningRequests.add(videoId);

                const videoTitle = await getYouTubeTitle(videoId);
                addToCache(videoId, videoTitle);

                //console.warn(titleElement.innerText + " => " + videoTitle);
                titleElement.innerText = videoTitle;
            }

        }, defaultIntervalMs);
        return interval;
    }

    (function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', afterDOMLoaded);
        } else {
            afterDOMLoaded();
        }
    })();

    function afterDOMLoaded() {
        observePathChanges();

        //intentionally not using observers because of youtubes content hydration which creates to many dom changes
        const intervals = [];
        run = async () => {

            const isStartPage = window.location.pathname === "/";
            const isOnTrendsPage = window.location.pathname === "/feed/trending";
            const isSubscriptionPage = window.location.pathname === "/feed/subscriptions";
            const isHistoryPage = window.location.pathname === "/feed/history";
            const isWatchingDefaultVideo = window.location.pathname === "/watch";
            const isWatchingShortsVideo = window.location.pathname.includes("/shorts/");

            if (isHistoryPage) {
                //history
                intervals.push(createUpdateMultiViewTitlesInterval("ytd-video-renderer", "a yt-formatted-string"));
            }

            if (isOnTrendsPage) {
                //trends
                intervals.push(createUpdateMultiViewTitlesInterval("ytd-video-renderer", "a yt-formatted-string"));
            }

            if (isSubscriptionPage) {
                //subscriptions
                intervals.push(createUpdateMultiViewTitlesInterval("ytd-rich-item-renderer", "#video-title-link yt-formatted-string"));
            }

            if (isStartPage) {
                //recommend videos on for you page
                intervals.push(createUpdateMultiViewTitlesInterval("ytd-rich-item-renderer", "#video-title-link yt-formatted-string"));
            }

            if (isWatchingDefaultVideo) {
                const videoId = window.location.pathname.concat(window.location.search);
                const cacheItem = getFromCache(videoId);

                const hasCache = cacheItem !== null;
                const originalTitle = hasCache ? cacheItem : (await getYouTubeTitle(videoId));

                const mainTitleInterval = setInterval(() => {
                    const videoTitleElement = document.querySelector("#title > h1 > yt-formatted-string");
                    if (!videoTitleElement) return;

                    videoTitleElement.innerHTML = originalTitle;
                    window.clearInterval(mainTitleInterval);
                }, defaultIntervalMs);

                intervals.push(mainTitleInterval);

                //sidebar videos
                intervals.push(createUpdateMultiViewTitlesInterval("ytd-compact-video-renderer", "h3 > span#video-title"));

                //playlists
                intervals.push(createUpdateMultiViewTitlesInterval("ytd-playlist-panel-video-renderer", "h4 > span#video-title"));
            }

            if (isWatchingShortsVideo) {


                const shortsTitleInterval = setInterval(async () => {
                    const shortsTitleElement = document.querySelector("#shorts-container [is-active] .ytShortsVideoTitleViewModelShortsVideoTitle > span");
                    if (!shortsTitleElement) return;

                    const activeShortId = window.location.pathname; // contains /shorts/hp6234...

                    const cacheItem = getFromCache(activeShortId);
                    if (cacheItem !== null) {
                        shortsTitleElement.innerText = cacheItem;
                        return;
                    }

                    if (runningRequests.has(activeShortId)) return;
                    runningRequests.add(activeShortId);

                    const shortTitle = await getYouTubeTitle(activeShortId);
                    addToCache(activeShortId, shortTitle);

                    shortsTitleElement.innerText = shortTitle;
                }, defaultIntervalMs);

                intervals.push(shortsTitleInterval);
            }
        }

        clearAllIntervals = () => {
            for (let interval of intervals) {
                window.clearInterval(interval);
            }
        }

        run();

        window.addEventListener(pathChangedEvent, () => {
            clearAllIntervals();
            run();
        });

    }

})();