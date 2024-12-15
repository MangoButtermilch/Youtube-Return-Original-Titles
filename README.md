![alt text](logo.png)

# Chrome extension: Youtube Return Original Titles
 
## Replaces translated Youtube video titles with their original version.

### Features

The extension updates Youtube video titles for:
- default videos
    - sidebar recommendations
    - playlists
- shorts
- Youtube trends
- history
- subscription feed
- channels
- search results

All titles will be cached inside the `localStorage`.
If you click the extension icon, you can see a small panel.
It displays the current amount of storage used in `kb.
The cache can be cleared with a button.


### Installation

1. Download extension latest release
2. Move folder to any place
3. Delete `README.md` and `LICENSE` and `/example` folder
4. Goto [chrome://extensions/](chrome://extensions/)
5. Enable developer mode
6. Click `load unpacked` and choose downloaded folder
7. You can now turn off developer mode
8. Done

For Updates do the same.

### How it works:

- The extension recognizes if you are on your subscription page or watching a video
- It then checks each `500 ms` for videos and makes an `http request` to fetch their title 
  - This consumes a lot of bandwidth but there's no public API to do it in any other way
  - Titles will be then be cached to avoid making multiple requests for the same videos

### Contributions

If you want to fix something or add new features, feel free to make a PR.


### What's next

- Video descriptions
- ...

### Example

Channel from Anton Pretrov: https://www.youtube.com/@whatdamath

#### Without extension:

![alt text](/example/german.png)

#### With extension:

![alt text](/example/original.png)