import React from 'react';
import { Typography, Box, Chip, CircularProgress, Alert } from '@mui/material';
import { useImpersonation, UserToImpersonate } from '#hooks/useImpersonation';
import PrivilegeWarning from './PrivilegeWarning';
import ImpersonationStatusBanner from './ImpersonationStatusBanner';
import UserSearchInput from './UserSearchInput';

const Impersonation = () => {
  const {
    hasImpersonationPrivilege,
    isCheckingPrivilege,
    isImpersonating,
    impersonatedUser,
    isCheckingStatus,
    searchResults,
    searchMessage,
    isSearching,
    hasMoreResults,
    favoriteUsers,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    error,
    startImpersonation,
    stopImpersonation,
    searchUsers,
    clearError,
    retryPrivilegeCheck,
  } = useImpersonation();

  const handleUserSelect = (user: UserToImpersonate | null) => {
    // This is handled within UserSearchInput component
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant='h6'
            component='h2'
            sx={{ mb: 0, fontSize: '1rem', fontWeight: '600' }}
          >
            Impersonation
          </Typography>
          {(hasImpersonationPrivilege === null || isCheckingPrivilege) && (
            <CircularProgress size={20} />
          )}
          {hasImpersonationPrivilege === false && <Chip label='No Access' color='error' />}
          {hasImpersonationPrivilege === true && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isCheckingStatus && <CircularProgress size={16} />}
              <Chip
                label={isImpersonating ? 'Active' : 'Inactive'}
                color={isImpersonating ? 'success' : 'default'}
              />
            </Box>
          )}
        </Box>

        {/* Privilege Warning */}
        <PrivilegeWarning
          show={hasImpersonationPrivilege === false}
          onRetry={retryPrivilegeCheck}
          isRetrying={isCheckingPrivilege}
        />

        {/* Show impersonation section if user has privilege OR is currently impersonating */}
        {(hasImpersonationPrivilege === true || isImpersonating) && (
          <>
            {/* Impersonation Status Banner */}
            <ImpersonationStatusBanner
              isImpersonating={isImpersonating}
              impersonatedUser={impersonatedUser}
              onStopImpersonation={stopImpersonation}
            />

            {/* Error Alert */}
            {error && (
              <Alert severity='error' sx={{ mb: 2 }} onClose={clearError}>
                {error}
              </Alert>
            )}

            {/* Show search and setup UI only when NOT impersonating */}
            {!isImpersonating && (
              <UserSearchInput
                searchResults={searchResults}
                isSearching={isSearching}
                searchMessage={searchMessage}
                hasMoreResults={hasMoreResults}
                favoriteUsers={favoriteUsers}
                onSearchChange={searchUsers}
                onUserSelect={handleUserSelect}
                onStartImpersonation={startImpersonation}
                onAddToFavorites={addToFavorites}
                onRemoveFromFavorites={removeFromFavorites}
                isFavorite={isFavorite}
              />
            )}
          </>
        )}
      </Box>
    </>
  );
};

export default Impersonation;

