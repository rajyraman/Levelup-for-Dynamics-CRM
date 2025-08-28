import React from 'react';
import { AppBar, Toolbar, IconButton, Tooltip, Box } from '@mui/material';
import { LightMode as LightModeIcon, DarkMode as DarkModeIcon } from '@mui/icons-material';
import { useTheme } from '#contexts/ThemeContext';
import DisplayModeSelector from './DisplayModeSelector';
import { ExtensionDisplayMode } from '#types/global';

interface HeaderProps {
  displayMode: ExtensionDisplayMode;
  onDisplayModeChange: (mode: ExtensionDisplayMode) => void;
}

const HeaderComponent: React.FC<HeaderProps> = ({ displayMode, onDisplayModeChange }) => {
  const { toggleTheme, isDarkMode } = useTheme();

  return (
    <AppBar
      position='static'
      color='default'
      elevation={0}
      sx={{ backgroundColor: 'transparent', padding: 0 }}
    >
      <Toolbar
        sx={{ minHeight: 'auto !important', padding: '0 !important', justifyContent: 'flex-end' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <DisplayModeSelector currentMode={displayMode} onModeChange={onDisplayModeChange} />

          <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
            <IconButton
              onClick={toggleTheme}
              size='small'
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              sx={{
                color: 'text.primary',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              {isDarkMode ? <LightModeIcon fontSize='small' /> : <DarkModeIcon fontSize='small' />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const Header = React.memo(HeaderComponent);

export default Header;

