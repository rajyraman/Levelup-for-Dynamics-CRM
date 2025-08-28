import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Upload as ExportIcon,
  Download as ImportIcon,
  Share as ShareIcon,
  Warning as WarningIcon,
  SelectAll as SelectAllIcon,
  ExpandMore as ExpandMoreIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { CustomCommand, CustomCommandExecution } from '#types/custom-commands';
import { DynamicsAction } from '#types/global';
import { CustomCommandsService } from '#services/CustomCommandsService';
import { messageService } from '#services/MessageService';
import { githubApiService } from '#services/GitHubApiService';
import CommandEditorDialog from '#components/CommandEditorDialog';
import ShareCollectionDialog from '#components/ShareCollectionDialog';
import StandardActionButton, { StandardActionGrid } from '#components/StandardActionButton';

interface MyCommandsProps {
  onToast: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

const MyCommands: React.FC<MyCommandsProps> = ({ onToast }) => {
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<CustomCommand | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuAnchorPosition, setMenuAnchorPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingCommand, setEditingCommand] = useState<CustomCommand | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareCollectionDialogOpen, setShareCollectionDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>('');
  const [importCommands, setImportCommands] = useState<CustomCommand[]>([]);
  const [selectedImportCommands, setSelectedImportCommands] = useState<Set<string>>(new Set());
  const [importUnderstand, setImportUnderstand] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleExpandClick = () => {
    // Allow users to expand even when no commands exist
    setExpanded(!expanded);
  };

  useEffect(() => {
    loadCommands();
  }, []);

  const loadCommands = async () => {
    try {
      const commandsList = await CustomCommandsService.getAllCommands();
      setCommands(commandsList);
    } catch (error) {
      onToast(`Failed to load commands: ${(error as Error).message}`, 'error');
    }
  };

  const handleExecuteCommand = async (command: CustomCommand) => {
    try {
      const result = await messageService.sendMessage('custom:execute' as DynamicsAction, {
        command: command,
      });

      if (result.success) {
        onToast(`Command executed successfully`, 'success');
      } else {
        onToast(`Command execution failed: ${result.error}`, 'error');
      }
    } catch (error) {
      onToast(`Command execution failed: ${(error as Error).message}`, 'error');
    }
  };

  const handleCreateCommand = () => {
    setEditorMode('create');
    setEditingCommand(null);
    setEditorOpen(true);
  };

  const handleEditCommand = (command: CustomCommand) => {
    setEditorMode('edit');
    setEditingCommand(command);
    setEditorOpen(true);
    setMenuAnchor(null);
  };

