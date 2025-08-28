import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Link,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  Settings as SettingsIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material';
import { githubApiService } from '#services/GitHubApiService';

interface GitHubIntegrationSettingsProps {
  onToast: (message: string, severity: 'success' | 'info' | 'warning' | 'error') => void;
}

const GitHubIntegrationSettings: React.FC<GitHubIntegrationSettingsProps> = ({ onToast }) => {
  const [config, setConfig] = useState({
    owner: '',
    repo: '',
  });
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    error?: string;
    repoInfo?: any;
  }>({ tested: false, success: false });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      // Load from Chrome storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['github_config']);
        if (result.github_config) {
          const savedConfig = result.github_config;
          setConfig(savedConfig);
          // Update the service configuration
          githubApiService.configure(savedConfig);
        }
      }
    } catch (error) {
      console.error('Failed to load GitHub configuration:', error);
    }
  };

  const saveConfiguration = async () => {
    try {
      // Save to Chrome storage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ github_config: config });
      }

      // Update the service configuration
      githubApiService.configure(config);
      onToast('GitHub configuration saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save GitHub configuration:', error);
      onToast('Failed to save configuration', 'error');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setConnectionStatus({ tested: false, success: false });

    try {
      // Update service config with current form values
      githubApiService.configure(config);

      // Test basic connectivity
      const connectionResult = await githubApiService.testConnection();

      if (connectionResult.success) {
        // Get repository information
        const repoResult = await githubApiService.getRepositoryInfo();

        setConnectionStatus({
          tested: true,
          success: true,
          repoInfo: repoResult.success ? repoResult.data : null,
        });

        onToast('GitHub connection successful!', 'success');
      } else {
        setConnectionStatus({
          tested: true,
          success: false,
          error: connectionResult.error,
        });

        onToast(`Connection failed: ${connectionResult.error}`, 'error');
      }
    } catch (error) {
      setConnectionStatus({
        tested: true,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      onToast('Connection test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleConfigChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    // Reset connection status when config changes
    if (connectionStatus.tested) {
      setConnectionStatus({ tested: false, success: false });
    }
  };

  const isConfigValid = config.owner.trim() && config.repo.trim();

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display='flex' alignItems='center' mb={2}>
          <GitHubIcon sx={{ mr: 1 }} />
          <Typography variant='h6'>GitHub Integration</Typography>
        </Box>

        <Alert severity='info' sx={{ mb: 2 }}>
          <Typography variant='body2'>
            Configure GitHub integration to share your custom commands with the Level Up community.
            Commands are shared by opening a pre-filled GitHub Issue form in your browser - no
            authentication required!
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label='Repository Owner'
            value={config.owner}
            onChange={e => handleConfigChange('owner', e.target.value)}
            placeholder='yourusername'
            helperText='GitHub username or organization name'
            size='small'
            required
          />

          <TextField
            label='Repository Name'
            value={config.repo}
            onChange={e => handleConfigChange('repo', e.target.value)}
            placeholder='level-up-community-commands'
            helperText='Name of the community commands repository'
            size='small'
            required
          />

          <FormControlLabel
            control={
              <Switch checked={showAdvanced} onChange={e => setShowAdvanced(e.target.checked)} />
            }
            label='Show advanced options'
          />

          {showAdvanced && (
            <>
              <Divider />
              <Alert severity='info' sx={{ mt: 1 }}>
                <Typography variant='body2'>
                  <strong>No Authentication Required:</strong> Commands are shared by opening a
                  pre-filled GitHub Issue form in your browser. No Personal Access Tokens or
                  authentication needed!
                </Typography>
              </Alert>
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant='contained'
            onClick={saveConfiguration}
            disabled={!isConfigValid}
            size='small'
          >
            Save Configuration
          </Button>

          <Button
            variant='outlined'
            onClick={testConnection}
            disabled={!isConfigValid || testing}
            startIcon={testing ? <CircularProgress size={16} /> : <RefreshIcon />}
            size='small'
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>

          {connectionStatus.tested && (
            <Chip
              icon={connectionStatus.success ? <CheckIcon /> : <ErrorIcon />}
              label={connectionStatus.success ? 'Connected' : 'Failed'}
              color={connectionStatus.success ? 'success' : 'error'}
              size='small'
            />
          )}
        </Box>

        {connectionStatus.tested && !connectionStatus.success && connectionStatus.error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            <Typography variant='body2'>
              <strong>Connection Error:</strong> {connectionStatus.error}
            </Typography>
          </Alert>
        )}

        {connectionStatus.success && connectionStatus.repoInfo && (
          <Alert severity='success' sx={{ mt: 2 }}>
            <Box>
              <Typography variant='body2' gutterBottom>
                <strong>Repository Information:</strong>
              </Typography>
              <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.875rem' }}
              >
                <Box>Name: {connectionStatus.repoInfo.name}</Box>
                <Box>Description: {connectionStatus.repoInfo.description || 'No description'}</Box>
                <Box>
                  Stars: {connectionStatus.repoInfo.stars} | Forks:{' '}
                  {connectionStatus.repoInfo.forks}
                </Box>
                <Box>Open Issues: {connectionStatus.repoInfo.openIssues}</Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                  <Link
                    href={connectionStatus.repoInfo.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    View Repository
                    <LaunchIcon fontSize='small' />
                  </Link>
                </Box>
              </Box>
            </Box>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <Box>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            <InfoIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
            How it works:
          </Typography>
          <Typography variant='body2' color='text.secondary' component='div'>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Click "Share Command" to open a pre-filled GitHub Issue form in your browser</li>
              <li>
                Review the generated content and submit the issue (GitHub account required for
                submission)
              </li>
              <li>Community members can review, test, and provide feedback on your command</li>
              <li>Approved commands are added to the official collection for everyone to use</li>
            </ul>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GitHubIntegrationSettings;
