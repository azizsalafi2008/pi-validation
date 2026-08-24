export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 1. Get Secret Key
  let apiKey = process.env.PI_API_KEY || "361138f95a13b12601fd35b5d8806f5841d81a685bfa210eb03d804ec0687b3ab8b9fe782a4082510c5e68060bcce737759bb621e6027870b29081b20168434b";
  
  if (!apiKey || apiKey === "361138f95a13b12601fd35b5d8806f5841d81a685bfa210eb03d804ec0687b3ab8b9fe782a4082510c5e68060bcce737759bb621e6027870b29081b20168434b") {
    return res.status(400).json({ error: 'Secret Key is not set in backend code.' });
  }

  // Format header
  const authHeader = apiKey.startsWith('Key ') ? apiKey : `Key ${apiKey}`;
  const { uid, amount } = req.body || {};

  if (!uid) {
    return res.status(400).json({ error: 'No UID received from frontend.' });
  }

  try {
    const piResponse = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment: {
          amount: amount || 0.1,
          memo: "App to User Payout",
          metadata: { type: "A2U" },
          uid: uid
        }
      })
    });

    const data = await piResponse.json();

    if (!piResponse.ok) {
      return res.status(piResponse.status).json({ 
        error: `Pi API returned ${piResponse.status}: ${data.message || JSON.stringify(data)}` 
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Server Catch Error: ' + err.message });
  }
}
