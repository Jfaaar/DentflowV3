import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  Upload,
  X,
  ZoomIn,
  Image as ImageIcon,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';
import { useLanguage } from '../../language/LanguageContext';
import {
  list as listDocuments,
  upload as uploadDocument,
  archive as archiveDocument,
  signedUrl as freshSignedUrl,
  type DocumentWithUrl,
} from '../../../lib/services/documents';

interface RadiologyGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  /**
   * Optional callback fired after a successful upload, so parent dashboards
   * can keep their preview grid in sync.
   */
  onChange?: () => void;
}

/**
 * Radiology gallery modal — backed by `lib/services/documents.ts` against
 * the Supabase `medical` storage bucket. Displays file_name, category,
 * uploaded_at and keeps the existing lightbox + delete confirmation flow.
 */
export const RadiologyGalleryModal: React.FC<RadiologyGalleryModalProps> = ({
  isOpen,
  onClose,
  patientId,
  onChange,
}) => {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DocumentWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lightbox: -1 means closed.
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const currentImage = lightboxIndex >= 0 && lightboxIndex < docs.length ? docs[lightboxIndex] : null;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await listDocuments(patientId, { category: 'radiology' });
      setDocs(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (isOpen) void refresh();
  }, [isOpen, refresh]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const created = await uploadDocument(file, patientId, 'radiology');
      setDocs((prev) => [created, ...prev]);
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
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
      await archiveDocument(deleteConfirmationId);
      setDocs((prev) => prev.filter((d) => d.id !== deleteConfirmationId));
      if (currentImage?.id === deleteConfirmationId) setLightboxIndex(-1);
      onChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive');
    } finally {
      setDeleteConfirmationId(null);
    }
  };

  // If a signed URL has expired by the time the user opens the lightbox,
  // re-sign on demand. Best-effort, no spinner.
  useEffect(() => {
    if (!currentImage || currentImage.signed_url) return;
    let cancelled = false;
    freshSignedUrl(currentImage.id)
      .then((url) => {
        if (cancelled) return;
        setDocs((prev) =>
          prev.map((d) =>
            d.id === currentImage.id ? { ...d, signed_url: url } : d,
          ),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentImage]);

  // Navigation handlers.
  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex < docs.length - 1) setLightboxIndex((i) => i + 1);
  };
  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (lightboxIndex > 0) setLightboxIndex((i) => i - 1);
  };

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (deleteConfirmationId) return;
      if (lightboxIndex === -1) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') setLightboxIndex(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, docs.length, deleteConfirmationId]);

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
              <p className="text-sm text-surface-500 dark:text-surface-400">
                {docs.length} image{docs.length === 1 ? '' : 's'} stored
              </p>
            </div>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-2 shadow-lg shadow-primary-200 dark:shadow-none"
              >
                {isUploading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Upload size={20} />
                )}
                {isUploading ? t('uploading') : t('uploadImage')}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-surface-400">
                <Loader2 className="animate-spin" size={24} />
              </div>
            ) : docs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-surface-400 dark:text-surface-500 border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-2xl bg-surface-50/50 dark:bg-surface-800/20">
                <ImageIcon size={64} className="mb-4 opacity-20" />
                <p className="font-medium text-lg">{t('noRadios')}</p>
                <p className="text-sm">Upload X-rays to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {docs.map((doc, index) => (
                  <div
                    key={doc.id}
                    onClick={() => setLightboxIndex(index)}
                    className="group relative aspect-square bg-black rounded-xl overflow-hidden cursor-pointer border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-xl transition-all"
                  >
                    {doc.signed_url ? (
                      <img
                        src={doc.signed_url}
                        alt={doc.file_name}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-500">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-white text-xs font-medium truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-surface-300 text-[10px]">
                        {doc.category} • {formatDate(new Date(doc.uploaded_at), language)}
                      </p>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDeleteClick(doc.id, e)}
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
            <Button variant="ghost" onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Lightbox */}
      {currentImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-200">
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

          <div className="flex-1 flex items-center justify-center relative p-4">
            <button
              onClick={handlePrev}
              className={`absolute left-4 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all ${
                lightboxIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
              }`}
              disabled={lightboxIndex === 0}
            >
              <ChevronLeft size={32} />
            </button>

            {currentImage.signed_url ? (
              <img
                src={currentImage.signed_url}
                alt={currentImage.file_name}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
            ) : (
              <div className="text-white opacity-60">Image unavailable</div>
            )}

            <button
              onClick={handleNext}
              className={`absolute right-4 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-white/20 transition-all ${
                lightboxIndex === docs.length - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'opacity-100'
              }`}
              disabled={lightboxIndex === docs.length - 1}
            >
              <ChevronRight size={32} />
            </button>
          </div>

          <div className="p-4 bg-gradient-to-t from-black to-transparent text-white text-center pb-8">
            <p className="text-lg font-bold">{currentImage.file_name}</p>
            <p className="text-sm opacity-70">
              {currentImage.category} •{' '}
              {formatDate(new Date(currentImage.uploaded_at), language)} •{' '}
              {lightboxIndex + 1} / {docs.length}
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
            Archive Image?
          </h3>
          <p className="text-surface-500 dark:text-surface-400 mb-6">
            The image will be hidden from this gallery. The underlying file stays
            in storage and can be restored later.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteConfirmationId(null)}
            >
              {t('cancel')}
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmDelete}>
              Archive
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
