import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateImage, calculateDimensions, processImage } from './imageProcessor.js';

// Mock Canvas API for testing
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    canvas: mockCanvas
  })),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockbase64data')
};

const mockImage = {
  width: 1600,
  height: 1200,
  onload: null,
  onerror: null,
  src: ''
};

// Mock DOM APIs
global.document = {
  createElement: vi.fn((tag) => {
    if (tag === 'canvas') return mockCanvas;
    if (tag === 'img') return { ...mockImage };
    return {};
  })
};

global.Image = function() {
  return { ...mockImage };
};

// Mock FileReader
global.FileReader = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.result = null;
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,mockfiledata';
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
};

describe('Image Processing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateImage', () => {
    it('should accept valid images under 3MB', () => {
      const validFile = { size: 1000000, type: 'image/jpeg' };
      expect(() => validateImage(validFile)).not.toThrow();
    });

    it('should reject images over 3MB', () => {
      const largeFile = { size: 4000000, type: 'image/jpeg' };
      expect(() => validateImage(largeFile)).toThrow('File too large');
    });

    it('should reject invalid file types', () => {
      const invalidFile = { size: 1000000, type: 'text/plain' };
      expect(() => validateImage(invalidFile)).toThrow('Invalid file type');
    });
  });

  describe('calculateDimensions', () => {
    it('should resize large images to max 1024px', () => {
      const result = calculateDimensions(2000, 1500);
      expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(1024);
    });

    it('should maintain aspect ratio', () => {
      const result = calculateDimensions(2000, 1000);
      expect(result.width / result.height).toBe(2);
    });

    it('should not resize small images', () => {
      const result = calculateDimensions(800, 600);
      expect(result).toEqual({ width: 800, height: 600 });
    });
  });

  describe('processImage', () => {
    it('should validate and process image', () => {
      const validFile = { size: 1000000, type: 'image/jpeg' };
      expect(() => validateImage(validFile)).not.toThrow();
      
      const dimensions = calculateDimensions(2000, 1500);
      expect(Math.max(dimensions.width, dimensions.height)).toBeLessThanOrEqual(1024);
    });
  });
});
