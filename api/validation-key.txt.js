export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
  res.status(200).send('361138f95a13b12601fd35b5d8806f5841d81a685bfa210eb03d804ec0687b3ab8b9fe782a4082510c5e68060bcce737759bb621e6027870b29081b20168434b');
}
