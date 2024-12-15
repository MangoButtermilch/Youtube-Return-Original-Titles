function clearLocalStorageData() {
    const cachePrefix = "return-org-titles";

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith(cachePrefix)) continue;
        localStorage.removeItem(key);
    }
    return 1;
}

function getLocalStorageSize() {
    const cachePrefix = "return-org-titles";
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith(cachePrefix)) continue;
        const value = localStorage.getItem(key);
        total += key.length + value.length;
    }
    return total;
}

function executeScript(script, resultHandler) {

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];

        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                function: script
            },
            (result) => {
                resultHandler(result);
            }
        );
    });
}

executeScript(getLocalStorageSize, (result) => {
    const cacheDisplay = document.querySelector("[data-cache-display]");
    const kb = result[0].result / 1000;
    cacheDisplay.innerText = kb.toLocaleString("en-GB").concat(" kb");
});

const clearCacheBtn = document.getElementById("clear-cache");
clearCacheBtn.addEventListener("click", () => {
    executeScript(clearLocalStorageData, (result) => { });
});