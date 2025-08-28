/**
 * GitHub API Service for Level Up Extension
 * Handles sharing commands to the community repository via GitHub Issues
 */

interface GitHubConfig {
  owner: string;
  repo: string;
}

interface ShareCommandData {
  commandName: string;
  description: string;
  category: string;
  author: string;
  tags: string[];
  dynamicsVersion: string;
  testingNotes: string;
  additionalContext: string;
  makePublic: boolean;
}

interface ShareCollectionData {
  collectionName: string;
  description: string;
  category: string;
  author: string;
  tags: string[];
  dynamicsVersion: string;
  setupInstructions: string;
  commandCount: number;
  commandsJson: string;
  workflowDiagram?: string;
  contactInfo?: string;
}

export type { ShareCommandData, ShareCollectionData };

interface GitHubIssueResponse {
  success: boolean;
  url?: string;
  error?: string;
  issueNumber?: number;
}

export class GitHubApiService {
  private static instance: GitHubApiService;
  private config: GitHubConfig;

  private constructor() {
    // Default configuration - points to the Level Up community repository
    this.config = {
      owner: 'rajyraman', // GitHub username
      repo: 'level-up-community-commands', // Community commands repository
    };
  }

  public static getInstance(): GitHubApiService {
    if (!GitHubApiService.instance) {
      GitHubApiService.instance = new GitHubApiService();
    }
    return GitHubApiService.instance;
  }

