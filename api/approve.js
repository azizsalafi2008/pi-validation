export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Paste Testnet Server API Key (starts with letters/numbers, NO "Key " prefix)
  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  const { paymentId } = req.body || {};
  if (!paymentId) {
    return res.status(400).json({ error: "Missing paymentId" });
  }

  try {
    const cleanId = String(paymentId).trim();
    // Use the native Fetch API
    const approveRes = await fetch(`https://api.minepi.com/v2/payments/${cleanId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const data = await approveRes.json();
    return res.status(approveRes.status).json(data);
  } catch (error) {
    // Return a proper JSON error if the call crashes
    return res.status(500).json({ error: error.message });
  }
}
