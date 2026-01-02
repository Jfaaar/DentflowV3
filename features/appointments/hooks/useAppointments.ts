import { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../../../types';
import { api } from '../../../lib/api';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.appointments.list();
      setAppointments(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch appointments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const saveAppointment = async (data: Partial<Appointment>, cancelIds: string[] = []) => {
    try {
      const updated = await api.appointments.save(data, cancelIds);
      setAppointments(updated);
      return true;
    } catch (err) {
      setError('Failed to save appointment');
      return false;
    }
  };

  const restoreAppointment = async (id: string) => {
    try {
      const updated = await api.appointments.restore(id);
      setAppointments(updated);
      return true;
    } catch (err) {
      setError('Failed to restore appointment');
      return false;
    }
  };

  return {
    appointments,
    isLoading,
    error,
    refetch: fetchAppointments,
    saveAppointment,
    restoreAppointment,
  };
};