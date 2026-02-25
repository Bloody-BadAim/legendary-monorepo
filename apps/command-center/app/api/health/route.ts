import { NextResponse } from 'next/server';
import net from 'net';

export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 3000;

const HEALTH_CHECKS: {
  id: string;
  url: string;
  label: string;
  type: 'http' | 'tcp';
}[] = [
  {
    id: 'matmat-web',
    url: 'https://matmat.me',
    label: 'matmat.me',
    type: 'http',
  },
  {
    id: 'n8n-local',
    url: 'http://localhost:5678',
    label: 'n8n Local',
    type: 'http',
  },
  {
    id: 'n8n-remote',
    url: 'https://n8n.matmat.me',
    label: 'n8n Remote',
    type: 'http',
  },
  {
    id: 'litellm',
    url: process.env.LITELLM_BASE_URL || 'http://localhost:4000',
    label: 'LiteLLM',
    type: 'http',
  },
  {
    id: 'ollama',
    url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    label: 'Ollama',
    type: 'http',
  },
  { id: 'postgres', url: 'localhost:5432', label: 'PostgreSQL', type: 'tcp' },
  {
    id: 'command-center',
    url: 'http://localhost:3000',
    label: 'Command Center',
    type: 'http',
  },
];

async function checkHttp(
  url: string
): Promise<{ status: 'online' | 'offline'; latency: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return { status: 'online', latency: Date.now() - start };
  } catch {
    clearTimeout(timeout);
    return { status: 'offline', latency: -1 };
  }
}

function checkTcp(
  hostPort: string
): Promise<{ status: 'online' | 'offline'; latency: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const [host, portStr] = hostPort.split(':');
    const port = parseInt(portStr ?? '5432', 10);
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ status: 'offline', latency: -1 });
    }, TIMEOUT_MS);
    socket.once('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ status: 'online', latency: Date.now() - start });
    });
    socket.once('error', () => {
      clearTimeout(timeout);
      resolve({ status: 'offline', latency: -1 });
    });
    socket.connect(port, host ?? 'localhost');
  });
}

export async function GET() {
  const results = await Promise.all(
    HEALTH_CHECKS.map(async (check) => {
      const result =
        check.type === 'tcp'
          ? await checkTcp(check.url)
          : await checkHttp(check.url);
      return {
        id: check.id,
        status: result.status,
        latency: result.latency,
      };
    })
  );

  return NextResponse.json({ results });
}
