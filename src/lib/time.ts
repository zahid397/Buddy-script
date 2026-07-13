export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  const intervals: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];

  let unitValue = seconds;
  let unitName = 'second';
  for (const [size, name] of intervals) {
    if (unitValue < size) {
      unitName = name;
      break;
    }
    unitValue = Math.floor(unitValue / size);
    unitName = name;
  }

  if (unitName === 'second' && unitValue < 5) return 'just now';
  return `${unitValue} ${unitName}${unitValue === 1 ? '' : 's'} ago`;
}
