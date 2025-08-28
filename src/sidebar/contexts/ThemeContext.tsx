import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, Theme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'levelup-theme-mode';

// Light theme configuration - Power Platform inspired
const lightTheme = createTheme({
  typography: {
    fontFamily:
      '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", Arial, sans-serif',
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#742774', // Power Platform purple
      light: '#8e4a8e',
      dark: '#5a1d5a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0078d4', // Microsoft blue
      light: '#40a0e6',
      dark: '#005a9e',
      contrastText: '#ffffff',
    },
    success: {
      main: '#107c10', // Microsoft green
      light: '#9ad29a',
      dark: '#0c5e0c',
    },
    warning: {
      main: '#ffaa44', // Microsoft orange
      light: '#ffcc99',
      dark: '#cc7a00',
    },
    error: {
      main: '#d13438', // Microsoft red
      light: '#f7d4d6',
      dark: '#a4262c',
    },
    background: {
      default: '#faf9f8', // Warm white background
      paper: '#ffffff',
    },
    text: {
      primary: '#323130', // Microsoft neutral grey
      secondary: '#605e5c',
    },
    divider: '#edebe9', // Light neutral
    action: {
      hover: 'rgba(116, 39, 116, 0.04)',
      selected: 'rgba(116, 39, 116, 0.08)',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #edebe9',
          borderRadius: '8px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#605e5c',
          borderRadius: '6px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(116, 39, 116, 0.06)',
            color: '#742774',
            transform: 'translateY(-1px)',
          },
          '&.Mui-disabled': {
            color: '#a19f9d',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        contained: {
          backgroundColor: '#742774',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#8e4a8e',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
        },
        filled: {
          backgroundColor: '#f3f2f1',
          color: '#323130',
          '&:hover': {
            backgroundColor: '#edebe9',
          },
        },
      },
    },
  },
});

// Dark theme configuration - Power Platform inspired
const darkTheme = createTheme({
  typography: {
    fontFamily:
      '"Segoe UI", -apple-system, BlinkMacSystemFont, "Roboto", "Helvetica Neue", Arial, sans-serif',
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  palette: {
    mode: 'dark',
    primary: {
      main: '#b794f6', // Lighter purple for dark mode
      light: '#dbb2ff',
      dark: '#8a4fbc',
      contrastText: '#000000',
    },
    secondary: {
      main: '#4fc3f7', // Lighter Microsoft blue
      light: '#8bf6ff',
      dark: '#0288d1',
      contrastText: '#000000',
    },
    success: {
      main: '#81c784', // Lighter green
      light: '#a5d6a7',
      dark: '#388e3c',
    },
    warning: {
      main: '#ffb74d', // Lighter orange
      light: '#ffcc80',
      dark: '#ff8f00',
    },
    error: {
      main: '#e57373', // Lighter red
      light: '#ffcdd2',
      dark: '#d32f2f',
    },
    background: {
      default: '#1a1a1a', // Rich dark background
      paper: '#252423', // Warm dark paper
    },
    text: {
      primary: '#ffffff',
      secondary: '#f3f2f1',
    },
    divider: '#3c3b39', // Dark neutral
    action: {
      hover: 'rgba(183, 148, 246, 0.08)',
      selected: 'rgba(183, 148, 246, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#252423',
          border: '1px solid #3c3b39',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'box-shadow 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          },
          '& .MuiCardContent-root': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#f3f2f1',
          backgroundColor: 'rgba(183, 148, 246, 0.05)',
          border: '1px solid #3c3b39',
          borderRadius: '6px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(183, 148, 246, 0.12)',
            borderColor: '#b794f6',
            color: '#b794f6',
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(183, 148, 246, 0.3)',
          },
          '&.Mui-disabled': {
            color: '#605e5c',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          },
          '& .MuiSvgIcon-root': {
            color: 'inherit',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          },
        },
        contained: {
          backgroundColor: '#b794f6',
          color: '#000000',
          '&:hover': {
            backgroundColor: '#dbb2ff',
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        },
        caption: {
          color: '#f3f2f1',
        },
        h6: {
          color: '#ffffff',
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: '#252423',
          border: '1px solid #3c3b39',
          color: '#ffffff',
          borderRadius: '8px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: '#f3f2f1',
          },
          '& .MuiInputBase-input': {
            color: '#ffffff',
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#3c3b39',
            },
            '&:hover fieldset': {
              borderColor: '#605e5c',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#b794f6',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
          backgroundColor: '#3c3b39',
          color: '#ffffff',
          border: '1px solid #605e5c',
        },
        filled: {
          backgroundColor: '#3c3b39',
          color: '#ffffff',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: '#252423',
          border: '1px solid #3c3b39',
          borderRadius: '8px',
        },
        option: {
          color: '#ffffff',
          '&:hover': {
            backgroundColor: 'rgba(183, 148, 246, 0.08)',
          },
          '&[aria-selected="true"]': {
            backgroundColor: 'rgba(183, 148, 246, 0.16)',
          },
        },
        listbox: {
          backgroundColor: '#252423',
        },
        groupLabel: {
          backgroundColor: '#3c3b39 !important',
          color: '#ffffff !important',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#252423',
          color: '#ffffff',
          borderRadius: '8px',
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: {
        root: {
          backgroundColor: '#3c3b39 !important',
          color: '#ffffff !important',
          fontWeight: 600,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#252423 !important',
          border: '1px solid #3c3b39',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          '& .MuiMenuItem-root': {
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(183, 148, 246, 0.08)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          '& .MuiSelect-select': {
            color: '#ffffff !important',
          },
          '& .MuiSelect-icon': {
            color: '#f3f2f1 !important',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            color: '#ffffff !important',
          },
        },
      },
    },
  },
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // Load theme preference from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Try chrome.storage.local first (more persistent)
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const result = await chrome.storage.local.get([STORAGE_KEY]);
          if (result[STORAGE_KEY]) {
            setMode(result[STORAGE_KEY] as ThemeMode);
            return;
          }
        }

        // Fallback to localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark')) {
          setMode(saved as ThemeMode);
          return;
        }

        // If no preference saved, check system preference
        if (typeof window !== 'undefined' && window.matchMedia) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme = prefersDark ? 'dark' : 'light';
          setMode(systemTheme);
          // Save the detected system preference
          saveTheme(systemTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };

    loadTheme();
  }, []);

  // Save theme preference to storage
  const saveTheme = async (newMode: ThemeMode) => {
    try {
      // Save to chrome.storage.local if available
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: newMode });
      }

      // Also save to localStorage as fallback
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    saveTheme(newMode);
  };

  const theme = mode === 'light' ? lightTheme : darkTheme;
  const isDarkMode = mode === 'dark';

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    isDarkMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
