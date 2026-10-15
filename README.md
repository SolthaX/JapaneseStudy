# 勉強 Benkyō — Japanese study planner

A cherry-blossom themed web app for the iPhone home screen that tracks daily Japanese study:

- **今日 Today**: daily goals checklist, streak, a sakura tree that blooms with each study day of the last 30, WaniKani and Bunpro status, the next textbook chapter, and a proverb of the day.
- **暦 Calendar**: month heatmap with one coloured dot per activity, a 6-month strip, and 18 achievements. Tap any day to log or edit what you did and add a note.
- **教科書 Books**: Genki I, Genki II, Quartet I and Quartet II, chapter by chapter. Each chapter has steps (vocab, ToKini Andy video, grammar, dialogue, workbook, kanji, reading, plus 読む・書く・話す・聞く for Quartet) and a checklist of Genki grammar points. Set a target date per book to get the chapters/week you need and whether you are ahead or behind.
- **読書 Reading**: books you're reading (page tracker, status), with links to Natively and the WaniKani book clubs.
- **新聞 News**: NHK NEWS WEB EASY and NHK News headlines. Tapping one logs "Read the news" for the day.

No build step, no server: plain HTML/CSS/JS modules. Your data stays in the browser's localStorage, so use **Settings → Export JSON** now and then to back it up.

## Integrations

| Source | How |
| --- | --- |
| WaniKani | Official API v2 with a personal access token (read-only is enough). Shows level, lessons, reviews, 24h forecast, SRS spread and items reviewed today, and fills in your WaniKani goal automatically. |
| Bunpro | No stable public API. The legacy `study_queue` endpoint is tried with your settings API key; if Bunpro or the browser refuses it, you tick Bunpro by hand. |
| Conjugation | Link to the Japan Foundation Sydney conjugation practice. |
| Natively / WaniKani book clubs | Links. Neither has a public API. |
| NHK news | NHK doesn't allow browsers to read its feeds directly (no CORS). A GitHub Action (`.github/workflows/news.yml`) fetches the headlines every 3 hours into `data/news.json`. |

## Put it online (GitHub Pages)

1. Merge this into `main`.
2. In the repo, open **Settings → Pages**, set *Source* to **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open **Actions → Refresh NHK headlines → Run workflow** once to get the first headlines. After that it runs every 3 hours.
4. The site is live at `https://<your-user>.github.io/<repo>/`.

## Install on iPhone

Open the site in **Safari** → Share → **Add to Home Screen**. It then opens full screen like an app and works offline, apart from live API data.

Then tap ⚙︎ and paste your WaniKani token from <https://www.wanikani.com/settings/personal_access_tokens>.

> Note: iOS keeps home-screen apps' storage separate from Safari. Set things up from the home-screen app itself, and export a backup from there.

## Development

```sh
python3 -m http.server 8000   # then open http://localhost:8000
python3 scripts/fetch_news.py # refresh data/news.json locally
```

When you change app files, bump `CACHE` in `sw.js` so phones pick up the new version.
