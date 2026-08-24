export default async function handler(req, res) {
  // 1. Immediately return for non-POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId } = req.body;
  if (!paymentId) {
    return res.status(400).json({ error: 'Missing paymentId' });
  }

  // Ensure key format matches 'Key <your_secret_key>'
  const secretKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const authHeader = secretKey.startsWith('Key ') ? secretKey : `Key ${secretKey}`;

  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    // Explicitly return response to Vercel immediately
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Approve Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
