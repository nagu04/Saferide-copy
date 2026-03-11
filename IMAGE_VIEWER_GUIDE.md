# Image Viewer Guide

## Overview

The SafeRide dashboard now includes an advanced image viewing system for violation evidence photos with comprehensive zoom, pan, comparison, and download capabilities.

## Features

### 🔍 Zoom & Pan Controls
- **Zoom In/Out**: Use the dedicated zoom buttons or mouse wheel
- **Pan**: Click and drag to move around zoomed images
- **Reset**: Quickly reset to original view with one click
- **Double-click**: Reset zoom by double-clicking the image
- **Smooth Controls**: Responsive zoom with configurable step increments

### 📊 Multiple View Modes
1. **Single View** - Focus on one image with full zoom/pan controls
2. **Compare View** - Side-by-side comparison of two images
3. **Grid View** - Overview of all evidence images

### 🖼️ Lightbox Gallery Navigation
- **Keyboard Navigation**: 
  - `←` Previous image
  - `→` Next image
  - `Esc` Close viewer
- **Thumbnail Strip**: Quick navigation between images
- **Image Counter**: Shows current position (e.g., "3 / 4")

### 💾 Download Functionality
- Download original high-resolution images
- One-click download from zoom controls
- Automatic filename generation (e.g., `violation-evidence-1.jpg`)

### 🎯 Smart Features
- **Metadata Display**: Camera ID, timestamp, and confidence scores
- **Image Captions**: Contextual information for each photo
- **Highlight Active Images**: Visual indicators for current selection
- **Responsive Design**: Works on all screen sizes

## Component Usage

### Basic Implementation

```tsx
import { ImageViewer, ImageViewerImage } from '@/app/components/ImageViewer';

// Define your images
const images: ImageViewerImage[] = [
  {
    src: 'https://example.com/image1.jpg',
    alt: 'Evidence photo 1',
    caption: 'Primary detection',
    metadata: {
      timestamp: '2024-03-11 14:32:05',
      camera: 'CAM-04-NORTH',
      confidence: 94.2
    }
  },
  // ... more images
];

// In your component
const [showViewer, setShowViewer] = useState(false);
const [selectedIndex, setSelectedIndex] = useState(0);

// Render
<ImageViewer
  open={showViewer}
  onClose={() => setShowViewer(false)}
  images={images}
  initialIndex={selectedIndex}
/>
```

### Image Data Structure

```typescript
interface ImageViewerImage {
  src: string;           // Image URL (required)
  alt: string;           // Alt text (required)
  caption?: string;      // Display caption (optional)
  metadata?: {           // Additional metadata (optional)
    timestamp?: string;
    camera?: string;
    confidence?: number;
  };
}
```

## Where It's Used

### 1. Admin Incident Detail Page (`/incidents/:id`)
- View all evidence photos from violation detection
- Compare multiple angles of the same incident
- Download high-resolution evidence for reporting
- **Access**: Click "View Gallery" button or click on any thumbnail

### 2. User Violation Detail Page (`/user/violations/:id`)
- Review evidence photos for personal violations
- Download evidence for appeals
- **Access**: Click "View Gallery" button or click on the main image

## User Guide

### Opening the Image Viewer
1. Navigate to an incident or violation detail page
2. Click the **"View Gallery"** button in the Evidence Gallery section
3. Or click directly on any thumbnail image

### Navigation
- **Next/Previous**: Use arrow buttons on screen or keyboard arrows
- **Thumbnails**: Click any thumbnail at the bottom to jump to that image
- **Close**: Click the X button or press Escape

### Zoom Controls
1. Click the **+** button to zoom in
2. Click the **-** button to zoom out
3. Click the **⟲** button to reset zoom
4. Or use mouse wheel to zoom while hovering over image

### Comparing Images
1. Click the **side-by-side** icon in the view mode toggle
2. Select which image to compare using the dropdown
3. Both images have independent zoom/pan controls
4. Perfect for comparing before/after or different angles

### Grid View
1. Click the **grid** icon in the view mode toggle
2. See all images at once in a responsive grid
3. Click any image to return to single view

### Downloading Images
1. Open any image in the viewer
2. Click the **download** button (⬇ icon)
3. Image will download with automatic naming

## Technical Details

### Dependencies
- **react-zoom-pan-pinch**: Provides zoom and pan functionality
- **lucide-react**: Icons for UI controls

### Performance
- Images are loaded on-demand
- Smooth transitions and animations
- Optimized for large image galleries (4+ images)

### Accessibility
- Keyboard navigation support
- Screen reader compatible alt text
- Focus management for modal interactions

### Browser Support
- Works in all modern browsers
- Responsive across desktop, tablet, and mobile
- Touch gestures supported on mobile devices

## Customization

### Zoom Settings
You can customize zoom behavior in the `ImageViewer.tsx` component:

```tsx
<TransformWrapper
  initialScale={1}      // Starting zoom level
  minScale={0.5}        // Minimum zoom (50%)
  maxScale={5}          // Maximum zoom (500%)
  wheel={{ step: 0.1 }} // Zoom step increment
  // ... other props
>
```

### Image Quality
Update the image URLs to use different quality settings:
- `?auto=format&fit=crop&q=80&w=1200` - Standard quality
- `?auto=format&fit=crop&q=95&w=2400` - High quality

## Best Practices

### For Administrators
1. Always review images at 100%+ zoom before approving violations
2. Use comparison mode to check consistency across multiple frames
3. Download original images for official records
4. Check metadata timestamps to verify sequence

### For Users
1. Use zoom to verify details in violation evidence
2. Download images before filing an appeal
3. Check all available angles in grid view
4. Note the confidence scores in metadata

## Troubleshooting

### Images Won't Load
- Check your internet connection
- Verify image URLs are accessible
- Try refreshing the page

### Zoom Not Working
- Ensure you're in Single or Compare view mode (not Grid)
- Try clicking the reset button first
- Check that JavaScript is enabled

### Download Fails
- Verify the image URL is publicly accessible
- Check browser download permissions
- Some browsers may block downloads - check popup blocker

## Future Enhancements

Potential improvements for future releases:
- [ ] Image annotations/markup tools
- [ ] Rotation controls for misaligned photos
- [ ] Brightness/contrast adjustment
- [ ] Print functionality
- [ ] Share via email
- [ ] Multiple image download (zip)
- [ ] Slideshow mode with auto-advance
- [ ] Pinch-to-zoom gesture support enhancement

## Security & Privacy

- Images are loaded from secure HTTPS sources
- No client-side image processing or storage
- Downloads respect original image permissions
- Metadata is display-only, not editable by users

## Support

For issues or questions about the Image Viewer:
1. Check this documentation first
2. Review the component code in `/src/app/components/ImageViewer.tsx`
3. Contact the development team with specific error messages

---

**Last Updated**: March 11, 2026  
**Component Version**: 1.0.0  
**Dependencies**: react-zoom-pan-pinch ^3.7.0
