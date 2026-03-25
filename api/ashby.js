// Vercel Serverless Function — Ashby API Proxy
// Handles POST /api/ashby?endpoint=candidate.search etc.

const ALLOWED = [
  'candidate.search',
  'candidate.info',
  'interviewSchedule.info',
  'interviewSchedule.list',
  'interviewSchedule.submit',
  'interview.list',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const endpoint = req.query.endpoint;
  const { apiKey, ...body } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing apiKey' });
  }

  if (!endpoint || !ALLOWED.includes(endpoint)) {
    return res.status(403).json({ error: `Endpoint "${endpoint}" not allowed` });
  }

  try {
    const response = await fetch(`https://api.ashbyhq.com/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(response.status).json({ error: text || `HTTP ${response.status}` });
    }

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (e) {
    console.error(`Ashby proxy error [${endpoint}]:`, e.message);
    res.status(502).json({ error: 'Failed to reach Ashby API: ' + e.message });
  }
}
