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

    /* Handle redirect to region-specific host (iCloud uses 330 or 421) */
    if (streamRes.status === 330 || streamRes.status === 421) {
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
    if (!photos.length) return res.json({ photos: [], total: 0 });

    const guids = photos.map(p => p.photoGuid);

    /* ── Step 2: fetch signed download URLs ── */
    const urlRes = await fetch(
      `https://${host}/${token}/sharedstreams/webasseturls`,
      { method: 'POST', headers: baseHeaders, body: JSON.stringify({ photoGuids: guids }) }
    );
    const urlData = await urlRes.json();
    const locations = urlData.locations || {};

    /* ── Step 3: assemble photo list ── */
    /*
     * webasseturls items are keyed by derivative CHECKSUM (not photoGuid).
     * URL = scheme + "://" + locations[url_location].hosts[0] + url_path
     */
    const result = photos
      .map(photo => {
        const guid   = photo.photoGuid;
        const derivs = photo.derivatives || {};
        const best   = derivs['2048x2048'] || derivs['1600x1600']
                    || derivs['1024x1024'] || derivs['640x640']
                    || Object.values(derivs)[0];

        if (!best?.checksum) return null;
        const urlInfo = urlData.items?.[best.checksum];
        if (!urlInfo) return null;

        const locKey  = urlInfo.url_location;
        const locObj  = locations[locKey] || {};
        const scheme  = locObj.scheme || 'https';
        const urlHost = (locObj.hosts && locObj.hosts[0]) || locKey;
        const path    = urlInfo.url_path || '';

        if (!urlHost || !path) return null;
        const url = `${scheme}://${urlHost}${path}`;

        return {
          guid,
          url,
          caption: photo.caption || '',
          width:   best.width  || 800,
          height:  best.height || 800,
          date:    photo.dateCreated || '',
        };
      })
      .filter(Boolean)
      .reverse(); // newest first

    return res.json({ photos: result, total: result.length });

  } catch (err) {
    console.error('[iCloud proxy error]', err.message);
    return res.status(200).json({ photos: [], error: err.message });
  }
};
