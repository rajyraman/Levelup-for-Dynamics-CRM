import React from 'react';
import { Typography, Box, Chip, CircularProgress, Alert, Button, Tooltip } from '@mui/material';
import { RestartAlt } from '@mui/icons-material';
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
    resetImpersonation,
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(hasImpersonationPrivilege === null || isCheckingPrivilege) && (
              <CircularProgress size={20} />
            )}
            {hasImpersonationPrivilege === false && <Chip label='No Access' color='error' />}
            {hasImpersonationPrivilege === true && (
              <>
                {isCheckingStatus && <CircularProgress size={16} />}
                <Chip
                  label={isImpersonating ? 'Active' : 'Inactive'}
                  color={isImpersonating ? 'success' : 'default'}
                />
                <Tooltip title='Reset impersonation headers if stuck' placement='top'>
                  <Button
                    size='small'
                    variant='outlined'
                    onClick={resetImpersonation}
                    startIcon={<RestartAlt sx={{ fontSize: '1rem' }} />}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      minWidth: 'auto',
                      px: 1,
                      py: 0.25,
                    }}
                  >
                    Reset
                  </Button>
                </Tooltip>
              </>
            )}
          </Box>
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

