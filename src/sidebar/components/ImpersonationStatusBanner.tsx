import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { UserToImpersonate } from '#hooks/useImpersonation';

interface ImpersonationStatusBannerProps {
  isImpersonating: boolean;
  impersonatedUser: UserToImpersonate | null;
}

const ImpersonationStatusBanner: React.FC<ImpersonationStatusBannerProps> = ({
  isImpersonating,
  impersonatedUser,
}) => {
  if (!isImpersonating || !impersonatedUser) return null;

  return (
    <Alert
      severity='info'
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        mb: 2,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderLeft: theme => `4px solid ${theme.palette.info.main}`,
        boxShadow: 1,
        px: 2,
        py: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box>
          <Typography component='span' sx={{ fontWeight: 600, display: 'block' }}>
            🎭 Impersonating {impersonatedUser.fullname}
          </Typography>
          <Typography
            component='div'
            variant='caption'
            sx={{ opacity: 0.85, color: 'text.secondary' }}
          >
            This environment is impersonated. Use Reset if headers get stuck.
          </Typography>
          <Typography
            component='div'
            variant='body2'
            sx={{
              opacity: 1,
              fontWeight: 700,
              color: 'text.primary',
              mt: 0.5,
            }}
          >
            Impersonation is NOT a native Dynamics 365/Power Apps feature.
          </Typography>
        </Box>
      </Box>
    </Alert>
  );
};

export default ImpersonationStatusBanner;
