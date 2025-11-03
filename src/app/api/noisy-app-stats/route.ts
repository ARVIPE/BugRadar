
import { NextResponse } from 'next/server';

async function fetchFromNoisyApp(path: string) {
  try {
    const response = await fetch(`http://localhost:5000${path}`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function fetchLogs(severity?: 'error' | 'warning') {
  let url = `http://localhost:3000/api/logs?container_name=bugradar-noisy`;
  if (severity) {
    url += `&severity=${severity}`;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    return [];
  }
}

async function getUptime() {
  try {
    const response = await fetch(`http://localhost:3000/api/uptime`);
    if (!response.ok) {
      return 0;
    }
    const data = await response.json();
    return data.uptime || 0;
  } catch (error) {
    return 0;
  }
}

function calculateMTBF(errors: any[]): number {
  if (errors.length < 2) {
    return 0;
  }

  const sortedErrors = errors.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const timeDiffs = [];
  for (let i = 1; i < sortedErrors.length; i++) {
    const diff = new Date(sortedErrors[i].created_at).getTime() - new Date(sortedErrors[i-1].created_at).getTime();
    timeDiffs.push(diff);
  }

  const totalDiff = timeDiffs.reduce((acc, diff) => acc + diff, 0);
  return totalDiff / timeDiffs.length / 1000 / 60; // in minutes
}

function getLogVolume(logs: any[]) {
  const volume = {};
  for (const log of logs) {
    const date = new Date(log.created_at).toLocaleDateString();
    if (!volume[date]) {
      volume[date] = { errors: 0, warnings: 0 };
    }
    if (log.severity === 'error') {
      volume[date].errors++;
    } else if (log.severity === 'warning') {
      volume[date].warnings++;
    }
  }
  return Object.entries(volume).map(([date, counts]) => ({ date, ...counts }));
}

export async function GET() {
  const [uptime, allLogs] = await Promise.all([
    getUptime(),
    fetchLogs(),
  ]);

  const errors = allLogs.filter(log => log.severity === 'error');
  const warnings = allLogs.filter(log => log.severity === 'warning');

  const mtbf = calculateMTBF(errors);
  const errorRate = allLogs.length > 0 ? (errors.length / allLogs.length) * 100 : 0;
  const warningRate = allLogs.length > 0 ? (warnings.length / allLogs.length) * 100 : 0;
  const logVolume = getLogVolume(allLogs);

  const stats = {
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    uptime: uptime,
    mtbf: mtbf.toFixed(2),
    errorRate: errorRate.toFixed(2),
    warningRate: warningRate.toFixed(2),
    logVolume,
  };

  return NextResponse.json(stats);
}
