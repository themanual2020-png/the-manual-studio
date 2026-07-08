const sharp = require('sharp');

const ALLOWED_HOST = 'pzrjboiioplhijzyfdmf.supabase.co';

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

    const acceptsWebp = (req.headers.accept || '').includes('image/webp');
    const isConvertibleImage = /^image\/(jpeg|png|jpg)$/i.test(contentType);

    if (acceptsWebp && isConvertibleImage) {
      try {
        const webp = await sharp(buf).webp({ quality: 80 }).toBuffer();
        res.setHeader('Content-Type', 'image/webp');
        res.status(200).send(webp);
        return;
      } catch (e) {
        // fall through and serve the original bytes if conversion fails
      }
    }

    res.setHeader('Content-Type', contentType);
    res.status(200).send(buf);
  } catch (e) {
    res.status(502).send('Proxy error');
  }
};
