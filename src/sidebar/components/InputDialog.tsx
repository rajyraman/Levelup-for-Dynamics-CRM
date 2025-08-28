import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Autocomplete,
} from '@mui/material';

interface EntityOption {
  logicalName: string;
  displayName: string;
}

interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  type: 'open-by-id' | 'new-record' | 'open-list';
  entityName: string;
  recordId: string;
  onEntityNameChange: (value: string) => void;
  onRecordIdChange: (value: string) => void;
}

const InputDialog = ({
  open,
  onClose,
  onSubmit,
  title,
  type,
  entityName,
  recordId,
  onEntityNameChange,
  onRecordIdChange,
}: InputDialogProps) => {
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);

  // Fetch entities when dialog opens
  useEffect(() => {
    if (open && entities.length === 0) {
      fetchEntities();
    }
  }, [open]);

  const fetchEntities = async () => {
    setEntitiesLoading(true);
    try {
      console.log('InputDialog: Requesting entities from background script');

      // Check if we're on a Dynamics 365 page first
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('InputDialog: Current tab URL:', currentTab?.url);

      // Let the background script handle Dynamics detection
      // No URL checking here - rely on Xrm API detection

      // Request entities from background script with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 5 seconds')), 5000);
      });

      const requestPromise = chrome.runtime.sendMessage({
        type: 'GET_ENTITY_METADATA_REQUEST',
      });

      const response = await Promise.race([requestPromise, timeoutPromise]);

      console.log('InputDialog: Received response:', response);

      if (response?.success && response.entities) {
        console.log('InputDialog: Processing entities:', response.entities.length);

        const entityOptions: EntityOption[] = response.entities.map((entity: any) => ({
          logicalName: entity.LogicalName || entity.logicalName,
          displayName:
            entity.DisplayName?.UserLocalizedLabel?.Label ||
            entity.displayName ||
            entity.LogicalName ||
            entity.logicalName,
        }));

        // Sort by display name for better UX
        entityOptions.sort((a, b) => a.displayName.localeCompare(b.displayName));
        console.log('InputDialog: Setting entities:', entityOptions.length);
        setEntities(entityOptions);
      } else {
        console.warn('InputDialog: Response missing success or entities:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching entities:', error);
      console.log('InputDialog: Falling back to hardcoded entities due to error');

      // Fallback to common entities if fetch fails
      setEntities([
        { logicalName: 'account', displayName: 'Account' },
        { logicalName: 'contact', displayName: 'Contact' },
        { logicalName: 'opportunity', displayName: 'Opportunity' },
        { logicalName: 'lead', displayName: 'Lead' },
        { logicalName: 'case', displayName: 'Case' },
        { logicalName: 'systemuser', displayName: 'User' },
        { logicalName: 'team', displayName: 'Team' },
      ]);
    } finally {
      console.log('InputDialog: Setting entitiesLoading to false');
      setEntitiesLoading(false);
    }
  };

  const renderEntityField = (autoFocus: boolean = false) => {
    return (
      <Autocomplete<EntityOption, false, false, true>
        options={entities}
        getOptionLabel={option => {
          if (typeof option === 'string') return option;
          return `${option.displayName} (${option.logicalName})`;
        }}
        value={entities.find(e => e.logicalName === entityName) || null}
        onChange={(event, newValue) => {
          if (typeof newValue === 'string') {
            onEntityNameChange(newValue);
          } else {
            onEntityNameChange(newValue ? newValue.logicalName : '');
          }
        }}
        loading={entitiesLoading}
        freeSolo
        onInputChange={(event, newInputValue) => {
          // Allow typing custom entity names
          if (event?.type === 'change') {
            onEntityNameChange(newInputValue);
          }
        }}
        renderInput={params => (
          <TextField
            {...params}
            autoFocus={autoFocus}
            margin='dense'
            label='Entity Name'
            placeholder='Start typing or select an entity...'
            fullWidth
            variant='outlined'
          />
        )}
        sx={{ mb: type === 'open-by-id' ? 2 : 0 }}
      />
    );
  };

  const renderFields = () => {
    switch (type) {
      case 'open-by-id':
        return (
          <>
            {renderEntityField(true)}
            <TextField
              margin='dense'
              label='Record ID'
              placeholder='e.g., 12345678-1234-1234-1234-123456789abc'
              fullWidth
              variant='outlined'
              value={recordId}
              onChange={e => onRecordIdChange(e.target.value)}
            />
          </>
        );
      case 'new-record':
        return renderEntityField(true);
      case 'open-list':
        return renderEntityField(true);
      default:
        return null;
    }
  };

  const getSubmitLabel = () => {
    switch (type) {
      case 'open-by-id':
        return 'Open Record';
      case 'new-record':
        return 'Create New';
      case 'open-list':
        return 'Open List';
      default:
        return 'Submit';
    }
  };

  const isValid = () => {
    switch (type) {
      case 'open-by-id':
        return entityName.trim() && recordId.trim();
      case 'new-record':
      case 'open-list':
        return entityName.trim();
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>{renderFields()}</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='inherit'>
          Cancel
        </Button>
        <Button onClick={onSubmit} variant='contained' disabled={!isValid()}>
          {getSubmitLabel()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InputDialog;

