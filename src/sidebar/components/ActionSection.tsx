import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Collapse,
  Tooltip,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material';
import {
  Favorite as HeartIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  GridView as GridViewIcon,
  List as ListViewIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DynamicsAction } from '#types/global';
import StandardActionButton, { StandardActionGrid } from '#components/StandardActionButton';

interface ActionButton {
  id: DynamicsAction;
  label: string;
  icon: React.ComponentType<any>;
  tooltip?: string;
  category?: 'common' | 'advanced';
  priority?: number;
}

interface ActionSectionProps {
  title: string;
  buttons: ActionButton[];
  onActionClick: (id: DynamicsAction) => void;
  onFavoriteToggle: (id: DynamicsAction) => void;
  favoriteIds: DynamicsAction[];
  sectionColor?: 'form' | 'navigation' | 'debugging';
}

const ActionSectionComponent: React.FC<ActionSectionProps> = ({
  title,
  buttons,
  onActionClick,
  onFavoriteToggle,
  favoriteIds,
  sectionColor = 'form',
}) => {
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Uniform color scheme for all sections
  const colors = {
    primary: 'action.hover',
    secondary: 'background.default',
    border: 'divider',
    text: 'text.primary',
  };

  // Filter buttons (no grouping)
  const filteredButtons = useMemo(() => {
    let filtered = buttons;

    // Apply search filter
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase().trim();
      filtered = buttons.filter(
        button =>
          button.label.toLowerCase().includes(lowercaseSearch) ||
          (button.tooltip && button.tooltip.toLowerCase().includes(lowercaseSearch))
      );
    }

    return filtered;
  }, [buttons, searchTerm]);

  const totalFilteredButtons = filteredButtons.length;

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleViewModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newViewMode: 'grid' | 'list' | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Don't render if no buttons after filtering
  if (totalFilteredButtons === 0 && searchTerm) {
    return (
      <Card
        sx={{
          mb: 1,
          borderRadius: 2,
          boxShadow: 'none',
          border: 1,
          borderColor: 'divider',
          background: colors.secondary,
        }}
      >
        <CardContent sx={{ py: 2, px: 2 }}>
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            <SearchIcon sx={{ fontSize: '2rem', mb: 1, opacity: 0.5 }} />
            <Typography variant='body2' sx={{ mb: 2 }}>
              No actions found for "{searchTerm}"
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Chip
                label={`Clear "${searchTerm}"`}
                onDelete={clearSearch}
                color='primary'
                variant='outlined'
                deleteIcon={<ClearIcon />}
                sx={{ fontSize: '0.8rem' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Don't render if no buttons at all
  if (buttons.length === 0) {
    return null;
  }

  return (
    <Card
      sx={{
        mb: 0.75,
        borderRadius: 2,
        boxShadow: 'none',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ py: 0, px: 0, '&:last-child': { pb: 0 } }}>
        {/* Collapsible Header */}
        <Box
          onClick={handleExpandClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
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
            <Typography
              variant='h6'
              component='h2'
              sx={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: 'text.primary',
                userSelect: 'none',
              }}
            >
              {title}
            </Typography>
            <Chip
              label={totalFilteredButtons}
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
            {searchTerm && (
              <Chip
                label={`"${searchTerm}"`}
                size='small'
                onDelete={clearSearch}
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            )}
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

        {/* Collapsible Content */}
        <Collapse in={expanded} timeout='auto' unmountOnExit>
          <Box sx={{ p: 2, pt: 1.5 }}>
            {/* Search and View Controls */}
            <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size='small'
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon fontSize='small' sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position='end'>
                      <IconButton size='small' onClick={clearSearch}>
                        <ClearIcon fontSize='small' />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                  sx: { fontSize: '0.8rem' },
                }}
                sx={{
                  flex: 1,
                  minWidth: 180,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.8)',
                    '&:hover': {
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(255,255,255,0.9)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: theme =>
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'white',
                    },
                  },
                  '& .MuiInputBase-input': {
                    padding: '6px 8px',
                    color: theme =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'inherit',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: theme =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'inherit',
                    opacity: 1,
                  },
                }}
              />

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size='small'
                sx={{
                  '& .MuiToggleButton-root': {
                    border: '1px solid',
                    borderColor: 'divider',
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value='grid' aria-label='grid view'>
                  <GridViewIcon fontSize='small' />
                </ToggleButton>
                <ToggleButton value='list' aria-label='list view'>
                  <ListViewIcon fontSize='small' />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* All Buttons */}
            {filteredButtons.length > 0 ? (
              viewMode === 'grid' ? (
                <StandardActionGrid>
                  {filteredButtons.map(button => (
                    <StandardActionButton
                      key={button.id}
                      id={button.id}
                      label={button.label}
                      icon={button.icon}
                      tooltip={button.tooltip}
                      onClick={() => onActionClick(button.id)}
                      isFavorite={favoriteIds.includes(button.id)}
                      onFavoriteToggle={() => onFavoriteToggle(button.id)}
                      showFavorite={true}
                      showLabel={true}
                    />
                  ))}
                </StandardActionGrid>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    width: '100%',
                    maxWidth: '100%',
                  }}
                >
                  {filteredButtons.map(button => (
                    <ActionButtonList
                      key={button.id}
                      button={button}
                      isFavorite={favoriteIds.includes(button.id)}
                      onActionClick={onActionClick}
                      onFavoriteToggle={onFavoriteToggle}
                      sectionColor={sectionColor}
                    />
                  ))}
                </Box>
              )
            ) : null}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// Grid view component for action buttons
const ActionButtonGrid: React.FC<{
  button: ActionButton;
  isFavorite: boolean;
  onActionClick: (id: DynamicsAction) => void;
  onFavoriteToggle: (id: DynamicsAction) => void;
  sectionColor: 'form' | 'navigation' | 'debugging';
}> = ({ button, isFavorite, onActionClick, onFavoriteToggle }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Tooltip title={button.tooltip || button.label} arrow placement='top'>
          <IconButton
            onClick={() => onActionClick(button.id)}
            sx={{
              width: 77,
              height: 77,
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
            <button.icon />
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
                wordBreak: 'break-word',
                hyphens: 'auto',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {button.label}
            </Typography>
          </IconButton>
        </Tooltip>
        <Tooltip
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          arrow
          placement='top'
        >
          <IconButton
            onClick={e => {
              e.stopPropagation();
              onFavoriteToggle(button.id);
            }}
            sx={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 20,
              height: 20,
              backgroundColor: 'background.paper',
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
            }}
          >
            <HeartIcon sx={{ fontSize: '0.75rem' }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

// List view component for action buttons
const ActionButtonList: React.FC<{
  button: ActionButton;
  isFavorite: boolean;
  onActionClick: (id: DynamicsAction) => void;
  onFavoriteToggle: (id: DynamicsAction) => void;
  sectionColor: 'form' | 'navigation' | 'debugging';
}> = ({ button, isFavorite, onActionClick, onFavoriteToggle }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        '&:hover': {
          backgroundColor: 'action.hover',
          borderColor: 'divider',
          boxShadow: 1,
        },
      }}
      onClick={() => onActionClick(button.id)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 2,
          backgroundColor: 'action.hover',
          color: 'text.primary',
          flexShrink: 0,
        }}
      >
        <button.icon sx={{ fontSize: '1.25rem' }} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant='body2'
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            lineHeight: 1.2,
            mb: 0.5,
          }}
        >
          {button.label}
        </Typography>
        {button.tooltip && (
          <Typography
            variant='caption'
            sx={{
              color: 'text.secondary',
              fontSize: '0.7rem',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {button.tooltip}
          </Typography>
        )}
      </Box>

      <Tooltip
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        arrow
        placement='top'
      >
        <IconButton
          onClick={e => {
            e.stopPropagation();
            onFavoriteToggle(button.id);
          }}
          sx={{
            color: isFavorite ? 'error.main' : 'text.disabled',
            opacity: isFavorite ? 1 : 0.6,
            '&:hover': {
              color: 'error.main',
              opacity: 1,
              backgroundColor: 'error.light',
            },
            transition: 'all 0.2s ease-in-out',
            flexShrink: 0,
          }}
        >
          <HeartIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const ActionSection = React.memo(ActionSectionComponent);

export default ActionSection;

