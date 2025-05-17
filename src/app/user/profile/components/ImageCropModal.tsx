'use client';

import { RefObject } from 'react';
import { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
// Import ReactCrop directly - we'll handle the component in a way that works with TypeScript
import ReactCrop from 'react-image-crop';

interface ImageCropModalProps {
  showCropModal: boolean;
  imgSrc: string;
  imgRef: RefObject<HTMLImageElement>;
  crop: Crop;
  setCrop: (crop: Crop) => void;
  completedCrop: PixelCrop | null;
  setCompletedCrop: (crop: PixelCrop) => void;
  aspect: number;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  handleCropCancel: () => void;
  handleCropComplete: () => void;
}

export default function ImageCropModal({
  showCropModal,
  imgSrc,
  imgRef,
  crop,
  setCrop,
  completedCrop,
  setCompletedCrop,
  aspect,
  onImageLoad,
  handleCropCancel,
  handleCropComplete
}: ImageCropModalProps) {
  if (!showCropModal) return null;
  
  // We need to use any here to avoid TypeScript errors with the ReactCrop component
  const ReactCropAny = ReactCrop as any;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Crop Your Profile Picture</h3>
        <div className="mb-4">
          {imgSrc && (
            <ReactCropAny
              crop={crop}
              onChange={(_: any, percentCrop: Crop) => setCrop(percentCrop)}
              onComplete={(c: PixelCrop) => setCompletedCrop(c)}
              aspect={aspect}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                onLoad={onImageLoad}
                className="max-h-[400px] max-w-full"
              />
            </ReactCropAny>
          )}
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCropCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCropComplete}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            disabled={!completedCrop}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
