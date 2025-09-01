import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Collapse, Chip } from '@mui/material';
import { Favorite as HeartIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { DynamicsAction } from '#types/global';
import StandardActionButton, { StandardActionGrid } from '#components/StandardActionButton';
import { Close as CloseIcon } from '@mui/icons-material';

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

// (no badge styles needed here)

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
            <StandardActionGrid minColumnWidth={80}>
              {favoriteButtons.map(button => (
                <StandardActionButton
                  key={button.id}
                  id={button.id}
                  label={button.label}
                  icon={button.icon}
                  tooltip={button.tooltip}
                  onClick={() => onActionClick(button.id)}
                  isFavorite={true}
                  onFavoriteToggle={() => onFavoriteToggle(button.id)}
                  showFavorite={true}
                  showLabel={true}
                  favoriteVariant='subtle'
                  favoriteIcon={CloseIcon}
                />
              ))}
            </StandardActionGrid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default React.memo(FavoritesComponent);
