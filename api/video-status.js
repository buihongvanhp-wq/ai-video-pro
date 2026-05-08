// api/video-status.js — Check fal.ai queue job status
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const { request_id, fal_key, model = 'fal-ai/wan/v2.1/t2v/480p' } = req.body || {};
  if (!request_id || !fal_key) { res.status(400).json({ error: 'request_id and fal_key required' }); return; }

  try {
    const base = `https://queue.fal.run/${model}/requests/${request_id}`;
    const sRes = await fetch(`${base}/status`, {
      headers: { 'Authorization': `Key ${fal_key}` }
    });
    if (!sRes.ok) {
      const e = await sRes.json().catch(() => ({}));
      const msg = e.detail?.message || (typeof e.detail === 'string' ? e.detail : null) || e.message || `Status check HTTP ${sRes.status}`;
      throw new Error(msg);
    }
    const s = await sRes.json();

    if (s.status === 'COMPLETED') {
      const rRes = await fetch(base, { headers: { 'Authorization': `Key ${fal_key}` } });
      if (!rRes.ok) throw new Error('Result fetch failed: ' + rRes.status);
      const result = await rRes.json();
      const videoUrl = result.video?.url || result.videos?.[0]?.url;
      res.json({ status: 'COMPLETED', video_url: videoUrl });
    } else if (s.status === 'FAILED') {
      res.json({ status: 'FAILED', error: s.error || 'Generation failed' });
    } else {
      // IN_QUEUE or IN_PROGRESS
      res.json({ status: s.status, queue_position: s.queue_position });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
