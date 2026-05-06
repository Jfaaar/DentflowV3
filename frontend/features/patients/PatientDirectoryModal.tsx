import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { Patient } from '../../types';
import { Search, Phone, Mail, UserCircle2, ArrowLeft, UserPlus, Loader2, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../features/language/LanguageContext';

interface PatientDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (patient: Patient) => void;
  title?: string;
}

export const PatientDirectoryModal: React.FC<PatientDirectoryModalProps> = ({ isOpen, onClose, onSelect, title }) => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', countryCode: '+212', phone: '', email: '' });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.patients.list()
        .then(setPatients)
        .catch(e => console.error("Failed to load patients", e))
        .finally(() => setIsLoading(false));
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsCreating(false);
    setFormData({ name: '', countryCode: '+212', phone: '', email: '' });
    setErrors({});
    setSearchQuery('');
  };

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const lower = searchQuery.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.phone.includes(lower) || 
      (p.email && p.email.toLowerCase().includes(lower))
    );
  }, [patients, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: string; phone?: string } = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    const fullPhone = `${formData.countryCode.trim()} ${formData.phone.trim()}`;

    try {
        const newPatient = await api.patients.create({
            id: '', 
            name: formData.name,
            phone: fullPhone,
            email: formData.email
        });

        setPatients(prev => [...prev, newPatient]);
        
        if (onSelect) {
            onSelect(newPatient);
            onClose();
        } else {
            resetForm();
        }
    } catch (e) {
        alert("Failed to create patient.");
    }
  };

  const getTitle = () => {
    if (isCreating) return t('newPatient');
    if (title) return title;
    return onSelect ? t('selectPatient') : t('patientDirectory');
  };

  const openWhatsApp = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const getCountryFlag = (code: string) => {
    const cleanCode = code.replace('+', '').trim();
    switch (cleanCode) {
        case '212': return '🇲🇦'; 
        case '33': return '🇫🇷';  
        case '1': return '🇺🇸';   
        case '34': return '🇪🇸';  
        case '39': return '🇮🇹';  
        case '44': return '🇬🇧';  
        case '971': return '🇦🇪'; 
        case '966': return '🇸🇦'; 
        default: return '🌐';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      maxWidth="lg"
    >
      <div className="flex flex-col h-[60vh]">
        
        {!isCreating ? (
            <>
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
                        <input 
                            type="text"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-300 dark:border-surface-600 text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-surface-50/50 dark:bg-surface-800/50"
                            placeholder={t('searchPatientsPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <Button onClick={() => setIsCreating(true)} className="shrink-0 gap-2 shadow-md shadow-primary-200 dark:shadow-none">
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">{t('addPatient')}</span>
                    </Button>
                </div>

                <div className="mb-2 px-1 text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide flex justify-between">
                    <span>{filteredPatients.length} {t('found')}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-1">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center text-surface-400 dark:text-surface-500">
                        <Loader2 className="animate-spin mr-2"/> {t('loading')}
                    </div>
                ) : filteredPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-surface-400 dark:text-surface-500">
                    <UserCircle2 size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">{t('noPatientsFound')}</p>
                    <p className="text-sm">{t('searchOrAddPatient')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredPatients.map((patient) => (
                        <div 
                        key={patient.id} 
                        onClick={() => onSelect && onSelect(patient)}
                        className={cn(
                            "bg-white dark:bg-surface-800 p-4 rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm transition-all group",
                            onSelect 
                                ? "cursor-pointer hover:border-primary-500 hover:ring-1 hover:ring-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/20" 
                                : "hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md"
                        )}
                        >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                            <span className="font-bold text-sm">{patient.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-surface-900 dark:text-white truncate">{patient.name}</h4>
                            
                            <div className="mt-2 space-y-1.5">
                                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                <Phone size={14} className="text-surface-400 dark:text-surface-500" />
                                <span className="truncate">{patient.phone}</span>
                                <button
                                    onClick={(e) => openWhatsApp(e, patient.phone)}
                                    className="ml-1 p-1 text-surface-300 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                                    title="Chat on WhatsApp"
                                >
                                    <MessageCircle size={14} />
                                </button>
                                </div>
                                {patient.email && (
                                <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                                    <Mail size={14} className="text-surface-400 dark:text-surface-500" />
                                    <span className="truncate">{patient.email}</span>
                                </div>
                                )}
                            </div>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>
            </>
        ) : (
            <form onSubmit={handleCreate} className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                <div className="flex-1 space-y-6 p-1">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full text-blue-600 dark:text-blue-300">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">{t('creatingPatientTitle')}</h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{t('creatingPatientDesc')}</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <Input 
                            label={t('fullName')}
                            placeholder="e.g. Sarah Connor" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            error={errors.name}
                            autoFocus
                        />
                        
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                                {t('phoneNumber')}
                            </label>
                            <div className="flex gap-3 items-start">
                                <div className="w-32 shrink-0 relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg select-none pointer-events-none z-10">
                                        {getCountryFlag(formData.countryCode)}
                                    </div>
                                    <Input
                                        placeholder="+212"
                                        value={formData.countryCode}
                                        onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                                        className="pl-10 font-medium text-surface-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                                        <Input
                                            placeholder="600000000"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            error={errors.phone}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Input 
                            label={t('emailOptional')}
                            placeholder="e.g. sarah@example.com" 
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-surface-100 dark:border-surface-700 mt-auto">
                    <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                        <ArrowLeft size={16} className="mr-2" /> {t('backToList')}
                    </Button>
                    <Button type="submit">
                        {t('createPatientButton')}
                    </Button>
                </div>
            </form>
        )}

      </div>
    </Modal>
  );
};