import type { NextApiRequest, NextApiResponse } from 'next';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function findSyncLocalesScript(): string | null {
  const roots = [
    process.cwd(),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '..', '..'),
    path.join(process.cwd(), '..', '..', '..'),
  ];
  for (const root of roots) {
    const candidate = path.join(
      root,
      'packages',
      'closer',
      'scripts',
      'syncBuildLocales.cjs',
    );
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

type OkBody = { ok: true };
type ErrBody = { ok: false; error: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkBody | ErrBody>,
) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const scriptPath = findSyncLocalesScript();
  if (!scriptPath) {
    return res
      .status(500)
      .json({ ok: false, error: 'syncBuildLocales.cjs not found' });
  }

  const result = spawnSync(process.execPath, [scriptPath], {
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join('\n');
    return res.status(500).json({
      ok: false,
      error: detail || `sync exited with code ${result.status ?? 'unknown'}`,
    });
  }

  return res.status(200).json({ ok: true });
}
