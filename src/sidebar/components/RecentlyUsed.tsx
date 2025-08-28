import React, { useState, useEffect, useMemo } from 'react';
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
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DynamicsAction } from '#types/global';
import StandardActionButton, { StandardActionGrid } from '#components/StandardActionButton';

interface ActionButton {
  id: DynamicsAction;
  label: string;
  icon: React.ComponentType<any>;
  tooltip?: string;
}

interface RecentlyUsedProps {
  allActions: ActionButton[];
  onActionClick: (id: DynamicsAction) => void;
  onActionUsed: (id: DynamicsAction) => void; // Callback to track usage
}

interface RecentAction {
  id: DynamicsAction;
  timestamp: number;
  count: number;
}

const RECENT_ACTIONS_KEY = 'levelup-recent-actions';
const MAX_RECENT_ACTIONS = 5;

const RecentlyUsedComponent: React.FC<RecentlyUsedProps> = ({
  allActions,
  onActionClick,
  onActionUsed,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);

  // Load recent actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_ACTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as RecentAction[];
        // Clean up old entries (older than 7 days)
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const filtered = parsed.filter(action => action.timestamp > weekAgo);
        setRecentActions(filtered);
      } catch (error) {
        console.warn('Failed to parse recent actions from localStorage:', error);
      }
    }
  }, []);

  // Save recent actions to localStorage whenever they change
  useEffect(() => {
    if (recentActions.length > 0) {
      localStorage.setItem(RECENT_ACTIONS_KEY, JSON.stringify(recentActions));
    }
  }, [recentActions]);

  // Function to add an action to recent list
  const addToRecent = (actionId: DynamicsAction) => {
    setRecentActions(prev => {
      const now = Date.now();
      const existing = prev.find(action => action.id === actionId);

      if (existing) {
        // Update existing action with new timestamp and increment count
        const updated = prev.map(action =>
          action.id === actionId ? { ...action, timestamp: now, count: action.count + 1 } : action
        );

        // Sort by timestamp (most recent first)
        return updated.sort((a, b) => b.timestamp - a.timestamp);
      } else {
        // Add new action
        const newAction: RecentAction = {
          id: actionId,
          timestamp: now,
          count: 1,
        };

        const updated = [newAction, ...prev];

        // Keep only the most recent MAX_RECENT_ACTIONS
        return updated.slice(0, MAX_RECENT_ACTIONS);
      }
    });
  };

  // Expose the addToRecent function to parent
  useEffect(() => {
    // Create a custom event listener for action usage
    const handleActionUsed = (event: CustomEvent<{ actionId: DynamicsAction }>) => {
      addToRecent(event.detail.actionId);
    };

    window.addEventListener('levelup-action-used', handleActionUsed as EventListener);

    return () => {
      window.removeEventListener('levelup-action-used', handleActionUsed as EventListener);
    };
  }, []);

  // Get recent action buttons with their metadata
  const recentButtons = useMemo(() => {
    return recentActions
      .map(recentAction => {
        const actionConfig = allActions.find(action => action.id === recentAction.id);
        if (!actionConfig) return null;

        return {
          ...actionConfig,
          recentData: recentAction,
        };
      })
      .filter(Boolean) as (ActionButton & { recentData: RecentAction })[];
  }, [recentActions, allActions]);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleActionClick = (id: DynamicsAction) => {
    addToRecent(id);
    onActionClick(id);
    onActionUsed(id);
  };

  const clearRecentActions = () => {
    setRecentActions([]);
    localStorage.removeItem(RECENT_ACTIONS_KEY);
  };

  // Don't render if no recent actions
  if (recentButtons.length === 0) {
    return null;
  }

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
        {/* Collapsible Header */}
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
            <HistoryIcon
              sx={{
                fontSize: '1.1rem',
                color: 'primary.main',
              }}
            />
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
              Recently Used
            </Typography>
            <Chip
              label={recentButtons.length}
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
            {recentButtons.length > 0 && (
              <Tooltip title='Clear recent actions' placement='top'>
                <IconButton
                  size='small'
                  onClick={e => {
                    e.stopPropagation();
                    clearRecentActions();
                  }}
                  sx={{
                    ml: 1,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'error.main',
                      backgroundColor: 'error.light',
                    },
                  }}
                >
                  <ClearIcon fontSize='small' />
                </IconButton>
              </Tooltip>
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
            <StandardActionGrid>
              {recentButtons.map(button => {
                const timeSince = Date.now() - button.recentData.timestamp;
                const minutesAgo = Math.floor(timeSince / (1000 * 60));
                const hoursAgo = Math.floor(timeSince / (1000 * 60 * 60));
                const daysAgo = Math.floor(hoursAgo / 24);

                let timeLabel;
                if (daysAgo > 0) {
                  timeLabel = `${daysAgo}d ago`;
                } else if (hoursAgo > 0) {
                  timeLabel = `${hoursAgo}h ago`;
                } else if (minutesAgo > 0) {
                  timeLabel = `${minutesAgo}m ago`;
                } else {
                  timeLabel = 'Just now';
                }

                return (
                  <StandardActionButton
                    key={button.id}
                    id={button.id}
                    label={button.label}
                    icon={button.icon}
                    tooltip={button.tooltip || button.label}
                    onClick={() => handleActionClick(button.id)}
                    additionalInfo={timeLabel}
                    showLabel={true}
                  />
                );
              })}
            </StandardActionGrid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

const RecentlyUsed = React.memo(RecentlyUsedComponent);

export default RecentlyUsed;
