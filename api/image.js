// api/image.js - Proxy to Pollinations.ai (bypasses CORS)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { prompt, seed = Date.now(), width = 512, height = 512 } = req.query;
  if (!prompt) { res.status(400).json({ error: 'prompt required' }); return; }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=flux`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Pollinations error: ' + response.status);
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
