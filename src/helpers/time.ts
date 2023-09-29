/** Returns date as eg. 5 Oct 2022 08:40 */
export function getFormattedLocalDatetime(date: Date | string) {
  date = new Date(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');

  return `${getFormattedLocalDate(date)} ${hours}:${mins}`;
}

/** Returns date as eg. 5 Oct 2022 */
export function getFormattedLocalDate(date: Date | string, skipDay = false) {
  date = new Date(date);
  const month = date.toLocaleString('default', { month: 'short' });
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();

  return `${skipDay ? '' : `${dayOfMonth} `}${month} ${year}`;
}

/** Returns date as yyyy-MM-dd */
export function getDateFormattedForInput(date: Date | string) {
  date = new Date(date);
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
  // set date to 1 to avoid jumping months accidentaly
  newDate2.setDate(1);

  // set next month
  newDate2.setMonth(newDate2.getMonth() + 1);

  // set previous day
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
  newDate.setMonth(newLocalMonth);
  newDate.setFullYear(newLocalYear);

  return getFirstDayOfMonthDate(newDate);
}

export function getNextMonthFirstDayDate(date: Date) {
  const localMonth = date.getMonth();
  const localYear = date.getFullYear();

  const newDate = new Date();
  const newLocalMonth = localMonth === 11 ? 0 : localMonth + 1;
  const newLocalYear = localMonth === 11 ? localYear + 1 : localYear;
  newDate.setMonth(newLocalMonth);
  newDate.setFullYear(newLocalYear);

  return getFirstDayOfMonthDate(newDate);
}

export function getMonthDifference(date1: Date | string, date2: Date | string) {
  date1 = new Date(date1);
  date2 = new Date(date2);

  let months = (date1.getFullYear() - date2.getFullYear()) * 12;
  months = months + date1.getMonth() - date2.getMonth() + 1;
  return months <= 0 ? 0 : months;
}
