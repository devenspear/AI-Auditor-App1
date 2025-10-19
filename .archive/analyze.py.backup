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

try:
    from anthropic import Anthropic
except ImportError:  # pragma: no cover - anthropic may not be installed locally yet
    Anthropic = None  # type: ignore

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger("ai_auditor")

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
PAGESPEED_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
OPENAI_MODEL = "gpt-4o"  # Latest GPT-4 Omni - 2x faster, 50% cheaper, better quality
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"  # Claude 3.5 Sonnet - excellent for deep content analysis


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

    # PageSpeed is optional - continue if it fails
    try:
        performance = collect_pagespeed(url)
    except Exception as exc:
        LOGGER.warning("PageSpeed collection failed, continuing without it: %s", exc)
        performance = {
            "mobileScore": None,
            "desktopScore": None,
            "overallScore": 0,
            "coreVitals": {
                "lcp": "Not available",
                "fid": "Not available",
                "cls": "Not available",
            },
        }

    # Run new free API analyses in parallel
    security_headers = check_security_headers(url)
    ssl_grade = check_ssl_grade(url)
    social_tags = analyze_social_tags(scraped)
    schema_data = extract_schema_markup(scraped)

    # Get Ahrefs SEO metrics (optional - requires API key)
    ahrefs_data = collect_ahrefs_metrics(url)

    # Run GPT-4o for initial analysis
    openai_analysis = run_openai_brand_analysis(scraped, performance)

    # Run Claude for enhanced narrative insights (optional - gracefully fail if unavailable)
    try:
        claude_insights = run_claude_narrative_analysis(scraped, openai_analysis)
        # Merge Claude's deeper narrative insights with OpenAI's analysis
        if claude_insights and "narrativeInsights" in claude_insights:
            openai_analysis["narrativeInsights"] = claude_insights["narrativeInsights"]
            LOGGER.info("Enhanced report with Claude narrative analysis")
    except Exception as exc:
        LOGGER.warning("Claude analysis skipped: %s", exc)

    recommendations = run_openai_action_plan(scraped, performance, openai_analysis)

    report = format_report(
        url, scraped, performance, openai_analysis, recommendations,
        security_headers, ssl_grade, social_tags, schema_data, ahrefs_data
    )
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

    # Extract Open Graph tags
    og_tags = {
        "og:title": None,
        "og:description": None,
        "og:image": None,
        "og:url": None,
    }
    for prop in og_tags.keys():
        tag = soup.find("meta", property=prop)
        if tag and tag.get("content"):
            og_tags[prop] = tag["content"].strip()

    # Extract Twitter Card tags
    twitter_tags = {
        "twitter:card": None,
        "twitter:title": None,
        "twitter:description": None,
        "twitter:image": None,
    }
    for name in twitter_tags.keys():
        tag = soup.find("meta", attrs={"name": name})
        if tag and tag.get("content"):
            twitter_tags[name] = tag["content"].strip()

    # Extract Schema.org structured data
    schema_scripts = soup.find_all("script", type="application/ld+json")
    schema_data = []
    for script in schema_scripts:
        try:
            data = json.loads(script.string)
            schema_data.append(data)
        except (json.JSONDecodeError, AttributeError):
            continue

    return {
        "title": title,
        "meta_description": meta_description,
        "h1": h1,
        "h2": h2,
        "word_count": word_count,
        "text": text_content[:15000],  # limit tokens sent to the LLM
        "robots_txt_found": robots_txt_found,
        "sitemap_xml_found": sitemap_xml_found,
        "og_tags": og_tags,
        "twitter_tags": twitter_tags,
        "schema_data": schema_data,
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
    LOGGER.info("Fetching PageSpeed Insights (mobile + desktop)")
    key = os.environ.get("PAGESPEED_API_KEY")

    # Fetch both mobile and desktop for comprehensive analysis
    mobile = _fetch_pagespeed(url, "mobile", key)
    desktop = _fetch_pagespeed(url, "desktop", key)

    # Extract core vitals from Lighthouse audits (more reliable than loadingExperience)
    mobile_audits = mobile.get("audits", {})

    # Get actual metric values from Lighthouse audits
    lcp_value = mobile_audits.get("largest-contentful-paint", {}).get("displayValue", "Not available")
    fid_value = mobile_audits.get("max-potential-fid", {}).get("displayValue", "Not available")
    cls_value = mobile_audits.get("cumulative-layout-shift", {}).get("displayValue", "Not available")

    mobile_score = mobile.get("score")
    desktop_score = desktop.get("score")
    overall = _average_scores([mobile_score, desktop_score])

    return {
        "mobileScore": mobile_score,
        "desktopScore": desktop_score,
        "overallScore": overall,
        "coreVitals": {
            "lcp": lcp_value,
            "fid": fid_value,
            "cls": cls_value,
        },
    }


def _fetch_pagespeed(url: str, strategy: str, key: str | None) -> Dict[str, Any]:
    # Only request performance category to speed up API response
    params = {
        "url": url,
        "strategy": strategy,
        "category": "performance"  # Only performance, skip accessibility/seo/best-practices
    }
    if key:
        params["key"] = key

    try:
        resp = requests.get(PAGESPEED_ENDPOINT, params=params, timeout=20)
        resp.raise_for_status()
        payload = resp.json()
    except requests.RequestException as exc:  # pragma: no cover - network dependent
        raise AuditorError(f"PageSpeed API failed for {strategy}: {exc}") from exc

    lighthouse_result = payload.get("lighthouseResult", {})
    categories = lighthouse_result.get("categories", {})
    score = categories.get("performance", {}).get("score")
    if isinstance(score, (int, float)):
        score = round(score * 100)

    # Get audits for Core Web Vitals
    audits = lighthouse_result.get("audits", {})

    return {
        "score": score,
        "audits": audits,
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


def check_security_headers(url: str) -> Dict[str, Any]:
    """Check security headers using SecurityHeaders.com (free)."""
    LOGGER.info("Checking security headers")
    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        check_url = f"https://securityheaders.com/?q={domain}&followRedirects=on"

        response = requests.get(check_url, headers={"User-Agent": USER_AGENT}, timeout=10)
        response.raise_for_status()

        # Parse HTML to extract grade
        soup = BeautifulSoup(response.text, "html.parser")

        # Find the grade element - SecurityHeaders.com uses specific classes
        grade_elem = soup.find("div", class_="grade")
        if not grade_elem:
            grade_elem = soup.find("span", class_="grade")

        grade = "Unknown"
        if grade_elem:
            grade_text = grade_elem.get_text(strip=True)
            # Extract just the letter grade (A+, A, B, C, D, F, R)
            if grade_text:
                grade = grade_text[0] if len(grade_text) > 0 else "Unknown"

        return {
            "checked": True,
            "grade": grade,
            "url": check_url
        }
    except Exception as exc:
        LOGGER.warning("Security headers check failed: %s", exc)
        return {"checked": False, "grade": "Not available", "error": str(exc)}


def check_ssl_grade(url: str) -> Dict[str, Any]:
    """Check SSL/TLS configuration (basic check, not full SSL Labs API due to rate limits)."""
    LOGGER.info("Checking SSL certificate")
    try:
        parsed = urlparse(url)
        if parsed.scheme != "https":
            return {
                "hasSSL": False,
                "grade": "F",
                "message": "Site does not use HTTPS"
            }

        # Basic SSL check - certificate exists and is valid
        import ssl
        import socket

        hostname = parsed.netloc
        context = ssl.create_default_context()

        with socket.create_connection((hostname, 443), timeout=10) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()

                return {
                    "hasSSL": True,
                    "grade": "B",  # Conservative grade for valid SSL
                    "issuer": dict(x[0] for x in cert.get('issuer', [])),
                    "validUntil": cert.get('notAfter', 'Unknown')
                }
    except Exception as exc:
        LOGGER.warning("SSL check failed: %s", exc)
        return {"hasSSL": False, "grade": "F", "error": str(exc)}


def analyze_social_tags(scraped: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze Open Graph and Twitter Card meta tags from scraped HTML."""
    LOGGER.info("Analyzing social media tags")

    og_tags = scraped.get("og_tags", {})
    twitter_tags = scraped.get("twitter_tags", {})

    # Score Open Graph tags
    og_score = 0
    has_og_title = bool(og_tags.get("og:title"))
    has_og_desc = bool(og_tags.get("og:description"))
    has_og_image = bool(og_tags.get("og:image"))
    has_og_url = bool(og_tags.get("og:url"))

    if has_og_title: og_score += 25
    if has_og_desc: og_score += 25
    if has_og_image: og_score += 25
    if has_og_url: og_score += 25

    # Score Twitter Card tags
    twitter_score = 0
    has_twitter_card = bool(twitter_tags.get("twitter:card"))
    has_twitter_title = bool(twitter_tags.get("twitter:title"))
    has_twitter_desc = bool(twitter_tags.get("twitter:description"))
    has_twitter_image = bool(twitter_tags.get("twitter:image"))

    if has_twitter_card: twitter_score += 25
    if has_twitter_title: twitter_score += 25
    if has_twitter_desc: twitter_score += 25
    if has_twitter_image: twitter_score += 25

    # Overall score
    overall_score = int((og_score + twitter_score) / 2)

    # Generate recommendations
    recommendations = []
    if not has_og_title:
        recommendations.append("Add og:title meta tag for better social sharing")
    if not has_og_desc:
        recommendations.append("Add og:description meta tag")
    if not has_og_image:
        recommendations.append("Add og:image meta tag (recommended: 1200x630px)")
    if not has_twitter_card:
        recommendations.append("Add twitter:card meta tag (use 'summary_large_image')")

    return {
        "openGraph": {
            "hasOGTitle": has_og_title,
            "hasOGDescription": has_og_desc,
            "hasOGImage": has_og_image,
            "hasOGUrl": has_og_url,
            "score": og_score,
            "tags": og_tags
        },
        "twitterCard": {
            "hasCard": has_twitter_card,
            "hasTitle": has_twitter_title,
            "hasDescription": has_twitter_desc,
            "hasImage": has_twitter_image,
            "score": twitter_score,
            "tags": twitter_tags
        },
        "overallScore": overall_score,
        "recommendations": recommendations if recommendations else ["All social media tags properly configured!"]
    }


def extract_schema_markup(scraped: Dict[str, Any]) -> Dict[str, Any]:
    """Extract and validate Schema.org structured data."""
    LOGGER.info("Extracting schema markup")

    schema_data = scraped.get("schema_data", [])
    schema_types = []

    # Extract all @type values from schema data
    for schema in schema_data:
        if isinstance(schema, dict):
            schema_type = schema.get("@type")
            if schema_type:
                if isinstance(schema_type, list):
                    schema_types.extend(schema_type)
                else:
                    schema_types.append(schema_type)

    has_schema = len(schema_types) > 0

    # Generate recommendations
    recommendations = []
    common_types = {"Organization", "WebSite", "WebPage", "Article", "LocalBusiness", "Product"}
    missing_types = common_types - set(schema_types)

    if not has_schema:
        recommendations.append("No structured data found. Add Schema.org markup to improve AI understanding")
    else:
        if "Organization" not in schema_types:
            recommendations.append("Add Organization schema with company details")
        if "WebSite" not in schema_types:
            recommendations.append("Add WebSite schema for site-level data")

    return {
        "hasSchema": has_schema,
        "schemaTypes": list(set(schema_types)),
        "count": len(schema_data),
        "recommendations": recommendations if recommendations else ["Good schema coverage detected!"],
        "rawData": schema_data[:3]  # Include first 3 schemas for reference
    }


def collect_ahrefs_metrics(url: str) -> Dict[str, Any] | None:
    """Collect SEO metrics from Ahrefs API v2 (requires API key)."""
    LOGGER.info("Collecting Ahrefs SEO metrics")
    api_key = os.environ.get("AHREFS_API_KEY")

    if not api_key:
        LOGGER.info("Ahrefs API key not found, skipping SEO metrics")
        return None

    try:
        parsed = urlparse(url)
        domain = parsed.netloc

        # Ahrefs API v2 endpoint for domain metrics
        base_url = "https://apiv2.ahrefs.com"

        # Get domain rating and backlink stats
        params = {
            "token": api_key,
            "target": domain,
            "mode": "domain",
            "from": "domain_rating",
            "output": "json"
        }

        response = requests.get(base_url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        # Extract key metrics from response
        domain_rating = data.get("domain", {}).get("domain_rating", 0)
        backlinks = data.get("domain", {}).get("backlinks", 0)
        referring_domains = data.get("domain", {}).get("refdomains", 0)

        # Get organic traffic estimate (separate call)
        traffic_params = {
            "token": api_key,
            "target": domain,
            "mode": "domain",
            "from": "metrics_extended",
            "output": "json"
        }

        traffic_response = requests.get(base_url, params=traffic_params, timeout=15)
        traffic_response.raise_for_status()
        traffic_data = traffic_response.json()

        organic_traffic = traffic_data.get("domain", {}).get("organic_traffic", 0)
        organic_keywords = traffic_data.get("domain", {}).get("organic_keywords", 0)

        return {
            "domainRating": domain_rating,
            "backlinks": backlinks,
            "referringDomains": referring_domains,
            "organicTraffic": organic_traffic,
            "organicKeywords": organic_keywords,
            "available": True
        }

    except Exception as exc:
        LOGGER.warning("Ahrefs API failed: %s", exc)
        return {
            "available": False,
            "error": str(exc)
        }


def format_report(
    url: str,
    scraped: Dict[str, Any],
    performance: Dict[str, Any],
    analysis: Dict[str, Any],
    recommendations: List[Dict[str, Any]],
    security_headers: Dict[str, Any] | None = None,
    ssl_grade: Dict[str, Any] | None = None,
    social_tags: Dict[str, Any] | None = None,
    schema_data: Dict[str, Any] | None = None,
    ahrefs_data: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    summary = analysis.get("summary", "")
    readability = analysis.get("readabilityLevel", "Unknown")

    overall = int(
        analysis.get("brandVoiceScore", 0) * 0.4
        + analysis.get("geoReadinessScore", 0) * 0.4
        + (performance.get("overallScore") or 0) * 0.2
    )
    grade = _score_to_grade(overall)

    report_data = {
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

    # Add new enhanced findings if available
    if security_headers:
        report_data["security"] = security_headers
    if ssl_grade:
        report_data["ssl"] = ssl_grade
    if social_tags:
        report_data["socialTags"] = social_tags
    if schema_data:
        report_data["schema"] = schema_data
    if ahrefs_data:
        report_data["ahrefs"] = ahrefs_data

    return report_data


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


def run_claude_narrative_analysis(
    scraped: Dict[str, Any],
    openai_analysis: Dict[str, Any],
) -> Dict[str, Any]:
    """Use Claude for deeper narrative insights and storytelling analysis."""
    LOGGER.info("Running Claude narrative analysis")
    client = _anthropic_client()
    if client is None:
        raise AuditorError("Claude client not available. Set ANTHROPIC_API_KEY.")

    # Build context for Claude
    context = {
        "content": scraped.get("text", "")[:10000],  # Limit for efficiency
        "title": scraped.get("title"),
        "h1": scraped.get("h1"),
        "keyThemes": openai_analysis.get("keyThemes", []),
        "brandVoiceScore": openai_analysis.get("brandVoiceScore"),
        "geoReadinessScore": openai_analysis.get("geoReadinessScore"),
    }

    prompt = f"""You are a senior marketing strategist analyzing website content.

Based on this website data:
{json.dumps(context, indent=2)}

Provide 2-3 deep narrative insights that focus on marketing strategy and brand positioning. Each insight should:
1. Have a compelling headline (3-6 words)
2. Provide strategic analysis in the body (2-3 sentences)
3. Focus on marketing impact, not technical details

Return valid JSON with this structure:
{{
  "narrativeInsights": [
    {{"headline": "Strategic headline", "body": "Deep marketing insight..."}}
  ]
}}"""

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1024,
        temperature=0.3,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    # Extract text content from Claude's response
    content_text = ""
    for block in response.content:
        if hasattr(block, 'text'):
            content_text = block.text
            break

    return json.loads(content_text)


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


def _anthropic_client() -> Anthropic | None:
    """Initialize Anthropic client if API key is available."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key or Anthropic is None:
        return None
    return Anthropic(api_key=api_key)


if __name__ == "__main__":  # pragma: no cover - manual testing helper
    test_url = os.environ.get("TEST_URL")
    if not test_url:
        raise SystemExit("Set TEST_URL to run manual orchestration")
    print(json.dumps(orchestrate_analysis(test_url), indent=2))
