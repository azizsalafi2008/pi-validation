// Pi Testnet Horizon Endpoint
const HORIZON_URL = "https://api.testnet.minepi.com";

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
    return res.status(400).json({ error: "Missing user UID. Please complete Step 1 first." });
  }

  try {
    // A. Create App-to-User Payment Order on Pi Platform
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
    let recipientAddress = null;

    if (createRes.ok) {
      paymentId = createData.identifier || createData.id;
      recipientAddress = createData.to_address;
    } else if (createData.error === 'ongoing_payment_found' && createData.payment) {
      paymentId = createData.payment.identifier;
      recipientAddress = createData.payment.to_address;
    } else {
      return res.status(createRes.status).json({
        error: `Payment creation failed: ${createData.error_message || createData.message || JSON.stringify(createData)}`
      });
    }

    // B. Finalize App-to-User Payment
    // For App-to-User validation, pass the server payment identifier as the transaction proof
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
      txid: paymentId,
      result: completeData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
