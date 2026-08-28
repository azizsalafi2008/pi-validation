export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  const { uid } = req.body || {};
  if (!uid) {
    return res.status(400).json({ error: "Missing user UID. Tap Button 1 first." });
  }

  try {
    // 1. Check if there is an ongoing stuck payment and cancel it first
    let createRes = await createPiPayment(authHeader, uid);
    let createData = await createRes.json();

    if (createData.error === 'ongoing_payment_found' && createData.payment) {
      const stuckId = createData.payment.identifier;
      
      // Try to cancel the stuck payment
      await fetch(`https://api.minepi.com/v2/payments/${stuckId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
      });

      // Try creating a fresh payment again after clearing
      createRes = await createPiPayment(authHeader, uid);
      createData = await createRes.json();
    }

    let paymentId = createData.identifier || createData.id;

    if (!paymentId) {
      return res.status(400).json({
        error: `Could not initialize unique payment: ${JSON.stringify(createData)}`
      });
    }

    // 2. Complete payment
    const completeRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid: paymentId })
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

function createPiPayment(authHeader, uid) {
  const nonce = Math.random().toString(36).substring(7);
  return fetch('https://api.minepi.com/v2/payments', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      payment: {
        amount: 0.1,
        memo: `Payout ${Date.now()}`,
        metadata: { nonce: nonce, uid: uid },
        uid: uid
      }
    })
  });
}
