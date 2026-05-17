/**
 * /api/photos — iCloud Shared Album proxy (protected)
 *
 * Requires a valid token from /api/unlock in the
 * X-GF-Token request header. Returns 401 otherwise.
 *
 * Vercel env vars:
 *   ICLOUD_ALBUM_TOKEN — hash from iCloud shared album URL
 *   GF_SECRET          — same secret used in /api/unlock
 */

const crypto = require('crypto');

function verifyToken(raw, secret) {
  if (!raw || !secret) return false;
  const [expires, sig] = raw.split('.');
  if (!expires || !sig) return false;
  if (Date.now() > parseInt(expires, 10)) return false;
  const expected = crypto.createHmac('sha256', secret).update(expires).digest('hex');
  return sig === expected;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-GF-Token');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  /* ── Auth check ── */
  const gfSecret = process.env.GF_SECRET;
  const gfToken  = req.headers['x-gf-token'];
  if (!verifyToken(gfToken, gfSecret)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
        const guid    = photo.photoGuid;
        const isVideo = photo.mediaAssetType === 'video';
        const derivs  = photo.derivatives || {};

        /* For videos prefer the original/highest; for photos prefer highest resolution */
        const best = isVideo
          ? (derivs['original'] || derivs['video_small'] || Object.values(derivs)[0])
          : (derivs['2048x2048'] || derivs['1600x1600'] || derivs['1024x1024'] || derivs['640x640'] || Object.values(derivs)[0]);

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

        /* For videos also grab a poster thumbnail from a photo-like derivative */
        let poster = null;
        if (isVideo) {
          const thumbDeriv = derivs['2048x2048'] || derivs['1600x1600'] || derivs['1024x1024'] || derivs['640x640'];
          if (thumbDeriv?.checksum) {
            const thumbInfo = urlData.items?.[thumbDeriv.checksum];
            if (thumbInfo) {
              const tLocObj = locations[thumbInfo.url_location] || {};
              const tHost   = (tLocObj.hosts && tLocObj.hosts[0]) || thumbInfo.url_location;
              const tPath   = thumbInfo.url_path || '';
              if (tHost && tPath) poster = `${tLocObj.scheme || 'https'}://${tHost}${tPath}`;
            }
          }
        }

        return {
          guid,
          type:    isVideo ? 'video' : 'photo',
          url,
          poster:  poster || '',
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
