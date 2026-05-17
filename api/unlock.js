/**
 * /api/unlock — verify girlfriend page PIN server-side
 *
 * Vercel env vars required:
 *   GF_PIN    — the 4-digit passcode (e.g. 0912)
 *   GF_SECRET — a random secret string for signing tokens
 */

const crypto = require('crypto');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { pin } = req.body || {};
  const correctPin = process.env.GF_PIN;
  const secret     = process.env.GF_SECRET;

  if (!correctPin || !secret) {
    return res.status(500).json({ ok: false, error: 'Server not configured' });
  }

  if (!pin || pin !== correctPin) {
    return res.status(401).json({ ok: false });
  }

  /* Issue a token valid for 24 hours */
  const expires = Date.now() + 24 * 60 * 60 * 1000;
  const payload = String(expires);
  const sig     = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token   = `${expires}.${sig}`;

  return res.json({ ok: true, token });
};