  /**
   * Configure GitHub repository settings
   */
  public configure(config: Partial<GitHubConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Share a single command by opening a pre-filled GitHub Issue form
   */
  public async shareCommand(
    commandData: ShareCommandData,
    commandCode: string
  ): Promise<GitHubIssueResponse> {
    try {
      const issueUrl = this.generateCommandIssueUrl(commandData, commandCode);

      // Open the GitHub issue form in a new tab
      window.open(issueUrl, '_blank');

      return {
        success: true,
        url: issueUrl,
      };
    } catch (error) {
      console.error('Failed to generate issue URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate issue URL',
      };
    }
  }

  /**
   * Share a command collection by opening a pre-filled GitHub Issue form
   */
  public async shareCollection(collectionData: ShareCollectionData): Promise<GitHubIssueResponse> {
    try {
      const issueUrl = this.generateCollectionIssueUrl(collectionData);

      // Open the GitHub issue form in a new tab
      window.open(issueUrl, '_blank');

      return {
        success: true,
        url: issueUrl,
      };
    } catch (error) {
      console.error('Failed to generate collection issue URL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate collection issue URL',
      };
    }
  }

  /**
   * Generate a GitHub Issue URL for sharing a single command using the command template
   */
  private generateCommandIssueUrl(commandData: ShareCommandData, commandCode: string): string {
    const baseUrl = `https://github.com/${this.config.owner}/${this.config.repo}/issues/new`;

    // Use the Share Custom Command template
    const params = new URLSearchParams({
      template: 'share-custom-command.yml',
      'command-name': commandData.commandName,
      description: commandData.description,
      category: commandData.category,
      tags: commandData.tags.join(', '),
      'javascript-code': commandCode,
      'dynamics-version': commandData.dynamicsVersion,
      'usage-instructions': commandData.testingNotes,
      'author-attribution': commandData.author,
    });

    // Add additional context if provided
    if (commandData.additionalContext) {
      const existingInstructions = params.get('usage-instructions') || '';
      const combinedInstructions =
        existingInstructions +
        (existingInstructions ? '\n\n**Additional Context:**\n' : '') +
        commandData.additionalContext;
      params.set('usage-instructions', combinedInstructions);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate a GitHub Issue URL for sharing a command collection using the collection template
   */
  private generateCollectionIssueUrl(collectionData: ShareCollectionData): string {
    const baseUrl = `https://github.com/${this.config.owner}/${this.config.repo}/issues/new`;

    // Use the Share Command Collection template
    const params = new URLSearchParams({
      template: 'share-command-collection.yml',
      'collection-name': collectionData.collectionName,
      description: collectionData.description,
      category: collectionData.category,
      tags: collectionData.tags.join(', '),
      'commands-json': collectionData.commandsJson,
      'setup-instructions': collectionData.setupInstructions,
      'command-count': collectionData.commandCount.toString(),
      'dynamics-version': collectionData.dynamicsVersion,
      'author-attribution': collectionData.author,
    });

    // Add optional fields if provided
    if (collectionData.workflowDiagram) {
      params.set('workflow-diagram', collectionData.workflowDiagram);
    }

    if (collectionData.contactInfo) {
      params.set('contact-info', collectionData.contactInfo);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Create a GitHub Issue using the GitHub API (kept for potential future use)
   */
  private async createGitHubIssue(issueData: any): Promise<Response> {
    const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/issues`;

    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(issueData),
    });
  }

  /**
   * Format the issue body according to the GitHub Issue template
   */
  private formatIssueBody(commandData: ShareCommandData, commandCode: string): string {
    return `### Command Name

${commandData.commandName}

### Description

${commandData.description}

### Category

${commandData.category}

### Command Code

\`\`\`javascript
${commandCode}
\`\`\`

### Author/Contributor

${commandData.author}

### Dynamics 365 Version

${commandData.dynamicsVersion}

### Tags

${commandData.tags.join(', ')}

### Testing Notes

${commandData.testingNotes}

${
  commandData.additionalContext
    ? `### Additional Context

${commandData.additionalContext}`
    : ''
}

---

*This issue was created automatically by the Level Up for Dynamics 365 browser extension.*`;
  }

  /**
   * Generate appropriate labels for the GitHub Issue
   */
  private generateLabels(commandData: ShareCommandData): string[] {
    const labels = ['community-submission', 'new-command'];

    // Add category label
    labels.push(`category:${commandData.category}`);

    // Add version-specific labels
    if (commandData.dynamicsVersion !== 'All versions') {
      labels.push(`version:${commandData.dynamicsVersion.toLowerCase().replace(/\s+/g, '-')}`);
    }

    // Add tag-based labels for common ones
    const commonLabelTags = ['webapi', 'forms', 'views', 'admin', 'debug', 'automation'];
    commandData.tags.forEach(tag => {
      if (commonLabelTags.includes(tag.toLowerCase())) {
        labels.push(`tag:${tag.toLowerCase()}`);
      }
    });

    return labels;
  }

  /**
   * Test GitHub API connectivity
   */
  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`;
      const response = await fetch(url);

      if (response.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          error: `Repository not accessible: ${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get repository information
   */
  public async getRepositoryInfo(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: {
            name: data.name,
            description: data.description,
            stars: data.stargazers_count,
            forks: data.forks_count,
            openIssues: data.open_issues_count,
            url: data.html_url,
          },
        };
      } else {
        return {
          success: false,
          error: `Failed to fetch repository info: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Search for existing commands in the repository
   */
  public async searchCommands(
    query: string
  ): Promise<{ success: boolean; commands?: any[]; error?: string }> {
    try {
      const url = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}+repo:${this.config.owner}/${this.config.repo}+label:new-command`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          commands: data.items.map((issue: any) => ({
            title: issue.title,
            url: issue.html_url,
            state: issue.state,
            labels: issue.labels.map((label: any) => label.name),
            createdAt: issue.created_at,
            author: issue.user.login,
          })),
        };
      } else {
        return {
          success: false,
          error: `Search failed: ${response.status}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search error',
      };
    }
  }

  /**
   * Get the current configuration
   */
  public getConfig(): GitHubConfig {
    return { ...this.config };
  }

  /**
   * Validate repository configuration
   */
  public isConfigured(): boolean {
    return !!(this.config.owner && this.config.repo);
  }

  /**
   * Check if authenticated (no longer needed with URL-based sharing)
   */
  public isAuthenticated(): boolean {
    return true; // Always true since we use URL-based sharing
  }
}

// Export singleton instance
export const githubApiService = GitHubApiService.getInstance();
