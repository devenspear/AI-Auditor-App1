"""Vercel Python function that orchestrates the AI Auditor analysis pipeline."""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from typing import Any, Dict, List, Tuple
from urllib.parse import urlparse, urljoin

import requests
from bs4 import BeautifulSoup

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - openai may not be installed locally yet
    OpenAI = None  # type: ignore

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger("ai_auditor")

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
PAGESPEED_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
OPENAI_MODEL = "gpt-4-turbo-preview"


class handler(BaseHTTPRequestHandler):
    """Entry point for Vercel Python functions."""

    def do_POST(self) -> None:  # noqa: N802 - signature required by BaseHTTPRequestHandler
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length) if content_length else b"{}"
            payload = json.loads(raw_body)
            url = payload.get("url")

            if not isinstance(url, str) or not _is_valid_url(url):
                self._send_json(HTTPStatus.BAD_REQUEST, {"message": "Invalid URL supplied."})
                return

            LOGGER.info("Starting analysis for URL: %s", url)

            try:
                result = orchestrate_analysis(url)
            except AuditorError as exc:
                LOGGER.exception("Analysis failed: %s", exc)
                self._send_json(
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    {"message": "Analysis failed", "details": str(exc)},
                )
                return

            LOGGER.info("Analysis complete: %s", json.dumps(result))
            self._send_json(HTTPStatus.OK, result)
        except json.JSONDecodeError:
            LOGGER.exception("Invalid JSON body")
            self._send_json(HTTPStatus.BAD_REQUEST, {"message": "Body must be valid JSON."})
        except Exception as exc:  # pragma: no cover - defensive logging
            LOGGER.exception("Unexpected error")
            self._send_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"message": "Unexpected server error.", "details": str(exc)},
            )

    def _send_json(self, status: HTTPStatus, payload: Dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class AuditorError(Exception):
    """Base exception for orchestrator failures."""


def orchestrate_analysis(url: str) -> Dict[str, Any]:
    scraped = scrape_site(url)
    performance = collect_pagespeed(url)
    openai_analysis = run_openai_brand_analysis(scraped, performance)
    recommendations = run_openai_action_plan(scraped, performance, openai_analysis)

    report = format_report(url, scraped, performance, openai_analysis, recommendations)
    return report


def scrape_site(url: str) -> Dict[str, Any]:
    LOGGER.info("Scraping site content")
    try:
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
        response.raise_for_status()
    except requests.RequestException as exc:  # pragma: no cover - network dependent
        raise AuditorError(f"Failed to fetch page content: {exc}") from exc

    soup = BeautifulSoup(response.text, "html.parser")
    title = soup.title.string.strip() if soup.title and soup.title.string else None
    description_tag = soup.find("meta", attrs={"name": "description"})
    meta_description = description_tag["content"].strip() if description_tag and description_tag.get("content") else None

    h1 = [element.get_text(strip=True) for element in soup.find_all("h1")]
    h2 = [element.get_text(strip=True) for element in soup.find_all("h2")]

    main = soup.find("main") or soup.find("body")
    text_content = main.get_text(separator=" ", strip=True) if main else ""
    word_count = len(text_content.split())

    parsed = urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    robots_url, sitemap_url = urljoin(base, "/robots.txt"), urljoin(base, "/sitemap.xml")

    robots_txt_found = _resource_exists(robots_url)
    sitemap_xml_found = _resource_exists(sitemap_url)

    return {
        "title": title,
        "meta_description": meta_description,
        "h1": h1,
        "h2": h2,
        "word_count": word_count,
        "text": text_content[:15000],  # limit tokens sent to the LLM
        "robots_txt_found": robots_txt_found,
        "sitemap_xml_found": sitemap_xml_found,
    }


def _resource_exists(url: str) -> bool:
    try:
        response = requests.head(url, headers={"User-Agent": USER_AGENT}, timeout=10)
        if response.status_code == HTTPStatus.METHOD_NOT_ALLOWED:
            response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=10)
        return response.ok
    except requests.RequestException:  # pragma: no cover - network dependent
        return False


