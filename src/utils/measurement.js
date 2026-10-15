export function rmsToRelativeDb(rms, calibration = 0) {
  const safe = Math.max(Number(rms) || 0, 1e-8);
  return Math.max(0, Math.min(120, 20 * Math.log10(safe) + 90 + calibration));
}
export function smooth(previous, current, alpha = 0.18) {
  if (!Number.isFinite(current)) return previous;
  if (!Number.isFinite(previous)) return current;
  return previous + alpha * (current - previous);
}
export function classify(level, warning, threshold) {
  if (!Number.isFinite(level)) return 'unknown';
  if (level >= threshold) return 'excessive';
  if (level >= warning) return 'warning';
  return 'normal';
}
export function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return [h,m,s].map((v,i)=>String(v).padStart(2,'0')).join(':');
}
