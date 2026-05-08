// api/video-i2v.js — Submit image-to-video job to fal.ai queue
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { image_url, prompt = '', fal_key, model = 'fal-ai/kling-video/v1.6/standard/image-to-video' } = req.body || {};
  if (!image_url || !fal_key) { res.status(400).json({ error: 'image_url and fal_key required' }); return; }

  try {
    const body = {
      image_url,
      prompt: prompt.slice(0, 500),
    };
    // Kling i2v params
    if (model.includes('kling')) {
      body.duration = '5';
      body.aspect_ratio = '9:16';
    }
    // Wan i2v params
    if (model.includes('wan')) {
      body.aspect_ratio = '9:16';
    }

    const r = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${fal_key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      const msg = err.detail?.message
        || (typeof err.detail === 'string' ? err.detail : null)
        || err.message || err.error
        || `fal.ai HTTP ${r.status}`;
      res.status(r.status).json({ error: msg });
      return;
    }

    const data = await r.json();
    if (!data.request_id) {
      res.status(502).json({ error: 'No request_id: ' + JSON.stringify(data).slice(0, 200) });
      return;
    }
    res.json({ request_id: data.request_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
