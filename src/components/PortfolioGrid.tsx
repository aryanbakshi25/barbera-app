'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Image from 'next/image';

interface Post {
  id: string;
  image_url?: string; // For backward compatibility
  images?: string[] | Array<{ url: string; type?: 'image' | 'video'; alt?: string; caption?: string; duration?: number }>; // JSONB support with video
  caption?: string;
}

interface PortfolioGridProps {
  posts: Post[];
  profileId: string;
}

export default function PortfolioGrid({ posts, profileId }: PortfolioGridProps) {
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [postId: string]: number }>({});
  
  // New state for full-screen post modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
  // New state for edit modal image management
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editCurrentImageIndex, setEditCurrentImageIndex] = useState(0);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check if current user is the owner
  useEffect(() => {
    const checkOwner = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === profileId) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error('Error checking owner:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkOwner();
  }, [profileId, supabase.auth]);

  // Auto-play video when navigating to it in modal
  useEffect(() => {
    if (showPostModal && selectedPost) {
      const media = getPostMedia(selectedPost);
      const currentMedia = media[modalImageIndex];
      
      if (currentMedia?.type === 'video') {
        // Small delay to ensure the video element is rendered
        const timer = setTimeout(() => {
          const videoElement = document.querySelector(`video[src="${currentMedia.url}"]`) as HTMLVideoElement;
          if (videoElement) {
            videoElement.currentTime = 0; // Reset to beginning
            videoElement.play().catch(() => {
              // Autoplay was prevented - this is normal behavior
            });
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [modalImageIndex, showPostModal, selectedPost]);

  // Helper function to get media items with their types
  const getPostMedia = (post: Post): Array<{ url: string; type: 'image' | 'video'; duration?: number }> => {
    if (post.images && post.images.length > 0) {
      return post.images.map(img => {
        if (typeof img === 'string') {
          return { url: img, type: 'image' as const };
        }
        return { 
          url: img.url, 
          type: (img.type as 'image' | 'video') || 'image',
          duration: img.duration
        };
      });
    }
    if (post.image_url) {
      return [{ url: post.image_url, type: 'image' as const }];
    }
    return [];
  };

  // New function to open post modal
  const handlePostClick = useCallback((post: Post) => {
    setSelectedPost(post);
    setModalImageIndex(0);
    setShowPostModal(true);
    
    // Auto-play video if the first item is a video
    const media = getPostMedia(post);
    if (media[0]?.type === 'video') {
      setTimeout(() => {
        const videoElement = document.querySelector(`video[src="${media[0].url}"]`) as HTMLVideoElement;
        if (videoElement) {
          videoElement.currentTime = 0;
          videoElement.play().catch(() => {
            // Autoplay was prevented - this is normal behavior
          });
        }
      }, 100);
    }
  }, []);

  // New function to close post modal
  const handleClosePostModal = useCallback(() => {
    setShowPostModal(false);
    setSelectedPost(null);
    setModalImageIndex(0);
  }, []);

  // New function to navigate images in modal
  const nextModalImage = useCallback(() => {
    if (selectedPost) {
      const media = getPostMedia(selectedPost);
      setModalImageIndex((prev) => (prev + 1) % media.length);
    }
  }, [selectedPost]);

  const prevModalImage = useCallback(() => {
    if (selectedPost) {
      const media = getPostMedia(selectedPost);
      setModalImageIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    }
  }, [selectedPost]);

  const handleEditCancel = useCallback(() => {
    setShowEditModal(false);
    setPostToEdit(null);
    setEditCaption('');
    setEditImages([]);
    setEditCurrentImageIndex(0);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showPostModal) {
        switch (e.key) {
          case 'Escape':
            handleClosePostModal();
            break;
          case 'ArrowLeft':
            prevModalImage();
            break;
          case 'ArrowRight':
            nextModalImage();
            break;
        }
      } else if (showEditModal) {
        switch (e.key) {
          case 'Escape':
            handleEditCancel();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showPostModal, showEditModal, handleClosePostModal, prevModalImage, nextModalImage, handleEditCancel]);

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };

  const handleEditClick = (post: Post) => {
    setPostToEdit(post);
    setEditCaption(post.caption || '');
    const media = getPostMedia(post);
    setEditImages(media.map(m => m.url)); // Initialize edit images with URLs
    setEditCurrentImageIndex(0);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postToEdit) return;

    // Check if there are any media items left
    if (editImages.length === 0) {
      showToast('You must have at least one media item in the post.', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      // Get the original media structure to preserve video information
      const originalMedia = getPostMedia(postToEdit);
      const mediaForDB = editImages.map((url) => {
        const originalItem = originalMedia.find(m => m.url === url);
        return {
          url,
          type: originalItem?.type || 'image',
          alt: '',
          caption: '',
          duration: originalItem?.duration
        };
      });
      
      const { error } = await supabase
        .from('posts')
        .update({ 
          caption: editCaption.trim() || null,
          images: mediaForDB
        })
        .eq('id', postToEdit.id)
        .eq('user_id', profileId);

      if (error) {
        throw error;
      }

      // Refresh the page to show updated content
      window.location.reload();

    } catch (error) {
      console.error('Error updating post:', error);
      showToast('Failed to update post. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
      setShowEditModal(false);
      setPostToEdit(null);
      setEditImages([]);
      setEditCurrentImageIndex(0);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    
    setDeletingPost(postToDelete.id);
    setShowDeleteModal(false);

    try {
      // Delete post from database
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postToDelete.id)
        .eq('user_id', profileId);

      if (error) {
        throw error;
      }

      // Refresh the page to show updated portfolio
      window.location.reload();

    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeletingPost(null);
      setPostToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };

  const nextImage = (postId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (postId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [postId]: prev[postId] === 0 ? totalImages - 1 : (prev[postId] || 0) - 1
    }));
  };

  // Toast notification function
  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); // Auto-hide after 4 seconds
  };

  // New function to remove image in edit modal
  const handleRemoveImage = (index: number) => {
    const media = getPostMedia(postToEdit!);
    if (media.length <= 1) {
      showToast('You must keep at least one media item in the post.', 'error');
      return;
    }
    
    const newImages = editImages.filter((_, i) => i !== index);
    setEditImages(newImages);
    
    // Adjust current index if needed
    if (editCurrentImageIndex >= newImages.length) {
      setEditCurrentImageIndex(Math.max(0, newImages.length - 1));
    } else if (editCurrentImageIndex === index) {
      // If we're removing the currently displayed item, show the next one
      // If it's the last item, show the previous one
      if (index === newImages.length) {
        setEditCurrentImageIndex(index - 1);
      } else {
        setEditCurrentImageIndex(index);
      }
    } else if (editCurrentImageIndex > index) {
      // If we're removing an item before the current one, adjust the index
      setEditCurrentImageIndex(editCurrentImageIndex - 1);
    }
    
    // Show success toast
    showToast('Media item removed successfully.', 'success');
  };

  // New function to navigate images in edit modal
  const nextEditImage = () => {
    setEditCurrentImageIndex((prev) => (prev + 1) % editImages.length);
  };

  const prevEditImage = () => {
    setEditCurrentImageIndex((prev) => (prev === 0 ? editImages.length - 1 : prev - 1));
  };

  if (isLoading) {
    return <p style={{ color: '#bbb' }}>Loading...</p>;
  }

  if (!posts.length) {
    return <p style={{ color: '#bbb' }}>No portfolio posts yet.</p>;
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'success' ? '#10b981' : '#3b82f6',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          zIndex: 10000,
          maxWidth: '300px',
          fontSize: '0.9rem',
          animation: 'slideIn 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0',
              margin: '0',
              lineHeight: '1',
            }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {posts.map(post => {
          const media = getPostMedia(post);
          const currentIndex = currentImageIndex[post.id] || 0;
          const currentMedia = media[currentIndex];
          
          return (
            <div key={post.id} style={{ 
              position: 'relative',
              width: 180, 
              background: '#222', 
              borderRadius: 8, 
              overflow: 'hidden',
              border: '1px solid #333',
              cursor: 'pointer', // Add cursor pointer
            }}
            onClick={() => handlePostClick(post)} // Add click handler
            >
              <div style={{ position: 'relative', height: 120 }}>
                {currentMedia?.type === 'video' ? (
                  <video
                    key={`${currentMedia.url}-${currentIndex}`}
                    src={currentMedia.url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <img 
                    src={currentMedia?.url || ''} 
                    alt={post.caption || 'Portfolio image'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                )}
                
                {/* Media type indicator */}
                {currentMedia?.type === 'video' && (
                  <div style={{
                    position: 'absolute',
                    top: '5px',
                    left: '5px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                  }}>
                    <span>🎥</span>
                  </div>
                )}
                
                {/* Image navigation for multiple images */}
                {media.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent modal from opening
                        prevImage(post.id, media.length);
                      }}
                      style={{
                        position: 'absolute',
                        left: '5px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent modal from opening
                        nextImage(post.id, media.length);
                      }}
                      style={{
                        position: 'absolute',
                        right: '5px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ›
                    </button>
                    
                    {/* Image counter */}
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      right: '5px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                    }}>
                      {currentIndex + 1}/{media.length}
                    </div>
                  </>
                )}
              </div>
              
              {post.caption && (
                <div style={{ padding: '0.5rem', color: '#eee', fontSize: '0.95rem' }}>
                  {post.caption}
                </div>
              )}
              
              {isOwner && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  display: 'flex',
                  gap: '0.25rem',
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent modal from opening
                      handleEditClick(post);
                    }}
                    disabled={deletingPost === post.id}
                    style={{
                      background: 'rgba(59, 130, 246, 0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '2rem',
                      height: '2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      opacity: deletingPost === post.id ? 0.5 : 1,
                    }}
                    title="Edit post"
                  >
                    <Image
                      src="/images/edit_icon.png"
                      alt="Edit"
                      width={18}
                      height={18}
                      style={{ filter: 'invert(1) drop-shadow(0 0 0.7px #fff)' }}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent modal from opening
                      handleDeleteClick(post);
                    }}
                    disabled={deletingPost === post.id}
                    style={{
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '2rem',
                      height: '2rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      opacity: deletingPost === post.id ? 0.5 : 1,
                    }}
                    title="Delete post"
                  >
                    {deletingPost === post.id ? '...' : '×'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full-Screen Post Modal */}
      {showPostModal && selectedPost && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={handleClosePostModal} // Close when clicking the backdrop
        >
          <div 
            style={{
              position: 'relative',
              background: '#232526',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              border: '1px solid #333',
              overflow: 'visible', // Allow arrows to be visible outside container
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the modal content
          >
            {/* Close button */}
            <button
              onClick={handleClosePostModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                zIndex: 2001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
              }}
            >
              ×
            </button>

            {/* Main image container with square-ish aspect ratio */}
            <div style={{
              position: 'relative',
              width: '600px',
              height: '600px',
              maxWidth: 'calc(90vw - 4rem)',
              maxHeight: 'calc(90vh - 8rem)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              {(() => {
                const media = getPostMedia(selectedPost);
                const currentMedia = media[modalImageIndex];
                
                return (
                  <>
                    {currentMedia?.type === 'video' ? (
                      <video
                        key={`${currentMedia.url}-${modalImageIndex}`}
                        src={currentMedia.url}
                        controls
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: '8px',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <img 
                        src={currentMedia?.url || ''} 
                        alt={selectedPost.caption || 'Portfolio image'} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', // Changed to cover for square-ish look
                          borderRadius: '8px',
                          display: 'block',
                        }} 
                      />
                    )}
                    
                    {/* Media counter in top-left */}
                    {media.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#fff',
                        padding: '6px 12px',
                        borderRadius: '15px',
                        fontSize: '0.9rem',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <span>{modalImageIndex + 1} / {media.length}</span>
                        {currentMedia?.type === 'video' && (
                          <span>🎥</span>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Navigation arrows - positioned outside the image container */}
            {(() => {
              const media = getPostMedia(selectedPost);
              if (media.length > 1) {
                return (
                  <>
                    <button
                      onClick={prevModalImage}
                      className="portfolio-modal-nav-left"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextModalImage}
                      className="portfolio-modal-nav-right"
                    >
                      ›
                    </button>
                  </>
                );
              }
              return null;
            })()}

            {/* Caption below the image */}
            {selectedPost.caption && (
              <div style={{
                color: '#fff',
                padding: '0.5rem 0',
                textAlign: 'center',
                fontSize: '1rem',
                maxWidth: '100%',
                wordWrap: 'break-word',
                marginTop: '0.5rem',
              }}>
                {selectedPost.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && postToEdit && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleEditCancel} // Close when clicking the backdrop
        >
          <div 
            style={{
              position: 'relative',
              background: '#232526',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              border: '1px solid #333',
              overflow: 'auto', // Changed to auto to handle overflow
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the modal content
          >
            {/* Close button */}
            <button
              onClick={handleEditCancel}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                zIndex: 1001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
              }}
            >
              ×
            </button>

            <h3 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}>
              Edit Portfolio Post
            </h3>
            
            <div style={{ 
              marginBottom: '1.5rem',
              width: '600px',
              height: '400px', // Reduced height to ensure buttons are visible
              maxWidth: 'calc(90vw - 4rem)',
              maxHeight: 'calc(90vh - 16rem)', // More space for buttons
              position: 'relative',
            }}>
              {(() => {
                // If no images left, show placeholder
                if (editImages.length === 0) {
                  return (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#333',
                      borderRadius: '8px',
                      border: '2px dashed #555',
                      color: '#888',
                      fontSize: '1.1rem',
                    }}>
                      No media items remaining
                    </div>
                  );
                }

                const originalMedia = getPostMedia(postToEdit);
                // Map the current editImages index to the original media
                const currentUrl = editImages[editCurrentImageIndex];
                const currentMedia = originalMedia.find(m => m.url === currentUrl);
                
                // Safety check - if currentMedia is not found, don't render
                if (!currentMedia) {
                  return (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#333',
                      borderRadius: '8px',
                      color: '#888',
                      fontSize: '1.1rem',
                    }}>
                      Media not found
                    </div>
                  );
                }
                
                return (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {currentMedia.type === 'video' ? (
                      <video
                        src={currentMedia.url}
                        controls
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                        }} 
                      />
                    ) : (
                      <img 
                        src={currentMedia.url} 
                        alt="Post image" 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                        }} 
                      />
                    )}
                    
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveImage(editCurrentImageIndex)}
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
                        zIndex: 10,
                      }}
                      title="Remove this media"
                    >
                      ×
                    </button>
                    
                    {/* Navigation arrows for multiple images */}
                    {editImages.length > 1 && (
                      <>
                        <button
                          onClick={prevEditImage}
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                          }}
                        >
                          ‹
                        </button>
                        <button
                          onClick={nextEditImage}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                          }}
                        >
                          ›
                        </button>
                        
                        {/* Media counter */}
                        <div style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <span>{editCurrentImageIndex + 1}/{editImages.length}</span>
                          {currentMedia.type === 'video' && (
                            <span>🎥</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            <form onSubmit={handleEditSubmit} style={{ width: '100%', maxWidth: '600px' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#bbb',
                  marginBottom: '0.5rem',
                  fontSize: '0.95rem',
                }}>
                  Caption
                </label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
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
                  disabled={isUpdating}
                />
                <p style={{
                  color: '#888',
                  fontSize: '0.8rem',
                  marginTop: '0.5rem',
                }}>
                  {editCaption.length}/200 characters
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '1rem', // Ensure buttons are spaced properly
              }}>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                  style={{
                    background: 'transparent',
                    color: '#bbb',
                    border: '1px solid #555',
                    borderRadius: '6px',
                    padding: '0.75rem 1.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    opacity: isUpdating ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || editImages.length === 0}
                  style={{
                    background: isUpdating || editImages.length === 0 ? '#555' : '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1.5rem',
                    cursor: isUpdating || editImages.length === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                  }}
                >
                  {isUpdating ? 'Updating...' : editImages.length === 0 ? 'No Media Items' : 'Update Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && postToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#232526',
            borderRadius: 12,
            padding: '2rem',
            maxWidth: 400,
            width: '90%',
            border: '1px solid #333',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}>
              Delete Portfolio Post
            </h3>
            <p style={{
              color: '#bbb',
              marginBottom: '1.5rem',
              lineHeight: 1.5,
            }}>
              Are you sure you want to delete this portfolio post? 
              This action cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={handleDeleteCancel}
                style={{
                  background: 'transparent',
                  color: '#bbb',
                  border: '1px solid #555',
                  borderRadius: 6,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 