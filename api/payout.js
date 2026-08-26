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
    // 1. Create App-to-User Payment
    const createRes = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: {
          amount: parseFloat(amount || 0.1),
          memo: memo || "Testnet Payout Reward",
          metadata: { type: "testnet_verification" },
          uid: uid
        }
      })
    });

    const createText = await createRes.text();
    let paymentData;
    try {
      paymentData = JSON.parse(createText);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON from Pi API", raw: createText });
    }

    if (!createRes.ok || (!paymentData.identifier && !paymentData.id)) {
      return res.status(createRes.status).json({ 
        error: "Payment creation failed", 
        pi_response: paymentData 
      });
    }

    const paymentId = paymentData.identifier || paymentData.id;

    // 2. Submit payment to blockchain
    const submitRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    const submitData = await submitRes.json();
    const txid = submitData.transaction?.txid || submitData.txid || "submitted";

    // 3. Complete payment to finalize
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
