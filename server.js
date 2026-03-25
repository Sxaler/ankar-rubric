const express = require('express');
const path = require('path');
const app = express();
const PORT = 3456;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ─── Ashby API Proxy ───
// Matches Vercel serverless route: /api/ashby?endpoint=candidate.search
const allowed = [
  'candidate.search',
  'candidate.info',
  'interviewSchedule.info',
  'interviewSchedule.list',
  'interviewSchedule.submit',
  'interview.list',
  'feedbackFormDefinition.list',
  'feedbackFormDefinition.info',
  'applicationFeedback.submit',
];

app.post('/api/ashby', async (req, res) => {
  const endpoint = req.query.endpoint;
  const { apiKey, ...body } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing apiKey' });
  }

  if (!endpoint || !allowed.includes(endpoint)) {
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
      console.error(`Ashby [${endpoint}] returned non-JSON:`, text);
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
});

app.listen(PORT, () => {
  console.log(`\n  Ankar Rubric running at http://localhost:${PORT}\n`);
});
