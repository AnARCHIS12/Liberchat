import React from 'react';

interface ImageModalProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ src, alt, onClose }) => {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <img
        src={src}
        alt={alt || 'Image'}
        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl border-4 border-red-700"
        onClick={e => e.stopPropagation()}
      />
      <button
        className="absolute top-4 right-4 text-white text-3xl font-bold bg-black/60 rounded-full px-3 py-1 hover:bg-red-700 transition"
        onClick={onClose}
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
};

export default ImageModal;
