import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Typography, Link, Skeleton, Alert, CircularProgress } from '@mui/material';
import { ExtensionConfigService, ExtensionConfig } from '#services/ExtensionConfigService';
import { checkDynamicsViaXrm, getEnvironmentUrlFromXrm } from '#utils/dynamicsDetection';
import { DynamicsAction, ExtensionDisplayMode } from '#types/global';
import { ThemeProvider } from '#contexts/ThemeContext';
import { formActions, navigationActions, ActionConfig } from '#config/actions';

const PopupApp: React.FC = () => {
  const [extensionConfig, setExtensionConfig] = useState<ExtensionConfig>(
    ExtensionConfigService.getConfig()
  );
  // Optimistic UI: assume connected until check finishes
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const [inlineToast, setInlineToast] = useState<null | {
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>(null);

  // Detect if running in Firefox
  const isFirefox =
    typeof chrome !== 'undefined' && chrome.runtime && navigator.userAgent.includes('Firefox');

  useEffect(() => {
    const checkConnection = async () => {
      setIsChecking(true);
      try {
        const connected = await checkDynamicsViaXrm();
        setIsConnected(connected);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();

    // Subscribe to config changes
    const unsubscribe = ExtensionConfigService.subscribe(setExtensionConfig);
    return unsubscribe;
  }, []);

  const showInlineToast = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error' = 'error'
  ) => {
    setInlineToast({ message, severity });
    window.setTimeout(() => setInlineToast(null), 4000);
  };

  const handleActionClick = async (actionId: DynamicsAction) => {
    try {
      console.log('Executing action:', actionId);

      // Handle actions that require input with simple prompts
      let actionData: unknown = undefined;

      if (actionId === 'navigation:open-record-by-id') {
        const recordId = prompt('Enter the record ID (GUID):');
        if (!recordId) return; // User cancelled
        const entityName = prompt(
          'Enter the entity logical name for the record (e.g., account, contact, opportunity):'
        );
        if (!entityName) return; // User cancelled
        actionData = { recordId: recordId.trim(), entityName: entityName.trim().toLowerCase() };
      } else if (actionId === 'navigation:new-record') {
        const entityName = prompt(
          'Enter the entity logical name (e.g., account, contact, opportunity):'
        );
        if (!entityName) return; // User cancelled
        actionData = { entityName: entityName.trim().toLowerCase() };
      } else if (actionId === 'navigation:open-list') {
        const entityName = prompt(
          'Enter the entity logical name (e.g., account, contact, opportunity):'
        );
        if (!entityName) return; // User cancelled
        actionData = { entityName: entityName.trim().toLowerCase() };
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        console.error('No active tab found');
        return;
      }

      console.log('Sending message to tab:', tab.id);

      // Send message in the correct format that content script expects
      chrome.tabs.sendMessage(
        tab.id,
        {
          type: 'LEVELUP_REQUEST',
          action: actionId,
          data: actionData,
          requestId: Date.now().toString(),
        },
        response => {
          if (chrome.runtime.lastError) {
            console.error('Message send error:', chrome.runtime.lastError.message);
          } else {
            console.log('Action response:', response);
            if (response?.success) {
              console.log(`✅ Action executed successfully: ${actionId}`);
            } else {
              console.error('❌ Action failed:', response?.error || 'Unknown error');
              // Show inline toast for the common form-only error so the popup UX is clear
              if (
                response?.error &&
                response.error.indexOf('Form actions can only be used') !== -1
              ) {
                showInlineToast(response.error, 'error');
              }
            }
          }
        }
      );

      console.log('Action message sent, keeping popup open');
    } catch (error) {
      console.error('Error executing action:', error);
    }
  };

  const switchDisplayModeAndOpenSidebar = async (mode: ExtensionDisplayMode) => {
    try {
      console.log('Switching to display mode:', mode);
      await ExtensionConfigService.setDisplayMode(mode);
      console.log('Display mode updated successfully');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        console.log('Opening sidebar for tab:', tab.id);
        await chrome.sidePanel.open({ tabId: tab.id });
        // Only close popup when successfully opening sidebar
        window.close();
      } else {
        console.error('No active tab found for sidebar opening');
      }
    } catch (error) {
      console.error('Error switching display mode and opening sidebar:', error);
    }
  };

  // removed skeleton and early not-connected returns — always render full UI

  return (
    <Box
      sx={{
        width: '320px',
        maxWidth: '320px',
        background: theme =>
          `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: theme =>
          theme.palette.mode === 'dark'
            ? '0 4px 20px rgba(0,0,0,0.6)'
            : '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex',
      }}
    >
      {/* Vertical Express Mode Label */}
      <Box
        sx={{
          width: '36px',
          minWidth: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Typography
          sx={{
            color: 'white',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '1px',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          Express Mode
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          p: 1,
          position: 'relative',
        }}
      >
        {/* Inline toast for quick feedback (overlay to avoid layout shift) */}
        {inlineToast && (
          <Box sx={{ position: 'absolute', left: 12, right: 12, top: 12, zIndex: 20 }}>
            <Alert severity={inlineToast.severity} onClose={() => setInlineToast(null)}>
              {inlineToast.message}
            </Alert>
          </Box>
        )}
        {/* Optimistic check spinner (small) */}
        {isChecking && (
          <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 30 }}>
            <CircularProgress size={18} />
          </Box>
        )}
        {/* Form Actions */}
        {extensionConfig.showFormSection && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant='subtitle2'
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                mb: 0.5,
                color: 'text.primary',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                opacity: 0.8,
              }}
            >
              Form Actions
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 0.5,
                p: 0.5,
                backgroundColor: theme =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : 'rgba(255,255,255,0.85)',
                borderRadius: '6px',
                border: theme => `1px solid ${theme.palette.divider}`,
                alignItems: 'stretch',
              }}
            >
              {formActions.map((action: ActionConfig) => {
                const label = action.label || '';
                const lowered = label.toLowerCase();
                const getShort = (text: string) => {
                  if (text.indexOf('url') !== -1) return 'URL';
                  if (text.indexOf('clone') !== -1) return 'Clone';
                  if (text.indexOf('id') !== -1) return 'ID';
                  if (text.indexOf('find') !== -1) return 'Find';
                  if (text.indexOf('new') !== -1) return 'New';
                  if (text.indexOf('record') !== -1) return 'Record';
                  if (text.indexOf('solution') !== -1) return 'Solution';
                  return text.split(' ')[0].slice(0, 8);
                };
                const getIcon = (text: string) => {
                  if (text.indexOf('url') !== -1) return '🔗';
                  if (text.indexOf('clone') !== -1) return '📋';
                  if (text.indexOf('id') !== -1) return '🆔';
                  if (text.indexOf('find') !== -1) return '🔍';
                  if (text.indexOf('job') !== -1) return '⚙️';
                  if (text.indexOf('solution') !== -1) return '📦';
                  if (text.indexOf('record') !== -1) return '📄';
                  return '🔧';
                };

                const short = action.shortLabel || getShort(lowered);
                const iconEmoji = action.shortIcon || getIcon(lowered);
                const IconComp = (action.icon || null) as React.ComponentType<any> | null;

                return (
                  <Link
                    key={action.id}
                    component='button'
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleActionClick(action.id);
                    }}
                    sx={{
                      color: 'text.primary',
                      textDecoration: 'none',
                      fontSize: '0.7rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.25,
                      transition: 'all 0.12s ease',
                      '&:hover': {
                        backgroundColor: theme =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.02)'
                            : 'rgba(0,0,0,0.04)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    title={action.tooltip || action.label}
                  >
                    {IconComp ? (
                      <IconComp sx={{ fontSize: 18 }} />
                    ) : (
                      <span style={{ fontSize: 18 }}>{iconEmoji}</span>
                    )}
                    <span style={{ fontSize: 11, marginTop: 2 }}>{short}</span>
                  </Link>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Navigation Actions */}
        {extensionConfig.showNavigationSection && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant='subtitle2'
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                mb: 0.5,
                color: 'text.primary',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                opacity: 0.8,
              }}
            >
              Navigation
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 0.5,
                p: 0.5,
                backgroundColor: theme =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.paper
                    : 'rgba(255,255,255,0.85)',
                borderRadius: '6px',
                border: theme => `1px solid ${theme.palette.divider}`,
                alignItems: 'stretch',
              }}
            >
              {navigationActions.map((action: ActionConfig) => {
                const label = action.label || '';
                const lowered = label.toLowerCase();
                const short =
                  action.shortLabel ||
                  (lowered.indexOf('open') !== -1
                    ? 'Open'
                    : lowered.indexOf('list') !== -1
                      ? 'List'
                      : lowered.split(' ')[0].slice(0, 8));
                const iconEmoji =
                  action.shortIcon ||
                  (lowered.indexOf('open') !== -1
                    ? '🔗'
                    : lowered.indexOf('list') !== -1
                      ? '📋'
                      : '➡️');
                const IconComp2 = (action.icon || null) as React.ComponentType<any> | null;

                return (
                  <Link
                    key={action.id}
                    component='button'
                    onClick={(e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleActionClick(action.id);
                    }}
                    sx={{
                      color: 'text.primary',
                      textDecoration: 'none',
                      fontSize: '0.7rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.25,
                      transition: 'all 0.12s ease',
                      '&:hover': {
                        backgroundColor: theme =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.02)'
                            : 'rgba(0,0,0,0.04)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    title={action.tooltip || action.label}
                  >
                    {IconComp2 ? (
                      <IconComp2 sx={{ fontSize: 18 }} />
                    ) : (
                      <span style={{ fontSize: 18 }}>{iconEmoji}</span>
                    )}
                    <span style={{ fontSize: 11, marginTop: 2 }}>{short}</span>
                  </Link>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Sidebar Modes at Bottom - Only show for non-Firefox browsers */}
        {!isFirefox && (
          <Box
            sx={{
              textAlign: 'center',
              pt: 1,
              mt: 0.5,
              borderTop: theme => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography
              variant='caption'
              sx={{
                color: 'text.secondary',
                fontSize: '0.65rem',
                display: 'block',
                mb: 0.25,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                fontWeight: 500,
              }}
            >
              Sidebar Modes
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5 }}>
              <Link
                component='button'
                onClick={() => switchDisplayModeAndOpenSidebar('default')}
                sx={{
                  color: 'primary.main',
                  fontSize: '0.7rem',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: 'primary.dark',
                    textDecoration: 'underline',
                  },
                }}
              >
                Default
              </Link>
              <Box sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>•</Box>
              <Link
                component='button'
                onClick={() => switchDisplayModeAndOpenSidebar('simple')}
                sx={{
                  color: 'primary.main',
                  fontSize: '0.7rem',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontWeight: 500,
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: 'primary.dark',
                    textDecoration: 'underline',
                  },
                }}
              >
                Simple
              </Link>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Initialize popup
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(
    <ThemeProvider>
      <PopupApp />
    </ThemeProvider>
  );
}

export default PopupApp;
