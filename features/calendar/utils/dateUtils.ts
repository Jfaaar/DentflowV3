
// We can use native Date objects or a library like date-fns. 
// Given the complexity of weeks/calendars, native is verbose. 
// I'll stick to native/simple helpers to avoid external deps unless defined in importmap (which currently has react/clsx).
// Implementing native helpers to keep it dependency-free based on "no Vite" / "CRA" context without assuming npm install access immediately.

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  return new Date(d.setDate(diff));
};

export const getWeekDays = (currentDate: Date): Date[] => {
  const start = getWeekStart(currentDate);
  const days = [];
  // Monday to Saturday (6 days)
  for (let i = 0; i < 6; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const getMonthDays = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const formatMonthYear = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
};

export const addDate = (date: Date, amount: number, type: 'day' | 'month'): Date => {
  const newDate = new Date(date);
  if (type === 'day') {
    newDate.setDate(newDate.getDate() + amount);
  } else {
    newDate.setMonth(newDate.getMonth() + amount);
  }
  return newDate;
};