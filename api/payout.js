export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. YOUR TESTNET SERVER API KEY (Paste raw key without "Key " prefix)
  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  try {
    const { uid } = req.body || {};
    if (!uid) {
      return res.status(400).json({ error: "Missing user UID. Please tap '1. Pay 0.1 Pi' first." });
    }

    // 2. Create the App-to-User Payment
    const createRes = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: {
          amount: 0.1,
          memo: "DocHelper Test Payout",
          metadata: { purpose: "testnet_validation" },
          uid: uid
        }
      })
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      return res.status(createRes.status).json({
        error: `Payment creation failed: ${createData.message || JSON.stringify(createData)}`
      });
    }

    const paymentId = createData.identifier || createData.id;

    // 3. Complete the payout
    const completeRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid: "app_to_user_payout" })
    });

    const completeData = await completeRes.json();

    return res.status(200).json({
      success: true,
      paymentId: paymentId,
      result: completeData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
