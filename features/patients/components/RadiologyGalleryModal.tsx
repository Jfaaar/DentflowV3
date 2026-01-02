import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Radio } from '../../../types';
import { Upload, X, ZoomIn, Image as ImageIcon, Loader2, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../../lib/utils';
import { useLanguage } from '../../language/LanguageContext';
import { api } from '../../../lib/api';

interface RadiologyGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  radios: Radio[];
  onUploadSuccess: (newRadio: Radio) => void;
  onDelete: (id: string) => void;
}

export const RadiologyGalleryModal: React.FC<RadiologyGalleryModalProps> = ({
  isOpen,
  onClose,
  patientId,
  radios,
  onUploadSuccess,
  onDelete
}) => {
  const { t, language } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use index for lightbox navigation (-1 means closed)
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  
  // State for Delete Confirmation Modal
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const currentImage = lightboxIndex >= 0 && lightboxIndex < radios.length ? radios[lightboxIndex] : null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
        const newRadio = await api.radios.upload(patientId, file);
        onUploadSuccess(newRadio);
    } catch (error) {
        console.error("Upload failed");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setDeleteConfirmationId(id);
  };

  const confirmDelete = async () => {
      if (!deleteConfirmationId) return;
      
      try {
          await api.radios.delete(deleteConfirmationId);
          onDelete(deleteConfirmationId);
          // If we deleted the currently viewed image, close lightbox
          if (currentImage?.id === deleteConfirmationId) {
              setLightboxIndex(-1);
          }
      } catch(err) {
          console.error("Failed to delete");
      } finally {
          setDeleteConfirmationId(null);
      }
  };

  // Navigation Handlers
  const handleNext = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (lightboxIndex < radios.length - 1) {
          setLightboxIndex(prev => prev + 1);
      }
  };

  const handlePrev = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (lightboxIndex > 0) {
          setLightboxIndex(prev => prev - 1);
      }
  };

  // Keyboard Navigation
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          // If delete modal is open, don't navigate
          if (deleteConfirmationId) return;

          if (lightboxIndex === -1) return;
          
          if (e.key === 'ArrowRight') handleNext();
          if (e.key === 'ArrowLeft') handlePrev();
          if (e.key === 'Escape') setLightboxIndex(-1);
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, radios.length, deleteConfirmationId]);

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('radiologyGallery')}
      maxWidth="4xl"
    >
      <div className="flex flex-col h-[70vh]">
        <div className="flex justify-between items-center mb-6 bg-surface-50 dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700">
             <div>
                <h3 className="font-bold text-surface-900 dark:text-white text-lg">X-Rays & Imaging</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">{radios.length} images stored</p>
             </div>
             
             <div>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2 shadow-lg shadow-primary-200 dark:shadow-none">
                    {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                    {isUploading ? t('uploading') : t('uploadImage')}
                </Button>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {radios.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-surface-400 dark:text-surface-500 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl bg-surface-50/50 dark:bg-surface-800/20">
                    <ImageIcon size={64} className="mb-4 opacity-20" />
                    <p className="font-medium text-lg">{t('noRadios')}</p>
                    <p className="text-sm">Upload X-rays to see them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {radios.map((radio, index) => (
                        <div 
                            key={radio.id} 
                            onClick={() => setLightboxIndex(index)}
                            className="group relative aspect-square bg-black rounded-xl overflow-hidden cursor-pointer border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-xl transition-all"
                        >
                            <img 
                                src={radio.url} 
                                alt="X-ray" 
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-white text-xs font-medium truncate">{radio.fileName}</p>
                                <p className="text-surface-300 text-[10px]">{formatDate(new Date(radio.date), language)}</p>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => handleDeleteClick(radio.id, e)}
                                    className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div className="bg-black/50 text-white p-1.5 rounded-full backdrop-blur-sm">
                                    <ZoomIn size={14} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <div className="pt-4 border-t border-surface-100 dark:border-surface-800 flex justify-end">
            <Button variant="ghost" onClick={onClose}>{t('close')}</Button>
        </div>
      </div>
    </Modal>

    {/* Lightbox Overlay - z-60 */}
    {currentImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-200">
            {/* Header Controls */}
            <div className="absolute top-4 right-4 z-20 flex gap-3">
                <button 
                    onClick={(e) => handleDeleteClick(currentImage.id, e)}
                    className="bg-red-500/20 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors border border-red-500/50"
                    title="Delete Image"
                >
                    <Trash2 size={24} />
                </button>
                <button 
                    onClick={() => setLightboxIndex(-1)}
                    className="bg-surface-800/50 text-white p-2 rounded-full hover:bg-surface-700 transition-colors border border-white/10"
                >
                    <X size={24} />
                </button>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center relative p-4">
                {/* Navigation Buttons */}
                <button 
                    onClick={handlePrev}
                    className={`absolute left-4 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all ${lightboxIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                    disabled={lightboxIndex === 0}
                >
                    <ChevronLeft size={32} />
                </button>

                <img 
                    src={currentImage.url} 
                    alt="Full view" 
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                />

                <button 
                    onClick={handleNext}
                    className={`absolute right-4 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all ${lightboxIndex === radios.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                    disabled={lightboxIndex === radios.length - 1}
                >
                    <ChevronRight size={32} />
                </button>
            </div>
            
            {/* Footer Info */}
            <div className="p-4 bg-gradient-to-t from-black to-transparent text-white text-center pb-8">
                <p className="text-lg font-bold">{currentImage.fileName}</p>
                <p className="text-sm opacity-70">{formatDate(new Date(currentImage.date), language)} • {lightboxIndex + 1} / {radios.length}</p>
            </div>
        </div>
    )}

    {/* Delete Confirmation Modal - z-70 (Higher than Lightbox) */}
    <Modal
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        title="Delete Image"
        maxWidth="sm"
        className="z-[70]" 
    >
        <div className="text-center p-4">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">Delete Image?</h3>
            <p className="text-surface-500 dark:text-surface-400 mb-6">
                Are you sure you want to delete this X-ray? This action cannot be undone.
            </p>
            <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirmationId(null)}>{t('cancel')}</Button>
                <Button variant="danger" className="flex-1" onClick={confirmDelete}>Delete</Button>
            </div>
        </div>
    </Modal>
    </>
  );
};