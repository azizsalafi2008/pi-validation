export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  try {
    // 1. Fetch all incomplete payments directly from Pi Server
    const listRes = await fetch('https://api.minepi.com/v2/payments/incomplete', {
      method: 'GET',
      headers: { 'Authorization': authHeader }
    });

    const listData = await listRes.json();
    const payments = listData.incomplete_payments || [];

    if (payments.length === 0) {
      return res.status(200).json({ message: "No incomplete payments found on server." });
    }

    // 2. Cancel every stuck payment found
    const cancelResults = [];
    for (const p of payments) {
      const pId = p.identifier || p.id;
      const cancelRes = await fetch(`https://api.minepi.com/v2/payments/${pId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      const cData = await cancelRes.json();
      cancelResults.push({ id: pId, result: cData });
    }

    return res.status(200).json({
      success: true,
      cleared_count: cancelResults.length,
      details: cancelResults
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
