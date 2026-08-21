export default async function handler(req, res) {
  // CORS & Method Check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId } = req.body;
  
  // Use environment variable or paste your raw 128-char key directly for testing
  const PI_API_KEY = process.env.PI_API_KEY;

  if (!PI_API_KEY) {
    return res.status(500).json({ error: 'PI_API_KEY is missing on server' });
  }

  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
