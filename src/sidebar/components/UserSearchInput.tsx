import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TextField,
  Button,
  Box,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Paper,
  Autocomplete,
  Typography,
  IconButton,
  ListSubheader,
} from '@mui/material';
import { Person as UserIcon, Favorite as HeartIcon } from '@mui/icons-material';
import { UserToImpersonate } from '#hooks/useImpersonation';
import { FavoriteUser } from '#hooks/useFavoriteUsers';

interface UserSearchInputProps {
  searchResults: UserToImpersonate[];
  isSearching: boolean;
  searchMessage: string;
  hasMoreResults: boolean;
  favoriteUsers: FavoriteUser[];
  onSearchChange: (query: string) => void;
  onUserSelect: (user: UserToImpersonate | null) => void;
  onStartImpersonation: (user: UserToImpersonate, options?: { openInWindow?: boolean }) => void;
  onAddToFavorites: (user: UserToImpersonate) => void;
  onRemoveFromFavorites: (userId: string) => void;
  isFavorite: (userId: string) => boolean;
}

const UserSearchInput: React.FC<UserSearchInputProps> = ({
  searchResults,
  isSearching,
  searchMessage,
  hasMoreResults,
  favoriteUsers,
  onSearchChange,
  onUserSelect,
  onStartImpersonation,
  onAddToFavorites,
  onRemoveFromFavorites,
  isFavorite,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserToImpersonate | null>(null);

  // Create combined options with grouping - memoized for performance
  const combinedOptions = useMemo(() => {
    const options: (UserToImpersonate | string)[] = [];

    // Add favorites if no search query or if favorites match the search
    if (favoriteUsers.length > 0) {
      let filteredFavorites = favoriteUsers;

      // Filter favorites by search query if there's one
      if (searchInput.length >= 2) {
        filteredFavorites = favoriteUsers.filter(
          user =>
            user.fullname.toLowerCase().includes(searchInput.toLowerCase()) ||
            user.internalemailaddress.toLowerCase().includes(searchInput.toLowerCase())
        );
      }

      if (filteredFavorites.length > 0) {
        options.push('Favorites');
        options.push(...filteredFavorites);
      }
    }

    // Add search results if there's a search query
    if (searchInput.length >= 2 && searchResults.length > 0) {
      // Filter out favorites from search results to avoid duplicates
      const nonFavoriteResults = searchResults.filter(
        user => !favoriteUsers.some(fav => fav.systemuserid === user.systemuserid)
      );

      if (nonFavoriteResults.length > 0) {
        if (options.length > 0) {
          options.push('Search Results');
        }
        options.push(...nonFavoriteResults);
      }
    }

    return options;
  }, [favoriteUsers, searchInput, searchResults]);

  // Filter options to get only UserToImpersonate objects
  const userOptions = useMemo(
    () =>
      combinedOptions.filter((option): option is UserToImpersonate => typeof option !== 'string'),
    [combinedOptions]
  );

  // Clear selected user only when actively searching and no results found
  useEffect(() => {
    // Only clear selection if user is actively searching (has input) and no results found
    // Also don't clear if the user was just selected (prevent race conditions)
    const shouldClear =
      searchInput.length >= 2 && (!searchResults || searchResults.length === 0) && !selectedUser;
    console.log('UserSearchInput useEffect check:', {
      searchInputLength: searchInput.length,
      searchResultsLength: searchResults?.length || 0,
      hasSelectedUser: !!selectedUser,
      shouldClear,
    });

    if (shouldClear) {
      console.log('UserSearchInput: Clearing selected user due to empty search results');
      setSelectedUser(null);
      onUserSelect(null);
    }
  }, [searchResults, searchInput, selectedUser, onUserSelect]);

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    if (value.length >= 2) {
      onSearchChange(value);
    }
  };

  const handleUserSelection = useCallback(
    (user: UserToImpersonate | null) => {
      console.log('UserSearchInput: Selecting user:', user?.fullname);
      setSelectedUser(user);
      onUserSelect(user);
      if (user) {
        // Clear search input when user is selected to prevent interference
        setSearchInput('');
      }
    },
    [onUserSelect]
  );

  const handleStartImpersonation = () => {
    if (selectedUser) {
      onStartImpersonation(selectedUser);
    }
  };

  const handleFavoriteToggle = (event: React.MouseEvent, user: UserToImpersonate) => {
    event.stopPropagation();
    event.preventDefault();

    if (isFavorite(user.systemuserid)) {
      onRemoveFromFavorites(user.systemuserid);
    } else {
      onAddToFavorites(user);
    }
  };

  return (
    <Box>
      {/* User Search Autocomplete */}
      <Box sx={{ mb: 2 }}>
        <Autocomplete<UserToImpersonate>
          fullWidth
          options={userOptions}
          getOptionLabel={option => option.fullname}
          isOptionEqualToValue={(option, value) => option.systemuserid === value.systemuserid}
          value={selectedUser}
          onChange={(event, newValue) => handleUserSelection(newValue)}
          inputValue={selectedUser ? '' : searchInput}
          onInputChange={(event, newInputValue) => {
            if (!selectedUser) {
              handleInputChange(newInputValue);
            }
          }}
          loading={isSearching}
          loadingText='Searching users...'
          noOptionsText={
            searchInput.length < 2
              ? favoriteUsers.length > 0
                ? 'Your favorite users are shown above. Type to search for more users.'
                : 'Type at least 2 characters to search for users'
              : 'No users found'
          }
          clearOnBlur={false}
          selectOnFocus={false}
          disableClearable={false}
          groupBy={option => {
            if (favoriteUsers.some(fav => fav.systemuserid === option.systemuserid)) {
              return 'Favorites';
            }
            return searchInput.length >= 2 ? 'Search Results' : '';
          }}
          renderGroup={params => (
            <Box key={params.key}>
              {params.group && (
                <ListSubheader
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {params.group === 'Favorites' && (
                    <HeartIcon
                      sx={{
                        color: 'error.main', // Use theme error color instead of hardcoded red
                        fontSize: '10px',
                      }}
                    />
                  )}
                  {params.group}
                  {params.group === 'Favorites' && (
                    <Typography variant='caption' sx={{ ml: 'auto', color: 'text.secondary' }}>
                      {favoriteUsers.length} saved
                    </Typography>
                  )}
                </ListSubheader>
              )}
              {params.children}
            </Box>
          )}
          renderInput={params => (
            <TextField
              {...params}
              variant='outlined'
              size='small'
              label='Search Users'
              placeholder={
                selectedUser
                  ? ''
                  : favoriteUsers.length > 0 && searchInput.length < 2
                    ? '⭐ Favorites shown above, type to search more...'
                    : '🔍 Search by name or email... (min 2 characters)'
              }
              slotProps={{
                input: {
                  ...params.InputProps,
                  startAdornment: selectedUser ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5, my: 0.5 }}>
                      <Chip
                        label={selectedUser.fullname}
                        variant='filled'
                        size='small'
                        sx={{ py: 0.5 }}
                        onDelete={() => handleUserSelection(null)}
                      />
                    </Box>
                  ) : null,
                  endAdornment: (
                    <>
                      {isSearching ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
              helperText={
                selectedUser
                  ? `Selected: ${selectedUser.internalemailaddress}`
                  : isSearching
                    ? 'Searching...'
                    : searchInput.length >= 2 && searchResults.length === 0 && !isSearching
                      ? 'No users found. Try a different search term.'
                      : favoriteUsers.length > 0 && searchInput.length < 2
                        ? `${favoriteUsers.length} favorite user${favoriteUsers.length === 1 ? '' : 's'} available`
                        : ''
              }
            />
          )}
          renderOption={(props, option) => {
            const { key, ...otherProps } = props;
            const isUserFavorite = isFavorite(option.systemuserid);

            return (
              <Box
                key={key}
                component='li'
                {...otherProps}
                sx={{
                  py: 1.5,
                  px: 2,
                  position: 'relative',
                  '&:hover .favorite-button': {
                    opacity: 1,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 4 }}>
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: 'action.selected', // Use a more subtle background
                      fontSize: '0.875rem',
                    }}
                  >
                    <UserIcon
                      sx={{
                        fontSize: '14px',
                        color: 'text.primary', // Use primary text color for visibility
                      }}
                    />
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant='body2'
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: isUserFavorite ? 500 : 400,
                        color: 'text.primary',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.25,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      {option.fullname}
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {option.internalemailaddress}
                    </Typography>
                  </Box>
                </Box>

                {/* Favorite toggle button */}
                <IconButton
                  className='favorite-button'
                  onClick={e => handleFavoriteToggle(e, option)}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    right: 8,
                    transform: 'translateY(-50%)',
                    width: 32,
                    height: 32,
                    opacity: isUserFavorite ? 1 : 0.3,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      opacity: 1,
                      backgroundColor: isUserFavorite
                        ? 'rgba(239, 83, 80, 0.1)' // Softer red hover
                        : 'action.hover',
                      transform: 'translateY(-50%) scale(1.1)',
                    },
                  }}
                >
                  <HeartIcon
                    sx={{
                      fontSize: '16px',
                      color: isUserFavorite ? 'error.main' : 'text.disabled', // Use theme error color
                    }}
                  />
                </IconButton>
              </Box>
            );
          }}
          PaperComponent={({ children, ...props }) => (
            <Paper
              {...props}
              elevation={2}
              sx={{
                borderRadius: 1,
                border: '1px solid #d1d5db',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                mt: 0.5,
                overflow: 'hidden',
                '& .MuiAutocomplete-listbox': {
                  maxHeight: 200,
                  py: 1,
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: '#f9fafb',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#d1d5db',
                    borderRadius: '3px',
                    '&:hover': {
                      backgroundColor: '#9ca3af',
                    },
                  },
                },
              }}
            >
              {children}
            </Paper>
          )}
        />
      </Box>

      {/* Search Message */}
      {searchMessage && (
        <Alert
          severity={hasMoreResults ? 'warning' : 'info'}
          sx={{ mb: 2 }}
          action={
            hasMoreResults && (
              <Button
                color='inherit'
                size='small'
                onClick={() => {
                  // This could be enhanced to show more detailed tips
                }}
              >
                Tips
              </Button>
            )
          }
        >
          {searchMessage}
          {hasMoreResults && (
            <Typography variant='caption' display='block' sx={{ mt: 1 }}>
              💡 Tip: Be more specific in your search to see additional results
            </Typography>
          )}
        </Alert>
      )}

      {/* Start Impersonation Button */}
      {selectedUser && (
        <Button
          variant='contained'
          color='primary'
          fullWidth
          onClick={handleStartImpersonation}
          sx={{
            mt: 2,
            py: 1,
            textTransform: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: 1,
          }}
        >
          🎭 Impersonate
        </Button>
      )}

      {/* 'Open in new window' option removed — impersonation runs in current tab */}
    </Box>
  );
};

export default UserSearchInput;
