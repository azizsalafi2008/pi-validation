export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId } = req.body;
  
  // 80cd070ba51d32805e5914ae47b722d4f63f91eab83f511bf9da3ae3ef7c8609e0cbc9f69bf59f00735d2ae8c0e539a7459dcea300e3374f0504874a30fe40ac
  const PI_API_KEY = "PASTE_YOUR_PI_API_KEY_HERE";

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
