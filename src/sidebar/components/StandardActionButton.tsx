import React from 'react';
import { Box, IconButton, Tooltip, Typography, useTheme, useMediaQuery } from '@mui/material';
import { Favorite as HeartIcon } from '@mui/icons-material';

export interface StandardActionButtonProps {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  tooltip?: string;
  onClick: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  showFavorite?: boolean;
  additionalInfo?: string; // For time info like "2h ago"
  showLabel?: boolean; // Whether to show label below button
  favoriteVariant?: 'default' | 'subtle';
  favoriteIcon?: React.ComponentType<any>;
}

/**
 * Standardized action button component used across all sections
 * (Recently Used, Commands, Form, Navigation, etc.)
 *
 * Consistent sizing: 64x64px buttons with 12px gaps
 * Responsive: Works on mobile and desktop
 */
const StandardActionButton: React.FC<StandardActionButtonProps> = ({
  id,
  label,
  icon: IconComponent,
  tooltip,
  onClick,
  isFavorite = false,
  onFavoriteToggle,
  showFavorite = false,
  additionalInfo,
  showLabel = true,
  favoriteVariant = 'default',
  favoriteIcon,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      key={id}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Tooltip
          title={
            additionalInfo ? (
              <Box>
                <Typography variant='caption' sx={{ fontWeight: 600 }}>
                  {tooltip || label}
                </Typography>
                <Typography variant='caption' sx={{ display: 'block', opacity: 0.8 }}>
                  {additionalInfo}
                </Typography>
              </Box>
            ) : (
              tooltip || label
            )
          }
          arrow
          placement='top'
        >
          <IconButton
            onClick={onClick}
            sx={{
              width: 77,
              height: 77, // Square button
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              color: 'text.primary',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              padding: 0.75,
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'divider',
                transform: 'translateY(-1px)',
                boxShadow: 1,
              },
              '& .MuiSvgIcon-root': {
                color: 'inherit',
                fontSize: '1.4rem',
              },
            }}
          >
            <IconComponent />
            {showLabel && (
              <Typography
                variant='caption'
                sx={{
                  fontWeight: '500',
                  color: 'inherit',
                  fontSize: '0.7rem',
                  lineHeight: 1.2,
                  textAlign: 'center',
                  maxWidth: '100%',
                  whiteSpace: 'normal',
                  wordBreak: 'normal',
                  overflowWrap: 'break-word',
                  hyphens: 'none',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {label}
              </Typography>
            )}
          </IconButton>
        </Tooltip>

        {/* Favorite toggle button */}
        {showFavorite && onFavoriteToggle && (
          <Tooltip title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation();
                onFavoriteToggle();
              }}
              sx={theme => {
                // default behavior (existing): red when favorited
                if (favoriteVariant === 'default') {
                  return {
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    color: isFavorite ? 'error.main' : 'text.disabled',
                    fontSize: '10px',
                    opacity: isFavorite ? 1 : 0.6,
                    borderRadius: '50%',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    '&:hover': {
                      backgroundColor: 'error.light',
                      transform: 'scale(1.2)',
                      color: 'error.main',
                      opacity: 1,
                      boxShadow: '0 3px 10px rgba(244, 67, 54, 0.3)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  };
                }

                // subtle variant: keep default color muted, highlight on hover to indicate unfavorite action
                return {
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  color: 'text.disabled',
                  fontSize: '10px',
                  opacity: 0.9,
                  borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    transform: 'scale(1.15)',
                    color: 'error.main',
                    opacity: 1,
                    boxShadow: '0 3px 8px rgba(244, 67, 54, 0.18)',
                  },
                  transition: 'all 0.18s ease-in-out',
                };
              }}
            >
              {(() => {
                const IconToRender = favoriteIcon || HeartIcon;
                return <IconToRender sx={{ fontSize: '0.75rem' }} />;
              })()}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Additional info (like time) - now shown outside button */}
      {additionalInfo && showLabel && (
        <Typography
          variant='caption'
          sx={{
            mt: 0.5,
            fontSize: '0.65rem',
            color: 'text.secondary',
            opacity: 0.7,
            textAlign: 'center',
          }}
        >
          {additionalInfo}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Standard grid container for action buttons
 * Consistent spacing: 12px gaps, responsive columns
 */
export const StandardActionGrid: React.FC<{
  children: React.ReactNode;
  minColumnWidth?: number;
}> = ({ children, minColumnWidth = 80 }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? 'repeat(3, 1fr)' // 3 columns on mobile
          : isTablet
            ? 'repeat(4, 1fr)' // 4 columns on tablet
            : `repeat(auto-fill, minmax(${minColumnWidth}px, 1fr))`, // Auto-fill on desktop
        gap: '12px', // Consistent 12px gap everywhere
      }}
    >
      {children}
    </Box>
  );
};

export default StandardActionButton;
