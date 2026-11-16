export const prerender = false;

import crypto from 'node:crypto';

export async function POST({ request }) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. If backend credentials are provided, perform signed upload
    if (cloudName && apiKey && apiSecret) {
      const timestamp = Math.floor(Date.now() / 1000);
      const folder = 'shangyun/products';
      const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash('sha1').update(toSign).digest('hex');

      const cldForm = new FormData();
      cldForm.append('file', file);
      cldForm.append('api_key', apiKey);
      cldForm.append('timestamp', timestamp.toString());
      cldForm.append('folder', folder);
      cldForm.append('signature', signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cldForm
      });

      const data = await res.json();
      if (res.ok && data.secure_url) {
        return new Response(JSON.stringify({
          url: data.secure_url,
          public_id: data.public_id,
          isCloudinary: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        console.warn('Cloudinary upload warning:', data);
        return new Response(JSON.stringify({
          error: data.error?.message || 'Gagal mengunggah ke Cloudinary',
          details: data
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 2. If unsigned preset is available
    if (cloudName && uploadPreset) {
      const cldForm = new FormData();
      cldForm.append('file', file);
      cldForm.append('upload_preset', uploadPreset);
      cldForm.append('folder', 'shangyun/products');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cldForm
      });

      const data = await res.json();
      if (res.ok && data.secure_url) {
        return new Response(JSON.stringify({
          url: data.secure_url,
          public_id: data.public_id,
          isCloudinary: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      error: 'Konfigurasi Cloudinary di .env belum lengkap (butuh CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('API upload error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

