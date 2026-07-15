// Verifies the patientsApi RTK Query slice round-trips through MSW.
// Builds a fresh store per test so cache state doesn't leak.

import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { baseApi } from '@/services/api/baseApi';
import { patientsApi } from './patientsApi';

function makeStore() {
  return configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (gdm) => gdm().concat(baseApi.middleware),
  });
}

describe('patientsApi', () => {
  it('listPatients returns the unwrapped { data, total } from the backend envelope', async () => {
    const store = makeStore();
    const result = await store.dispatch(patientsApi.endpoints.listPatients.initiate());
    expect(result.error).toBeUndefined();
    expect(result.data?.total).toBe(1);
    expect(result.data?.data[0]?.name).toBe('Jane Doe');
  });

  it('getPatient returns the unwrapped patient by id', async () => {
    const store = makeStore();
    const result = await store.dispatch(patientsApi.endpoints.getPatient.initiate('p_42'));
    expect(result.error).toBeUndefined();
    expect(result.data?.id).toBe('p_42');
  });

  it('createPatient POSTs and returns the created patient', async () => {
    const store = makeStore();
    const action = await store
      .dispatch(patientsApi.endpoints.createPatient.initiate({ name: 'New Person', phone: '+1' }));
    // Mutation results expose `data` on success or `error` on failure.
    if ('error' in action && action.error) {
      throw new Error(`Mutation failed: ${JSON.stringify(action.error)}`);
    }
    expect(action.data?.id).toBe('p_new');
    expect(action.data?.name).toBe('New Person');
  });
});
