# Benkyō — Japanese study planner

A cherry-blossom themed web app for the iPhone home screen that tracks daily Japanese study:

- **今日 Today**: daily goals checklist, streak, a sakura tree that blooms with each study day of the last 30, WaniKani and Bunpro status, the next textbook chapter, and a proverb of the day.
- **暦 Calendar**: month heatmap with one coloured dot per activity, a 6-month strip, and 18 achievements. Tap any day to log or edit what you did and add a note.
- **教科書 Books**: Genki I, Genki II, Quartet I and Quartet II, chapter by chapter. Each chapter has steps (vocab, ToKini Andy video, grammar, dialogue, workbook, kanji, reading, plus 読む・書く・話す・聞く for Quartet) and a checklist of Genki grammar points. Set a target date per book to get the chapters/week you need and whether you are ahead or behind.
- **読書 Reading**: books you're reading (page tracker, status), with links to Natively and the WaniKani book clubs.
- **新聞 News**: NHK NEWS WEB EASY and NHK News headlines. Tapping one logs "Read the news" for the day.

**Only kanji you know.** Japanese in the interface (labels, chapter titles, grammar points, proverbs, the widget) only uses kanji you've taken to Guru at least once on WaniKani. Words with other kanji appear in English, word by word, so the app turns more Japanese as you level up. Tap any Japanese word with kanji to see its reading. Each label is written as `[漢字|reading|English]` (see `js/jp.js`). News headlines and your own book titles are shown as they are.

📄 **User manual:** [docs/Benkyo-User-Manual.pdf](docs/Benkyo-User-Manual.pdf)

No build step, no server: plain HTML/CSS/JS modules. Your data stays in the browser's localStorage, so use **Settings → Export JSON** now and then to back it up.

## Integrations

| Source | How |
| --- | --- |
| WaniKani | Official API v2 with a personal access token (read-only is enough). Shows level, lessons, reviews, 24h forecast, SRS spread and items reviewed today, and fills in your WaniKani goal automatically. |
| Bunpro | No public API: tick your Bunpro reviews by hand (one tap on Today). |
| Conjugation | Link to the Japan Foundation Sydney conjugation practice. |
| Natively / WaniKani book clubs | Links. Neither has a public API. |
| NHK news | A GitHub Action (`.github/workflows/news.yml`) fetches headlines every 3 hours into `data/news.json`, since browsers can't read NHK's feeds directly. Since NHK's move to NHK ONE, the Easy list needs a login token, so Easy stories come from [NHK Easier](https://nhkeasier.com/)'s RSS. Regular news comes from the NHK ONE RSS. A feed whose newest item is over 7 days old is skipped. |
| ToKini Andy | Official playlists for Genki I, Genki II, Quartet 1 and Quartet 2 (Books tab and My links), plus a search link per lesson. |

## Home screen widget (Scriptable)

iOS only lets native apps add widgets, so the widget runs in the free [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) app (`widget/benkyo-widget.js`). Three sizes, each with its own job:

- **Large**: streak, WaniKani level/lessons/reviews, 24h forecast, daily goals, textbook chapter and pace, current book, 30-day bloom strip and the proverb.
- **Medium (ribbon)**: the next grammar point to study (or next Quartet step) with your pace, and the latest NHK Easy headline (tap to open).
- **Small**: reviews waiting, level and streak.

1. Install Scriptable.
2. In Benkyō tap ⚙︎ → **Copy widget script**. In Scriptable tap ＋, paste, and name the script **Benkyo Widget**.
3. Back in Benkyō tap **Update widget 🌸**. This opens Scriptable with your progress and WaniKani token. The token is kept in the iOS Keychain.
4. Long-press the home screen → ＋ → Scriptable → pick a size → add it, long-press it → *Edit Widget* → Script: **Benkyo Widget**. Add as many sizes as you like; they all use the same script.

WaniKani numbers refresh live on their own (iOS refreshes widgets roughly every 15–30 min). Goals, streak and book progress update each time you tap **Update widget** (also on the Today tab). Tapping the WaniKani tiles opens WaniKani.

## My links

A card on the Today tab with your useful sites as icon tiles, pre-filled with the study links. Tap **Edit** to add, rename, reorder or delete links. For the icon, type an emoji or leave it empty to use the site's own icon. The list syncs between devices.

## Obsidian export

⚙︎ → **Export notes for Obsidian (.zip)** produces a `Benkyō/` folder of Markdown notes with frontmatter: a dashboard, one note per book (chapter steps and grammar as checkboxes), the reading list, monthly study logs with your notes, learned kanji and links. Unzip it into your vault and replace the folder on each export.

## On your computer (taskbar app)

On a wide screen the app switches to a dashboard layout: sidebar navigation and two columns.

1. Open the site in **Chrome** or **Edge**.
2. Click **⬇ Install app** at the top (or the install icon in the address bar, or browser menu → *Install Benkyō*). It opens in its own window.
3. Right-click its icon in the taskbar → **Pin to taskbar** (on macOS: right-click in the Dock → *Options → Keep in Dock*).

**Zen / Firefox** can't install web apps: pin the tab instead (right-click → *Pin Tab*, or drag it into Zen's *Essentials*). Install from Chrome or Edge as well if you want a taskbar window; sync keeps both identical.

## Sync phone ↔ computer

Progress lives in each browser, so the app syncs it through one **secret gist** on your GitHub account:

1. Create a classic token with only the **gist** permission: <https://github.com/settings/tokens/new?scopes=gist&description=Benky%C5%8D%20sync>.
2. Paste it in ⚙︎ → *Sync phone ↔ computer* on every device. The first device creates the gist and the others find it.

Each day of the log, each chapter, each book and the shared settings carry a change time. The newest version wins, so edits and deletions on either device carry over. Sync runs when the app opens and a few seconds after each change. Only progress is uploaded, never the WaniKani or GitHub token. A secret gist isn't listed publicly, but anyone with its link can read it.

## Put it online (GitHub Pages)

> GitHub Pages on a **private** repository needs a paid GitHub plan (Pro). On a free account, either make the repository public (no secrets are stored in it: your token and progress stay on the phone) or deploy the folder for free with Cloudflare Pages or Netlify.


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
