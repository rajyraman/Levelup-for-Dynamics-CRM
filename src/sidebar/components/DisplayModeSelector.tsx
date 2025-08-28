import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Typography,
  Divider,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ViewModule as DefaultIcon,
  ViewList as SimpleIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { ExtensionDisplayMode } from '#types/global';

interface DisplayModeSelectorProps {
  currentMode: ExtensionDisplayMode;
  onModeChange: (mode: ExtensionDisplayMode) => void;
}

const DISPLAY_MODE_CONFIG = {
  default: {
    label: 'Default',
    description: 'All features',
    icon: DefaultIcon,
  },
  simple: {
    label: 'Simple',
    description: 'Only essential features',
    icon: SimpleIcon,
  },
} as const;

const DisplayModeSelector: React.FC<DisplayModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleModeSelect = (mode: ExtensionDisplayMode) => {
    onModeChange(mode);
    handleClose();
  };

  return (
    <>
      <Tooltip title='Display Mode'>
        <IconButton
          onClick={handleClick}
          size='small'
          aria-label='Display mode settings'
          sx={{
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <SettingsIcon fontSize='small' />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              '& .MuiMenuItem-root': {
                py: 1,
              },
            },
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Typography
          variant='overline'
          sx={{
            px: 2,
            py: 1,
            fontWeight: 600,
            color: 'text.secondary',
            fontSize: '0.7rem',
          }}
        >
          Display Mode
        </Typography>
        <Divider />

        {(
          Object.entries(DISPLAY_MODE_CONFIG) as [
            ExtensionDisplayMode,
            (typeof DISPLAY_MODE_CONFIG)[ExtensionDisplayMode],
          ][]
        ).map(([mode, config]) => {
          const IconComponent = config.icon;
          const isSelected = currentMode === mode;

          return (
            <MenuItem
              key={mode}
              onClick={() => handleModeSelect(mode)}
              selected={isSelected}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemText-secondary': {
                    color: 'primary.contrastText !important',
                    opacity: '0.9 !important',
                  },
                },
                '&:hover': {
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isSelected ? 'primary.contrastText' : 'text.secondary',
                  minWidth: 36,
                }}
              >
                <IconComponent fontSize='small' />
              </ListItemIcon>
              <ListItemText
                primary={config.label}
                secondary={config.description}
                slotProps={{
                  secondary: {
                    style: {
                      fontSize: '0.75rem',
                      color: isSelected ? 'inherit' : undefined,
                      opacity: isSelected ? 0.9 : 0.7,
                    },
                  },
                }}
              />
              {isSelected && (
                <CheckIcon
                  fontSize='small'
                  sx={{
                    color: 'primary.contrastText',
                    ml: 1,
                  }}
                />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default DisplayModeSelector;
