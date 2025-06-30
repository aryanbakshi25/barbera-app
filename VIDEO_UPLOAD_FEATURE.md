# Video Upload Feature

This document outlines the video upload functionality added to the portfolio posts in your barber appointment booking app.

## Overview

The system now supports both images and videos in portfolio posts, with a 10-minute limit for videos and proper validation and playback controls.

## Features

### Upload Experience
1. **Mixed Media Support**: Users can upload both images and videos in the same post
2. **Video Duration Validation**: Videos must be under 10 minutes (600 seconds)
3. **File Size Limits**: 
   - Images: 10MB max
   - Videos: 100MB max
4. **File Type Validation**: Supports common image and video formats
5. **Preview with Duration**: Shows video duration in preview and thumbnails
6. **Drag & Drop Reordering**: Reorder media items before upload

### Display Experience
1. **Grid View**: Videos show with hover-to-play functionality
2. **Video Indicators**: 🎥 icon and duration display on video thumbnails
3. **Modal View**: Full-screen video playback with controls
4. **Navigation**: Seamless navigation between images and videos
5. **Duration Display**: Shows video duration in various views

### Edit Experience
1. **Video Editing**: Edit posts containing videos
2. **Media Preservation**: Maintains video metadata during edits
3. **Navigation**: Navigate through mixed media in edit modal

## Technical Implementation

### Data Structure
```typescript
interface MediaItem {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  caption?: string;
  duration?: number; // For videos in seconds
}
```

### Database Storage
- Videos are stored in the same `images` JSONB column as images
- Each media item includes a `type` field to distinguish between images and videos
- Video duration is stored for display purposes

### File Validation
- **Duration Check**: Videos are validated to be under 10 minutes
- **Size Check**: Videos limited to 100MB, images to 10MB
- **Type Check**: Only image/* and video/* MIME types accepted

### Video Playback
- **Grid View**: Hover to play, pause on mouse leave
- **Modal View**: Full controls with play/pause/seek
- **Muted by Default**: Videos start muted for better UX

## Usage Instructions

### For Users
1. **Uploading Videos**:
   - Click "Upload Post"
   - Select video files (along with images if desired)
   - Videos will be validated for duration and size
   - Preview videos with duration display
   - Upload when ready

2. **Viewing Videos**:
   - Videos in grid show 🎥 icon and duration
   - Hover over videos to play them
   - Click to open full-screen modal with controls
   - Navigate between images and videos with arrows

3. **Editing Posts with Videos**:
   - Edit modal shows videos with controls
   - Duration information preserved during edits
   - Can remove videos (but must keep at least one media item)

### For Developers
1. **Database**: No schema changes needed - uses existing JSONB structure
2. **Storage**: Videos stored in same Supabase bucket as images
3. **Components**: Updated PortfolioUpload and PortfolioGrid components
4. **Validation**: Client-side duration and size validation
5. **Playback**: HTML5 video elements with custom controls

## File Size and Duration Limits

- **Images**: 10MB maximum
- **Videos**: 100MB maximum, 10 minutes maximum
- **Supported Formats**: Common image and video formats (browser-dependent)

## Performance Considerations

1. **Video Optimization**: Consider implementing video compression
2. **Lazy Loading**: Videos load on demand
3. **Storage Monitoring**: Monitor storage usage with larger video files
4. **Bandwidth**: Consider CDN for video delivery
5. **Mobile**: Ensure responsive video playback

## Browser Compatibility

- **Modern Browsers**: Full support for video upload and playback
- **Mobile Browsers**: Responsive video controls
- **Fallbacks**: Graceful degradation for unsupported features

## Future Enhancements

1. **Video Thumbnails**: Generate custom thumbnails for videos
2. **Video Compression**: Client-side video compression
3. **Streaming**: Adaptive bitrate streaming for large videos
4. **Video Editing**: Basic video editing tools
5. **Analytics**: Video view tracking and analytics
6. **Accessibility**: Enhanced accessibility features for video content

## Troubleshooting

### Common Issues
1. **Upload Failures**: Check file size and duration limits
2. **Playback Issues**: Verify video format compatibility
3. **Duration Not Showing**: Check if video metadata is accessible
4. **Storage Errors**: Monitor Supabase storage limits

### Debug Tips
- Check browser console for video-related errors
- Verify video file format and encoding
- Test with different video sizes and durations
- Monitor network requests for video uploads
- Check Supabase storage permissions

This implementation provides a robust video upload and playback experience while maintaining compatibility with existing image functionality. 