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

/** Returns date as yyyy-MM-dd */
export function getDateFormattedForInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${dayOfMonth}`;
}

/** Returns date as yyyy-MM-ddThh:mm */
export function getDatetimeLocalFormattedForInputDate(date: Date) {
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}T${hours}:${mins}`;
}

export function getFirstDayOfMonthDate(date: Date) {
  const newDate = new Date(date);

  newDate.setHours(0);
  newDate.setMinutes(0);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  newDate.setDate(1);

  return newDate;
}

export function getLastDayOfMonthDate(date: Date) {
  const newDate = new Date(date);
  const newDate2 = new Date(date);

  // get last day of month
  newDate2.setMonth(newDate2.getMonth() + 1);
  newDate2.setDate(0);
  const lastDayOfMonth = newDate2.getDate();

  newDate.setHours(23);
  newDate.setMinutes(59);
  newDate.setSeconds(59);
  newDate.setMilliseconds(999);
  newDate.setDate(lastDayOfMonth);

  return newDate;
}

export function getPreviousMonthFirstDayDate(date: Date) {
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

export function getNextMonthFirstDayDate(date: Date) {
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
