#!/usr/bin/env python3
"""Fetch NHK headlines into data/news.json.

Run by the GitHub Action every few hours: NHK doesn't send CORS headers, so the
phone can't read the feeds directly — it reads this static file instead.
If a source fails, the previous headlines for that feed are kept.
"""

import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "news.json"
LIMIT = 25
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"

# Since NHK moved to NHK ONE (news.web.nhk), the NEWS WEB EASY list needs a login
# token, so easy articles come from NHK Easier's RSS (same NHK Easy stories, with
# furigana). The old www3 RSS still answers but froze in August 2026.
EASY_SOURCES = [
    "https://nhkeasier.com/feed/",
]
REGULAR_SOURCES = [
    "https://news.web.nhk/n-data/conf/na/rss/cat0.xml",
    "https://www3.nhk.or.jp/rss/news/cat0.xml",
]
MAX_AGE_DAYS = 7  # a feed whose newest item is older than this is treated as dead


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read()


def easy_date(value):
    # NHK Easy uses "YYYY-MM-DD HH:MM:SS" in Japan time.
    try:
        return datetime.strptime(value, "%Y-%m-%d %H:%M:%S").isoformat() + "+09:00"
    except (TypeError, ValueError):
        return None


def parse_easy(raw, link_tpl):
    data = json.loads(raw.decode("utf-8-sig"))
    articles = []

    def collect(obj):
        if isinstance(obj, dict):
            if "news_id" in obj and "title" in obj:
                articles.append(obj)
            else:
                for v in obj.values():
                    collect(v)
        elif isinstance(obj, list):
            for v in obj:
                collect(v)

    collect(data)
    items = []
    for a in articles:
        nid = a["news_id"]
        items.append({
            "title": a["title"],
            "url": link_tpl.format(id=nid),
            "date": easy_date(a.get("news_prearranged_time")),
        })
    items.sort(key=lambda i: i["date"] or "", reverse=True)
    return items[:LIMIT]


def parse_rss(raw):
    root = ET.fromstring(raw)
    items = []
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        pub = it.findtext("pubDate")
        try:
            date = parsedate_to_datetime(pub).isoformat() if pub else None
        except (TypeError, ValueError):
            date = None
        if title and link:
            items.append({"title": title, "url": link, "date": date})
    return items[:LIMIT]


def fresh(items):
    dates = [i["date"] for i in items if i.get("date")]
    if not dates:
        return True
    newest = max(datetime.fromisoformat(d) for d in dates)
    if newest.tzinfo is None:
        newest = newest.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - newest).days <= MAX_AGE_DAYS


def first_working(sources, parse):
    for src in sources:
        try:
            items = parse(src)
            if items and not fresh(items):
                print(f"stale feed skipped: {src}", file=sys.stderr)
                continue
            if items:
                print(f"ok: {len(items)} items", file=sys.stderr)
                return items
        except Exception as e:  # noqa: BLE001 — try the next mirror
            print(f"failed: {e}", file=sys.stderr)
    return None


def main():
    previous = {}
    if OUT.exists():
        try:
            previous = json.loads(OUT.read_text("utf-8"))
        except ValueError:
            previous = {}

    easy = first_working(EASY_SOURCES, lambda s: parse_rss(get(s)))
    regular = first_working(REGULAR_SOURCES, lambda s: parse_rss(get(s)))

    result = {
        "updated": datetime.now(timezone.utc).isoformat(timespec="seconds") if (easy or regular) else previous.get("updated"),
        "easy": easy if easy is not None else previous.get("easy", []),
        "regular": regular if regular is not None else previous.get("regular", []),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", "utf-8")


if __name__ == "__main__":
    main()
