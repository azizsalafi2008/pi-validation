export default async function handler(req, res) {
  // Always allow CORS for Pi Browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const authHeader = secretKey.startsWith('Key ') ? secretKey : `Key ${secretKey}`;
  const { paymentId } = req.body;

  if (!paymentId) return res.status(400).json({ error: 'Missing paymentId' });

  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log("Pi Approve Response:", data);

    // Return the exact status code from Pi Network
    return res.status(response.status).json(data);
  } catch (error) {
    console.error("Approve endpoint error:", error);
    return res.status(500).json({ error: error.message });
  }
}
