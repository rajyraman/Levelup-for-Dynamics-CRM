import React, { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import InformationDialog from './InformationDialog';

const InformationButton: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = () => {
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Tooltip title='Extension information and stats' placement='top'>
        <IconButton
          size='small'
          onClick={handleClick}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'info.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          <InfoIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <InformationDialog open={dialogOpen} onClose={handleClose} />
    </>
  );
};

export default InformationButton;
