import StellarSdk from 'stellar-sdk';

const server = new StellarSdk.Horizon.Server('https://api.testnet.minepi.com');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. YOUR TESTNET SERVER API KEY (No "Key " prefix)
  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  // 2. YOUR TESTNET APP WALLET SECRET SEED (Starts with 'S...')
  const APP_SECRET_SEED = "SDZXTXGGP3JKKLTXM5QY3CAKU4AH3Z5NSBPFQGIPOG52MR3TK62WPR6K".trim();

  const { uid } = req.body || {};
  if (!uid) {
    return res.status(400).json({ error: "Missing user UID. Tap Button 1 first." });
  }

  try {
    // A. Create App-to-User Payment on Pi Platform
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

    // B. Sign & Submit Blockchain Transfer using Secret Seed
    const sourceKeypair = StellarSdk.Keypair.fromSecret(APP_SECRET_SEED);
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '10000',
      networkPassphrase: 'Pi Testnet'
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: recipientAddress,
        asset: StellarSdk.Asset.native(),
        amount: '0.1'
      }))
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);
    const txResponse = await server.submitTransaction(transaction);
    const txid = txResponse.hash;

    // C. Complete Payment on Pi Platform with actual txid
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
      paymentId: paymentId,
      txid: txid,
      result: completeData
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
