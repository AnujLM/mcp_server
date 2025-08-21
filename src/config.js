import 'dotenv/config';

export const settings = {
  serverName: process.env.SERVER_NAME || 'likeminds-mcp-wrapper',
  serverVersion: process.env.SERVER_VERSION || '1.0.0',
  likemindsApiUrl: process.env.LIKEMINDS_API_URL || "http://localhost:8000",
  port: Number(process.env.PORT || '8080')
};
