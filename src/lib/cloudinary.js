/**
 * Cloudinary Image Storage Service for Shang Yun (尚韵)
 * Mendukung upload gambar langsung ke Cloudinary CDN via API Serverless / Unsigned Presets
 * dengan fallback lokal aman.
 */

export const CLOUDINARY_STORAGE_KEY = 'shangyun.cloudinary.config.v1';

export function getCloudinaryConfig() {
  let cloudName = '';
  let uploadPreset = '';

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME || '';
    uploadPreset = import.meta.env.PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CLOUDINARY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.cloudName) cloudName = parsed.cloudName;
        if (parsed.uploadPreset) uploadPreset = parsed.uploadPreset;
      }
    } catch (e) {}
  }

  return {
    cloudName: cloudName || 'dqh8sci',
    uploadPreset: uploadPreset || '',
    isConfigured: Boolean(cloudName)
  };
}

export function saveCloudinaryConfig(config) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        CLOUDINARY_STORAGE_KEY,
        JSON.stringify({
          cloudName: config.cloudName?.trim() || '',
          uploadPreset: config.uploadPreset?.trim() || ''
        })
      );
    } catch (e) {}
  }
}

/**
 * Upload gambar ke Cloudinary CDN
 * @param {File|Blob|string} file - File gambar atau data URI
 * @returns {Promise<{ url: string, publicId?: string, isCloudinary: boolean }>}
 */
export async function uploadImageToCloudinary(file) {
  // If string (already a URL or data URI)
  if (typeof file === 'string') {
    return { url: file, isCloudinary: file.includes('cloudinary.com') };
  }

  // 1. Coba upload via Backend API Astro (/api/upload) dengan kredensial server .env
  try {
    const apiForm = new FormData();
    apiForm.append('file', file);
    const apiRes = await fetch('/api/upload', {
      method: 'POST',
      body: apiForm
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.url) {
        return {
          url: data.url,
          publicId: data.public_id,
          isCloudinary: true
        };
      }
    }
  } catch (apiErr) {
    console.warn('Backend API upload not reached, trying direct client...', apiErr);
  }

  // 2. Direct client upload jika upload_preset disetel
  const config = getCloudinaryConfig();
  if (config.cloudName && config.uploadPreset) {
    try {
      const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.uploadPreset);
      formData.append('folder', 'shangyun/products');

      const res = await fetch(endpoint, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        return {
          url: data.secure_url || data.url,
          publicId: data.public_id,
          isCloudinary: true
        };
      }
    } catch (err) {
      console.warn('Direct upload failed:', err);
    }
  }

  // 3. Fallback ke local data URI jika Cloudinary offline/unconfigured
  const fallbackUri = await fileToDataUri(file);
  return { url: fallbackUri, isCloudinary: false };
}

function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Optimasi URL Cloudinary dengan on-the-fly transformations
 */
export function getOptimizedCloudinaryUrl(url, { width = 600, quality = 'auto', format = 'auto' } = {}) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const parts = url.split('/upload/');
  if (parts.length === 2) {
    return `${parts[0]}/upload/w_${width},q_${quality},f_${format}/${parts[1]}`;
  }
  return url;
}
