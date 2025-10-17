import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImageList from './ImageList.jsx';

describe('ImageList Component', () => {
  const mockImages = [
    {
      url: 'data:image/jpeg;base64,test1',
      postText: 'First post with an image',
      postUrl: 'https://example.com/post/1'
    },
    {
      url: 'data:image/jpeg;base64,test2', 
      postText: 'Second post with another image',
      postUrl: 'https://example.com/post/2'
    }
  ];

  it('should display list of images', () => {
    render(<ImageList images={mockImages} />);
    
    const imageList = screen.getByTestId('image-list');
    expect(imageList).toBeDefined();
    
    const imageItems = screen.getAllByTestId(/image-item-/);
    expect(imageItems).toHaveLength(2);
  });

  it('should display post text preview', () => {
    render(<ImageList images={mockImages} />);
    
    expect(screen.getByText('First post with an image...')).toBeDefined();
    expect(screen.getByText('Second post with another image...')).toBeDefined();
  });

  it('should handle image selection', () => {
    const onImageSelect = vi.fn();
    
    render(
      <ImageList 
        images={mockImages} 
        onImageSelect={onImageSelect}
      />
    );
    
    const firstImage = screen.getByTestId('image-item-0');
    firstImage.click();
    
    expect(onImageSelect).toHaveBeenCalledWith(mockImages[0]);
  });

  it('should handle empty image list', () => {
    render(<ImageList images={[]} />);
    
    const imageList = screen.getByTestId('image-list');
    expect(imageList).toBeDefined();
    expect(imageList.children).toHaveLength(0);
  });
});
