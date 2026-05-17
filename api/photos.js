/**
 * /api/photos — iCloud Shared Album proxy
 *
 * Set ICLOUD_ALBUM_TOKEN in Vercel Environment Variables
 * (Dashboard → Project → Settings → Environment Variables)
 *
 * Token comes from the hash fragment of the iCloud album URL:
 * https://www.icloud.com/sharedalbum/#TOKEN_HERE
 */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  const token = process.env.ICLOUD_ALBUM_TOKEN;
  if (!token) {
    return res.status(200).json({
      photos: [],
      _note: 'Set ICLOUD_ALBUM_TOKEN in Vercel env vars'
    });
  }

  const baseHeaders = {
    'Content-Type':  'application/json',
    'Origin':        'https://www.icloud.com',
    'Referer':       'https://www.icloud.com/',
    'User-Agent':    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  };

  let host = 'p23-sharedstreams.icloud.com';

  try {
    /* ── Step 1: fetch stream metadata ── */
    let streamRes = await fetch(
      `https://${host}/${token}/sharedstreams/webstream`,
      { method: 'POST', headers: baseHeaders, body: JSON.stringify({ streamCtag: null }) }
    );

    /* Handle 421 redirect to region-specific host */
    if (streamRes.status === 421) {
      const redir = await streamRes.json();
      const newHost = redir['X-Apple-MMe-Host'] || redir['X_Apple_MMe_Host'];
      if (newHost) {
        host = newHost;
        streamRes = await fetch(
          `https://${host}/${token}/sharedstreams/webstream`,
          { method: 'POST', headers: baseHeaders, body: JSON.stringify({ streamCtag: null }) }
        );
      }
    }

    const stream = await streamRes.json();
    const photos = stream.photos || [];
    if (!photos.length) return res.json({
      photos: [],
      total: 0,
      _debug: 'no photos in stream',
      _streamKeys: Object.keys(stream),
      _streamStatus: streamRes.status,
      _host: host,
    });

    const guids = photos.map(p => p.photoGuid);

    /* ── Step 2: fetch signed download URLs ── */
    const urlRes = await fetch(
      `https://${host}/${token}/sharedstreams/webasseturls`,
      { method: 'POST', headers: baseHeaders, body: JSON.stringify({ photoGuids: guids }) }
    );
    const urlData = await urlRes.json();

    /* ── Step 3: assemble photo list ── */
    /*
     * iCloud webasseturls response shape:
     * {
     *   "items": {
     *     "<photoGuid>": {
     *       "url_location": "pXX-sharedstreams.icloud.com",   ← location KEY, not a URL
     *       "url_path":     "/TOKEN/sharedstreams/GUID/...",
     *       "url_expiry":   "..."
     *     }
     *   },
     *   "locations": {
     *     "pXX-sharedstreams.icloud.com": {
     *       "scheme": "https",
     *       "hosts":  ["pXX-sharedstreams.icloud.com"]
     *     }
     *   }
     * }
     * The full URL = scheme + "://" + hosts[0] + url_path
     */
    const locations = urlData.locations || {};

    const result = photos
      .map(photo => {
        const guid    = photo.photoGuid;
        const urlInfo = urlData.items?.[guid];
        if (!urlInfo) return null;

        /* Build the actual signed URL */
        const locKey  = urlInfo.url_location;
        const locObj  = locations[locKey] || {};
        const scheme  = locObj.scheme || 'https';
        const urlHost = (locObj.hosts && locObj.hosts[0]) || locKey;
        const path    = urlInfo.url_path || '';

        if (!urlHost || !path) return null;
        const url = `${scheme}://${urlHost}${path}`;

        /* Prefer highest available resolution */
        const derivs = photo.derivatives || {};
        const best   = derivs['2048x2048'] || derivs['1600x1600']
                    || derivs['1024x1024'] || derivs['640x640']
                    || Object.values(derivs)[0];

        return {
          guid,
          url,
          caption: photo.caption || '',
          width:   best?.width  || 800,
          height:  best?.height || 800,
          date:    photo.dateCreated || '',
        };
      })
      .filter(Boolean)
      .reverse();               // newest first

    return res.json({ photos: result, total: result.length });

  } catch (err) {
    console.error('[iCloud proxy error]', err.message);
    /* Return empty rather than 500 so the page still shows placeholders */
    return res.status(200).json({ photos: [], error: err.message });
  }
};
