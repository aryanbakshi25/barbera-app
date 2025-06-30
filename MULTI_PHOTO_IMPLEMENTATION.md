# Multi-Photo Portfolio Implementation

This document outlines the implementation of multi-photo support for portfolio posts in your barber appointment booking app.

## Overview

The system now supports multiple images per portfolio post, with backward compatibility for existing single-image posts. Images are stored as JSONB for flexibility and performance.

## Database Changes

### Migration SQL
Run the following SQL in your Supabase SQL editor:

```sql
-- Migration to add multi-photo support to posts table
-- Run this in your Supabase SQL editor

-- Add the images column (using jsonb for flexibility and performance)
ALTER TABLE posts ADD COLUMN images JSONB;

-- Update existing posts to migrate image_url to images array
UPDATE posts 
SET images = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL AND images IS NULL;

-- Optional: Add a constraint to ensure at least one image
ALTER TABLE posts ADD CONSTRAINT posts_images_not_empty CHECK (jsonb_array_length(images) > 0);

-- Optional: Keep image_url for backward compatibility (you can remove this later)
-- ALTER TABLE posts DROP COLUMN image_url;
```

## Component Updates

### 1. PortfolioUpload.tsx
**Key Changes:**
- Changed from single image selection to multiple image selection
- Added image carousel preview with navigation
- Added thumbnail navigation for multiple images
- Added individual image removal functionality
- Updated upload logic to handle multiple files
- Stores images as JSONB objects with metadata in the `images` column

**New Features:**
- Multiple image selection with drag-and-drop support
- Preview carousel with left/right navigation
- Thumbnail navigation for quick image switching
- Individual image removal before upload
- File validation for size and type
- Progress indication during upload
- JSONB storage with metadata support

### 2. PortfolioGrid.tsx
**Key Changes:**
- Updated Post interface to support both `image_url` (legacy) and `images` (JSONB)
- Added carousel navigation for posts with multiple images
- Added image counter display
- Updated edit modal to support multiple images
- Backward compatibility with existing single-image posts
- JSONB data handling for both string and object formats

**New Features:**
- Carousel navigation for multiple images per post
- Image counter (e.g., "2/5") for multi-image posts
- Smooth navigation between images
- Edit modal supports viewing all images in a post
- Flexible JSONB data structure support

### 3. Page.tsx ([username]/page.tsx)
**Key Changes:**
- Updated Post interface to include `images` field with JSONB support
- Updated database query to fetch `images` column
- Maintains backward compatibility

## Features

### Upload Experience
1. **Multiple Image Selection**: Users can select multiple images at once
2. **Preview Carousel**: Navigate through selected images before upload
3. **Thumbnail Navigation**: Quick switching between images
4. **Individual Removal**: Remove specific images before upload
5. **File Validation**: Size and type validation for each image
6. **JSONB Storage**: Images stored with metadata for future extensibility

### Display Experience
1. **Carousel Navigation**: Left/right arrows for multi-image posts
2. **Image Counter**: Shows current position (e.g., "3/7")
3. **Smooth Transitions**: Seamless navigation between images
4. **Backward Compatibility**: Existing single-image posts work unchanged
5. **Flexible Data**: Handles both simple strings and complex JSONB objects

### Edit Experience
1. **Multi-Image Viewing**: Edit modal shows all images in a post
2. **Carousel in Modal**: Navigate through images while editing
3. **Caption Editing**: Edit captions for posts with multiple images

## Technical Implementation

### Data Structure
```typescript
interface Post {
  id: string;
  image_url?: string; // Legacy single image
  images?: string[] | Array<{ url: string; alt?: string; caption?: string }>; // JSONB support
  caption?: string;
}
```

### JSONB Storage Format
```json
// Simple format (backward compatible)
["url1", "url2", "url3"]

// Extended format (with metadata)
[
  { "url": "url1", "alt": "Alt text", "caption": "Image caption" },
  { "url": "url2", "alt": "Alt text 2", "caption": "Image caption 2" }
]
```

### Helper Functions
- `getPostImages(post: Post)`: Returns array of image URLs, handling both legacy and JSONB formats
- `nextImage()` / `prevImage()`: Navigation functions for carousel
- Image state management per post ID
- JSONB data extraction and normalization

### Backward Compatibility
- Existing posts with only `image_url` continue to work
- New posts use `images` JSONB array
- Migration script converts existing data
- Components handle both formats seamlessly
- Supports both string arrays and object arrays

## Usage Instructions

### For Users
1. **Uploading Multiple Images**:
   - Click "Upload Post"
   - Select multiple images (hold Ctrl/Cmd to select multiple)
   - Use preview carousel to review images
   - Remove unwanted images with the × button
   - Add caption and upload

2. **Viewing Multi-Image Posts**:
   - Look for navigation arrows on posts with multiple images
   - Click arrows to navigate between images
   - Image counter shows current position
   - Edit modal also supports image navigation

### For Developers
1. **Database Migration**: Run the SQL migration first
2. **Component Updates**: All components are already updated
3. **Testing**: Test with both single and multiple image posts
4. **Optional Cleanup**: Remove `image_url` column after migration period
5. **JSONB Benefits**: Leverage JSONB for future metadata features

## Future Enhancements

1. **Image Reordering**: Drag-and-drop to reorder images
2. **Bulk Operations**: Select multiple posts for bulk actions
3. **Image Cropping**: Built-in image editing tools
4. **Video Support**: Extend to support video files
5. **Advanced Carousel**: Auto-play, swipe gestures, fullscreen view
6. **Image Metadata**: Individual image captions, alt text, tags
7. **JSONB Queries**: Advanced filtering and searching using JSONB operators

## Troubleshooting

### Common Issues
1. **Migration Errors**: Ensure you have proper permissions in Supabase
2. **Image Display Issues**: Check that images array is properly populated
3. **Navigation Problems**: Verify currentImageIndex state management
4. **Upload Failures**: Check file size limits and storage permissions
5. **JSONB Parsing**: Verify JSONB data structure in database

### Debug Tips
- Check browser console for JavaScript errors
- Verify database schema with Supabase dashboard
- Test with both single and multiple image scenarios
- Monitor network requests for upload issues
- Use Supabase JSONB operators for advanced queries

## Performance Considerations

1. **Image Optimization**: Consider implementing image compression
2. **Lazy Loading**: Load images as needed for better performance
3. **Caching**: Implement proper caching for frequently viewed images
4. **Storage Limits**: Monitor storage usage with multiple images per post
5. **JSONB Indexing**: Leverage JSONB indexes for better query performance
6. **Data Structure**: Use appropriate JSONB structure for your use case

## JSONB Advantages

1. **Flexibility**: Easy to add new fields without schema changes
2. **Performance**: Better indexing and query performance than text arrays
3. **Metadata**: Store additional information per image
4. **Supabase Integration**: Better support for JSONB operations
5. **Future-Proof**: Easy to extend with new features

This implementation provides a robust, user-friendly multi-photo experience while maintaining full backward compatibility with existing content and leveraging the power of JSONB for future extensibility. 