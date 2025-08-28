import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Collapse,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Favorite as HeartIcon,
  Close as TimesIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { DynamicsAction } from '#types/global';

interface ActionButton {
  id: DynamicsAction;
  label: string;
  icon: React.ComponentType<any>;
  tooltip?: string;
}

interface FavoritesProps {
  favoriteButtons: ActionButton[];
  onActionClick: (id: DynamicsAction) => void;
  onFavoriteToggle: (id: DynamicsAction) => void;
}

const badgeSx = {
  width: 18,
  height: 18,
  minWidth: 18,
  boxSizing: 'border-box',
  mr: 1,
  p: 0,
  borderRadius: '50%',
  backgroundColor: 'background.paper',
  border: 1,
  borderColor: 'divider',
  color: 'error.main',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transformOrigin: 'center center',
  '& .MuiSvgIcon-root': {
    fontSize: '0.9rem',
    lineHeight: 0,
    transformOrigin: 'center',
    transformBox: 'fill-box',
  },
  transition:
    'transform 0.2s ease-in-out, background-color 0.2s ease-in-out, color 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: 'error.main',
    color: 'error.contrastText',
    transform: 'scale(1.2)',
  },
  verticalAlign: 'middle',
};

const FavoritesComponent: React.FC<FavoritesProps> = ({
  favoriteButtons,
  onActionClick,
  onFavoriteToggle,
}) => {
  const [expanded, setExpanded] = React.useState(true);

  const handleExpandClick = () => setExpanded(!expanded);

  return (
    <Card
      sx={{
        mb: 1,
        borderRadius: 2,
        boxShadow: 'none',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ py: 0, px: 0, '&:last-child': { pb: 0 } }}>
        <Box
          onClick={handleExpandClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            cursor: 'pointer',
            backgroundColor: 'action.hover',
            borderRadius: '8px 8px 0 0',
            transition: 'background-color 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'action.selected',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HeartIcon
              sx={{
                fontSize: '1.1rem',
                color: 'error.main',
              }}
            />
            <Typography
              variant='h6'
              sx={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'text.primary',
                userSelect: 'none',
              }}
            >
              Favorites
            </Typography>
            <Chip
              label={favoriteButtons.length}
              size='small'
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 600,
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          </Box>

          <IconButton
            size='small'
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease-in-out',
              color: 'text.secondary',
            }}
          >
            <ExpandMoreIcon fontSize='small' />
          </IconButton>
        </Box>

        <Collapse in={expanded} timeout='auto' unmountOnExit>
          <Box sx={{ p: 2, pt: 1.5 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, 80px)',
                gap: '12px',
                justifyContent: 'flex-start',
              }}
            >
              {favoriteButtons.map(button => (
                <Box
                  key={button.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    width: '80px',
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <Tooltip title={button.tooltip || button.label} arrow placement='top'>
                      <IconButton
                        onClick={() => onActionClick(button.id)}
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2,
                          border: 1,
                          borderColor: 'divider',
                          color: 'text.primary',
                          backgroundColor: 'transparent',
                          flexShrink: 0,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            borderColor: 'divider',
                            transform: 'translateY(-1px)',
                            boxShadow: 1,
                          },
                          '& .MuiSvgIcon-root': { color: 'inherit' },
                        }}
                      >
                        <button.icon sx={{ fontSize: '1.5rem' }} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title='Remove from favorites' arrow placement='top'>
                      <IconButton
                        className='remove-button'
                        onClick={e => {
                          e.stopPropagation();
                          onFavoriteToggle(button.id);
                        }}
                        size='small'
                        sx={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          width: 18,
                          height: 18,
                          minWidth: 18,
                          padding: 0,
                          zIndex: 2,
                          backgroundColor: 'background.paper',
                          color: 'text.disabled',
                          borderRadius: '50%',
                          border: 1,
                          borderColor: 'divider',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition:
                            'transform 0.2s ease-in-out, background-color 0.2s ease-in-out, color 0.2s ease-in-out',
                          transformOrigin: 'center center',
                          '&:hover': {
                            backgroundColor: 'error.main',
                            color: 'error.contrastText',
                            borderColor: 'error.main',
                            transform: 'scale(1.2)',
                          },
                          '& .MuiSvgIcon-root': {
                            fontSize: '0.9rem',
                            lineHeight: 0,
                            transformOrigin: 'center',
                            transformBox: 'fill-box',
                          },
                        }}
                      >
                        <TimesIcon
                          sx={{
                            transition: 'transform 0.2s ease-in-out',
                            fontSize: '0.9rem',
                            lineHeight: 0,
                            transformOrigin: 'center',
                            transformBox: 'fill-box',
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Typography
                    variant='caption'
                    sx={{
                      mt: 0.5,
                      fontWeight: 500,
                      color: 'text.secondary',
                      width: '100%',
                      maxWidth: '80px',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      textAlign: 'center',
                      fontSize: '0.7rem',
                      lineHeight: 1.1,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {button.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default React.memo(FavoritesComponent);
