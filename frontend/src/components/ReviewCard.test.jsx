import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReviewCard from './ReviewCard.jsx';

describe('ReviewCard Component', () => {
  const mockImage = {
    url: 'data:image/jpeg;base64,test',
    postUrl: 'https://example.com/post/1'
  };
  
  const mockAltText = 'A beautiful landscape';

  it('should display image', () => {
    render(
      <ReviewCard 
        image={mockImage} 
        altText={mockAltText}
      />
    );
    
    const image = screen.getByTestId('review-image');
    expect(image).toBeDefined();
    expect(image.src).toBe(mockImage.url);
  });

  it('should display editable alt text', () => {
    render(
      <ReviewCard 
        image={mockImage} 
        altText={mockAltText}
      />
    );
    
    const input = screen.getByTestId('alt-text-input');
    expect(input).toBeDefined();
    expect(input.value).toBe(mockAltText);
  });

  it('should handle alt text editing', () => {
    const onEdit = vi.fn();
    
    render(
      <ReviewCard 
        image={mockImage} 
        altText={mockAltText}
        onEdit={onEdit}
      />
    );
    
    const input = screen.getByTestId('alt-text-input');
    fireEvent.change(input, { target: { value: 'Updated text' } });
    
    expect(onEdit).toHaveBeenCalledWith('Updated text');
  });

  it('should handle approval', () => {
    const onApprove = vi.fn();
    
    render(
      <ReviewCard 
        image={mockImage} 
        altText={mockAltText}
        onApprove={onApprove}
      />
    );
    
    const approveBtn = screen.getByTestId('approve-btn');
    fireEvent.click(approveBtn);
    
    expect(onApprove).toHaveBeenCalledWith(mockAltText);
  });

  it('should handle rejection', () => {
    const onReject = vi.fn();
    
    render(
      <ReviewCard 
        image={mockImage} 
        altText={mockAltText}
        onReject={onReject}
      />
    );
    
    const rejectBtn = screen.getByTestId('reject-btn');
    fireEvent.click(rejectBtn);
    
    expect(onReject).toHaveBeenCalled();
  });
});
