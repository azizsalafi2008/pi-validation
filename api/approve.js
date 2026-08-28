export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure YOUR TESTNET SERVER API KEY is pasted below without the word "Key"
  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  const { paymentId } = req.body || {};
  if (!paymentId) {
    return res.status(400).json({ error: "Missing paymentId in request body" });
  }

  try {
    const piResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const responseData = await piResponse.json();
    console.log("Pi Server Approve Response:", responseData);

    return res.status(piResponse.status).json(responseData);
  } catch (error) {
    console.error("Approve Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
