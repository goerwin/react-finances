/** Returns date as eg. 5 Oct 2022 08:40 */
export function getLocalFormattedDate(isoDateString: string) {
  const date = new Date(isoDateString);

  const month = date.toLocaleString('default', { month: 'short' });
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');

  return `${dayOfMonth} ${month} ${year} ${hours}:${mins}`;
}

/** Returns date as yyyy-MM-ddThh:mm */
export function getLocalFormattedInputDate(isoDateString: string) {
  const date = new Date(isoDateString);

  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}T${hours}:${mins}`;
}

export function getPreviousMonthDate(date: Date) {
  const localMonth = date.getMonth();
  const localYear = date.getFullYear();

  const newDate = new Date();
  const newLocalMonth = localMonth === 0 ? 11 : localMonth - 1;
  const newLocalYear = localMonth === 0 ? localYear - 1 : localYear;

  newDate.setHours(0);
  newDate.setMinutes(0);
  newDate.setSeconds(0);
  newDate.setDate(1);
  newDate.setMonth(newLocalMonth);
  newDate.setFullYear(newLocalYear);

  return newDate;
}

export function getNextMonthDate(date: Date) {
  const localMonth = date.getMonth();
  const localYear = date.getFullYear();

  const newDate = new Date();
  const newLocalMonth = localMonth === 11 ? 0 : localMonth + 1;
  const newLocalYear = localMonth === 11 ? localYear + 1 : localYear;

  newDate.setHours(0);
  newDate.setMinutes(0);
  newDate.setSeconds(0);
  newDate.setDate(1);
  newDate.setMonth(newLocalMonth);
  newDate.setFullYear(newLocalYear);

  return newDate;
}
