export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
  res.status(200).send('477dviz77vzk3csh2gei4xv9dji9hxkwq8dyju9fgqxmfhsc7s1adhqoqxflfdrp');
}
