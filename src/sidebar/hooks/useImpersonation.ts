import { useState, useEffect, useCallback } from 'react';
import { messageService } from '#services/MessageService';
import { debounce } from '#utils/debounce';
import { useFavoriteUsers, FavoriteUser } from './useFavoriteUsers';

export interface UserToImpersonate {
  systemuserid: string;
  azureactivedirectoryobjectid: string;
  fullname: string;
  internalemailaddress: string;
  domainname: string;
}

export interface SearchResult {
  users: UserToImpersonate[];
  hasMoreResults: boolean;
  totalResultsMessage?: string;
}

export interface UseImpersonationReturn {
  // Privilege state
  hasImpersonationPrivilege: boolean | null;
  isCheckingPrivilege: boolean;

  // Impersonation state
  isImpersonating: boolean;
  impersonatedUser: UserToImpersonate | null;
  isCheckingStatus: boolean;

  // Search state
  searchResults: UserToImpersonate[];
  searchMessage: string;
  isSearching: boolean;
  hasMoreResults: boolean;

  // Favorites state
  favoriteUsers: FavoriteUser[];
  addToFavorites: (user: UserToImpersonate) => void;
  removeFromFavorites: (userId: string) => void;
  isFavorite: (userId: string) => boolean;

  // Error state
  error: string;

  // Actions
  startImpersonation: (user: UserToImpersonate) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  searchUsers: (query: string) => void;
  clearError: () => void;
  checkImpersonationStatus: (tabId?: number) => Promise<void>;
  retryPrivilegeCheck: () => void;
}

