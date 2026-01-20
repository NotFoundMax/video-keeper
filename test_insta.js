
async function testInstagramMetadata(url) {
  const resolvedUrl = url.split('?')[0]; // Clean URL
  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';

  console.log(`Testing URL: ${resolvedUrl}`);

  try {
    const response = await fetch(resolvedUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      }
    });

    if (!response.ok) {
      console.log(`Response not OK: ${response.status}`);
      return;
    }

    const html = await response.text();

    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/["']thumbnail_url["']:\s*["']([^"']+)["']/i);

    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);

    const instaTitleMatch = html.match(/["']caption["']:\s*["']([^"']+)["']/i) ||
      html.match(/["']media_title["']:\s*["']([^"']+)["']/i);

    console.log('Thumbnail:', ogImageMatch ? ogImageMatch[1].replace(/\\u0026/g, '&') : 'Not found');
    console.log('OG Title:', ogTitleMatch ? ogTitleMatch[1] : 'Not found');
    console.log('Insta Caption/Title:', instaTitleMatch ? instaTitleMatch[1].replace(/\\u0026/g, '&').replace(/\\n/g, ' ') : 'Not found');

  } catch (err) {
    console.error('Error:', err);
  }
}

testInstagramMetadata('https://www.instagram.com/reel/DSlfXGFCc5r/?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==');
