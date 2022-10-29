export function getLocalFormattedDate(isoString: string) {
  const date = new Date(isoString);

  const month = date.toLocaleString('default', { month: 'short' });
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');

  return `${dayOfMonth} ${month} ${year} ${hours}:${mins}`;
}
