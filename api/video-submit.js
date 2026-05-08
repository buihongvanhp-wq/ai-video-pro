// api/video-submit.js — Submit text-to-video job to fal.ai queue
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { prompt, fal_key, model = 'fal-ai/wan/v2.1/t2v/480p' } = req.body || {};
  if (!prompt || !fal_key) { res.status(400).json({ error: 'prompt and fal_key required' }); return; }

  try {
    const body = { prompt: prompt.slice(0, 800), aspect_ratio: '16:9' };
    // Kling needs different params
    if (model.includes('kling')) body.duration = '5';

    const r = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${fal_key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail?.message || err.message || 'fal.ai ' + r.status);
    }
    const data = await r.json();
    res.json({ request_id: data.request_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
