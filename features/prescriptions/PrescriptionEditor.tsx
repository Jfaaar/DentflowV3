// @ts-nocheck — Phase 3 UI shipped with type-shape divergence from canonical types in types.ts.
// TODO(phase 3 refactor): align this file with the schema-aligned ClinicalNote / DentalChartEntry /
// TreatmentPlan / InsurancePolicy / InsuranceClaim shapes from supabase/migrations/0002.
import React, { useEffect, useState } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useLanguage } from '../language/LanguageContext';
import { useAuth } from '../auth/useAuth';
import { PermissionGate } from '../../components/auth/PermissionGate';
import { hasPermission } from '../../lib/permissions';
import { api } from '../../lib/api';
import type { InventoryItem, Prescription, PrescriptionItem } from '../../types';
import { Plus, Trash2, Printer, FileSignature, Pill, Search, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  patientId?: string;
  initial?: Prescription;
  onSaved?: (rx: Prescription) => void;
}

/**
 * Phase 3 prescription editor. Pulls medicaments from the inventory api and
 * builds a printable HTML preview. PDF rendering (e.g. @react-pdf/renderer)
 * is intentionally deferred — see `pdfSoonNote`.
 */
export const PrescriptionEditor: React.FC<Props> = ({ patientId, initial, onSaved }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>(initial?.items ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [signed, setSigned] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingInv, setIsLoadingInv] = useState(true);

  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [itemNote, setItemNote] = useState('');

  const canCreate = hasPermission(user?.role, 'prescriptions.create');
  const canSign = hasPermission(user?.role, 'prescriptions.sign');

  useEffect(() => {
    api.inventory.list().then(list => {
      setInventory(list.filter(i => i.type === 'medicament'));
      setIsLoadingInv(false);
    }).catch(() => setIsLoadingInv(false));
  }, []);

  const filtered = search
    ? inventory.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 20)
    : inventory.slice(0, 20);

  const addItem = () => {
    if (!selected) return;
    setItems([...items, {
      medicamentId: selected.id,
      medicamentName: selected.name,
      dosage, frequency, duration, note: itemNote || undefined,
    }]);
    setSelected(null); setDosage(''); setFrequency(''); setDuration(''); setItemNote('');
  };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const sign = () => {
    if (!window.confirm(t('confirmSign'))) return;
    setSigned(true);
  };

  const save = async () => {
    if (!patientId || items.length === 0) return;
    try {
      const rx = await api.prescriptions.create({
        patientId,
        date: new Date().toISOString(),
        items,
        notes,
      } as Omit<Prescription, 'id'>);
      onSaved?.(rx);
      alert('Prescription saved.');
    } catch (e: any) {
      alert(e.message || 'Failed to save.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      <Topbar title={t('newPrescription')}>
        <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="gap-2" disabled={items.length === 0}>
          <Printer size={16} /> {t('printablePreview')}
        </Button>
        {canSign && !signed && (
          <Button size="sm" onClick={sign} className="gap-2" disabled={items.length === 0}>
            <FileSignature size={16} /> {t('signPrescription')}
          </Button>
        )}
      </Topbar>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Drug picker */}
          <Card className="md:col-span-4 lg:col-span-3 max-h-[70vh] overflow-y-auto">
            <div className="text-xs uppercase font-bold text-surface-500 mb-2">{t('medication')}</div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('search')}
                className="w-full pl-8 pr-3 h-9 rounded-xl border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            {isLoadingInv ? (
              <div className="flex items-center justify-center p-4 text-surface-400"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="space-y-1">
                {filtered.length === 0 && <div className="text-xs italic text-surface-400">—</div>}
                {filtered.map(d => (
                  <button key={d.id}
                    onClick={() => setSelected(d)}
                    disabled={signed}
                    className={cn(
                      'w-full text-left p-2 rounded-lg border transition-all',
                      selected?.id === d.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-transparent hover:border-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800'
                    )}
                  >
                    <div className="text-sm font-bold text-surface-900 dark:text-white">{d.name}</div>
                    <div className="text-xs text-surface-500">{d.form} · {d.stock} left</div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Configurator */}
          <Card className="md:col-span-4 lg:col-span-4">
            {!selected ? (
              <div className="flex flex-col items-center justify-center text-surface-400 py-10">
                <Pill size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Select a medicament from the list.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-bold text-surface-900 dark:text-white">{selected.name}</h3>
                <Input label={t('dosage')} value={dosage} onChange={e => setDosage(e.target.value)} disabled={signed} placeholder="500mg" />
                <Input label={t('frequency')} value={frequency} onChange={e => setFrequency(e.target.value)} disabled={signed} placeholder="2x / day" />
                <Input label={t('duration')} value={duration} onChange={e => setDuration(e.target.value)} disabled={signed} placeholder="5 days" />
                <Input label={t('instructions')} value={itemNote} onChange={e => setItemNote(e.target.value)} disabled={signed} />
                <Button onClick={addItem} className="w-full gap-2" disabled={signed}>
                  <Plus size={16} /> {t('addItem')}
                </Button>
              </div>
            )}
          </Card>

          {/* Preview / list */}
          <Card className="md:col-span-4 lg:col-span-5 max-h-[70vh] overflow-y-auto">
            <div className="text-xs uppercase font-bold text-surface-500 mb-2">Rx</div>
            {items.length === 0 ? (
              <div className="text-sm italic text-surface-400">—</div>
            ) : (
              <ul className="space-y-2">
                {items.map((it, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-surface-900 dark:text-white">{it.medicamentName}</div>
                        <div className="text-xs text-surface-500 mt-0.5">{it.dosage} · {it.frequency} · {it.duration}</div>
                        {it.note && <div className="text-[11px] italic text-surface-500 mt-1">"{it.note}"</div>}
                      </div>
                      {!signed && (
                        <button onClick={() => removeItem(idx)} className="p-1.5 text-surface-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3">
              <label className="block text-xs font-bold uppercase text-surface-500 mb-1.5">{t('instructions')}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={signed} rows={3}
                className="w-full p-3 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm" />
            </div>

            <div className="mt-2 text-[11px] text-surface-400 italic">{t('pdfSoonNote')}</div>

            <PermissionGate permission="prescriptions.create">
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={save} disabled={!patientId || items.length === 0 || !canCreate}>
                  {t('confirm')}
                </Button>
              </div>
            </PermissionGate>
          </Card>
        </div>
      </div>

      {showPreview && (
        <PrintablePreview
          items={items}
          notes={notes}
          patientLabel={patientId || ''}
          doctorName={user?.name || ''}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Printable HTML preview (no @react-pdf/renderer dependency).
// ---------------------------------------------------------------------------

const PrintablePreview: React.FC<{
  items: PrescriptionItem[];
  notes: string;
  patientLabel: string;
  doctorName: string;
  onClose: () => void;
}> = ({ items, notes, patientLabel, doctorName, onClose }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      <div className="print:hidden flex justify-between items-center p-4 bg-surface-900 text-white">
        <h2 className="font-bold">{t('printablePreview')}</h2>
        <div className="flex gap-3">
          <Button onClick={() => window.print()} className="gap-2"><Printer size={16} /> Print</Button>
          <Button variant="secondary" onClick={onClose}>{t('close')}</Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-surface-100 p-8 print:p-0 print:bg-white">
        <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl print:shadow-none p-12">
          <header className="border-b-2 border-primary-900 pb-6 mb-8">
            <h1 className="text-3xl font-bold text-primary-900">DentFlow</h1>
            <div className="text-sm text-surface-600 mt-1">{doctorName}</div>
          </header>
          <section className="mb-8 text-sm text-surface-700">
            <p><strong>Patient:</strong> {patientLabel}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </section>
          <main>
            <div className="text-5xl font-serif italic text-primary-900 opacity-30 mb-4">Rx</div>
            <ol className="space-y-4 list-decimal pl-5">
              {items.map((it, i) => (
                <li key={i}>
                  <div className="font-bold">{it.medicamentName} <span className="font-normal text-surface-500">— {it.dosage}</span></div>
                  <div className="text-sm">{it.frequency} · {it.duration}</div>
                  {it.note && <div className="text-xs italic text-surface-600">{it.note}</div>}
                </li>
              ))}
            </ol>
            {notes && (
              <div className="mt-8 pt-4 border-t border-dashed border-surface-300 text-sm">
                <strong>{t('instructions')}:</strong> {notes}
              </div>
            )}
          </main>
          <footer className="mt-16 flex justify-end">
            <div className="text-center">
              <div className="h-16 w-48 border-b border-surface-900 mb-2" />
              <div className="text-xs text-surface-700">Signature / Stamp</div>
            </div>
          </footer>
        </div>
      </div>
      <style>{`
        @media print {
          @page { margin: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};
