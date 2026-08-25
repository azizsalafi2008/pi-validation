export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'Missing paymentId' });

  // Retry up to 5 times (1.5 seconds apart) to wait for Pi's backend to register the paymentId
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      // If approved successfully, return 200
      if (response.ok) {
        return res.status(200).json(data);
      }

      // If Pi's servers say not found yet, wait and try again
      if (response.status === 404 && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      // If another error occurred or max attempts reached, return response
      return res.status(response.status).json(data);
    } catch (error) {
      if (attempt === maxAttempts) {
        return res.status(500).json({ error: error.message });
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }
}
