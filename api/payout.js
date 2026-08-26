export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { uid, amount, memo } = req.body || {};

  if (!uid) {
    return res.status(400).json({ error: "Missing Pioneer UID" });
  }

  const apiKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er";
  const authHeader = `Key ${apiKey}`;

  try {
    // Standard Pi App-to-User payload format
    const payload = {
      payment: {
        amount: Number(amount || 0.1),
        memo: memo || "Testnet Payout Reward",
        metadata: { type: "testnet_verification" },
        uid: String(uid)
      }
    };

    const createRes = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const createData = await createRes.json();

    if (!createRes.ok || (!createData.identifier && !createData.id)) {
      return res.status(createRes.status).json({
        error: "Payment creation failed",
        status: createRes.status,
        details: createData
      });
    }

    const paymentId = createData.identifier || createData.id;

    // Submit to blockchain
    const submitRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    const submitData = await submitRes.json();
    const txid = submitData.transaction?.txid || submitData.txid || "submitted";

    // Complete transaction
    const completeRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid: txid })
    });
    const completeData = await completeRes.json();

    return res.status(200).json({
      success: true,
      payment_id: paymentId,
      txid: txid,
      completed: completeData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
