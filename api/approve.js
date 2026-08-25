export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const authHeader = secretKey.startsWith('Key ') ? secretKey : `Key ${secretKey}`;
  const { paymentId } = req.body;

  if (!paymentId) return res.status(400).json({ error: 'Missing paymentId' });

  // Retry up to 3 times with a delay if Pi's testnet nodes lag
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        return res.status(200).json(data);
      }

      // If payment is not ready on Pi's server yet, wait 1.5 seconds and retry
      if (response.status === 404 && attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        continue;
      }

      return res.status(response.status).json(data);
    } catch (error) {
      if (attempt === 3) return res.status(500).json({ error: error.message });
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
}
