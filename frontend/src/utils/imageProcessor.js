/**
 * Simple image processing utilities
 */

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;
const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function validateImage(file) {
  if (!file || file.size > MAX_FILE_SIZE) {
    throw new Error('File too large (max 3MB)');
  }
  
  if (!VALID_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  return true;
}

export function calculateDimensions(width, height) {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }
  
  const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
}

export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = calculateDimensions(img.width, img.height);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const result = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      resolve(result);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function processImage(file) {
  validateImage(file);
  return await resizeImage(file);
}
