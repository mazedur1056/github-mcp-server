# GitHub MCP Server

A Model Context Protocol (MCP) server that integrates GitHub functionality with AI assistants like Cursor, enabling seamless interaction with your GitHub repositories, issues, pull requests, and more.

## What is MCP Server?

The Model Context Protocol (MCP) is a standardized way for AI assistants to interact with external tools and services. This GitHub MCP Server acts as a bridge between your AI assistant and the GitHub API, allowing you to:

- **Manage repositories** directly from your AI chat
- **Create and track issues** without leaving your development environment
- **Review pull requests** and get insights on code changes
- **Access file contents** from any repository you have access to
- **Perform GitHub operations** using natural language commands

## Features

This MCP server provides the following tools:

### 🗂️ Repository Management
- **`list_repositories`** - List repositories for the authenticated user
- **`get_repository`** - Get detailed information about a specific repository

### 🐛 Issue Management
- **`list_issues`** - List issues for a repository with filtering options
- **`create_issue`** - Create new issues with title, body, labels, and assignees

### 🔄 Pull Request Management
- **`list_pull_requests`** - List pull requests for a repository with state filtering

### 📄 File Operations
- **`get_file_content`** - Read file contents from any repository branch or commit

### 🔍 Advanced Filtering
- Filter by repository type (owner, member, all)
- Sort repositories by creation date, last update, or name
- Filter issues and PRs by state (open, closed, all)
- Apply label-based filtering for issues

## Installation

### Prerequisites

- Node.js 18 or higher
- A GitHub Personal Access Token
- Cursor IDE or another MCP-compatible AI assistant

### Step 1: Clone and Setup

```bash
# Clone the repository
 git clone https://github.com/mazedur1056/github-mcp-server.git
 cd github-mcp-server

# Install dependencies
npm install
```

### Step 2: GitHub Token Setup

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:user` (Read access to profile info)
   - `read:org` (Read access to organization info)
4. Copy the generated token

### Step 3: Build and Test

```bash
# Build the TypeScript
npm run build

# Set your GitHub token
export GITHUB_TOKEN=your_github_token_here

# Start the server (runs the compiled JavaScript)
npm start
```

**For Linux Only**\
Give execution permission before running
```bash
chmod +x server.ts
```

Or, for development (runs server.ts directly with tsx):

```bash
npm run dev
```

### Step 4: Configure Cursor

Create or edit your MCP configuration file at one of these locations:

**macOS:**
```
~/Library/Application Support/Cursor/User/globalStorage/mcp.json
```

**Linux:**
```
~/.config/Cursor/User/globalStorage/mcp.json
```
or
```
~/.cursor/mcp.config
```

**Windows:**
```
%APPDATA%\Cursor\User\globalStorage\mcp.json
```

Add the following configuration:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/absolute/path/to/your/github-mcp-server/dist/server.ts"],
      "env": {
        "GITHUB_TOKEN": "your_github_personal_access_token"
      }
    }
  }
}
```

**Important:** Replace `/absolute/path/to/your/github-mcp-server/dist/server.js` with the actual absolute path to your built server file (after running `npm run build`).

### Step 5: Restart Cursor

1. Completely quit Cursor
2. Restart Cursor
3. The GitHub MCP server should now be available

## Testing the Installation

Once installed, you can test the integration by asking Cursor:

**You must add your github token to the environment**
```bash
export GITHUB_TOKEN="Your Github Token"
```

```
List my GitHub repositories
```

```
Show me the open issues in my project-name repository
```

```
Get the content of README.md from my repository-name
```

If configured correctly, Cursor will use the MCP server to fetch this information from GitHub.

## Troubleshooting

### "0 tools enabled" error
- Verify the absolute path in your MCP configuration
- Ensure the GitHub token has proper permissions
- Check that all dependencies are installed (`npm install`)
- Restart Cursor completely

### Server not starting
- Verify Node.js version (18+)
- Check that GITHUB_TOKEN environment variable is set
- Run `npm run dev` or `npm start` directly to see error messages

### Permission errors
- Ensure your GitHub token has the required scopes
- Verify you have access to the repositories you're trying to query

---


## License

MIT
