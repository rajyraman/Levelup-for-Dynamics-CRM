import React from 'react';
import { Alert, AlertTitle, IconButton, Fade, Box } from '@mui/material';
import { Close } from '@mui/icons-material';

interface InlineAlertProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  title?: string;
}

const InlineAlert: React.FC<InlineAlertProps> = ({ open, onClose, message, severity, title }) => {
  return (
    <Fade in={open}>
      <Box
        sx={{
          position: 'fixed',
          top: 8,
          left: 8,
          right: 8,
          zIndex: 2000,
          display: open ? 'block' : 'none',
        }}
      >
        <Alert
          severity={severity}
          variant='filled'
          action={
            <IconButton aria-label='close' color='inherit' size='small' onClick={onClose}>
              <Close fontSize='inherit' />
            </IconButton>
          }
          sx={{
            '& .MuiAlert-message': {
              fontSize: '0.875rem',
              fontWeight: 500,
            },
            boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.25)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {title && <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>{title}</AlertTitle>}
          {message}
        </Alert>
      </Box>
    </Fade>
  );
};

export default InlineAlert;
