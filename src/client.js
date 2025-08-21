import { settings } from './config.js';

export class LikeMindsClient {
  constructor() {
    this.baseUrl = settings.likemindsApiUrl;
    this.headers = { 'Content-Type': 'application/json' };
    console.info(`[client] LikeMindsClient base URL: ${this.baseUrl}`);
  }

  async #post(path, payload) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async queryAiAgent(query, context) {
    console.info('[client] → POST /api/ai-query');
    return this.#post('/ai-agent/query', { query, context });
  }

  async generateFlutterCode(user_query) {
    console.info('[client] → POST /api/ai-query');
    return this.#post('/api/ai-query', { user_query });
  }
}
