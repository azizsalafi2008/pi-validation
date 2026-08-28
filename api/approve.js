export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawKey = "x0d4ozrupxeeou2tqtun9lupvfgupqysoixie2udyjkqfbftvzl1fmjdd3gqw3er".trim();
  const secretKey = rawKey.replace(/^Key\s+/i, '');
  const authHeader = `Key ${secretKey}`;

  const { paymentId } = req.body || {};
  if (!paymentId) {
    return res.status(400).json({ error: "Missing paymentId" });
  }

  try {
    const cleanId = String(paymentId).trim();
    const url = `https://api.minepi.com/v2/payments/${cleanId}/approve`;

    const approveRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const text = await approveRes.text();
    let data;
    
    // Safely try to parse JSON. If Pi returned HTML, catch it gracefully.
    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(502).json({
        error: `Pi Server returned HTML instead of JSON (Status ${approveRes.status})`,
        pi_response: text.substring(0, 150)
      });
    }

    return res.status(approveRes.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
