import type React from 'react';
import { useState, useCallback } from 'react';

/**
 * Reusable hook for managing image file selection and preview.
 * Handles file selection, preview URL creation, and cleanup.
 */
export function useImageUpload() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  /**
   * Handle image file selection from input.
   */
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up previous preview URL if it's a blob
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setImageFile(file);
      setShouldRemoveImage(false);
      // Create preview URL from file object
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  }, [imagePreview]);

  /**
   * Set preview from an existing URL (for editing).
   */
  const setPreviewFromUrl = useCallback((url: string | null) => {
    setImagePreview(url || null);
    setOriginalImageUrl(url || null);
    setImageFile(null);
    setShouldRemoveImage(false);
  }, []);

  /**
   * Remove the current image (marks for removal on save).
   */
  const removeImage = useCallback(() => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    // Only mark for removal if there was an original image
    if (originalImageUrl) {
      setShouldRemoveImage(true);
    }
  }, [imagePreview, originalImageUrl]);

  /**
   * Clear image file and preview, cleaning up blob URL.
   */
  const clearImage = useCallback(() => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setShouldRemoveImage(false);
    setOriginalImageUrl(null);
  }, [imagePreview]);

  /**
   * Check if there's a new image file to upload.
   */
  const hasNewImage = imageFile !== null;

  return {
    // State
    imageFile,
    imagePreview,
    hasNewImage,
    shouldRemoveImage,

    // Handlers
    handleImageChange,
    setPreviewFromUrl,
    removeImage,
    clearImage
  };
}
