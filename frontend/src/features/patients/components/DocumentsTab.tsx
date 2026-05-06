import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Upload,
  Loader2,
  FileText,
  Trash2,
  Download,
  Image as ImageIcon,
  ShieldCheck,
  ScrollText,
  AlertTriangle,
  FilePlus,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { formatDate } from '../../../lib/utils';
import { useLanguage } from '../../language/LanguageContext';
import {
  list as listDocuments,
  upload as uploadDocument,
  archive as archiveDocument,
  type DocumentCategory,
  type DocumentWithUrl,
} from '../../../lib/services/documents';

interface DocumentsTabProps {
  patientId: string;
  /**
   * Restricts both upload + listing to a single category. When omitted,
   * the tab shows all non-radiology categories and lets the user pick
   * one at upload time.
   */
  category?: DocumentCategory;
  /**
   * MIME hint for the file input. E.g. `image/png`. Defaults to
   * unrestricted.
   */
  accept?: string;
  /** Optional title override. */
  title?: string;
}

const CATEGORY_OPTIONS: DocumentCategory[] = [
  'consent',
  'insurance',
  'certificate',
  'other',
];

// LucideIcon's prop type is wider than what we use here, so we keep this loose.
const CATEGORY_ICON: Record<DocumentCategory, React.ComponentType<any>> = {
  radiology: ImageIcon,
  consent: ScrollText,
  insurance: ShieldCheck,
  certificate: FileText,
  other: FileText,
};

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  radiology: 'Radiology',
  consent: 'Consent',
  insurance: 'Insurance',
  certificate: 'Certificate',
  other: 'Other',
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  patientId,
  category,
  accept,
  title,
}) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [pendingCategory, setPendingCategory] = useState<DocumentCategory>(
    category ?? 'other',
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await listDocuments(patientId, { category });
      setDocuments(rows);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load documents';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [patientId, category]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const cat = category ?? pendingCategory;
      const created = await uploadDocument(file, patientId, cat);
      setDocuments((prev) => [created, ...prev]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveId) return;
    try {
      await archiveDocument(archiveId);
      setDocuments((prev) => prev.filter((d) => d.id !== archiveId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Archive failed';
      setError(msg);
    } finally {
      setArchiveId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-lg text-surface-900 dark:text-white">
            {title ?? (category ? CATEGORY_LABEL[category] : 'Documents')}
          </h3>
          <p className="text-xs text-surface-500">
            {documents.length} document{documents.length === 1 ? '' : 's'} on file
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!category && (
            <select
              value={pendingCategory}
              onChange={(e) => setPendingCategory(e.target.value as DocumentCategory)}
              className="h-10 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            onClick={handlePickFile}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Upload size={18} />
            )}
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-surface-400">
          <Loader2 className="animate-spin" size={24} />
        </div>
      ) : documents.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed border-surface-200 dark:border-surface-700 rounded-xl">
          <FilePlus size={40} className="mx-auto text-surface-300 mb-2" />
          <p className="text-surface-500">No documents yet</p>
          <p className="text-xs text-surface-400 mt-1">
            Upload a file to keep it on record.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((doc) => {
            const Icon = CATEGORY_ICON[doc.category] ?? FileText;
            return (
              <Card key={doc.id} className="p-4 flex flex-col gap-3 group">
                <div className="flex items-start gap-3">
                  <div className="bg-surface-100 dark:bg-surface-700 p-2 rounded-lg text-primary-600 shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm text-surface-900 dark:text-white truncate"
                      title={doc.file_name}
                    >
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {CATEGORY_LABEL[doc.category]} •{' '}
                      {formatDate(new Date(doc.uploaded_at), language)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  {doc.signed_url ? (
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      <Download size={14} /> Open
                    </a>
                  ) : (
                    <span className="text-xs text-surface-400 italic">
                      URL unavailable
                    </span>
                  )}
                  <button
                    onClick={() => setArchiveId(doc.id)}
                    className="ml-auto inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} /> Archive
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={!!archiveId}
        onClose={() => setArchiveId(null)}
        title="Archive document?"
        maxWidth="sm"
      >
        <div className="text-center p-2">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-red-600 dark:text-red-400">
            <Trash2 size={28} />
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-5">
            The file will be hidden from this list. The underlying object stays
            in storage and can be restored later.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setArchiveId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleConfirmArchive}
            >
              Archive
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