  const handleSaveCommand = async (
    command: Omit<CustomCommand, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      if (editorMode === 'create') {
        await CustomCommandsService.createCommand(command);
        onToast('Command created successfully', 'success');
      } else if (editingCommand) {
        await CustomCommandsService.updateCommand(editingCommand.id, command);
        onToast('Command updated successfully', 'success');
      }
      await loadCommands();
      setEditorOpen(false);
    } catch (error) {
      onToast(`Failed to save command: ${(error as Error).message}`, 'error');
    }
  };

  const handleTestCommand = async (code: string): Promise<CustomCommandExecution> => {
    try {
      const testCommand: CustomCommand = {
        id: 'test-command',
        name: 'Test Command',
        code: code,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await messageService.sendMessage('custom:execute' as DynamicsAction, {
        command: testCommand,
      });

      return {
        success: result.success,
        result: result.data,
        error: result.error,
        executionTime: 0, // We don't have execution time from MessageResponse
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        executionTime: 0,
      };
    }
  };

  const handleDeleteCommand = (command: CustomCommand) => {
    setSelectedCommand(command);
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
  };

  const confirmDeleteCommand = async () => {
    if (!selectedCommand) return;

    try {
      await CustomCommandsService.deleteCommand(selectedCommand.id);
      await loadCommands();
      onToast('Command deleted successfully', 'success');
    } catch (error) {
      onToast(`Failed to delete command: ${(error as Error).message}`, 'error');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCommand(null);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, command: CustomCommand) => {
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    setMenuAnchor(el);
    // compute viewport coordinates to place the menu beside the button
    const rect = el.getBoundingClientRect();
    // place menu to the left of the button, vertically centered
    setMenuAnchorPosition({
      top: Math.round(rect.top + rect.height / 2),
      left: Math.round(rect.left),
    });
    setSelectedCommand(command);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuAnchorPosition(null);
  };

  const handleExportCommands = async () => {
    try {
      const exportData = await CustomCommandsService.exportCommands();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `level-up-commands-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onToast('Commands exported successfully', 'success');
    } catch (error) {
      onToast(`Export failed: ${(error as Error).message}`, 'error');
    }
  };

  const handleImportCommands = async () => {
    if (!importData.trim() || selectedImportCommands.size === 0 || !importUnderstand) return;

    try {
      // Filter to only import selected commands
      const commandsToImport = importCommands.filter(cmd => selectedImportCommands.has(cmd.id));
      const importPayload = {
        version: '1.0.0',
        exportedAt: Date.now(),
        commands: commandsToImport,
      };

      await CustomCommandsService.importCommands(JSON.stringify(importPayload, null, 2));
      await loadCommands();
      onToast(`Successfully imported ${commandsToImport.length} command(s)`, 'success');

      // Reset import state
      setImportDialogOpen(false);
      setImportData('');
      setImportCommands([]);
      setSelectedImportCommands(new Set());
      setImportUnderstand(false);
    } catch (error) {
      onToast(`Import failed: ${(error as Error).message}`, 'error');
    }
  };

  const handleImportDataChange = (data: string) => {
    setImportData(data);
    setImportCommands([]);
    setSelectedImportCommands(new Set());
    setImportUnderstand(false);

    if (data.trim()) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.commands && Array.isArray(parsed.commands)) {
          setImportCommands(parsed.commands);
          // Auto-select all commands by default
          setSelectedImportCommands(new Set(parsed.commands.map((cmd: CustomCommand) => cmd.id)));
        }
      } catch (error) {
        // Invalid JSON, keep empty commands list
      }
    }
  };

  const handleImportCommandToggle = (commandId: string) => {
    const newSelected = new Set(selectedImportCommands);
    if (newSelected.has(commandId)) {
      newSelected.delete(commandId);
    } else {
      newSelected.add(commandId);
    }
    setSelectedImportCommands(newSelected);
  };

  const handleImportSelectAll = () => {
    if (selectedImportCommands.size === importCommands.length) {
      setSelectedImportCommands(new Set());
    } else {
      setSelectedImportCommands(new Set(importCommands.map(cmd => cmd.id)));
    }
  };

  const handleShareCollectionSubmit = async (collectionData: any) => {
    try {
      const result = await githubApiService.shareCollection(collectionData);

      if (result.success) {
        onToast('Collection shared successfully with the community!', 'success');
        setShareCollectionDialogOpen(false);
      } else {
        throw new Error(result.error || 'Failed to share collection');
      }
    } catch (error) {
      console.error('Share collection failed:', error);
      throw error;
    }
  };

  // Custom Command Button with Menu
  const CustomCommandButton: React.FC<{ command: CustomCommand }> = ({ command }) => {
    // Create icon component for text/emoji icons
    const IconComponent =
      command.icon && command.icon.length <= 2
        ? () => (
            <Typography variant='body2' component='span' sx={{ fontSize: '1.5rem' }}>
              {command.icon}
            </Typography>
          )
        : CodeIcon;

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
          <Tooltip title={command.name} arrow placement='top'>
            <IconButton
              onClick={() => handleExecuteCommand(command)}
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
              <IconComponent />
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
                {command.name}
              </Typography>
            </IconButton>
          </Tooltip>

          {/* Menu Button */}
          <Tooltip title='Command options'>
            <IconButton
              onClick={e => handleMenuOpen(e, command)}
              sx={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 20,
                height: 20,
                backgroundColor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                color: 'text.secondary',
                fontSize: '10px',
                borderRadius: '50%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'scale(1.1)',
                  color: 'text.primary',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <MoreVertIcon sx={{ fontSize: '0.7rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  };

  // Auto-collapse when no commands exist, but still show the section
  const shouldAutoCollapse = commands.length === 0;
  const effectiveExpanded = shouldAutoCollapse ? false : expanded;

  return (
    <>
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
              <Typography
                variant='h6'
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'text.primary',
                  userSelect: 'none',
                }}
              >
                Commands
              </Typography>
              <Chip
                label={commands.length}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box display='flex' gap={1}>
                <Tooltip title='Import Commands'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation();
                      setImportDialogOpen(true);
                    }}
                    color='primary'
                  >
                    <ImportIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Export Commands'>
                  <span>
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.stopPropagation();
                        handleExportCommands();
                      }}
                      color='primary'
                      disabled={commands.length === 0}
                    >
                      <ExportIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title='Share Collection'>
                  <span>
                    <IconButton
                      size='small'
                      onClick={e => {
                        e.stopPropagation();
                        setShareCollectionDialogOpen(true);
                      }}
                      color='primary'
                      disabled={commands.length === 0}
                    >
                      <ShareIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title='Create New Command'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation();
                      handleCreateCommand();
                    }}
                    color='primary'
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <IconButton
                size='small'
                sx={{
                  transform: effectiveExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                  color: 'text.secondary',
                }}
              >
                <ExpandMoreIcon fontSize='small' />
              </IconButton>
            </Box>
          </Box>

          {/* Collapsible Content */}
          <Collapse in={effectiveExpanded} timeout='auto' unmountOnExit>
            <Box sx={{ p: 2, pt: 1.5 }}>
              {/* Commands Grid */}
              {commands.length === 0 ? (
                <Box
                  display='flex'
                  flexDirection='column'
                  alignItems='center'
                  py={4}
                  sx={{ color: 'text.secondary' }}
                >
                  <CodeIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant='body1' gutterBottom>
                    No custom commands yet
                  </Typography>
                  <Typography variant='body2' textAlign='center'>
                    Create your first custom command to get started with automating Dynamics 365
                    tasks.
                  </Typography>
                  <Button
                    variant='contained'
                    startIcon={<AddIcon />}
                    onClick={handleCreateCommand}
                    sx={{ mt: 2 }}
                  >
                    Create Command
                  </Button>
                </Box>
              ) : (
                <StandardActionGrid>
                  {commands.map(command => (
                    <CustomCommandButton key={command.id} command={command} />
                  ))}
                </StandardActionGrid>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        // use explicit coordinates so the menu appears directly beside the small absolute-positioned button
        anchorReference='anchorPosition'
        anchorPosition={menuAnchorPosition ?? undefined}
        transformOrigin={{ vertical: 'center', horizontal: 'right' }}
      >
        <MenuItem onClick={() => selectedCommand && handleEditCommand(selectedCommand)}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedCommand && handleDeleteCommand(selectedCommand)}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Command Editor Dialog */}
      <CommandEditorDialog
        open={editorOpen}
        mode={editorMode}
        command={editingCommand || undefined}
        onSave={handleSaveCommand}
        onClose={() => setEditorOpen(false)}
        onTest={handleTestCommand}
      />

      {/* Share Collection Dialog */}
      <ShareCollectionDialog
        open={shareCollectionDialogOpen}
        commands={commands}
        onShare={handleShareCollectionSubmit}
        onClose={() => setShareCollectionDialogOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Command</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the command "{selectedCommand?.name}"? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteCommand} color='error' variant='contained'>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' },
        }}
      >
        <DialogTitle>
          <Box display='flex' alignItems='center' gap={1}>
            <ImportIcon />
            Import Commands
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' mb={2}>
            Paste the exported JSON data below to import commands:
          </Typography>

          <Box
            component='textarea'
            value={importData}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleImportDataChange(e.target.value)
            }
            placeholder='Paste exported command data here...'
            sx={{
              width: '100%',
              minHeight: 150,
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              resize: 'vertical',
              backgroundColor: 'background.paper',
              color: 'text.primary',
              mb: 2,
            }}
          />

          {importCommands.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  Select Commands to Import ({selectedImportCommands.size} of{' '}
                  {importCommands.length} selected)
                </Typography>
                <Button
                  size='small'
                  variant='outlined'
                  startIcon={<SelectAllIcon />}
                  onClick={handleImportSelectAll}
                >
                  {selectedImportCommands.size === importCommands.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </Box>

              <Box
                sx={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <FormGroup>
                  {importCommands.map(command => (
                    <Card key={command.id} variant='outlined' sx={{ mb: 1 }}>
                      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedImportCommands.has(command.id)}
                              onChange={() => handleImportCommandToggle(command.id)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant='subtitle2'>{command.name}</Typography>
                              <Typography variant='body2' color='text.secondary'>
                                {command.description || 'No description'}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </FormGroup>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Alert severity='warning' icon={<WarningIcon />} sx={{ mb: 2 }}>
                <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
                  Important: Review Code Before Importing
                </Typography>
                <Typography variant='body2' component='div'>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    <li>Imported commands will have access to your Dynamics 365 environment</li>
                    <li>Only import commands from trusted sources you recognize</li>
                    <li>Review the JavaScript code in each command before execution</li>
                    <li>
                      Commands may modify data, create records, or perform administrative actions
                    </li>
                    <li>You are responsible for any actions performed by imported commands</li>
                  </ul>
                </Typography>
              </Alert>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={importUnderstand}
                    onChange={e => setImportUnderstand(e.target.checked)}
                  />
                }
                label={
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    I understand the risks and have reviewed the commands I'm importing
                  </Typography>
                }
                sx={{ mb: 1 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setImportDialogOpen(false);
              setImportData('');
              setImportCommands([]);
              setSelectedImportCommands(new Set());
              setImportUnderstand(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImportCommands}
            variant='contained'
            disabled={
              !importData.trim() ||
              importCommands.length === 0 ||
              selectedImportCommands.size === 0 ||
              !importUnderstand
            }
            startIcon={<ImportIcon />}
          >
            Import {selectedImportCommands.size > 0 ? `(${selectedImportCommands.size})` : ''}{' '}
            Commands
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MyCommands;
