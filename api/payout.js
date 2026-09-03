
const StellarSdk = require('stellar-sdk');

// Configure the Pi Testnet Horizon server
const server = new StellarSdk.Server('https://api.testnet.minepi.com');
const networkPassphrase = 'Pi Testnet';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Use environment variables instead of hardcoding keys
  const apiKey = process.env.PI_API_KEY || "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er";
  const authHeader = `Key ${apiKey.replace(/^Key\s+/i, '').trim()}`;
  
  // Your App Wallet's Secret Seed (starts with 'S', NOT 'G')
  const APP_WALLET_SEED = process.env.PI_WALLET_SEED; 
  if (!APP_WALLET_SEED) {
    return res.status(500).json({ error: "Missing PI_WALLET_SEED in environment variables." });
  }

  const { uid } = req.body || {};
  if (!uid) {
    return res.status(400).json({ error: "Missing user UID." });
  }

  try {
    // 1. Create the pending payment with Pi Server
    let createRes = await createPiPayment(authHeader, uid);
    let createData = await createRes.json();

    // Clear stuck transactions if they exist
    if (createData.error === 'ongoing_payment_found' && createData.payment) {
      const stuckId = createData.payment.identifier;
      await fetch(`https://api.minepi.com/v2/payments/${stuckId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
      });

      createRes = await createPiPayment(authHeader, uid);
      createData = await createRes.json();
    }

    const paymentId = createData.identifier || createData.id;
    const recipientAddress = createData.recipient; // Pi API provides the user's wallet address

    if (!paymentId || !recipientAddress) {
      return res.status(400).json({
        error: `Could not initialize payment or find recipient address: ${JSON.stringify(createData)}`
      });
    }

    // 2. Build, Sign, and Submit the Blockchain Transaction via Stellar SDK
    const sourceKeypair = StellarSdk.Keypair.fromSecret(APP_WALLET_SEED);
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: '10000000', // Standard Pi Testnet base fee
      networkPassphrase: networkPassphrase
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: recipientAddress,
          asset: StellarSdk.Asset.native(),
          amount: '0.1'
        })
      )
      // The Pi paymentId MUST be included in the memo!
      .addMemo(StellarSdk.Memo.text(paymentId))
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);
    const stellarSubmitResponse = await server.submitTransaction(transaction);

    // 3. Complete payment with the REAL blockchain transaction hash
    const completeRes = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid: stellarSubmitResponse.hash })
    });

    const completeData = await completeRes.json();

    if (!completeRes.ok) {
      return res.status(500).json({
        error: "Pi API /complete rejected the transaction.",
        details: completeData
      });
    }

    return res.status(200).json({
      success: true,
      paymentId: paymentId,
      txid: stellarSubmitResponse.hash
    });

  } catch (error) {
    let errorMessage = error.message;
    // Extract the specific Stellar blockchain error code if it crashes
    if (error.response && error.response.data && error.response.data.extras) {
      errorMessage = JSON.stringify(error.response.data.extras.result_codes);
    }
    return res.status(500).json({ error: errorMessage });
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
