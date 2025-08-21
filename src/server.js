// src/server.js
import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { setupTools } from './tools.js';
import { settings } from './config.js';

// --- adjust this if your SDK expects another version ---
const EXPECTED_PROTOCOL_VERSION = '2025-06-18';

async function main() {
  console.info('Server Name:', settings.serverName);
  console.info('Server Version:', settings.serverVersion);
  console.info('LikeMinds API URL:', settings.likemindsApiUrl);

  // One MCP server instance
  const server = new McpServer({
    name: settings.serverName,
    version: settings.serverVersion,
  });

  // Setup tools and store tool registry
  const toolsRegistry = setupTools(server);

  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => res.status(200).send('ok'));

  // Simple request handler that processes MCP messages directly
  app.post('/mcp', async (req, res) => {
    try {
      // Validate request body
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error: Invalid JSON',
          },
          id: null,
        });
      }

      const message = req.body;

      // Handle initialize request
      if (message.method === 'initialize') {
        const { protocolVersion } = message.params || {};

        if (protocolVersion !== EXPECTED_PROTOCOL_VERSION) {
          return res.status(200).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: `Invalid protocolVersion: expected ${EXPECTED_PROTOCOL_VERSION}, got ${protocolVersion}`,
            },
            id: message.id ?? null,
          });
        }

        const sessionId = randomUUID();
        console.info(`Session initialized: ${sessionId}`);

        // Return initialize response
        return res.status(200).json({
          jsonrpc: '2.0',
          result: {
            protocolVersion: EXPECTED_PROTOCOL_VERSION,
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
            },
            serverInfo: {
              name: settings.serverName,
              version: settings.serverVersion,
            },
          },
          id: message.id,
        });
      }

      // Handle tools/list request
      if (message.method === 'tools/list') {
        const tools = Array.from(toolsRegistry.keys()).map(toolName => {
          const tool = toolsRegistry.get(toolName);
          return {
            name: toolName,
            description: tool.description || '',
            inputSchema: tool.inputSchema || {},
          };
        });
        
        return res.status(200).json({
          jsonrpc: '2.0',
          result: {
            tools,
          },
          id: message.id,
        });
      }

      // Handle tools/call request
      if (message.method === 'tools/call') {
        try {
          const { name, arguments: args } = message.params;
          const tool = toolsRegistry.get(name);
          
          if (!tool) {
            return res.status(200).json({
              jsonrpc: '2.0',
              error: {
                code: -32601,
                message: `Tool not found: ${name}`,
              },
              id: message.id,
            });
          }

          const result = await tool.handler(args);
          return res.status(200).json({
            jsonrpc: '2.0',
            result,
            id: message.id,
          });
        } catch (error) {
          return res.status(200).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: error.message || 'Tool execution failed',
            },
            id: message.id,
          });
        }
      }

      // Handle resources/list request
      if (message.method === 'resources/list') {
        return res.status(200).json({
          jsonrpc: '2.0',
          result: {
            resources: [],
          },
          id: message.id,
        });
      }

      // Handle prompts/list request
      if (message.method === 'prompts/list') {
        return res.status(200).json({
          jsonrpc: '2.0',
          result: {
            prompts: [],
          },
          id: message.id,
        });
      }

      // Method not found
      return res.status(200).json({
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: `Method not found: ${message.method}`,
        },
        id: message.id,
      });

    } catch (err) {
      console.error('POST /mcp error:', err);
      return res.status(200).json({
        jsonrpc: '2.0',
        error: { 
          code: -32603, 
          message: 'Internal server error',
          data: err.message 
        },
        id: req.body?.id ?? null,
      });
    }
  });

  app.listen(settings.port, () => {
    console.info(`MCP HTTP server running on http://localhost:${settings.port}`);
    console.info('Endpoints:');
    console.info('  POST /mcp   (JSON-RPC MCP messages)');
    console.info('  GET  /health (health check)');
  });
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
