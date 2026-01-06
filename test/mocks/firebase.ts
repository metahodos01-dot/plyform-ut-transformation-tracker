import { vi } from 'vitest';

// Mock Firestore QuerySnapshot
export const createMockQuerySnapshot = (docs: any[]) => ({
  empty: docs.length === 0,
  docs: docs.map((data, index) => ({
    id: data.id || `mock-id-${index}`,
    data: () => {
      const { id, ...rest } = data;
      return rest;
    },
    exists: () => true,
  })),
  size: docs.length,
  forEach: (callback: any) => {
    docs.forEach((data, index) => {
      callback({
        id: data.id || `mock-id-${index}`,
        data: () => {
          const { id, ...rest } = data;
          return rest;
        },
        exists: () => true,
      });
    });
  },
});

// Mock Firestore DocumentSnapshot
export const createMockDocSnapshot = (data: any | null, id = 'mock-doc-id') => ({
  id,
  data: () => data,
  exists: () => !!data,
});

// Mock Firestore WriteBatch
export const createMockBatch = () => {
  const operations: any[] = [];
  return {
    set: vi.fn((ref, data, options) => {
      operations.push({ type: 'set', ref, data, options });
      return this;
    }),
    update: vi.fn((ref, data) => {
      operations.push({ type: 'update', ref, data });
      return this;
    }),
    delete: vi.fn((ref) => {
      operations.push({ type: 'delete', ref });
      return this;
    }),
    commit: vi.fn(() => Promise.resolve()),
    _operations: operations, // Per assertion nei test
  };
};

// Mock Auth
export const createMockAuth = (authenticated = true) => ({
  currentUser: authenticated ? { uid: 'test-user-id', isAnonymous: true } : null,
});

// Mock DocumentReference
export const createMockDocRef = (id = 'mock-doc-ref') => ({
  id,
  path: `collection/${id}`,
});

// Mock CollectionReference
export const createMockCollectionRef = (collectionName = 'mock-collection') => ({
  id: collectionName,
  path: collectionName,
});
