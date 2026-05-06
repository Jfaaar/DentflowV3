import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Appointment } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { formatDate, formatTime } from '../../../lib/utils';
import { Undo2, Trash2, CalendarOff } from 'lucide-react';
import { useLanguage } from '../../language/LanguageContext';

interface CanceledAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  canceledAppointments: Appointment[];
  onRestore: (appointment: Appointment) => void;
}

export const CanceledAppointmentsModal: React.FC<CanceledAppointmentsModalProps> = ({
  isOpen,
  onClose,
  canceledAppointments,
  onRestore
}) => {
  const { t, language } = useLanguage();
  const sorted = [...canceledAppointments].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('canceledLogTitle')}
      maxWidth="lg"
    >
      <div className="flex flex-col h-[60vh]">
        {sorted.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-surface-400">
            <CalendarOff size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('noCanceledAppointments')}</p>
            <p className="text-sm">{t('canceledLogDescription')}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 p-1">
            {sorted.map((apt) => (
              <div 
                key={apt.id} 
                className="flex items-center justify-between bg-surface-50 p-4 rounded-xl border border-surface-200 hover:border-red-200 transition-colors group"
              >
                <div className="flex items-start gap-4">
                    <div className="bg-red-100 text-red-600 p-2.5 rounded-lg">
                        <Trash2 size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-surface-900">{apt.patientName}</h4>
                        <div className="text-sm text-surface-600 mt-0.5">
                            {formatDate(new Date(apt.start), language)} • {formatTime(apt.start)} - {formatTime(apt.end)}
                        </div>
                        {apt.observation && (
                            <p className="text-xs text-surface-500 italic mt-1 border-l-2 border-surface-300 pl-2">
                                "{apt.observation}"
                            </p>
                        )}
                    </div>
                </div>

                <Button 
                    size="sm" 
                    variant="outline" 
                    className="gap-2 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
                    onClick={() => onRestore(apt)}
                >
                    <Undo2 size={16} />
                    {t('restore')}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-surface-100 flex justify-end">
            <Button variant="ghost" onClick={onClose}>{t('close')}</Button>
        </div>
      </div>
    </Modal>
  );
};