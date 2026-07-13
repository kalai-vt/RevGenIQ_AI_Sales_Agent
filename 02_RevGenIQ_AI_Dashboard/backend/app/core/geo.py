"""
Lightweight visitor-context extraction — deliberately not a new dependency.
Good enough for analytics/segmentation; not meant to be a precise UA parser.
"""
import re
from starlette.requests import Request

_BROWSERS = [
    ("Edg/", "Edge"), ("OPR/", "Opera"), ("Chrome/", "Chrome"),
    ("CriOS/", "Chrome"), ("FxiOS/", "Firefox"), ("Firefox/", "Firefox"),
    ("Safari/", "Safari"),
]
_OS = [
    ("Windows NT", "Windows"), ("Mac OS X", "macOS"), ("Android", "Android"),
    ("iPhone", "iOS"), ("iPad", "iOS"), ("CrOS", "ChromeOS"), ("Linux", "Linux"),
]


def parse_user_agent(ua: str | None) -> dict:
    ua = ua or ""
    browser = next((name for marker, name in _BROWSERS if marker in ua), None)
    os_name = next((name for marker, name in _OS if marker in ua), None)
    is_mobile = bool(re.search(r"Mobi|Android(?!.*Tablet)|iPhone", ua)) and "iPad" not in ua
    device_type = "mobile" if is_mobile else ("tablet" if "iPad" in ua or "Tablet" in ua else "desktop")
    return {"browser": browser, "os": os_name, "device_type": device_type}


def geo_from_headers(request: Request) -> dict:
    """Vercel injects these on every request at the edge, for free — no
    geolocation service or new dependency needed."""
    h = request.headers
    return {
        "country": h.get("x-vercel-ip-country"),
        "city": h.get("x-vercel-ip-city"),
    }
