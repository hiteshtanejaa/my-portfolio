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
  res.setHeader('Cache-Control', 'no-store');

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
  const _log = [];

  try {
    /* ── Step 1: fetch stream metadata ── */
    let streamRes = await fetch(
      `https://${host}/${token}/sharedstreams/webstream`,
      { method: 'POST', headers: baseHeaders, body: JSON.stringify({ streamCtag: null }) }
    );
    _log.push(`step1 status=${streamRes.status} host=${host}`);

    /* Handle redirect to region-specific host (iCloud uses 330 or 421) */
    if (streamRes.status === 330 || streamRes.status === 421) {
      const redir = await streamRes.json();
      const newHost = redir['X-Apple-MMe-Host'] || redir['X_Apple_MMe_Host'];
      _log.push(`redirect body keys=${Object.keys(redir).join(',')}, newHost=${newHost}`);
      if (newHost) {
        host = newHost;
        streamRes = await fetch(
          `https://${host}/${token}/sharedstreams/webstream`,
          { method: 'POST', headers: baseHeaders, body: JSON.stringify({ streamCtag: null }) }
        );
        _log.push(`step1b status=${streamRes.status} host=${host}`);
      }
    }

    const streamText = await streamRes.text();
    _log.push(`stream body preview=${streamText.slice(0, 300)}`);

    let stream;
    try { stream = JSON.parse(streamText); }
    catch(e) { return res.json({ photos: [], _log, _error: 'stream JSON parse failed', _raw: streamText.slice(0,500) }); }

    const photos = stream.photos || [];
    _log.push(`photos count=${photos.length}, stream keys=${Object.keys(stream).join(',')}`);

    if (!photos.length) return res.json({
      photos: [],
      total: 0,
      _log,
    });

    const guids = photos.map(p => p.photoGuid);

    /* ── Step 2: fetch signed download URLs ── */
    const urlRes = await fetch(
      `https://${host}/${token}/sharedstreams/webasseturls`,
      { method: 'POST', headers: baseHeaders, body: JSON.stringify({ photoGuids: guids }) }
    );
    _log.push(`step2 status=${urlRes.status}`);
    const urlData = await urlRes.json();
    _log.push(`urlData keys=${Object.keys(urlData).join(',')}, items count=${Object.keys(urlData.items||{}).length}`);

    const locations = urlData.locations || {};

    /* Debug: inspect first item in urlData.items to understand shape */
    const firstItemKey  = Object.keys(urlData.items || {})[0];
    const firstItem     = firstItemKey ? urlData.items[firstItemKey] : null;
    const firstLocKey   = Object.keys(locations)[0];
    const firstLoc      = firstLocKey ? locations[firstLocKey] : null;
    _log.push(`first guid=${guids[0]}, firstItemKey=${firstItemKey}, match=${guids[0]===firstItemKey}`);
    _log.push(`firstItem=${JSON.stringify(firstItem)}`);
    _log.push(`firstLoc=${JSON.stringify(firstLoc)}`);

    const result = photos
      .map(photo => {
        const guid    = photo.photoGuid;
        const urlInfo = urlData.items?.[guid];
        if (!urlInfo) return null;

        const locKey  = urlInfo.url_location;
        const locObj  = locations[locKey] || {};
        const scheme  = locObj.scheme || 'https';
        const urlHost = (locObj.hosts && locObj.hosts[0]) || locKey;
        const path    = urlInfo.url_path || '';

        if (!urlHost || !path) return null;
        const url = `${scheme}://${urlHost}${path}`;

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
      .reverse();

    if (!result.length) return res.json({ photos: [], total: 0, _log });
    return res.json({ photos: result, total: result.length });

  } catch (err) {
    return res.status(200).json({ photos: [], _log, error: err.message });
  }
};
