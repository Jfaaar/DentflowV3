import { useLanguage } from '../../language/LanguageContext';

export const useGreeting = (): string => {
  const { t } = useLanguage();
  const hour = new Date().getHours();
  if (hour < 12) return t('goodMorning');
  if (hour < 18) return t('goodAfternoon');
  return t('goodEvening');
};
