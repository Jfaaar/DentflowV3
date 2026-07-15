import { afterEach, describe, expect, it } from 'vitest';
import {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from './authStorage';

afterEach(() => clearStoredToken());

describe('authStorage', () => {
  it('returns null when no token is stored', () => {
    expect(getStoredToken()).toBeNull();
  });

  it('round-trips a token via setStoredToken / getStoredToken', () => {
    setStoredToken('abc123');
    expect(getStoredToken()).toBe('abc123');
  });

  it('clears the token when setStoredToken(null) is called', () => {
    setStoredToken('abc');
    setStoredToken(null);
    expect(getStoredToken()).toBeNull();
  });

  it('clearStoredToken() removes the token', () => {
    setStoredToken('abc');
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });
});
