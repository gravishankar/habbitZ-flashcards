# Habbitz Flashcards

An elegant, offline‑first flashcard app you can host on **GitHub Pages** and embed inside **Google Sites**.

## Features
- Uses your CSV/JSON word lists (preloaded with your uploaded vocabulary)
- Spaced repetition (SM‑2‑style) with grading buttons: **Again / Hard / Good / Easy**
- **Study** (flashcards) and **Quiz** (multiple-choice) modes
- Create, rename, delete **decks**; add/edit/delete cards
- Search, sort A→Z, shuffle, “Due only” filter, hide leeches
- **Import/Export** JSON or CSV; progress stored in `localStorage`
- 100% static: no server required; perfect for GitHub Pages + Google Sites embed

## Quick Start
1. Download the zip and extract.
2. Commit the folder to a GitHub repo (e.g. `habbitz-flashcards`).
3. Turn on GitHub Pages (**Settings → Pages → Source: Deploy from a branch**, select `main` and `/root`).
4. Your app will be live at `https://<your-user>.github.io/<repo>/`.

## Embed in Google Sites
In your Google Site page:
- Click **Insert → Embed → By URL**
- Paste your GitHub Pages URL (e.g., `https://<user>.github.io/habbitz-flashcards/`)
- Choose **Whole page** or **Embed**. Save.

## CSV Format
The Import expects a header line with:
```
word,definition,example,tip
```
Extra columns are ignored. You can export JSON and share with others.

## “3 Essential Tips” in the UI
1) One idea per card, 2) memorable context, 3) active recall. These principles drive the card layout and scheduling.

## Reset
Click **Reset** to clear local data and reload the baked `words.json`.

---
© Habbitz
