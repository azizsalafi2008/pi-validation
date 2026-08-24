export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Temporary hardcoded key to complete Step 8 testing
  const apiKey = "361138f95a13b12601fd35b5d8806f5841d81a685bfa210eb03d804ec0687b3ab8b9fe782a4082510c5e68060bcce737759bb621e6027870b29081b20168434b";
  const formattedKey = apiKey.startsWith('Key ') ? apiKey : `Key ${apiKey}`;
  
  const { uid, amount } = req.body;
  if (!uid) return res.status(400).json({ error: 'Missing user UID' });

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