export const useImpersonation = (): UseImpersonationReturn => {
  // Privilege state
  const [hasImpersonationPrivilege, setHasImpersonationPrivilege] = useState<boolean | null>(null);
  const [isCheckingPrivilege, setIsCheckingPrivilege] = useState(false);

  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<UserToImpersonate | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Search state
  const [searchResults, setSearchResults] = useState<UserToImpersonate[]>([]);
  const [searchMessage, setSearchMessage] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);

  // Error state
  const [error, setError] = useState<string>('');

  // Favorites hook
  const { favoriteUsers, addToFavorites, removeFromFavorites, isFavorite } = useFavoriteUsers();

  const checkImpersonationPrivilege = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second between retries

    if (retryCount === 0) {
      setIsCheckingPrivilege(true);
    }

    try {
      const response = await messageService.sendMessage('admin:check-user-privilege', {
        privilegeName: 'prvActOnBehalfOfAnotherUser',
      });

      const hasPrivilege = response.success && Boolean(response.data);
      setHasImpersonationPrivilege(hasPrivilege);
      setIsCheckingPrivilege(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Check if this is a communication error (tab switching, connection lost)
      if (
        errorMessage.includes('Receiving end does not exist') ||
        errorMessage.includes('Could not establish connection') ||
        errorMessage.includes('Extension context invalidated')
      ) {
        // Don't change the privilege state on communication errors
        setIsCheckingPrivilege(false);
        return;
      }

      // Check for errors that might indicate the page isn't ready yet
      if (
        (errorMessage.includes('Xrm') ||
          errorMessage.includes('context') ||
          errorMessage.includes('not defined') ||
          errorMessage.includes('not available')) &&
        retryCount < maxRetries
      ) {
        setTimeout(
          () => {
            checkImpersonationPrivilege(retryCount + 1);
          },
          retryDelay * (retryCount + 1)
        ); // Exponential backoff
        return;
      }

      // Only set to false for actual privilege check failures after retries
      setHasImpersonationPrivilege(false);
      setIsCheckingPrivilege(false);
    }
  }, []);

  // This function now includes its own retry logic, making it more resilient.
  const checkImpersonationStatus = useCallback(async (tabId?: number) => {
    setIsCheckingStatus(true);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        let tab: chrome.tabs.Tab | undefined;
        if (typeof tabId === 'number') {
          try {
            tab = await chrome.tabs.get(tabId);
          } catch (e) {
            tab = undefined;
          }
        } else {
          const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
          tab = t;
        }

        const response = await messageService.sendMessage('admin:get-impersonation-status', {
          tabId: tab?.id,
          tabUrl: tab?.url,
        });

        if (response.success && response.data) {
          setImpersonatedUser(response.data as UserToImpersonate);
          setIsImpersonating(true);
        } else {
          // Covers cases where the message is sent successfully but logic fails,
          // or the user is simply not impersonating. No retry needed here.
          setIsImpersonating(false);
          setImpersonatedUser(null);
        }
        setIsCheckingStatus(false);
        return; // Success, exit the function
      } catch (error) {
        console.error(`Attempt ${attempt} to check impersonation status failed:`, error);
        if (attempt === MAX_RETRIES) {
          // All retries have failed
          setIsImpersonating(false);
          setImpersonatedUser(null);
        } else {
          // Wait before the next attempt
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      } finally {
        setIsCheckingStatus(false);
      }
    }
  }, []);

  const debouncedCheckStatus = useCallback(
    debounce((tabId?: number) => {
      checkImpersonationStatus(tabId);
    }, 200),
    [checkImpersonationStatus]
  );

  const reloadCurrentTab = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        await chrome.tabs.reload(tab.id, { bypassCache: true });
        checkImpersonationStatus();
      }
    } catch (reloadError) {
      console.error('Failed to reload tab:', reloadError);
    }
  }, [checkImpersonationStatus]);

  const startImpersonation = useCallback(
    async (user: UserToImpersonate) => {
      if (!user.azureactivedirectoryobjectid) {
        setError(
          `Selected user does not have a valid Azure AD Object ID. Available properties: ${Object.keys(
            user
          ).join(', ')}`
        );
        return;
      }

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await messageService.sendMessage('admin:start-impersonation', {
          user,
          tabId: tab?.id,
          tabUrl: tab?.url,
        });

        if (response.success) {
          setIsImpersonating(true);
          setImpersonatedUser(user);
          setSearchResults([]);
          setSearchMessage('');
          setError('');

          // If we opened in a new window, the active tab may have changed; wait briefly
          // and then refresh the previous tab if needed. For normal flow, reload current.
          await reloadCurrentTab();
        } else {
          setError(response.error || 'Failed to start impersonation');
        }
      } catch (error) {
        console.error('Error starting impersonation:', error);
        setError(
          `Failed to start impersonation: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [reloadCurrentTab]
  );

  const stopImpersonation = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await messageService.sendMessage('admin:stop-impersonation', {
        tabId: tab?.id,
        tabUrl: tab?.url,
      });

      if (response.success) {
        setIsImpersonating(false);
        setImpersonatedUser(null);
        setError('');

        await reloadCurrentTab();
      } else {
        console.error('Failed to stop impersonation:', response.error);
        setError(response.error || 'Failed to stop impersonation');
      }
    } catch (error) {
      console.error('Error stopping impersonation:', error);
      setError(
        `Failed to stop impersonation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, [reloadCurrentTab]);

  const searchUsers = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setSearchMessage('');
        setHasMoreResults(false);
        return;
      }

      setIsSearching(true);
      setError('');

      try {
        const response = await messageService.searchUsers(query.trim());

        if (response.success) {
          const searchResult = response.data as SearchResult;
          const users = Array.isArray(searchResult?.users) ? searchResult.users : [];

          setSearchResults(users);
          setSearchMessage(searchResult?.totalResultsMessage || '');
          setHasMoreResults(Boolean(searchResult?.hasMoreResults));
        } else {
          setError(response?.error || 'Failed to search users');
          setSearchResults([]);
          setHasMoreResults(false);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setSearchResults([]);
        setHasMoreResults(false);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const retryPrivilegeCheck = useCallback(() => {
    // Reset privilege state and retry the check
    setHasImpersonationPrivilege(null);
    checkImpersonationPrivilege();
  }, [checkImpersonationPrivilege]);

  // Check impersonation privilege on mount
  useEffect(() => {
    checkImpersonationPrivilege();
  }, [checkImpersonationPrivilege]);

  // Set up status checking and tab listeners when user has privilege
  useEffect(() => {
    if (!hasImpersonationPrivilege) {
      return;
    }

    // Initial check. The retry logic within handles background script startup delays.
    checkImpersonationStatus();

    // Tab activation listener — always check the tab's impersonation status
    const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
      try {
        debouncedCheckStatus(activeInfo.tabId);
      } catch (error) {
        console.error('Error handling tab activation in impersonation:', error);
      }
    };

    // Tab URL change listener
    const handleTabUpdated = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (changeInfo.url && tab.active) {
        debouncedCheckStatus(tabId);
      }
    };

    // Page load completion listener
    const handleTabCompleted = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (changeInfo.status === 'complete' && tab.active) {
        debouncedCheckStatus(tabId);
      }
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onUpdated.addListener(handleTabCompleted);

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.tabs.onUpdated.removeListener(handleTabCompleted);
    };
  }, [hasImpersonationPrivilege, checkImpersonationStatus, debouncedCheckStatus]);

  return {
    // Privilege state
    hasImpersonationPrivilege,
    isCheckingPrivilege,

    // Impersonation state
    isImpersonating,
    impersonatedUser,
    isCheckingStatus,

    // Search state
    searchResults,
    searchMessage,
    isSearching,
    hasMoreResults,

    // Favorites state
    favoriteUsers,
    addToFavorites,
    removeFromFavorites,
    isFavorite,

    // Error state
    error,

    // Actions
    startImpersonation,
    stopImpersonation,
    searchUsers,
    clearError,
    checkImpersonationStatus,
    retryPrivilegeCheck,
  };
};
