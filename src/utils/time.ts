export function formatTimecode(seconds: number, showMs: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);

  const formattedMins = mins.toString().padStart(2, '0');
  const formattedSecs = secs.toString().padStart(2, '0');
  const formattedMs = ms.toString().padStart(2, '0');

  if (showMs) {
    return `${formattedMins}:${formattedSecs}.${formattedMs}`;
  }
  return `${formattedMins}:${formattedSecs}`;
}

export function parseTimecode(str: string): number {
  const parts = str.split(':');
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  return parseFloat(str) || 0;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
