export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Replace with your raw App Secret Key from developer.pi (without typing "Key " in front of it)
  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();

  // Formats correctly for Pi Network API
  const formattedKey = rawKey.startsWith('Key ') ? rawKey : `Key ${rawKey}`;
  const { uid, amount } = req.body;

  if (!uid) return res.status(400).json({ error: 'Missing user UID.' });

  try {
    const response = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': formattedKey,
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

    if (!response.ok) {
      return res.status(response.status).json({
        error: paymentData.message || paymentData.error || JSON.stringify(paymentData)
      });
    }

    return res.status(200).json(paymentData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
