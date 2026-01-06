import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup automatico dopo ogni test
afterEach(() => {
  cleanup();
});

// Mock globale per Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ type: 'firestore' })),
  collection: vi.fn((db, name) => ({ type: 'collection', path: name })),
  doc: vi.fn((db, ...pathSegments) => ({
    type: 'document',
    path: Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments,
  })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  addDoc: vi.fn(),
  writeBatch: vi.fn(),
  query: vi.fn((ref, ...modifiers) => ({ type: 'query', ref, modifiers })),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  signInAnonymously: vi.fn(),
}));

// Mock window.alert e window.confirm
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
