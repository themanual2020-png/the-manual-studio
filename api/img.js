const sharp = require('sharp');

const ALLOWED_HOST = 'pzrjboiioplhijzyfdmf.supabase.co';
const MAX_WIDTH = 2000;

module.exports = async function handler(req, res) {
  const src = req.query.src;
  if (!src) {
    res.status(400).send('Missing src');
    return;
  }

  let url;
  try {
    url = new URL(src);
  } catch (e) {
    res.status(400).send('Invalid src');
    return;
  }

  if (url.hostname !== ALLOWED_HOST) {
    res.status(400).send('Host not allowed');
    return;
  }

  try {
    const upstream = await fetch(url.toString());
    if (!upstream.ok) {
      res.status(upstream.status).send('Upstream error');
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.setHeader('Vary', 'Accept');

    const isConvertibleImage = /^image\/(jpeg|png|jpg)$/i.test(contentType);
    const acceptsWebp = (req.headers.accept || '').includes('image/webp');

    if (isConvertibleImage) {
      try {
        const pipeline = sharp(buf).resize({ width: MAX_WIDTH, withoutEnlargement: true });
        if (acceptsWebp) {
          const out = await pipeline.webp({ quality: 80 }).toBuffer();
          res.setHeader('Content-Type', 'image/webp');
          res.status(200).send(out);
        } else {
          const out = await pipeline.jpeg({ quality: 80 }).toBuffer();
          res.setHeader('Content-Type', 'image/jpeg');
          res.status(200).send(out);
        }
        return;
      } catch (e) {
        // fall through and serve the original bytes if processing fails
      }
    }

    res.setHeader('Content-Type', contentType);
    res.status(200).send(buf);
  } catch (e) {
    res.status(502).send('Proxy error');
  }
};
