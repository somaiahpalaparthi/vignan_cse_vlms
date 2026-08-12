// Utility for date-based filtering: All, Today, Monthly, Quarterly, Yearly, Custom Date Range

export const DATE_FILTER_OPTIONS = [
  { value: 'All', label: '📅 All Time' },
  { value: 'Today', label: '📆 Today' },
  { value: 'Monthly', label: '🗓️ This Month (Monthly)' },
  { value: 'Quarterly', label: '📊 This Quarter (Quarterly)' },
  { value: 'Yearly', label: '📈 This Year (Yearly)' },
  { value: 'Custom', label: '⚙️ Custom Date Range' }
];

export const parseItemDate = (dateStr) => {
  if (!dateStr) return null;
  const str = String(dateStr).trim();
  if (!str) return null;

  // Handle DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(str)) {
    const parts = str.split(/[-/]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  // Handle YYYY-MM-DD or ISO string
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export const matchesDateFilter = (dateVal, filterType = 'All', customStart = '', customEnd = '') => {
  if (!filterType || filterType === 'All') return true;
  if (!dateVal) return true; // Keep items without recorded dates visible unless explicit date match exists

  const itemDate = parseItemDate(dateVal);
  if (!itemDate) return true;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  const itemYear = itemDate.getFullYear();
  const itemMonth = itemDate.getMonth();
  const itemDay = itemDate.getDate();

  if (filterType === 'Today') {
    return (
      itemYear === currentYear &&
      itemMonth === currentMonth &&
      itemDay === now.getDate()
    );
  }

  if (filterType === 'Monthly') {
    return itemYear === currentYear && itemMonth === currentMonth;
  }

  if (filterType === 'Quarterly') {
    const currentQuarter = Math.floor(currentMonth / 3);
    const itemQuarter = Math.floor(itemMonth / 3);
    return itemYear === currentYear && itemQuarter === currentQuarter;
  }

  if (filterType === 'Yearly') {
    return itemYear === currentYear;
  }

  if (filterType === 'Custom') {
    let valid = true;
    if (customStart) {
      const startDate = parseItemDate(customStart);
      if (startDate) {
        startDate.setHours(0, 0, 0, 0);
        valid = valid && itemDate >= startDate;
      }
    }
    if (customEnd) {
      const endDate = parseItemDate(customEnd);
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
        valid = valid && itemDate <= endDate;
      }
    }
    return valid;
  }

  return true;
};
