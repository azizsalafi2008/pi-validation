export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Paste your App Secret Key / Server API Key inside quotes below
  const secretKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const authHeader = secretKey.startsWith('Key ') ? secretKey : `Key ${secretKey}`;
  const { uid, amount } = req.body;

  if (!uid) return res.status(400).json({ error: 'Missing UID from client.' });

  try {
    const response = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: {
          amount: amount || 0.1,
          memo: "App to User Testnet Payout",
          metadata: { type: "A2U" },
          uid: uid
        }
      })
    });

    const paymentData = await response.json();
    return res.status(response.ok ? 200 : response.status).json(paymentData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
