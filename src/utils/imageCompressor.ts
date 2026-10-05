/**
 * Image Compressor Utility
 * Safely scales down and compresses images in the browser using HTML5 Canvas API.
 * - Enforces max dimensions (default 500x500)
 * - Converts to WebP (fallback to JPEG) with 0.8 quality
 * - Output file size typically 25 KB - 60 KB
 * - Non-blocking asynchronous processing via Promise
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSizeBytes?: number; // Reject file if raw input exceeds this limit (e.g. 10MB)
}

export interface CompressResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  mimeType: string;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 500,
  maxHeight: 500,
  quality: 0.8,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB limit for original image
};

export async function compressImage(
  file: File,
  options?: CompressOptions
): Promise<CompressResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Berkas yang dipilih harus berupa file gambar (JPG, PNG, WebP).');
  }

  // 2. Validate file size
  if (file.size > opts.maxFileSizeBytes) {
    throw new Error('Ukuran file terlalu besar. Maksimum ukuran file asli adalah 10 MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas gambar dari perangkat.'));
    };

    reader.onload = (event) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Format gambar tidak dapat diproses oleh browser.'));
      };

      img.onload = () => {
        try {
          let { width, height } = img;

          // Maintain aspect ratio while scaling to max dimensions
          if (width > opts.maxWidth || height > opts.maxHeight) {
            const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Browser tidak mendukung Canvas 2D context.'));
            return;
          }

          // Clear and draw image
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Attempt WebP compression first, fall back to JPEG if unsupported
          let mimeType = 'image/webp';
          let dataUrl = canvas.toDataURL(mimeType, opts.quality);

          // Some older browsers might silently return png if webp unsupported
          if (!dataUrl.startsWith('data:image/webp')) {
            mimeType = 'image/jpeg';
            dataUrl = canvas.toDataURL(mimeType, opts.quality);
          }

          // Calculate estimated size from base64 string
          const base64Data = dataUrl.split(',')[1] || '';
          const compressedSize = Math.round((base64Data.length * 3) / 4);

          resolve({
            dataUrl,
            originalSize: file.size,
            compressedSize,
            width,
            height,
            mimeType,
          });
        } catch (err: any) {
          reject(new Error(err?.message || 'Terjadi kesalahan saat mengompresi gambar.'));
        }
      };

      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error('Data gambar kosong.'));
      }
    };

    reader.readAsDataURL(file);
  });
}
