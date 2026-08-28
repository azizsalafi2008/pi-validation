export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  let { paymentId } = req.body || {};
  if (!paymentId) {
    return res.status(400).json({ error: "Missing paymentId" });
  }

  const cleanId = String(paymentId).trim();
  const endpoints = [
    `https://api.minepi.com/v2/payments/${cleanId}/approve`,
    `https://sandbox.minepi.com/v2/payments/${cleanId}/approve`
  ];

  let lastError = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok) {
        return res.status(200).json(data);
      }
      lastError = data;
    } catch (err) {
      lastError = { error: err.message };
    }
  }

  return res.status(400).json(lastError);
}
