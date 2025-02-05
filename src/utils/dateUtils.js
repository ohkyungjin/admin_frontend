import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// 서버 timezone 설정 (한국 시간)
const SERVER_TIMEZONE = 'Asia/Seoul';

export const formatToISO = (date) => {
  if (!date) return null;
  return dayjs(date).tz(SERVER_TIMEZONE).toISOString();
};

export const formatToLocal = (date) => {
  if (!date) return '-';
  return dayjs(date)
    .tz(SERVER_TIMEZONE)
    .format('YYYY-MM-DD A hh:mm');
};

export const getCurrentDateTime = () => {
  return dayjs().tz(SERVER_TIMEZONE);
};

export const isValidDate = (date) => {
  return dayjs(date).isValid();
};

export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '-';
  const start = dayjs(startDate).tz(SERVER_TIMEZONE);
  const end = dayjs(endDate).tz(SERVER_TIMEZONE);
  return `${start.format('YYYY-MM-DD A hh:mm')} ~ ${end.format('YYYY-MM-DD A hh:mm')}`;
};

export const formatToServerDateTime = (date) => {
  if (!date) return null;
  return dayjs(date).tz(SERVER_TIMEZONE).format('YYYY-MM-DDTHH:mm:ss[Z]');
};

export const parseServerDateTime = (dateString) => {
  if (!dateString) return null;
  return dayjs(dateString).tz(SERVER_TIMEZONE);
};

export const isSameDay = (date1, date2) => {
  return dayjs(date1).tz(SERVER_TIMEZONE).isSame(dayjs(date2).tz(SERVER_TIMEZONE), 'day');
};

export const isAfter = (date1, date2) => {
  return dayjs(date1).tz(SERVER_TIMEZONE).isAfter(dayjs(date2).tz(SERVER_TIMEZONE));
}; 