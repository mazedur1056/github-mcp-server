#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';

// GitHub MCP Server
class GitHubMCPServer {
  private server: Server;
  private octokit: Octokit;

  constructor() {
    this.server = new Server(
      {
        name: 'github-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize Octokit with GitHub token
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_repositories',
            description: 'List repositories for the authenticated user',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['all', 'owner', 'member'],
                  default: 'owner',
                  description: 'Type of repositories to list',
                },
                sort: {
                  type: 'string',
                  enum: ['created', 'updated', 'pushed', 'full_name'],
                  default: 'updated',
                  description: 'Sort repositories by',
                },
                per_page: {
                  type: 'number',
                  default: 30,
                  maximum: 100,
                  description: 'Number of repositories to return',
                },
              },
            },
          },
          {
            name: 'get_repository',
            description: 'Get details about a specific repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
              },
              required: ['owner', 'repo'],
            },
          },
          {
            name: 'list_issues',
            description: 'List issues for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  default: 'open',
                  description: 'Issue state',
                },
                labels: {
                  type: 'string',
                  description: 'Comma-separated list of labels',
                },
                per_page: {
                  type: 'number',
                  default: 30,
                  maximum: 100,
                  description: 'Number of issues to return',
                },
              },
              required: ['owner', 'repo'],
            },
          },
          {
            name: 'create_issue',
            description: 'Create a new issue in a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
                title: {
                  type: 'string',
                  description: 'Issue title',
                },
                body: {
                  type: 'string',
                  description: 'Issue body',
                },
                labels: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Issue labels',
                },
                assignees: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Issue assignees',
                },
              },
              required: ['owner', 'repo', 'title'],
            },
          },
          {
            name: 'list_pull_requests',
            description: 'List pull requests for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
                state: {
                  type: 'string',
                  enum: ['open', 'closed', 'all'],
                  default: 'open',
                  description: 'Pull request state',
                },
                per_page: {
                  type: 'number',
                  default: 30,
                  maximum: 100,
                  description: 'Number of pull requests to return',
                },
              },
              required: ['owner', 'repo'],
            },
          },
          {
            name: 'get_file_content',
            description: 'Get content of a file from a repository',
            inputSchema: {
              type: 'object',
              properties: {
                owner: {
                  type: 'string',
                  description: 'Repository owner',
                },
                repo: {
                  type: 'string',
                  description: 'Repository name',
                },
                path: {
                  type: 'string',
                  description: 'File path',
                },
                ref: {
                  type: 'string',
                  description: 'Git reference (branch, tag, commit SHA)',
                  default: 'main',
                },
              },
              required: ['owner', 'repo', 'path'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_repositories':
            return await this.listRepositories(args);
          case 'get_repository':
            return await this.getRepository(args);
          case 'list_issues':
            return await this.listIssues(args);
          case 'create_issue':
            return await this.createIssue(args);
          case 'list_pull_requests':
            return await this.listPullRequests(args);
          case 'get_file_content':
            return await this.getFileContent(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error}`
        );
      }
    });
  }

  private async listRepositories(args: any) {
    const { type = 'owner', sort = 'updated', per_page = 30 } = args;
    
    const response = await this.octokit.rest.repos.listForAuthenticatedUser({
      type,
      sort,
      per_page,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getRepository(args: any) {
    const { owner, repo } = args;
    
    const response = await this.octokit.rest.repos.get({
      owner,
      repo,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async listIssues(args: any) {
    const { owner, repo, state = 'open', labels, per_page = 30 } = args;
    
    const response = await this.octokit.rest.issues.listForRepo({
      owner,
      repo,
      state,
      labels,
      per_page,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async createIssue(args: any) {
    const { owner, repo, title, body, labels, assignees } = args;
    
    const response = await this.octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels,
      assignees,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async listPullRequests(args: any) {
    const { owner, repo, state = 'open', per_page = 30 } = args;
    
    const response = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state,
      per_page,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  private async getFileContent(args: any) {
    const { owner, repo, path, ref = 'main' } = args;
    
    const response = await this.octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('GitHub MCP server running on stdio');
  }
}

const server = new GitHubMCPServer();
server.run().catch(console.error);