import { OPENCHAMBER_SERVICE_DATA_DIR } from '@openchamber/sdk';
import { createArenaService } from './server';

const rawPort = process.env.OPENCHAMBER_SERVICE_PORT;
const token = process.env.OPENCHAMBER_SERVICE_TOKEN;
const dataDir = process.env[OPENCHAMBER_SERVICE_DATA_DIR] || process.env.OPENCHAMBER_SERVICE_DATA_DIR;
const port = Number(rawPort);

if (!rawPort || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('OPENCHAMBER_SERVICE_PORT must be a valid TCP port');
}
if (!token) {
  throw new Error('OPENCHAMBER_SERVICE_TOKEN is required');
}

const service = createArenaService({ port, token, dataDir });
service.start().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : 'Failed to start Model Arena service');
  process.exitCode = 1;
});
