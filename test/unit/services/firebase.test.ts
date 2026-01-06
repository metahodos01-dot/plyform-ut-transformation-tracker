import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as firestore from 'firebase/firestore';
import * as auth from 'firebase/auth';
import {
  ensureAuth,
  checkConnection,
  getProjectSettings,
  saveProjectSettings,
  updateLastSaved,
  formatDateTime,
  seedInitialData,
} from '@/services/firebase';
import { createMockDocSnapshot, createMockQuerySnapshot } from '../../mocks/firebase';
import { mockProjectSettings } from '../../mocks/fixtures';

describe('Firebase Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ensureAuth', () => {
    it('should authenticate anonymously if no user', async () => {
      vi.mocked(auth.signInAnonymously).mockResolvedValue({} as any);

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await ensureAuth();

      expect(auth.signInAnonymously).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Authenticated anonymously');

      consoleLogSpy.mockRestore();
    });

    it('should handle auth errors without crashing', async () => {
      const mockAuth = { currentUser: null };
      vi.mocked(auth.getAuth).mockReturnValue(mockAuth as any);
      vi.mocked(auth.signInAnonymously).mockRejectedValue(new Error('Auth failed'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await ensureAuth();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Anonymous auth failed'),
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('checkConnection', () => {
    it('should return true if Firestore is accessible', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.getDocs).mockResolvedValue(createMockQuerySnapshot([]) as any);

      const result = await checkConnection();

      expect(result).toBe(true);
      expect(firestore.getDocs).toHaveBeenCalled();
    });

    it('should return false on connection error', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.getDocs).mockRejectedValue(new Error('Network error'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await checkConnection();

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Connection check failed:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getProjectSettings', () => {
    it('should return ProjectSettings when document exists', async () => {
      const mockData = { ...mockProjectSettings };
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.getDoc).mockResolvedValue(
        createMockDocSnapshot(mockData) as any
      );

      const result = await getProjectSettings();

      expect(result).toEqual(mockData);
      expect(firestore.getDoc).toHaveBeenCalled();
    });

    it('should return null when document does not exist', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.getDoc).mockResolvedValue(
        createMockDocSnapshot(null) as any
      );

      const result = await getProjectSettings();

      expect(result).toBeNull();
    });

    it('should handle Firestore errors gracefully', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.getDoc).mockRejectedValue(new Error('Firestore error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getProjectSettings();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching settings:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveProjectSettings', () => {
    it('should save settings with automatic lastUpdated timestamp', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      const settings = {
        startDate: '2025-01-06',
        team: [],
      };

      const timestamp = await saveProjectSettings(settings);

      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...settings,
          lastUpdated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }),
        { merge: true }
      );
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should throw error if setDoc fails', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.setDoc).mockRejectedValue(new Error('Firestore error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(saveProjectSettings({ startDate: '2025-01-06', team: [] })).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving settings:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateLastSaved', () => {
    it('should update only timestamp field', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      const timestamp = await updateLastSaved();

      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          lastUpdated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        }),
        { merge: true }
      );
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return timestamp even if save fails (offline)', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.setDoc).mockRejectedValue(new Error('Network error'));

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const timestamp = await updateLastSaved();

      // Dovrebbe comunque tornare il timestamp per UI optimistic
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('formatDateTime', () => {
    it('should format ISO date to it-IT locale', () => {
      const isoString = '2025-01-06T14:30:00.000Z';
      const result = formatDateTime(isoString);

      // Formato atteso: DD/MM/YYYY, HH:MM
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}$/);
    });

    it('should return "Mai" for null or undefined', () => {
      expect(formatDateTime(null as any)).toBe('Mai');
      expect(formatDateTime(undefined)).toBe('Mai');
      expect(formatDateTime('')).toBe('Mai');
    });
  });

  describe('seedInitialData', () => {
    it('should seed data if DB is empty', async () => {
      const mockInitialData = [
        {
          day: 1,
          tasks: [
            { id: 't1', description: 'Task 1', completed: false },
            { id: 't2', description: 'Task 2', completed: false },
          ],
        },
        {
          day: 2,
          tasks: [
            { id: 't3', description: 'Task 3', completed: false },
          ],
        },
      ];

      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as any // Empty DB
      );
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await seedInitialData(mockInitialData);

      expect(consoleLogSpy).toHaveBeenCalledWith('Seeding database...');
      expect(consoleLogSpy).toHaveBeenCalledWith('Seeding complete.');
      expect(firestore.setDoc).toHaveBeenCalledTimes(3); // 2 + 1 tasks

      consoleLogSpy.mockRestore();
    });

    it('should skip seeding if DB has data', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.getDocs).mockResolvedValue(
        createMockQuerySnapshot([{ id: 'existing-task' }]) as any
      );

      await seedInitialData([]);

      expect(firestore.setDoc).not.toHaveBeenCalled();
    });

    it('should throw error on seeding failure', async () => {
      vi.mocked(auth.getAuth).mockReturnValue({ currentUser: { uid: 'test' } } as any);
      vi.mocked(firestore.getDocs).mockRejectedValue(new Error('Firestore error'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(seedInitialData([])).rejects.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Firebase error during seeding'),
        expect.anything()
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
