import type { SchemaMarkup, SocialTags, OpenGraphTags, TwitterCardTags } from "./report-types";

/**
 * Scrapes and analyzes a website's HTML for SEO and marketing data
 */
export class WebScraper {
  private html: string;
  private url: string;

  constructor(url: string, html: string) {
    this.url = url;
    this.html = html;
  }

  /**
   * Extract all Schema.org structured data (JSON-LD)
   */
  extractSchema(): SchemaMarkup {
    const jsonLdScripts: Record<string, unknown>[] = [];
    const schemaTypes = new Set<string>();

    // Match all JSON-LD script tags
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(this.html)) !== null) {
      try {
        const jsonData = JSON.parse(match[1]);
        jsonLdScripts.push(jsonData);

        // Extract @type from JSON-LD
        if (jsonData["@type"]) {
          const types = Array.isArray(jsonData["@type"])
            ? jsonData["@type"]
            : [jsonData["@type"]];
          types.forEach((type: string) => schemaTypes.add(type));
        }

        // Handle @graph arrays
        if (jsonData["@graph"] && Array.isArray(jsonData["@graph"])) {
          jsonData["@graph"].forEach((item: Record<string, unknown>) => {
            if (item["@type"]) {
              const types = Array.isArray(item["@type"])
                ? item["@type"]
                : [item["@type"]];
              types.forEach((type: string) => schemaTypes.add(type));
            }
          });
        }
      } catch (e) {
        console.warn("Failed to parse JSON-LD:", e);
      }
    }

    const schemaTypesArray = Array.from(schemaTypes);
    const recommendations: string[] = [];

    // Provide recommendations based on what's missing
    if (!schemaTypes.has("Organization") && !schemaTypes.has("LocalBusiness")) {
      recommendations.push("Add Organization schema to improve brand recognition in search");
    }
    if (!schemaTypes.has("WebSite")) {
      recommendations.push("Add WebSite schema with siteNavigationElement for better search features");
    }
    if (!schemaTypes.has("BreadcrumbList")) {
      recommendations.push("Implement BreadcrumbList schema for enhanced navigation display");
    }
    if (schemaTypesArray.length === 0) {
      recommendations.push("No structured data found. Implement JSON-LD schema for better AI/search understanding");
    }

    return {
      hasSchema: schemaTypesArray.length > 0,
      schemaTypes: schemaTypesArray,
      count: schemaTypesArray.length,
      recommendations,
      rawData: jsonLdScripts.length > 0 ? jsonLdScripts : undefined,
    };
  }

  /**
   * Extract and validate Open Graph tags
   */
  extractOpenGraph(): OpenGraphTags {
    const tags: Record<string, string | null> = {};

    const ogRegex = /<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
    let match;

    while ((match = ogRegex.exec(this.html)) !== null) {
      tags[`og:${match[1]}`] = match[2];
    }

    const hasOGTitle = !!tags["og:title"];
    const hasOGDescription = !!tags["og:description"];
    const hasOGImage = !!tags["og:image"];
    const hasOGUrl = !!tags["og:url"];

    // Calculate score based on essential tags
    let score = 0;
    if (hasOGTitle) score += 30;
    if (hasOGDescription) score += 30;
    if (hasOGImage) score += 30;
    if (hasOGUrl) score += 10;

    return {
      hasOGTitle,
      hasOGDescription,
      hasOGImage,
      hasOGUrl,
      score,
      tags,
    };
  }

  /**
   * Extract and validate Twitter Card tags
   */
  extractTwitterCard(): TwitterCardTags {
    const tags: Record<string, string | null> = {};

    const twitterRegex = /<meta[^>]*name=["']twitter:([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
    let match;

    while ((match = twitterRegex.exec(this.html)) !== null) {
      tags[`twitter:${match[1]}`] = match[2];
    }

    const hasCard = !!tags["twitter:card"];
    const hasTitle = !!tags["twitter:title"];
    const hasDescription = !!tags["twitter:description"];
    const hasImage = !!tags["twitter:image"];

    // Calculate score
    let score = 0;
    if (hasCard) score += 30;
    if (hasTitle) score += 25;
    if (hasDescription) score += 25;
    if (hasImage) score += 20;

    return {
      hasCard,
      hasTitle,
      hasDescription,
      hasImage,
      score,
      tags,
    };
  }

  /**
   * Combined social tags analysis with recommendations
   */
  extractSocialTags(): SocialTags {
    const openGraph = this.extractOpenGraph();
    const twitterCard = this.extractTwitterCard();

    const overallScore = Math.round((openGraph.score + twitterCard.score) / 2);
    const recommendations: string[] = [];

    // Open Graph recommendations
    if (!openGraph.hasOGTitle) {
      recommendations.push("Add og:title meta tag for better social sharing");
    }
    if (!openGraph.hasOGDescription) {
      recommendations.push("Add og:description to control how links appear on Facebook/LinkedIn");
    }
    if (!openGraph.hasOGImage) {
      recommendations.push("Add og:image (1200x630px recommended) for visual social sharing");
    }

    // Twitter Card recommendations
    if (!twitterCard.hasCard) {
      recommendations.push("Add twitter:card meta tag (use 'summary_large_image' for best results)");
    }
    if (!twitterCard.hasTitle) {
      recommendations.push("Add twitter:title for optimized Twitter sharing");
    }
    if (!twitterCard.hasImage) {
      recommendations.push("Add twitter:image for visual Twitter cards");
    }

    // Overall recommendations
    if (overallScore < 50) {
      recommendations.push("Social media tags are incomplete. This limits sharing potential and AI visibility");
    }

    return {
      openGraph,
      twitterCard,
      overallScore,
      recommendations,
    };
  }

  /**
   * Extract all enhanced metadata in one pass
   */
  extractAll() {
    return {
      schema: this.extractSchema(),
      socialTags: this.extractSocialTags(),
    };
  }
}

/**
 * Fetch and scrape a website
 */
export async function scrapeWebsite(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AI-Auditor/1.0; +https://ai-auditor-app1.vercel.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const html = await response.text();
  const scraper = new WebScraper(url, html);

  return scraper.extractAll();
}