def collect_pagespeed(url: str) -> Dict[str, Any]:
    LOGGER.info("Fetching PageSpeed Insights")
    key = os.environ.get("PAGESPEED_API_KEY")
    mobile = _fetch_pagespeed(url, "mobile", key)
    desktop = _fetch_pagespeed(url, "desktop", key)

    core_vitals = _merge_core_web_vitals(mobile, desktop)

    return {
        "mobileScore": mobile.get("score"),
        "desktopScore": desktop.get("score"),
        "overallScore": _average_scores([mobile.get("score"), desktop.get("score")]),
        "coreVitals": core_vitals,
    }


def _fetch_pagespeed(url: str, strategy: str, key: str | None) -> Dict[str, Any]:
    params = {"url": url, "strategy": strategy}
    if key:
        params["key"] = key

    try:
        resp = requests.get(PAGESPEED_ENDPOINT, params=params, timeout=45)
        resp.raise_for_status()
        payload = resp.json()
    except requests.RequestException as exc:  # pragma: no cover - network dependent
        raise AuditorError(f"PageSpeed API failed for {strategy}: {exc}") from exc

    categories = payload.get("lighthouseResult", {}).get("categories", {})
    score = categories.get("performance", {}).get("score")
    if isinstance(score, (int, float)):
        score = round(score * 100)

    metrics = payload.get("loadingExperience", {}).get("metrics", {})

    return {
        "score": score,
        "metrics": metrics,
    }


def _merge_core_web_vitals(mobile: Dict[str, Any], desktop: Dict[str, Any]) -> Dict[str, str]:
    def _extract(metric_name: str) -> Tuple[str | None, str | None]:
        mobile_metric = mobile.get("metrics", {}).get(metric_name, {})
        desktop_metric = desktop.get("metrics", {}).get(metric_name, {})
        return mobile_metric.get("category"), desktop_metric.get("category")

    lcp_mobile, lcp_desktop = _extract("LARGEST_CONTENTFUL_PAINT_MS")
    fid_mobile, fid_desktop = _extract("FIRST_INPUT_DELAY_MS")
    cls_mobile, cls_desktop = _extract("CUMULATIVE_LAYOUT_SHIFT_SCORE")

    return {
        "lcp": _format_metric(lcp_mobile, lcp_desktop),
        "fid": _format_metric(fid_mobile, fid_desktop),
        "cls": _format_metric(cls_mobile, cls_desktop),
    }


def _format_metric(mobile: str | None, desktop: str | None) -> str:
    options = [value for value in (mobile, desktop) if value]
    return " / ".join(options) if options else "Not available"


def _average_scores(scores: List[Any]) -> int:
    valid = [score for score in scores if isinstance(score, (int, float))]
    if not valid:
        return 0
    return int(sum(valid) / len(valid))


def run_openai_brand_analysis(
    scraped: Dict[str, Any], performance: Dict[str, Any]
) -> Dict[str, Any]:
    LOGGER.info("Running OpenAI brand analysis")
    client = _openai_client()
    if client is None:
        raise AuditorError("OpenAI client not available. Set OPENAI_API_KEY.")

    system_prompt = (
        "You are an AI marketing strategist. Analyze website content for brand clarity, "
        "tone, and readiness for generative engine optimization. Return only valid JSON."
    )

    prompt = {
        "content": scraped.get("text", ""),
        "title": scraped.get("title"),
        "meta": scraped.get("meta_description"),
        "h1": scraped.get("h1"),
        "h2": scraped.get("h2"),
        "performance": performance,
    }

    user_prompt = (
        "Return a JSON object with keys: summary, brandVoiceScore (0-100), "
        "geoReadinessScore (0-100), technicalHealthScore (0-100), readabilityLevel, "
        "keyThemes (array of strings), clarityNotes (array of strings), "
        "narrativeInsights (array of objects with headline and body).\n\n"
        "Analyze this website snapshot:\n" + json.dumps(prompt)
    )

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2,
        max_tokens=1200,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    return json.loads(content)


