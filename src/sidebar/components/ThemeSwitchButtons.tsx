import React from 'react';
import { useTheme } from '#contexts/ThemeContext';
import { Button, ButtonGroup, Tooltip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';

const ThemeSwitchButtons: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  return (
    <ButtonGroup
      variant='outlined'
      size='small'
      sx={{
        borderRadius: 20,
        bgcolor: 'transparent',
        '& .MuiButton-root': {
          minWidth: 40,
          color: 'text.primary',
          borderColor: 'divider',
        },
        '& .MuiButton-contained': {
          bgcolor: 'action.selected',
          color: 'text.primary',
          boxShadow: 'none',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        },
        '& .MuiButton-outlined': {
          borderColor: 'divider',
          color: 'text.secondary',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'divider',
          },
        },
      }}
    >
      <Tooltip title='Switch to light mode' arrow placement='top'>
        <Button
          onClick={() => mode !== 'light' && toggleTheme()}
          variant={mode === 'light' ? 'contained' : 'outlined'}
          sx={{ borderRadius: '20px 0 0 20px' }}
          aria-label='Switch to light mode'
        >
          <LightMode fontSize='small' />
        </Button>
      </Tooltip>
      <Tooltip title='Switch to dark mode' arrow placement='top'>
        <Button
          onClick={() => mode !== 'dark' && toggleTheme()}
          variant={mode === 'dark' ? 'contained' : 'outlined'}
          sx={{ borderRadius: '0 20px 20px 0' }}
          aria-label='Switch to dark mode'
        >
          <DarkMode fontSize='small' />
        </Button>
      </Tooltip>
    </ButtonGroup>
  );
};

export default ThemeSwitchButtons;
