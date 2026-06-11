# Present Progressive — Grammar Guide

A static site for learning the **Present Progressive** tense, with three sections:

1. **Introduction** — 4-part video gallery (upload, play/pause, restart)
2. **Practice** — fill-in-the-blank sentences
3. **Quiz** — multiple-choice questions

Ready for [GitHub Pages](https://pages.github.com/).

## Preview locally

Open `index.html` in your browser.

## Video uploads

Each of the four introduction videos has its own upload button. Controls below each video:

- **Play** — start playback
- **Pause** — pause playback
- **Restart** — return to the start
- **Fullscreen** — watch in full screen

Videos are **saved automatically** in your browser (IndexedDB). When you open the site again in the same browser, your uploaded videos will reload.

> Note: Saved videos stay on your computer in browser storage. They are not uploaded to GitHub or any server.

## Publish to GitHub Pages

```bash
cd grammar-site
git init
git add .
git commit -m "Present Progressive grammar site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/grammar-site.git
git push -u origin main
```

Then enable **Settings → Pages →** branch `main`, folder `/ (root)`.

## Project structure

```
grammar-site/
├── index.html
├── css/style.css
├── js/
│   ├── videos.js
│   ├── practice.js
│   └── quiz.js
└── README.md
```
