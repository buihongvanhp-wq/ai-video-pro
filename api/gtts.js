// api/gtts.js — Google Translate TTS proxy (free, no key needed)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { text, lang = 'vi' } = req.body || {};
  if (!text) { res.status(400).json({ error: 'text required' }); return; }

  // Google Translate TTS limit ~200 chars — split at word boundaries
  const chunks = splitChunks(text.slice(0, 600), 180);
  const buffers = [];

  for (const chunk of chunks) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob&ttsspeed=0.9`;
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
          'Accept': '*/*',
        }
      });
      if (!r.ok) throw new Error('Google TTS ' + r.status);
      buffers.push(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      return res.status(502).json({ error: e.message });
    }
  }

  const combined = Buffer.concat(buffers);
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  res.send(combined);
}

function splitChunks(text, maxLen) {
  const words = text.split(' ');
  const chunks = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (test.length <= maxLen) { cur = test; }
    else { if (cur) chunks.push(cur); cur = w; }
  }
  if (cur) chunks.push(cur);
  return chunks.length ? chunks : [text.slice(0, maxLen)];
}
