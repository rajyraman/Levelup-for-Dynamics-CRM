import React from 'react';
import { Alert, Typography, Button, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

interface PrivilegeWarningProps {
  show: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

const PrivilegeWarning: React.FC<PrivilegeWarningProps> = ({
  show,
  onRetry,
  isRetrying = false,
}) => {
  if (!show) return null;

  return (
    <Alert severity='warning'>
      <Typography variant='body2'>
        <strong>Insufficient Privileges</strong>
      </Typography>
      <Typography variant='caption' sx={{ display: 'block', mb: 1 }}>
        You need the "Act on Behalf of Another User" privilege to use impersonation features. Please
        contact your system administrator.
      </Typography>
      {onRetry && (
        <Box sx={{ mt: 1 }}>
          <Button
            size='small'
            variant='outlined'
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            disabled={isRetrying}
            sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}
          >
            {isRetrying ? 'Checking...' : 'Retry Check'}
          </Button>
        </Box>
      )}
    </Alert>
  );
};

export default PrivilegeWarning;
