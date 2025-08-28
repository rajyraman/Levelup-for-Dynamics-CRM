import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Box,
  Typography,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
} from '@mui/material';
import {
  Collections as CollectionIcon,
  Code as CodeIcon,
  Share as ShareIcon,
  CheckCircle as SuccessIcon,
  GitHub as GitHubIcon,
  Send as SendIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { CustomCommand } from '#types/custom-commands';
import { ShareCollectionData } from '#services/GitHubApiService';

interface ShareCollectionDialogProps {
  open: boolean;
  commands: CustomCommand[];
  onShare: (collectionData: ShareCollectionData) => Promise<void>;
  onClose: () => void;
}

const categories = [
  'Form Actions',
  'Navigation',
  'Data Management',
  'UI Enhancement',
  'Development Tools',
  'Workflow Automation',
  'Reporting & Analytics',
  'User Management',
  'Business Process',
  'Other',
];

const dynamicsVersions = [
  'Any',
  'Dynamics 365 Online',
  'Dynamics 365 (on-premises)',
  'Power Platform',
  'Dynamics 365 Customer Engagement',
  'Dynamics 365 Finance & Operations',
  'Version 9.2+',
];

const commonTags = [
  'workflow',
  'automation',
  'reporting',
  'data-migration',
  'integration',
  'productivity',
  'business-process',
  'data-management',
  'ui-enhancement',
  'analytics',
  'user-management',
  'development',
  'utilities',
];

const steps = ['Select Commands', 'Collection Details', 'Safety & Quality', 'Preview & Share'];

const ShareCollectionDialog: React.FC<ShareCollectionDialogProps> = ({
  open,
  commands,
  onShare,
  onClose,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCommands, setSelectedCommands] = useState<Set<string>>(new Set());
  const [collectionName, setCollectionName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [dynamicsVersion, setDynamicsVersion] = useState('Any');
  const [contactInfo, setContactInfo] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareComplete, setShareComplete] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Safety checklist state
  const [safetyChecklist, setSafetyChecklist] = useState({
    tested: false,
    noSensitiveData: false,
    bestPractices: false,
    confirmations: false,
    publicLicense: false,
  });

  useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      setActiveStep(0);
      setSelectedCommands(new Set());
      setCollectionName('');
      setDescription('');
      setCategory('');
      setAuthor('');
      setTags([]);
      setDynamicsVersion('Any');
      setContactInfo('');
      setIsSharing(false);
      setShareComplete(false);
      setErrors([]);
      setSafetyChecklist({
        tested: false,
        noSensitiveData: false,
        bestPractices: false,
        confirmations: false,
        publicLicense: false,
      });
    }
  }, [open]);

  const handleCommandToggle = (commandId: string) => {
    const newSelected = new Set(selectedCommands);
    if (newSelected.has(commandId)) {
      newSelected.delete(commandId);
    } else {
      newSelected.add(commandId);
    }
    setSelectedCommands(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCommands.size === commands.length) {
      setSelectedCommands(new Set());
    } else {
      setSelectedCommands(new Set(commands.map(cmd => cmd.id)));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: string[] = [];

    switch (step) {
      case 0: // Select Commands
        if (selectedCommands.size === 0) {
          newErrors.push('Please select at least one command to share');
        }
        break;
      case 1: // Collection Details
        if (!collectionName.trim()) {
          newErrors.push('Collection name is required');
        }
        if (!description.trim()) {
          newErrors.push('Collection description is required');
        } else if (description.length < 20) {
          newErrors.push('Description should be at least 20 characters');
        }
        if (!author.trim()) {
          newErrors.push('Author name is required');
        }
        if (!category.trim()) {
          newErrors.push('Category is required');
        }
        break;
      case 2: // Safety & Quality
        const requiredChecks = Object.values(safetyChecklist);
        if (!requiredChecks.every(checked => checked)) {
          newErrors.push('All safety and quality items must be confirmed before sharing');
        }
        break;
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const buildGitHubIssueUrl = () => {
    const baseUrl =
      'https://github.com/rajyraman/level-up-community-commands/issues/new?template=share-command-collection.yml';
    const params = new URLSearchParams();

    if (collectionName.trim()) params.set('collection-name', collectionName.trim());
    if (description.trim()) params.set('description', description.trim());
    if (category.trim()) params.set('category', category.trim());
    if (tags.length > 0) params.set('tags', tags.join(', '));
    if (dynamicsVersion.trim()) params.set('dynamics-version', dynamicsVersion.trim());
    if (author.trim()) params.set('author-attribution', author.trim());
    if (contactInfo.trim()) params.set('contact-info', contactInfo.trim());

    // Add command count
    params.set('command-count', selectedCommands.size.toString());

    // Add commands JSON
    if (selectedCommands.size > 0) {
      const selectedCommandsList = commands.filter(cmd => selectedCommands.has(cmd.id));
      const commandsJson = JSON.stringify(
        {
          version: '1.0.0',
          exportedAt: Date.now(),
          commands: selectedCommandsList,
        },
        null,
        2
      );
      params.set('commands-json', commandsJson);
    }

    return `${baseUrl}&${params.toString()}`;
  };

  const handleShare = async () => {
    if (!validateStep(activeStep)) return;

    setIsSharing(true);
    try {
      const selectedCommandsList = commands.filter(cmd => selectedCommands.has(cmd.id));

      const collectionData: ShareCollectionData = {
        collectionName: collectionName.trim(),
        description: description.trim(),
        category: category.trim(),
        author: author.trim(),
        tags: tags,
        dynamicsVersion: dynamicsVersion.trim(),
        setupInstructions: '',
        commandCount: selectedCommandsList.length,
        commandsJson: JSON.stringify(
          {
            version: '1.0.0',
            exportedAt: Date.now(),
            commands: selectedCommandsList,
          },
          null,
          2
        ),
        workflowDiagram: undefined,
        contactInfo: contactInfo.trim() || undefined,
      };

      await onShare(collectionData);
      setShareComplete(true);
      setActiveStep(steps.length); // Move to success step
    } catch (error) {
      setErrors([`Failed to share collection: ${(error as Error).message}`]);
    } finally {
      setIsSharing(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Select Commands
        return (
          <Box>
            <Typography variant='body2' color='text.secondary' mb={2}>
              Select the commands you want to include in this collection:
            </Typography>

            <Box mb={2}>
              <Button
                variant='outlined'
                size='small'
                onClick={handleSelectAll}
                startIcon={<CollectionIcon />}
              >
                {selectedCommands.size === commands.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Typography variant='body2' color='text.secondary' mt={1}>
                {selectedCommands.size} of {commands.length} commands selected
              </Typography>
            </Box>

            <FormGroup>
              {commands.map(command => (
                <Card key={command.id} variant='outlined' sx={{ mb: 1 }}>
                  <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedCommands.has(command.id)}
                          onChange={() => handleCommandToggle(command.id)}
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
                      sx={{ alignItems: 'flex-start', m: 0 }}
                    />
                  </CardContent>
                </Card>
              ))}
            </FormGroup>
          </Box>
        );

      case 1: // Collection Details
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label='Collection Name *'
              value={collectionName}
              onChange={e => setCollectionName(e.target.value)}
              placeholder='e.g., Lead Management Suite, Report Generation Tools'
              helperText='A descriptive name for your command collection'
              required
            />

            <TextField
              fullWidth
              label='Collection Description *'
              value={description}
              onChange={e => setDescription(e.target.value)}
              multiline
              rows={3}
              placeholder='Describe what this collection accomplishes and what business scenario it addresses...'
              helperText='Explain the overall purpose, workflow, and benefits (minimum 50 characters)'
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Primary Category *</InputLabel>
              <Select
                value={category}
                onChange={e => setCategory(e.target.value)}
                label='Primary Category *'
              >
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Which category best fits this collection?</FormHelperText>
            </FormControl>

            <TextField
              fullWidth
              label='Author Name *'
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder='Your name or organization'
              helperText='How would you like to be credited?'
              required
            />

            <Autocomplete
              multiple
              options={commonTags}
              value={tags}
              onChange={(_, newValue) => setTags(newValue)}
              freeSolo
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant='outlined'
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label='Tags'
                  placeholder='e.g., workflow, automation, reporting'
                  helperText='Add relevant tags separated by commas to help others find your collection'
                />
              )}
            />

            <FormControl fullWidth>
              <InputLabel>Dynamics 365/Power Apps Version</InputLabel>
              <Select
                value={dynamicsVersion}
                onChange={e => setDynamicsVersion(e.target.value)}
                label='Dynamics 365/Power Apps Version'
              >
                {dynamicsVersions.map(version => (
                  <MenuItem key={version} value={version}>
                    {version}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Which version(s) have you tested this collection with?
              </FormHelperText>
            </FormControl>
          </Box>
        );

      case 2: // Safety & Quality
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity='info' icon={<SecurityIcon />}>
              <Typography variant='body2'>
                Please review and confirm all safety and quality requirements before sharing your
                collection.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label='Contact Information (Optional)'
              value={contactInfo}
              onChange={e => setContactInfo(e.target.value)}
              placeholder='GitHub username (e.g., @yourusername) or email'
              helperText='Optional: For follow-up questions (will be visible publicly and auto-filled in GitHub issue)'
            />

            <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>
              Safety & Quality Checklist
            </Typography>

            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={safetyChecklist.tested}
                    onChange={e =>
                      setSafetyChecklist(prev => ({ ...prev, tested: e.target.checked }))
                    }
                  />
                }
                label='All commands have been tested and work correctly together'
                required
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={safetyChecklist.noSensitiveData}
                    onChange={e =>
                      setSafetyChecklist(prev => ({ ...prev, noSensitiveData: e.target.checked }))
                    }
                  />
                }
                label='No commands contain sensitive data (URLs, passwords, personal info)'
                required
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={safetyChecklist.bestPractices}
                    onChange={e =>
                      setSafetyChecklist(prev => ({ ...prev, bestPractices: e.target.checked }))
                    }
                  />
                }
                label='All code follows JavaScript best practices with helpful comments'
                required
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={safetyChecklist.confirmations}
                    onChange={e =>
                      setSafetyChecklist(prev => ({ ...prev, confirmations: e.target.checked }))
                    }
                  />
                }
                label='Destructive operations have appropriate user confirmations'
                required
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={safetyChecklist.publicLicense}
                    onChange={e =>
                      setSafetyChecklist(prev => ({ ...prev, publicLicense: e.target.checked }))
                    }
                  />
                }
                label='I understand this will be shared publicly under the MIT license'
                required
              />
            </FormGroup>
          </Box>
        );

      case 3: // Preview & Share
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity='info' sx={{ mb: 2 }}>
              <Typography variant='body2'>
                Your collection will be shared to the Level Up Community repository as a GitHub
                Issue. The community can then review, test, and include it in the official
                collection.
              </Typography>
            </Alert>

            <Card variant='outlined'>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  <CollectionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Collection Preview
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                  <Typography variant='body2'>
                    <strong>Name:</strong> {collectionName}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Category:</strong> {category}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Author:</strong> {author}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Dynamics Version:</strong> {dynamicsVersion}
                  </Typography>
                  <Typography variant='body2'>
                    <strong>Commands:</strong> {selectedCommands.size} selected
                  </Typography>
                </Box>

                <Typography variant='body2' paragraph>
                  <strong>Description:</strong> {description}
                </Typography>

                {tags.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant='body2' sx={{ mb: 1 }}>
                      <strong>Tags:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {tags.map(tag => (
                        <Chip key={tag} label={tag} size='small' variant='outlined' />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Typography variant='subtitle2' mb={1}>
              Included Commands:
            </Typography>
            <List dense>
              {commands
                .filter(cmd => selectedCommands.has(cmd.id))
                .map(command => (
                  <ListItem key={command.id}>
                    <ListItemIcon>
                      <CodeIcon fontSize='small' />
                    </ListItemIcon>
                    <ListItemText
                      primary={command.name}
                      secondary={command.description || 'No description'}
                    />
                  </ListItem>
                ))}
            </List>
          </Box>
        );

      default:
        return null;
    }
  };

  // Success state
  if (shareComplete) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant='h5' gutterBottom>
            GitHub Issue Form Opened!
          </Typography>
          <Typography variant='body1' color='text.secondary' paragraph>
            A new browser tab has opened with a pre-filled GitHub Issue form. Review the content and
            submit the issue to share your collection with the community.
          </Typography>
          <Button
            variant='outlined'
            startIcon={<GitHubIcon />}
            href={buildGitHubIssueUrl()}
            target='_blank'
            rel='noopener noreferrer'
            sx={{ mb: 2 }}
          >
            Open GitHub Issue Form
          </Button>
          <Box>
            <Button onClick={handleClose} variant='contained'>
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' },
      }}
    >
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          <ShareIcon />
          Share Command Collection
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation='vertical'>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                {renderStepContent(index)}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  {index > 0 && (
                    <Button onClick={handleBack} variant='outlined'>
                      Back
                    </Button>
                  )}
                  {index < steps.length - 1 ? (
                    <Button onClick={handleNext} variant='contained'>
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleShare}
                      variant='contained'
                      disabled={isSharing || selectedCommands.size === 0}
                      startIcon={isSharing ? <CircularProgress size={20} /> : <SendIcon />}
                    >
                      {isSharing ? 'Opening GitHub...' : 'Open GitHub Issue Form'}
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {errors.length > 0 && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSharing}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareCollectionDialog;
