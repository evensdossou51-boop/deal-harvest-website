// Netlify Function: fetch-product
// Fetch product page via ScraperAPI and extract title/image/price

const fetch = require('node-fetch');
const cheerio = require('cheerio');

function jsonResponse(status, body) {
  return {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  };
}

function detectStore(url) {
  const u = (url || '').toLowerCase();
  if (u.includes('amazon.com') || u.includes('amzn.to')) return 'Amazon';
  if (u.includes('walmart.com')) return 'Walmart';
  if (u.includes('target.com')) return 'Target';
  if (u.includes('homedepot.com')) return 'Home Depot';
  return 'Online Store';
}

function formatPrice(p) {
  if (!p) return '';
  const m = p.toString().match(/[\$€£]\s?\d+[\d,.]*/);
  return m ? m[0].replace(/\s+/g, '') : p;
}

async function fetchHtmlViaScraper(url, apiKey) {
  const endpoint = `https://api.scraperapi.com?api_key=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(url)}&keep_headers=true&country=us`;
  const res = await fetch(endpoint, { method: 'GET' });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return await res.text();
}

function extractFields(url, html) {
  const $ = cheerio.load(html);
  // Title candidates
  const title = (
    $("meta[property='og:title']").attr('content') ||
    $('#productTitle').text() ||
    $("meta[name='title']").attr('content') ||
    $('title').text() ||
    ''
  ).trim();

  // Image candidates
  const img = (
    $("meta[property='og:image']").attr('content') ||
    $('#landingImage').attr('src') ||
    $('#imgTagWrapperId img').attr('src') ||
    $("img#main-image, img#imgBlkFront").attr('src') ||
    ''
  ).trim();

  // Price candidates (Amazon)
  const price = (
    $('#corePrice_feature_div .a-offscreen').first().text() ||
    $('#priceblock_ourprice').text() ||
    $('#priceblock_dealprice').text() ||
    $('#priceblock_saleprice').text() ||
    $("meta[property='product:price:amount']").attr('content') ||
    ''
  ).trim();

  const store = detectStore(url);
  return {
    name: title || undefined,
    image: img || undefined,
    price: formatPrice(price) || undefined,
    store,
    url
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }
  try {
    const { url } = event.queryStringParameters || {};
    if (!url) return jsonResponse(400, { error: 'Missing url parameter' });

    const apiKey = process.env.SCRAPERAPI_KEY || process.env.SCRAPER_API_KEY;
    if (!apiKey) return jsonResponse(500, { error: 'Missing SCRAPERAPI_KEY env var' });

    const html = await fetchHtmlViaScraper(url, apiKey);
    const data = extractFields(url, html);

    return jsonResponse(200, { success: true, data });
  } catch (err) {
    console.error('fetch-product error', err);
    return jsonResponse(500, { success: false, error: err.message });
  }
};
