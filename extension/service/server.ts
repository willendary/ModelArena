import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SERVICE_SCHEDULE_PATH,
  readServiceScheduleRequest,
} from '@openchamber/sdk';

const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8765';
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const DEFAULT_PROXY_TIMEOUT_MS = 18_000;
const SCHEDULE_TICK_TIMEOUT_MS = 7_500;

export interface ArenaServiceOptions {
  port: number;
  token: string;
  dataDir?: string;
  defaultBackendUrl?: string;
}

export interface ArenaServiceHandle {
  readonly url: string;
  start(): Promise<void>;
  stop(): Promise<void>;
}

interface StoredConfig {
  backendUrl: string;
}

export function normalizeBackendUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

function loadConfig(dataDir: string | undefined, fallbackUrl: string): StoredConfig {
  if (!dataDir) return { backendUrl: fallbackUrl };
  try {
    const filePath = join(dataDir, 'config.json');
    const raw = JSON.parse(readFileSync(filePath, 'utf8')) as Partial<StoredConfig>;
    const normalized = raw.backendUrl ? normalizeBackendUrl(raw.backendUrl) : null;
    if (normalized) return { backendUrl: normalized };
  } catch {
    // Config file not initialized yet
  }
  return { backendUrl: fallbackUrl };
}

function saveConfig(dataDir: string | undefined, cfg: StoredConfig): void {
  if (!dataDir) return;
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'config.json'), JSON.stringify(cfg, null, 2), 'utf8');
}

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX_BODY_BYTES) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function createArenaService(options: ArenaServiceOptions): ArenaServiceHandle {
  let server: Server | undefined;
  let boundPort = options.port;
  const fallback = normalizeBackendUrl(options.defaultBackendUrl || DEFAULT_BACKEND_URL) || DEFAULT_BACKEND_URL;
  let config = loadConfig(options.dataDir, fallback);

  async function proxyToBackend(
    method: string,
    apiPath: string,
    query: string,
    body: string | undefined,
    timeoutMs: number,
  ): Promise<{ status: number; contentType: string; body: string }> {
    const targetUrl = `${config.backendUrl}${apiPath}${query ? `?${query}` : ''}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(targetUrl, {
        method,
        headers: body
          ? { 'Content-Type': 'application/json', Accept: 'application/json, text/markdown' }
          : { Accept: 'application/json, text/markdown' },
        body: method === 'GET' || method === 'HEAD' ? undefined : body,
        signal: controller.signal,
      });
      const text = await res.text();
      return {
        status: res.status,
        contentType: res.headers.get('content-type') || 'application/json; charset=utf-8',
        body: text,
      };
    } catch (err) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      if (aborted) {
        return {
          status: 504,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({
            code: 'UPSTREAM_TIMEOUT',
            detail: `Timeout ao comunicar com o backend ModelArena em ${config.backendUrl}.`,
          }),
        };
      }
      return {
        status: 502,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 'BACKEND_OFFLINE',
          backendUrl: config.backendUrl,
          detail: `Backend ModelArena não está acessível em ${config.backendUrl}. Inicie o serviço local para executar benchmarks.`,
        }),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    get url() {
      return `http://127.0.0.1:${boundPort}`;
    },
    async start() {
      if (server) return;
      server = createServer(async (req, res) => {
        if (req.headers.authorization !== `Bearer ${options.token}`) {
          writeJson(res, 401, { code: 'UNAUTHORIZED', message: 'Unauthorized' });
          return;
        }

        const method = (req.method || 'GET').toUpperCase();
        const rawUrl = req.url || '/';
        const [pathname, query = ''] = rawUrl.split('?', 2);

        if (method === 'GET' && pathname === '/health') {
          writeJson(res, 200, { status: 'ok', backendUrl: config.backendUrl });
          return;
        }

        if (pathname === '/config') {
          if (method === 'GET') {
            writeJson(res, 200, config);
            return;
          }
          if (method === 'PUT') {
            try {
              const rawBody = await readBody(req);
              const parsed = JSON.parse(rawBody || '{}') as { backendUrl?: string };
              const normalized = typeof parsed.backendUrl === 'string' ? normalizeBackendUrl(parsed.backendUrl) : null;
              if (!normalized) {
                writeJson(res, 400, {
                  code: 'INVALID_URL',
                  detail: 'Informe uma URL HTTP/HTTPS válida (ex: http://127.0.0.1:8765).',
                });
                return;
              }
              config = { backendUrl: normalized };
              saveConfig(options.dataDir, config);
              writeJson(res, 200, config);
            } catch (err) {
              writeJson(res, err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, {
                code: 'BAD_REQUEST',
                detail: 'Payload JSON inválido.',
              });
            }
            return;
          }
        }

        if (method === 'POST' && pathname === SERVICE_SCHEDULE_PATH) {
          try {
            const rawBody = await readBody(req);
            const scheduleReq = readServiceScheduleRequest(rawBody);
            if (!scheduleReq) {
              writeJson(res, 400, { code: 'INVALID_SCHEDULE_REQUEST', detail: 'Invalid schedule payload' });
              return;
            }
            const upstream = await proxyToBackend('POST', '/api/schedule/tick', '', undefined, SCHEDULE_TICK_TIMEOUT_MS);
            writeJson(res, 200, {
              ok: true,
              scheduleId: scheduleReq.id,
              upstreamStatus: upstream.status,
            });
          } catch {
            writeJson(res, 400, { code: 'INVALID_SCHEDULE_REQUEST', detail: 'Invalid schedule payload' });
          }
          return;
        }

        if (pathname.startsWith('/arena/')) {
          const apiPath = `/api/${pathname.slice('/arena/'.length)}`;
          try {
            const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);
            const upstream = await proxyToBackend(method, apiPath, query, body || undefined, DEFAULT_PROXY_TIMEOUT_MS);
            res.writeHead(upstream.status, { 'Content-Type': upstream.contentType });
            res.end(upstream.body);
          } catch (err) {
            const tooLarge = err instanceof Error && err.message === 'PAYLOAD_TOO_LARGE';
            writeJson(res, tooLarge ? 413 : 500, {
              code: tooLarge ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR',
              detail: tooLarge ? 'Corpo da requisição excede 2 MiB.' : 'Erro interno no serviço local.',
            });
          }
          return;
        }

        writeJson(res, 404, { code: 'NOT_FOUND', detail: `Rota não encontrada: ${pathname}` });
      });

      await new Promise<void>((resolve, reject) => {
        server?.once('error', reject);
        server?.listen(options.port, '127.0.0.1', () => {
          const addr = server?.address();
          if (addr && typeof addr === 'object') {
            boundPort = addr.port;
          }
          resolve();
        });
      });
    },
    async stop() {
      if (!server) return;
      const closing = server;
      server = undefined;
      await new Promise<void>((resolve, reject) => {
        closing.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}
