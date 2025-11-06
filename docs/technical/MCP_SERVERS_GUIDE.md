# MCP Servers Guide

This guide provides information about the Model Context Protocol (MCP) servers configured in your environment and how to use them effectively.

## What is MCP?

The Model Context Protocol (MCP) is a standard for AI model interactions that allows tools like Cursor, Claude Desktop, and other AI coding assistants to access external tools and data sources. MCP servers provide specific capabilities to these AI assistants.

## Configured MCP Servers

### 1. Context7

**Purpose**: Provides up-to-date documentation and code examples for libraries and frameworks.

**Usage**: Add `use context7` to your prompts.

**Example**: 
```
Create a basic Next.js project with app router. use context7
```

### 2. Sequential Thinking

**Purpose**: Enables AI to break down complex problems into sequential steps, improving reasoning.

**Usage**: Add `use sequential thinking` to your prompts.

**Example**:
```
Solve this complex algorithm problem step by step. use sequential thinking
```

### 3. Filesystem

**Purpose**: Provides secure file operations with configurable access controls.

**Usage**: Add `use filesystem` to your prompts.

**Example**:
```
Help me organize my project files. use filesystem
```

### 4. Fetch

**Purpose**: Web content fetching and conversion for efficient LLM usage.

**Usage**: Add `use fetch` to your prompts.

**Example**:
```
Summarize the content from this website: https://example.com. use fetch
```

### 5. Brave Search

**Purpose**: Web and local search using Brave's Search API.

**Usage**: Add `use brave-search` to your prompts.

**Example**:
```
Find information about React hooks. use brave-search
```

### 6. Memory

**Purpose**: Knowledge graph-based persistent memory system.

**Usage**: Add `use memory` to your prompts.

**Example**:
```
Remember that my project uses TypeScript and Next.js. use memory
```

### 7. Git

**Purpose**: Tools to read, search, and manipulate Git repositories.

**Usage**: Add `use git` to your prompts.

**Example**:
```
Show me the recent commits in this repository. use git
```

### 8. Vibe Check

**Purpose**: Prevents cascading errors by calling a "Vibe-check" agent to ensure alignment and prevent scope creep.

**Usage**: Add `use vibe-check` to your prompts.

**Example**:
```
Refactor this complex component. use vibe-check
```

### 9. User Prompt

**Purpose**: Enables requesting user input during generation process.

**Usage**: Add `use user-prompt` to your prompts.

**Example**:
```
Create a component based on user specifications. use user-prompt
```

### 10. Backup

**Purpose**: Adds smart backup ability to coding agents.

**Usage**: Add `use backup` to your prompts.

**Example**:
```
Make changes to this file but create a backup first. use backup
```

### 11. Tavily

**Purpose**: Search engine for AI agents (search + extract) powered by Tavily.

**Usage**: Add `use tavily` to your prompts.

**Example**:
```
Research the latest trends in web development. use tavily
```

## Combining MCP Servers

You can use multiple MCP servers in a single prompt by adding multiple `use` statements.

**Example**:
```
Create a React component that fetches data from an API. use context7 use sequential-thinking
```

## Troubleshooting

If you encounter issues with any MCP server:

1. Run the `test_mcp_servers.sh` script to check which servers are working
2. Try reinstalling the problematic server: `npm install -g @package/name@latest`
3. Check for specific configuration requirements on [mcpservers.org](https://mcpservers.org/)

## Additional Resources

- [MCP Servers Directory](https://mcpservers.org/)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Context7 Documentation](https://github.com/upstash/context7)
