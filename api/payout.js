export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const apiKey = process.env.PI_API_KEY;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'Payout failed: Missing PI_API_KEY in environment variables' });
  }

  const formattedKey = apiKey.startsWith('Key ') ? apiKey : `Key ${apiKey}`;
  const { uid, amount } = req.body;
  
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
      return res.status(response.status).json({ error: paymentData.message || 'Pi API error' });
    }
    
    return res.status(200).json(paymentData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
