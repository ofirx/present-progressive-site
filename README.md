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

## Git setup (Windows)

If `git` is not recognized, restart Cursor/terminal after installing Git, or use the full path:

```powershell
& "C:\Program Files\Git\bin\git.exe" --version
```

Set your name and email once (replace with your details):

```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

This repo is already initialized on branch `main` with an initial commit.

## Publish to GitHub Pages

### 1. Log in to GitHub

```powershell
gh auth login
```

### 2. Create the repo and push

```powershell
cd "C:\Users\או\Documents\grammar-site"
gh repo create present-progressive-site --public --source=. --remote=origin --push
```

Use any repo name you like. If you pick a different name, your site URL will be:
`https://YOUR_USERNAME.github.io/REPO_NAME/`

### 3. Enable GitHub Pages

On GitHub: **Settings → Pages →** branch `main`, folder `/ (root)`.

Your site will be live in 1–2 minutes.

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
