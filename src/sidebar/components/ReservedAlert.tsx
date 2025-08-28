import React from 'react';
import { Alert, AlertTitle, IconButton, Box, Fade } from '@mui/material';
import { Close } from '@mui/icons-material';

interface ReservedAlertProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  reservedHeight?: number;
}

const ReservedAlert: React.FC<ReservedAlertProps> = ({
  open,
  onClose,
  message,
  severity,
  title,
  reservedHeight = 80,
}) => {
  return (
    <Box
      sx={{
        height: reservedHeight,
        mb: 2,
        display: 'flex',
        alignItems: 'flex-start',
        position: 'relative',
      }}
    >
      <Fade in={open}>
        <Box sx={{ width: '100%', display: open ? 'block' : 'none' }}>
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
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '8px',
            }}
          >
            {title && <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>{title}</AlertTitle>}
            {message}
          </Alert>
        </Box>
      </Fade>
    </Box>
  );
};

export default ReservedAlert;
