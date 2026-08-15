"""Refresh the public AI attention proxy used by Developer Lab.

This records Wikimedia article pageviews. It is intentionally not described as
unique users, model DAU, or product market share.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "data" / "ai-pulse.json"
API = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/user/{article}/daily/{start}/{end}"
PLATFORMS = [
    {"id": "chatgpt", "label": "ChatGPT", "article": "ChatGPT", "color": "#63e6e2"},
    {"id": "claude", "label": "Claude", "article": "Claude_(AI)", "color": "#60a5fa"},
    {"id": "gemini", "label": "Gemini", "article": "Gemini_(chatbot)", "color": "#b79aff"},
    {"id": "copilot", "label": "Copilot", "article": "Microsoft_Copilot", "color": "#9ce7b2"},
    {"id": "perplexity", "label": "Perplexity", "article": "Perplexity_AI", "color": "#ffd17a"},
    {"id": "deepseek", "label": "DeepSeek", "article": "DeepSeek", "color": "#f472b6"},
]


def week_key(value: datetime) -> str:
    return (value - timedelta(days=value.weekday())).date().isoformat()


def fetch_article(article: str, start: datetime, end: datetime) -> dict[str, int]:
    encoded = urllib.parse.quote(article, safe="")
    url = API.format(article=encoded, start=start.strftime("%Y%m%d"), end=end.strftime("%Y%m%d"))
    request = urllib.request.Request(url, headers={"User-Agent": "developer-lab-ai-pulse/1.0 (+https://github.com/mrnamazbek/developer-lab)"})
    with urllib.request.urlopen(request, timeout=35) as response:
        payload = json.loads(response.read().decode("utf-8"))

    weeks: dict[str, int] = {}
    for item in payload.get("items", []):
        try:
            timestamp = datetime.strptime(str(item["timestamp"])[:8], "%Y%m%d")
            views = max(0, int(item["views"]))
        except (KeyError, TypeError, ValueError):
            continue
        key = week_key(timestamp)
        weeks[key] = weeks.get(key, 0) + views
    return weeks


def existing_payload() -> dict:
    try:
        return json.loads(OUTPUT.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def main() -> int:
    now = datetime.now(timezone.utc)
    end = now - timedelta(days=1)
    start = end - timedelta(days=91)
    series = []
    errors = []
    all_weeks: set[str] = set()

    for platform in PLATFORMS:
        try:
            weekly = fetch_article(platform["article"], start, end)
            all_weeks.update(weekly)
            series.append({"platform": platform, "weekly": weekly})
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            errors.append(f"{platform['label']}: {error}")
            series.append({"platform": platform, "weekly": {}})

    # The current calendar week is incomplete; exclude it so week-over-week
    # comparisons never present a partial week as a sudden drop in attention.
    current_week = week_key(now)
    weeks = sorted(week for week in all_weeks if week < current_week)[-12:]
    if not weeks:
        current = existing_payload()
        if current:
            current["generated_at"] = now.isoformat()
            current["status"] = "fallback_existing"
            current["errors"] = errors or ["No fresh data returned by Wikimedia."]
            OUTPUT.write_text(json.dumps(current, indent=2) + "\n", encoding="utf-8")
            print("Kept the existing AI Pulse snapshot.")
            return 0
        print("No AI Pulse data was returned and no previous snapshot exists.", file=sys.stderr)
        return 1

    output_series = []
    for item in series:
        platform = item["platform"]
        weekly = item["weekly"]
        output_series.append({
            **platform,
            "points": [{"week": week, "views": int(weekly.get(week, 0))} for week in weeks],
        })

    latest_rank = sorted(
        [{"id": item["id"], "label": item["label"], "views": item["points"][-1]["views"]} for item in output_series],
        key=lambda item: item["views"],
        reverse=True,
    )
    payload = {
        "as_of": weeks[-1],
        "generated_at": now.isoformat(),
        "status": "partial" if errors else "ok",
        "methodology": "Weekly attention proxy based on English Wikipedia pageviews for each AI product article. This is not unique active users or model DAU.",
        "source": {
            "name": "Wikimedia Pageviews API",
            "docs": ["https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/getting-started/"],
        },
        "series": output_series,
        "latest_rank": latest_rank,
        "errors": errors,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"AI Pulse updated through {payload['as_of']} ({payload['status']}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
