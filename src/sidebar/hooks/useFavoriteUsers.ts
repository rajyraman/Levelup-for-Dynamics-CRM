import { useState, useEffect, useCallback } from 'react';
import { UserToImpersonate } from './useImpersonation';

export interface FavoriteUser extends UserToImpersonate {
  favoriteTimestamp: number;
}

export interface UseFavoriteUsersReturn {
  favoriteUsers: FavoriteUser[];
  addToFavorites: (user: UserToImpersonate) => void;
  removeFromFavorites: (userId: string) => void;
  isFavorite: (userId: string) => boolean;
  clearFavorites: () => void;
}

const STORAGE_KEY = 'levelup-favorite-users';
const MAX_FAVORITES = 10; // Limit the number of favorites to keep storage manageable

export const useFavoriteUsers = (): UseFavoriteUsersReturn => {
  const [favoriteUsers, setFavoriteUsers] = useState<FavoriteUser[]>([]);

  // Load favorites from storage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // Try chrome.storage.local first (more persistent across sessions)
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const result = await chrome.storage.local.get([STORAGE_KEY]);
          if (result[STORAGE_KEY]) {
            setFavoriteUsers(result[STORAGE_KEY]);
            return;
          }
        }

        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as FavoriteUser[];
          setFavoriteUsers(parsed);
        }
      } catch (error) {
        console.error('Error loading favorite users:', error);
      }
    };

    loadFavorites();
  }, []);

  // Save favorites to storage
  const saveFavorites = useCallback(async (favorites: FavoriteUser[]) => {
    try {
      // Save to chrome.storage.local if available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: favorites });
      }

      // Also save to localStorage as fallback
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorite users:', error);
    }
  }, []);

  // Add user to favorites
  const addToFavorites = useCallback(
    (user: UserToImpersonate) => {
      setFavoriteUsers(prevFavorites => {
        // Check if user is already in favorites
        const existingIndex = prevFavorites.findIndex(
          fav => fav.systemuserid === user.systemuserid
        );

        let newFavorites: FavoriteUser[];

        if (existingIndex >= 0) {
          // Update timestamp if already exists
          newFavorites = [...prevFavorites];
          newFavorites[existingIndex] = {
            ...user,
            favoriteTimestamp: Date.now(),
          };
        } else {
          // Add new favorite
          const favoriteUser: FavoriteUser = {
            ...user,
            favoriteTimestamp: Date.now(),
          };

          newFavorites = [favoriteUser, ...prevFavorites];

          // Limit to max favorites (remove oldest)
          if (newFavorites.length > MAX_FAVORITES) {
            newFavorites = newFavorites
              .sort((a, b) => b.favoriteTimestamp - a.favoriteTimestamp)
              .slice(0, MAX_FAVORITES);
          }
        }

        // Sort by most recent first
        newFavorites.sort((a, b) => b.favoriteTimestamp - a.favoriteTimestamp);

        // Save to storage
        saveFavorites(newFavorites);

        return newFavorites;
      });
    },
    [saveFavorites]
  );

  // Remove user from favorites
  const removeFromFavorites = useCallback(
    (userId: string) => {
      setFavoriteUsers(prevFavorites => {
        const newFavorites = prevFavorites.filter(fav => fav.systemuserid !== userId);
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    [saveFavorites]
  );

  // Check if user is in favorites
  const isFavorite = useCallback(
    (userId: string) => {
      return favoriteUsers.some(fav => fav.systemuserid === userId);
    },
    [favoriteUsers]
  );

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavoriteUsers([]);
    saveFavorites([]);
  }, [saveFavorites]);

  return {
    favoriteUsers,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearFavorites,
  };
};
