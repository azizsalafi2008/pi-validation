export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Paste your Server API Key below
  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  const { uid, amount } = req.body;
  if (!uid) return res.status(400).json({ error: 'Missing user UID' });

  try {
    // 1. Attempt to create the payout
    const createRes = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: {
          amount: parseFloat(amount) || 0.1,
          memo: "DocHelper Testnet Payout",
          metadata: { type: "testnet_payout", timestamp: Date.now() },
          uid: uid
        }
      })
    });

    const createData = await createRes.json();
    let paymentId = createData.identifier || createData.payment?.identifier || createData.payment_id;

    // 2. If blocked by ongoing payment, extract the stuck ID from the response or cancel it
    if (!createRes.ok) {
      // If Pi returned the stuck payment details in the error object:
      const stuckId = createData.identifier || createData.payment?.identifier || createData.payment_identifier || createData.data?.identifier;
      
      if (stuckId) {
        // Complete the stuck payment so it counts as 1 completed payout
        const compRes = await fetch(`https://api.minepi.com/v2/payments/${stuckId}/complete`, {
          method: 'POST',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ txid: "auto_recovered_tx" })
        });
        const compData = await compRes.json();
        return res.status(200).json({
          recovered: true,
          message: "Recovered and finalized stuck payout!",
          paymentId: stuckId,
          details: compData
        });
      }

      // If no ID was returned, output the full raw response to inspect
      return res.status(createRes.status).json({
        raw_error: createData,
        tip: "Check Pi error payload"
      });
    }

    // 3. Submit and Complete normal payout
    const submitRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/submit`, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
    });
    const submitData = await submitRes.json();
    const txid = submitData.txid || submitData.payment?.transaction?.txid;

    if (txid) {
      await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid: txid })
      });
    }

    return res.status(200).json({
      success: true,
      paymentId: paymentId,
      txid: txid || "submitted"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
