export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. YOUR TESTNET SERVER API KEY
  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  const { uid } = req.body || {};
  if (!uid) {
    return res.status(400).json({ error: "Missing user UID. Tap Button 1 first." });
  }

  try {
    // 1. Create the App-to-User Payment on Pi Server
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

    let createData = await createRes.json();
    let paymentId = null;

    if (createRes.ok) {
      paymentId = createData.identifier || createData.id;
    } else if (createData.error === 'ongoing_payment_found' && createData.payment) {
      paymentId = createData.payment.identifier;
    } else {
      return res.status(createRes.status).json({
        error: `Payment creation failed: ${createData.error_message || createData.message || JSON.stringify(createData)}`
      });
    }

    // 2. Complete the Payout via Pi Platform API
    const completeRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid: "payout_complete" })
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