def run_openai_action_plan(
    scraped: Dict[str, Any],
    performance: Dict[str, Any],
    analysis: Dict[str, Any],
) -> List[Dict[str, Any]]:
    LOGGER.info("Generating OpenAI action plan")
    client = _openai_client()
    if client is None:
        raise AuditorError("OpenAI client not available. Set OPENAI_API_KEY.")

    payload = {
        "scraped": scraped,
        "performance": performance,
        "analysis": analysis,
    }

    user_prompt = (
        "Return a JSON object with key actionPlan as an array of exactly three "
        "items. Each item must include title, summary, category (Quick Win, "
        "Opportunity, or Foundation), and impact (High, Medium, Low). Actions "
        "must be specific to AI readiness and GEO strategy.\n\n" + json.dumps(payload)
    )

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "Return strategic marketing actions formatted as JSON."},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.4,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    data = json.loads(content)
    plan = data.get("actionPlan")
    if not isinstance(plan, list):
        raise AuditorError("OpenAI action plan response missing actionPlan array")
    return plan


def format_report(
    url: str,
    scraped: Dict[str, Any],
    performance: Dict[str, Any],
    analysis: Dict[str, Any],
    recommendations: List[Dict[str, Any]],
) -> Dict[str, Any]:
    summary = analysis.get("summary", "")
    readability = analysis.get("readabilityLevel", "Unknown")

    overall = int(
        analysis.get("brandVoiceScore", 0) * 0.4
        + analysis.get("geoReadinessScore", 0) * 0.4
        + (performance.get("overallScore") or 0) * 0.2
    )
    grade = _score_to_grade(overall)

    return {
        "url": url,
        "analyzedAt": datetime.utcnow().isoformat() + "Z",
        "summary": summary,
        "keyThemes": analysis.get("keyThemes", []),
        "readabilityLevel": readability,
        "score": {
            "overall": overall,
            "grade": grade,
            "brandVoice": analysis.get("brandVoiceScore", 0),
            "geoReadiness": analysis.get("geoReadinessScore", 0),
            "technicalHealth": analysis.get("technicalHealthScore", performance.get("overallScore", 0)),
            "clarityNotes": analysis.get("clarityNotes", []),
        },
        "performance": performance,
        "content": {
            "title": scraped.get("title"),
            "metaDescription": scraped.get("meta_description"),
            "h1": scraped.get("h1", []),
            "h2": scraped.get("h2", []),
            "wordCount": scraped.get("word_count", 0),
            "robotsTxtFound": scraped.get("robots_txt_found", False),
            "sitemapXmlFound": scraped.get("sitemap_xml_found", False),
        },
        "narrative": analysis.get("narrativeInsights", []),
        "actionPlan": recommendations,
    }


def _score_to_grade(score: int) -> str:
    if score >= 93:
        return "A"
    if score >= 90:
        return "A-"
    if score >= 87:
        return "B+"
    if score >= 83:
        return "B"
    if score >= 80:
        return "B-"
    if score >= 77:
        return "C+"
    if score >= 73:
        return "C"
    if score >= 70:
        return "C-"
    if score >= 67:
        return "D+"
    if score >= 63:
        return "D"
    if score >= 60:
        return "D-"
    return "F"


def _is_valid_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except Exception:
        return False


def _openai_client() -> OpenAI | None:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key or OpenAI is None:
        return None
    return OpenAI(api_key=api_key)


if __name__ == "__main__":  # pragma: no cover - manual testing helper
    test_url = os.environ.get("TEST_URL")
    if not test_url:
        raise SystemExit("Set TEST_URL to run manual orchestration")
    print(json.dumps(orchestrate_analysis(test_url), indent=2))
