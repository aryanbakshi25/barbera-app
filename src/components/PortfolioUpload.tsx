'use client';

import { useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';

interface PortfolioUploadProps {
  profileId: string;
}

interface MediaFile {
  file: File;
  type: 'image' | 'video';
  previewUrl: string;
  duration?: number; // For videos
}

export default function PortfolioUpload({ profileId }: PortfolioUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Helper function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  // Helper function to create preview URL
  const createPreviewUrl = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validMedia: MediaFile[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        // Check file size (10MB for images, 300MB for videos)
        const maxSize = file.type.startsWith('video/') ? 300 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          errors.push(`${file.name} must be less than ${maxSize / (1024 * 1024)}MB`);
          continue;
        }

        // Check file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          errors.push(`${file.name} is not a supported image or video format`);
          continue;
        }

        // For videos, check duration (10 minutes = 600 seconds)
        let duration: number | undefined;
        if (file.type.startsWith('video/')) {
          try {
            duration = await getVideoDuration(file);
            if (duration > 600) {
              errors.push(`${file.name} must be less than 10 minutes (current: ${Math.round(duration / 60)}m ${Math.round(duration % 60)}s)`);
              continue;
            }
          } catch {
            errors.push(`Could not read duration for ${file.name}`);
            continue;
          }
        }

        // Create preview URL
        const previewUrl = await createPreviewUrl(file);
        
        validMedia.push({
          file,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          previewUrl,
          duration
        });

      } catch (err) {
        errors.push(`Error processing ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validMedia.length > 0) {
      setSelectedMedia(validMedia);
      setError(null);
    }
  };

  const removeMedia = (index: number) => {
    const newMedia = selectedMedia.filter((_, i) => i !== index);
    setSelectedMedia(newMedia);
    if (currentPreviewIndex >= newMedia.length) {
      setCurrentPreviewIndex(Math.max(0, newMedia.length - 1));
    }
  };

  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder array
    const newMedia = [...selectedMedia];
    const draggedMedia = newMedia[dragIndex];
    
    // Remove from original position
    newMedia.splice(dragIndex, 1);
    
    // Insert at new position
    newMedia.splice(dropIndex, 0, draggedMedia);
    
    setSelectedMedia(newMedia);
    
    // Update current preview index if needed
    if (currentPreviewIndex === dragIndex) {
      setCurrentPreviewIndex(dropIndex);
    } else if (currentPreviewIndex > dragIndex && currentPreviewIndex <= dropIndex) {
      setCurrentPreviewIndex(currentPreviewIndex - 1);
    } else if (currentPreviewIndex < dragIndex && currentPreviewIndex >= dropIndex) {
      setCurrentPreviewIndex(currentPreviewIndex + 1);
    }
    
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMedia.length === 0) {
      setError('Please select at least one image or video');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const mediaUrls: Array<{ url: string; type: 'image' | 'video'; alt: string; caption: string; duration?: number }> = [];
      const uploadErrors: string[] = [];

      // Upload all media to Supabase Storage
      for (let i = 0; i < selectedMedia.length; i++) {
        const media = selectedMedia[i];
        try {
          const fileExt = media.file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('portfolio')
            .upload(fileName, media.file);

          if (uploadError) {
            throw new Error(`Upload failed for ${media.file.name}: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('portfolio')
            .getPublicUrl(fileName);

          mediaUrls.push({
            url: urlData.publicUrl,
            type: media.type,
            alt: '',
            caption: '',
            duration: media.duration
          });
          
          // Upload successful - no need to log in production
        } catch (uploadErr) {
          const errorMsg = `Failed to upload ${media.file.name}: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}`;
          uploadErrors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Check if any uploads failed
      if (uploadErrors.length > 0) {
        if (uploadErrors.length === selectedMedia.length) {
          // All uploads failed
          throw new Error(`All uploads failed:\n${uploadErrors.join('\n')}`);
        } else {
          // Some uploads failed, but some succeeded
          setError(`Some files failed to upload:\n${uploadErrors.join('\n')}\n\nContinuing with successful uploads...`);
          // Continue with successful uploads
        }
      }

      if (mediaUrls.length === 0) {
        throw new Error('No files were uploaded successfully');
      }

      // Save post to database with media array as JSONB
      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          user_id: profileId,
          images: mediaUrls, // Store both images and videos in the images column
          caption: caption.trim() || null
        });

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`);
      }

      const successMessage = mediaUrls.length === selectedMedia.length 
        ? 'Portfolio post uploaded successfully!' 
        : `Portfolio post uploaded with ${mediaUrls.length}/${selectedMedia.length} files!`;
      
      setSuccess(successMessage);
      setCaption('');
      setSelectedMedia([]);
      setCurrentPreviewIndex(0);
      setShowForm(false);
      
      // Reset form after a delay
      setTimeout(() => {
        setSuccess(null);
        // Optionally refresh the page or update the portfolio list
        window.location.reload();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setCaption('');
    setSelectedMedia([]);
    setCurrentPreviewIndex(0);
    setError(null);
  };

  // Helper function to format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          background: 'linear-gradient(144deg, var(--metallic-accent), var(--chrome-silver))',
          color: '#000',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        }}
      >
        Upload Post
      </button>
    );
  }

  return (
    <div style={{
      background: '#232526',
      borderRadius: '12px',
      padding: '2rem',
      border: '1px solid #333',
      marginBottom: '2rem',
    }}>
      <h3 style={{
        color: '#fff',
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '1.5rem',
      }}>
        Upload Portfolio Post
      </h3>

      {error && (
        <div style={{
          background: '#ef4444',
          color: '#fff',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          whiteSpace: 'pre-line',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#10b981',
          color: '#fff',
          padding: '0.75rem',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.9rem',
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            color: '#bbb',
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
          }}>
            Images & Videos ({selectedMedia.length} selected)
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaSelect}
            ref={fileInputRef}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#333',
              border: '1px solid #555',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.9rem',
            }}
            disabled={isUploading}
          />
          <p style={{
            color: '#888',
            fontSize: '0.8rem',
            marginTop: '0.5rem',
          }}>
            Select images (max 10MB each) and videos (max 300MB, 10 minutes each)
          </p>
        </div>

        {selectedMedia.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#bbb',
              marginBottom: '0.5rem',
              fontSize: '0.95rem',
            }}>
              Preview ({currentPreviewIndex + 1} of {selectedMedia.length})
            </label>
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '400px',
              height: '300px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #555',
            }}>
              {selectedMedia[currentPreviewIndex].type === 'image' ? (
                <Image
                  src={selectedMedia[currentPreviewIndex].previewUrl}
                  alt={`Preview ${currentPreviewIndex + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <video
                  src={selectedMedia[currentPreviewIndex].previewUrl}
                  controls
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                />
              )}
              
              {/* Navigation arrows */}
              {selectedMedia.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setCurrentPreviewIndex(Math.max(0, currentPreviewIndex - 1))}
                    disabled={currentPreviewIndex === 0}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      opacity: currentPreviewIndex === 0 ? 0.5 : 1,
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPreviewIndex(Math.min(selectedMedia.length - 1, currentPreviewIndex + 1))}
                    disabled={currentPreviewIndex === selectedMedia.length - 1}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      opacity: currentPreviewIndex === selectedMedia.length - 1 ? 0.5 : 1,
                    }}
                  >
                    ›
                  </button>
                </>
              )}
              
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeMedia(currentPreviewIndex)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
                title="Remove file"
              >
                ×
              </button>

              {/* Video duration indicator */}
              {selectedMedia[currentPreviewIndex].type === 'video' && selectedMedia[currentPreviewIndex].duration && (
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                }}>
                  {formatDuration(selectedMedia[currentPreviewIndex].duration!)}
                </div>
              )}
            </div>
            
            {/* Thumbnail navigation */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '0.5rem',
              overflowX: 'auto',
              padding: '0.5rem 0',
            }}>
              {selectedMedia.map((media, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    position: 'relative',
                    cursor: 'grab',
                    opacity: dragIndex === index ? 0.5 : 1,
                    transform: dragIndex === index ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPreviewIndex(index)}
                    style={{
                      width: '60px',
                      height: '45px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: index === currentPreviewIndex ? '2px solid #3b82f6' : '1px solid #555',
                      cursor: 'pointer',
                      background: 'none',
                      padding: 0,
                      position: 'relative',
                    }}
                  >
                    {media.type === 'image' ? (
                      <Image
                        src={media.previewUrl}
                        alt={`Thumbnail ${index + 1}`}
                        width={60}
                        height={45}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      />
                    ) : (
                      <video
                        src={media.previewUrl}
                        style={{ 
                          objectFit: 'cover', 
                          width: '100%', 
                          height: '100%' 
                        }}
                        muted
                      />
                    )}
                    
                    {/* Media type indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      left: '2px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      fontSize: '0.6rem',
                      padding: '1px 3px',
                      borderRadius: '2px',
                      pointerEvents: 'none',
                    }}>
                      {media.type === 'video' ? '🎥' : '📷'}
                    </div>

                    {/* Video duration on thumbnail */}
                    {media.type === 'video' && media.duration && (
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#fff',
                        fontSize: '0.5rem',
                        padding: '1px 2px',
                        borderRadius: '2px',
                        pointerEvents: 'none',
                      }}>
                        {formatDuration(media.duration)}
                      </div>
                    )}
                    
                    {/* Drag indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      fontSize: '0.6rem',
                      padding: '1px 3px',
                      borderRadius: '2px',
                      pointerEvents: 'none',
                    }}>
                      ⋮⋮
                    </div>
                  </button>
                  
                  {/* Drop indicator */}
                  {dragOverIndex === index && dragIndex !== index && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      border: '2px dashed #3b82f6',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      pointerEvents: 'none',
                      zIndex: 5,
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            color: '#bbb',
            marginBottom: '0.5rem',
            fontSize: '0.95rem',
          }}>
            Caption (optional)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe this work..."
            rows={3}
            maxLength={200}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#333',
              border: '1px solid #555',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.9rem',
              resize: 'vertical',
            }}
            disabled={isUploading}
          />
          <p style={{
            color: '#888',
            fontSize: '0.8rem',
            marginTop: '0.5rem',
          }}>
            {caption.length}/200 characters
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end',
        }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUploading}
            style={{
              background: 'transparent',
              color: '#bbb',
              border: '1px solid #555',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              cursor: 'pointer',
              fontSize: '0.95rem',
              opacity: isUploading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading || selectedMedia.length === 0}
            style={{
              background: isUploading || selectedMedia.length === 0 ? '#555' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              cursor: isUploading || selectedMedia.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          >
            {isUploading ? 'Uploading...' : 'Upload Post'}
          </button>
        </div>
      </form>
    </div>
  );
} 