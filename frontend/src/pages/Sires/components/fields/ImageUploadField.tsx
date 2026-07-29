import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import ConfirmModal from '../../../../components/common/ConfirmModal';

interface ImageUploadFieldProps {
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: () => void;
}

export default function ImageUploadField({ imagePreview, onImageChange, onRemoveImage }: ImageUploadFieldProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRemoveClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmRemove = () => {
    onRemoveImage?.();
    setShowConfirm(false);
  };

  return (
    <div className="form-group form-group--full">
      <label htmlFor="image_url" className="form-label">Bull Photo</label>
      <input
        type="file"
        id="image_url"
        name="image_url"
        accept="image/*"
        onChange={onImageChange}
        className="form-input sires__form-input--file"
      />
      {imagePreview && (
        <div className="sires__image-preview">
          <img src={imagePreview} alt="Preview" />
          {onRemoveImage && (
            <button
              type="button"
              onClick={handleRemoveClick}
              className="sires__image-remove"
              aria-label="Remove image"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Image"
        message="Are you sure you want to remove this image?"
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
