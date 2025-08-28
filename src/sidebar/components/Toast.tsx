import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface ToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

const ToastComponent: React.FC<ToastProps> = ({ open, onClose, message, severity }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={severity === 'warning' || severity === 'error' ? 8000 : 6000}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      sx={{
        top: '16px !important',
        zIndex: 9999,
        '& .MuiSnackbar-root': {
          position: 'relative',
        },
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant='filled'
        sx={{
          width: '100%',
          fontSize: '0.875rem',
          fontWeight: 500,
          boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.12)',
          '& .MuiAlert-message': {
            padding: '8px 0',
          },
          ...(severity === 'warning' && {
            backgroundColor: '#f57c00',
            color: '#fff',
            '& .MuiAlert-icon': {
              color: '#fff',
            },
          }),
          ...(severity === 'error' && {
            backgroundColor: '#d32f2f',
            color: '#fff',
            '& .MuiAlert-icon': {
              color: '#fff',
            },
          }),
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

const Toast = React.memo(ToastComponent);

export default Toast;

