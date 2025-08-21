// src/tools.js
import { LikeMindsClient } from './client.js';
import { formatResponse, formatFlutterResponse } from './formatters.js';
import { z } from 'zod';

/** Register tools on the MCP server */
export function setupTools(server) {
  const client = new LikeMindsClient();
  const tools = new Map();

  // likeminds_query
  const likemindsQueryHandler = async ({ query, context }) => {
    try {
      console.info(`[tools] likeminds_query: "${String(query).slice(0, 80)}"`);
      const resp = await client.queryAiAgent(query, context);
      const formatted = formatResponse(resp);
      return { content: [{ type: 'text', text: formatted }] };
    } catch (e) {
      const msg = `Error querying LikeMinds AI Agent: ${e.message}`;
      console.error('[tools] likeminds_query error:', e);
      return { content: [{ type: 'text', text: msg }] };
    }
  };

  tools.set('likeminds_query', {
    description: 'Query LikeMinds AI Agent for chat SDK integration help',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Your question about LikeMinds chat SDK integration'
        },
        context: {
          type: 'string',
          description: 'Additional context (platform, specific issue, etc.)'
        }
      },
      required: ['query']
    },
    handler: likemindsQueryHandler
  });

  server.registerTool(
    'likeminds_query',
    {
      title: 'LikeMinds Query',
      description: 'Query LikeMinds AI Agent for chat SDK integration help',
      inputSchema: z.object({
        query: z.string().describe('Your question about LikeMinds chat SDK integration'),
        context: z.string().optional().describe('Additional context (platform, specific issue, etc.)')
      })
    },
    likemindsQueryHandler
  );

  // flutter_chat_integration
  const flutterChatHandler = async ({ user_query }) => {
    try {
      console.info(`[tools] flutter_chat_integration: "${String(user_query).slice(0, 80)}"`);
      const resp = await client.generateFlutterCode(user_query);
      const formatted = formatFlutterResponse(resp);
      return { content: [{ type: 'text', text: formatted }] };
    } catch (e) {
      const msg = `Error generating Flutter chat integration code: ${e.message}`;
      console.error('[tools] flutter_chat_integration error:', e);
      return { content: [{ type: 'text', text: msg }] };
    }
  };

  tools.set('flutter_chat_integration', {
    description: 'Generate Flutter code for integrating LikeMinds chat SDK',
    inputSchema: {
      type: 'object',
      properties: {
        user_query: {
          type: 'string',
          description: 'Request for Flutter chat SDK integration'
        }
      },
      required: ['user_query']
    },
    handler: flutterChatHandler
  });

  server.registerTool(
    'flutter_chat_integration',
    {
      title: 'Flutter Chat Integration',
      description: 'Generate Flutter code for integrating LikeMinds chat SDK',
      inputSchema: z.object({
        user_query: z.string().describe('Request for Flutter chat SDK integration')
      })
    },
    flutterChatHandler
  );

  // add
  const addHandler = async ({ a, b }) => {
    try {
      const result = Number(a) + Number(b);
      const text = `The sum of ${a} and ${b} is ${result}`;
      console.info('[tools] add:', text);
      return { content: [{ type: 'text', text }] };
    } catch (e) {
      const msg = `Error adding numbers: ${e.message}`;
      console.error('[tools] add error:', e);
      return { content: [{ type: 'text', text: msg }] };
    }
  };

  tools.set('add', {
    description: 'Add two numbers together',
    inputSchema: {
      type: 'object',
      properties: {
        a: {
          type: 'number',
          description: 'First number'
        },
        b: {
          type: 'number',
          description: 'Second number'
        }
      },
      required: ['a', 'b']
    },
    handler: addHandler
  });

  server.registerTool(
    'add',
    {
      title: 'Add',
      description: 'Add two numbers together',
      inputSchema: z.object({
        a: z.number().describe('First number'),
        b: z.number().describe('Second number')
      })
    },
    addHandler
  );

  return tools;
}
