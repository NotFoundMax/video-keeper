
async function resolveUrlRedirects(url) {
  if (url.includes("facebook.com/share/") || url.includes("fb.watch/")) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        }
      });

      console.log('Final URL after fetch:', response.url);

      // If it's a Facebook share URL and didn't redirect, try to scrape og:url
      if (url.includes("facebook.com/share/") && response.url === url) {
        const html = await response.text();
        const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i);
        if (ogUrlMatch) {
          console.log('Extracted og:url:', ogUrlMatch[1]);
          return ogUrlMatch[1].replace(/&amp;/g, '&');
        }
      }

      return response.url || url;
    } catch (e) {
      console.error("Error resolving:", e);
    }
  }
  return url;
}

// Example URL provided by user in previous conversation or similar
const testUrl = "https://fb.watch/x7r_id_example/"; // Replace with real one if known
resolveUrlRedirects(testUrl);
