import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  Chip,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  PlayArrow as TestIcon,
  Code as CodeIcon,
  BugReport as BugIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { CustomCommand } from '#types/custom-commands';
import CodeMirrorEditor from './CodeMirrorEditor';

interface CommandEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (command: Omit<CustomCommand, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onTest?: (code: string) => Promise<{ success: boolean; result?: any; error?: string }>;
  command?: CustomCommand;
  mode: 'create' | 'edit';
}

const CommandEditorDialogComponent: React.FC<CommandEditorDialogProps> = ({
  open,
  onClose,
  onSave,
  onTest,
  command,
  mode,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [icon, setIcon] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    result?: any;
    error?: string;
  } | null>(null);

  // Initialize form data when dialog opens or command changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && command) {
        setName(command.name);
        setDescription(command.description || '');
        setCode(command.code);
        setIcon(command.icon || '');
      } else {
        // Create mode - initialize with defaults
        setName('');
        setDescription('');
        setCode(''); // Start with empty code
        setIcon('');
      }
      setValidationErrors([]);
      setValidationWarnings([]);
      setTestResult(null);
    }
  }, [open, command, mode]);

  const handleClose = () => {
    setTestResult(null);
    onClose();
  };

  const handleSave = async () => {
    console.log('[CommandEditorDialog] handleSave called with:', {
      name,
      code: code.substring(0, 50) + '...',
    });

    // Final validation
    if (!name.trim()) {
      console.log('[CommandEditorDialog] Validation failed: missing name');
      setValidationErrors(['Command name is required']);
      return;
    }

    if (!code.trim()) {
      console.log('[CommandEditorDialog] Validation failed: missing code');
      setValidationErrors(['Command code is required']);
      return;
    }

    if (validationErrors.length > 0) {
      console.log('[CommandEditorDialog] Validation failed: errors present', validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      console.log('[CommandEditorDialog] Calling onSave...');
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        code: code.trim(),
        icon: icon || '',
      });
      console.log('[CommandEditorDialog] onSave completed successfully');
      handleClose();
    } catch (error) {
      console.error('[CommandEditorDialog] onSave failed:', error);
      setValidationErrors([`Failed to save command: ${(error as Error).message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!code.trim()) {
      setTestResult({ success: false, error: 'No code to test' });
      return;
    }

    if (validationErrors.length > 0) {
      setTestResult({ success: false, error: 'Please fix validation errors before testing' });
      return;
    }

    if (!onTest) {
      setTestResult({ success: false, error: 'Test functionality not available' });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const result = await onTest(code);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: `Test execution failed: ${(error as Error).message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidation = (errors: string[], warnings: string[]) => {
    setValidationErrors(errors);
    setValidationWarnings(warnings);
  };

  const isFormValid = () => {
    return name.trim() && code.trim() && validationErrors.length === 0;
  };

  const getDialogTitle = () => {
    return mode === 'create' ? 'Create Custom Command' : `Edit Command: ${command?.name}`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='lg'
      fullWidth
      slotProps={{
        paper: {
          sx: {
            height: '90vh',
            maxHeight: '90vh',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 0,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon sx={{ color: 'primary.main' }} />
          <Typography variant='h6'>{getDialogTitle()}</Typography>
        </Box>
        <Tooltip title='Close' arrow>
          <IconButton onClick={handleClose} size='small'>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Command Metadata */}
        <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
          <TextField
            label='Command Name'
            value={name}
            onChange={e => setName(e.target.value)}
            required
            fullWidth
            variant='outlined'
            placeholder='e.g., Get Current User Info'
            error={!name.trim() && validationErrors.some(e => e.includes('name'))}
            helperText={!name.trim() ? 'Required field' : 'Unique name for your command'}
          />
          <TextField
            label='Icon'
            value={icon}
            onChange={e => {
              // Limit to 2 characters to keep it as emoji/icon
              const value = e.target.value.slice(0, 2);
              setIcon(value);
            }}
            variant='outlined'
            sx={{
              minWidth: 100,
              maxWidth: 100,
            }}
            helperText='Enter emoji or 1-2 chars'
            slotProps={{
              input: {
                sx: {
                  '& input': {
                    textAlign: 'center',
                    fontSize: '20px',
                  },
                },
              },
            }}
          />
        </Box>

        <TextField
          label='Description (Optional)'
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={2}
          variant='outlined'
          placeholder='Brief description of what this command does...'
          helperText='Optional description to help you remember what this command does'
        />

        {/* Code Editor */}
        <Box sx={{ flex: 1, minHeight: 300 }}>
          <CodeMirrorEditor
            value={code}
            onChange={setCode}
            height='100%'
            maxLines={500}
            showLineCount={true}
            onValidation={handleValidation}
          />
        </Box>

        {/* Test Result */}
        {testResult && (
          <Alert
            severity={testResult.success ? 'success' : 'error'}
            icon={testResult.success ? <CheckIcon /> : <ErrorIcon />}
            sx={{ mt: 1 }}
          >
            <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
              {testResult.success ? 'Test Successful' : 'Test Failed'}
            </Typography>
            {testResult.success && testResult.result !== undefined && (
              <Typography variant='body2' sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                Result: {JSON.stringify(testResult.result, null, 2)}
              </Typography>
            )}
            {!testResult.success && testResult.error && (
              <Typography variant='body2' sx={{ mt: 0.5 }}>
                {testResult.error}
              </Typography>
            )}
          </Alert>
        )}

        {/* Validation Summary */}
        {validationWarnings.length > 0 && (
          <Alert severity='warning' icon={<WarningIcon />}>
            <Typography variant='subtitle2' sx={{ fontWeight: 'bold' }}>
              Warnings ({validationWarnings.length})
            </Typography>
            <Box component='ul' sx={{ mt: 0.5, mb: 0, pl: 2 }}>
              {validationWarnings.map((warning, index) => (
                <Typography component='li' variant='body2' key={index}>
                  {warning}
                </Typography>
              ))}
            </Box>
          </Alert>
        )}

        {/* Quick Help */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography
            variant='subtitle2'
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CodeIcon fontSize='small' />
            Quick Reference
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {[
              'Xrm.Page.data.entity.getId()',
              'Xrm.Page.getAttribute("name")',
              'Xrm.Utility.alertDialog()',
              'Xrm.WebApi.retrieveRecord()',
              'console.log()',
            ].map(snippet => (
              <Chip
                key={snippet}
                label={snippet}
                size='small'
                variant='outlined'
                onClick={() => {
                  // Insert snippet at cursor position
                  setCode(prev => prev + '\n' + snippet);
                }}
                sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>

        {onTest && (
          <Button
            onClick={handleTest}
            disabled={isLoading || !code.trim() || validationErrors.length > 0}
            startIcon={<TestIcon />}
            variant='outlined'
          >
            Test Code
          </Button>
        )}

        <Button
          onClick={handleSave}
          disabled={isLoading || !isFormValid()}
          startIcon={<SaveIcon />}
          variant='contained'
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Command' : 'Update Command'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CommandEditorDialog = React.memo(CommandEditorDialogComponent);

export default CommandEditorDialog;
