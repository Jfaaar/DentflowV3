import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Patient } from '../../../types';
import { User, Mail, Phone, Calendar, HeartPulse, Shield, MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '../../../features/language/LanguageContext';
import { mapApiErrorToFormErrors } from '../../../lib/errors';
import { toastError } from '../../../lib/toast';
import { cn } from '../../../lib/utils';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Parents may return a Promise that rejects on API failure; the modal
  // awaits it so it can surface validation errors inline instead of closing.
  onSubmit: (data: Patient) => void | Promise<void>;
  initialData?: Patient;
}

type FormErrors = Partial<Record<
  'name' | 'phone' | 'email' | 'address' | 'birthDate' | 'gender' | 'insuranceProvider',
  string
>>;

export const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { t } = useLanguage();
  
  // Basic Info
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+212');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  
  // Demographics
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  
  // Medical & Admin
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Attempt to parse existing phone number
        let code = '+212';
        let num = initialData.phone;
        const match = initialData.phone.match(/^(\+\d+)\s*(.*)$/);
        if (match) {
            code = match[1];
            num = match[2];
        }

        setName(initialData.name);
        setCountryCode(code);
        setPhone(num);
        setEmail(initialData.email || '');
        setAddress(initialData.address || '');
        setBirthDate(initialData.birthDate || '');
        setGender(initialData.gender || '');
        setInsuranceProvider(initialData.insuranceProvider || '');
        
        // Convert array to string for editing
        setAllergies(initialData.medicalHistory?.allergies?.join(', ') || '');
        setConditions(initialData.medicalHistory?.conditions?.join(', ') || '');
      } else {
        // Reset form
        setName('');
        setCountryCode('+212');
        setPhone('');
        setEmail('');
        setAddress('');
        setBirthDate('');
        setGender('');
        setInsuranceProvider('');
        setAllergies('');
        setConditions('');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!phone.trim()) newErrors.phone = "Phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const fullPhone = `${countryCode.trim()} ${phone.trim()}`;

    // Parse tags
    const allergyList = allergies.split(',').map(s => s.trim()).filter(Boolean);
    const conditionList = conditions.split(',').map(s => s.trim()).filter(Boolean);

    const newPatient: Patient = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name,
      phone: fullPhone,
      email: email || undefined,
      address: address || undefined,
      birthDate: birthDate || undefined,
      gender: gender || undefined,
      insuranceProvider: insuranceProvider || undefined,
      medicalHistory: {
          allergies: allergyList,
          conditions: conditionList,
          medications: [] // Future: Add medication field
      }
    };

    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(newPatient);
      onClose();
    } catch (err) {
      const fieldErrs = mapApiErrorToFormErrors(err);
      if (fieldErrs) {
        // Backend validation: render inline, keep modal open, no toast.
        setErrors(fieldErrs as FormErrors);
      } else {
        // Network / 5xx / unknown: keep modal open and toast the cause.
        toastError(err, 'Failed to save patient');
      }
    } finally {
      setIsSubmitting(false);
    }
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
      title={initialData ? t('editPatient') : t('addPatient')}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Header Icon */}
        <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-700">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                <User size={24} />
            </div>
            <div>
                <h4 className="font-bold text-surface-900 dark:text-white">{t('patientProfile')}</h4>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                    {initialData ? t('updatePatientDesc') : t('creatingPatientDesc')}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Personal & Contact */}
            <div className="space-y-5">
                <h5 className="text-xs font-bold text-surface-500 uppercase border-b border-surface-100 dark:border-surface-800 pb-2 mb-2">
                    {t('contactInfo')}
                </h5>

                <Input
                    label={t('fullName')}
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    error={errors.name}
                    autoFocus
                />

                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                        {t('phoneNumber')}
                    </label>
                    <div className="flex gap-3 items-start">
                        <div className="w-24 shrink-0 relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg select-none pointer-events-none">
                                {getCountryFlag(countryCode)}
                            </div>
                            <Input
                                placeholder="+212"
                                value={countryCode}
                                onChange={e => setCountryCode(e.target.value)}
                                className="pl-10 font-medium text-surface-900 dark:text-white"
                            />
                        </div>
                        <div className="flex-1">
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                                <Input
                                    placeholder="600000000"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    error={errors.phone}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 z-10" />
                    <Input
                        label={t('emailOptional')}
                        type="email"
                        placeholder="e.g. john@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        error={errors.email}
                        className="pl-10"
                    />
                </div>

                <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 z-10" />
                    <Input
                        label={t('address')}
                        placeholder="e.g. 123 Main St, Casablanca"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        error={errors.address}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Right Column: Demographics & Medical */}
            <div className="space-y-5">
                <h5 className="text-xs font-bold text-surface-500 uppercase border-b border-surface-100 dark:border-surface-800 pb-2 mb-2">
                    {t('medicalHistory')}
                </h5>

                <div className="flex gap-4">
                    <div className="flex-1 space-y-1.5">
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                            {t('gender')}
                        </label>
                        <select
                            className={cn(
                                "w-full px-3 py-2 rounded-xl border bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500",
                                errors.gender
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-surface-300 dark:border-surface-600"
                            )}
                            value={gender}
                            onChange={(e) => setGender(e.target.value as any)}
                        >
                            <option value="">Select...</option>
                            <option value="male">{t('male')}</option>
                            <option value="female">{t('female')}</option>
                        </select>
                        {errors.gender && (
                            <p className="text-xs text-red-500 dark:text-red-400 animate-slide-up">{errors.gender}</p>
                        )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                            {t('birthDate')}
                        </label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 z-10" />
                            <input
                                type="date"
                                className={cn(
                                    "w-full pl-10 px-3 py-2 rounded-xl border bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500",
                                    errors.birthDate
                                        ? "border-red-500 focus:ring-red-500"
                                        : "border-surface-300 dark:border-surface-600"
                                )}
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </div>
                        {errors.birthDate && (
                            <p className="text-xs text-red-500 dark:text-red-400 animate-slide-up">{errors.birthDate}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                        {t('insuranceProvider')}
                    </label>
                    <div className="relative">
                        <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 z-10" />
                        <select
                            className={cn(
                                "w-full pl-10 px-3 py-2 rounded-xl border bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500",
                                errors.insuranceProvider
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-surface-300 dark:border-surface-600"
                            )}
                            value={insuranceProvider}
                            onChange={(e) => setInsuranceProvider(e.target.value)}
                        >
                            <option value="">{t('insuranceNone')}</option>
                            <option value="CNSS">{t('insuranceCnss')}</option>
                            <option value="CNOPS">{t('insuranceCnops')}</option>
                            <option value="Other">{t('insuranceOther')}</option>
                        </select>
                    </div>
                    {errors.insuranceProvider && (
                        <p className="text-xs text-red-500 dark:text-red-400 animate-slide-up">{errors.insuranceProvider}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                        {t('allergies')}
                    </label>
                    <div className="relative">
                        <HeartPulse size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400 z-10" />
                        <Input
                            placeholder={t('allergiesPlaceholder')}
                            value={allergies}
                            onChange={e => setAllergies(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
                        {t('conditions')}
                    </label>
                    <Input
                        placeholder={t('conditionsPlaceholder')}
                        value={conditions}
                        onChange={e => setConditions(e.target.value)}
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 dark:border-surface-700">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button type="submit" className="min-w-[120px]" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin mr-2" size={16} />}
            {initialData ? t('updatePatientButton') : t('createPatientButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};