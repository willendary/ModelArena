import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SERVICE_SCHEDULE_PATH, SERVICE_SCHEDULE_WIRE_VERSION } from '@openchamber/sdk';
import { createArenaService, normalizeBackendUrl } from '../service/server';

test('normalizeBackendUrl accepts valid http/https URLs and rejects invalid protocols', () => {
  assert.equal(normalizeBackendUrl('http://127.0.0.1:8765/'), 'http://127.0.0.1:8765');
  assert.equal(normalizeBackendUrl('https://arena.local/sub/'), 'https://arena.local/sub');
  assert.equal(normalizeBackendUrl('file:///etc/passwd'), null);
  assert.equal(normalizeBackendUrl('not-a-url'), null);
});

test('OpenChamber guest service enforces bearer auth, proxies backend API, persists config, and handles /schedule', async () => {
  const ticks: string[] = [];
  const upstream = createServer((req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', nvidia_configured: true }));
      return;
    }
    if (req.method === 'POST' && req.url === '/api/schedule/tick') {
      ticks.push('tick');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ triggered: true }));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ detail: 'not found' }));
  });

  await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const upAddr = upstream.address();
  assert(upAddr && typeof upAddr === 'object');
  const upstreamUrl = `http://127.0.0.1:${upAddr.port}`;

  const dataDir = mkdtempSync(join(tmpdir(), 'modelarena-svc-'));
  const runtimeFile = join(dataDir, 'runtime.json');
  const token = 'test-secret-token';
  const service = createArenaService({
    port: 0,
    token,
    dataDir,
    defaultBackendUrl: 'http://127.0.0.1:1', // initially offline
    runtimeFilePath: runtimeFile,
  });

  await service.start();
  try {
    // 1. Unauthorized must return 401
    const unauth = await fetch(`${service.url}/health`);
    assert.equal(unauth.status, 401);

    // 2. Authorized /health returns 200
    const authHeaders = { Authorization: `Bearer ${token}` };
    const health = await fetch(`${service.url}/health`, { headers: authHeaders });
    assert.equal(health.status, 200);

    // 3. Offline backend returns structured 502 BACKEND_OFFLINE
    const offline = await fetch(`${service.url}/arena/health`, { headers: authHeaders });
    assert.equal(offline.status, 502);
    const offlineBody = (await offline.json()) as { code: string };
    assert.equal(offlineBody.code, 'BACKEND_OFFLINE');

    // 4. Update backend URL via PUT /config
    const putCfg = await fetch(`${service.url}/config`, {
      method: 'PUT',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ backendUrl: upstreamUrl }),
    });
    assert.equal(putCfg.status, 200);

    // 5. Proxy works after pointing to mock backend
    const proxied = await fetch(`${service.url}/arena/health`, { headers: authHeaders });
    assert.equal(proxied.status, 200);
    const proxiedJson = (await proxied.json()) as { status: string; nvidia_configured: boolean };
    assert.equal(proxiedJson.status, 'ok');
    assert.equal(proxiedJson.nvidia_configured, true);

    // 6. OpenChamber cron schedule tick calls backend /api/schedule/tick
    const schedRes = await fetch(`${service.url}${SERVICE_SCHEDULE_PATH}`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        v: SERVICE_SCHEDULE_WIRE_VERSION,
        requestId: 'req-1',
        id: 'arena-tick',
        at: Date.now(),
      }),
    });
    assert.equal(schedRes.status, 200);
    assert.equal(ticks.length, 1);

    // 7. Invalid schedule payload returns 400
    const badSched = await fetch(`${service.url}${SERVICE_SCHEDULE_PATH}`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ wrong: true }),
    });
    assert.equal(badSched.status, 400);
  } finally {
    await service.stop();
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test('compiled service/main.js boots cleanly under Node ESM runtime', async () => {
  const port = 19780 + Math.floor(Math.random() * 200);
  const token = 'spawn-smoke-token';
  const dataDir = mkdtempSync(join(tmpdir(), 'modelarena-spawn-'));
  const child = spawn(process.execPath, [resolve('service/main.js')], {
    env: {
      ...process.env,
      OPENCHAMBER_SERVICE_PORT: String(port),
      OPENCHAMBER_SERVICE_TOKEN: token,
      OPENCHAMBER_SERVICE_DATA_DIR: dataDir,
    },
    stdio: 'ignore',
  });

  try {
    let ok = false;
    for (let i = 0; i < 30; i += 1) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          ok = true;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    assert.equal(ok, true, 'Compiled service/main.js failed to respond on /health');
  } finally {
    child.kill();
    rmSync(dataDir, { recursive: true, force: true });
  }
});

test('service auto-discovers fallback backend port from runtime.json', async () => {
  const upstream = createServer((req, res) => {
    if (req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', active_provider_mode: 'opencode' }));
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise<void>((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const upAddr = upstream.address();
  assert(upAddr && typeof upAddr === 'object');
  const upstreamUrl = `http://127.0.0.1:${upAddr.port}`;

  const dir = mkdtempSync(join(tmpdir(), 'modelarena-rt-'));
  const runtimeFile = join(dir, 'runtime.json');
  writeFileSync(runtimeFile, JSON.stringify({ url: upstreamUrl, port: upAddr.port }), 'utf8');

  const token = 'rt-token';
  const svc = createArenaService({
    port: 0,
    token,
    dataDir: dir,
    defaultBackendUrl: 'http://127.0.0.1:1',
    runtimeFilePath: runtimeFile,
  });
  await svc.start();
  try {
    const res = await fetch(`${svc.url}/arena/health`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string; active_provider_mode: string };
    assert.equal(body.active_provider_mode, 'opencode');
  } finally {
    await svc.stop();
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  }
});
