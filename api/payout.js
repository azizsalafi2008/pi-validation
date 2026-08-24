export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Paste your actual API Secret Key between the quotes below
  const secretKey = "PASTE_YOUR_NEW_API_KEY_HERE".trim();
  const authHeader = secretKey.startsWith('Key ') ? secretKey : `Key ${secretKey}`;
  const { uid, amount } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'Missing UID in request body.' });
  }

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
