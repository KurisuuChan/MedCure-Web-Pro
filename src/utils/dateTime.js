// Date and time utilities

/**
 * Format date for display
 */
export function formatDate(date, options = {}) {
  if (!date) return "";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("en-PH", defaultOptions).format(
    new Date(date)
  );
}

/**
 * Format datetime for display
 */
export function formatDateTime(date, options = {}) {
  if (!date) return "";

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  return new Intl.DateTimeFormat("en-PH", defaultOptions).format(
    new Date(date)
  );
}

/**
 * Format time for display
 */
export function formatTime(date, options = {}) {
  if (!date) return "";

  const defaultOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  };

  return new Intl.DateTimeFormat("en-PH", defaultOptions).format(
    new Date(date)
  );
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date) {
  if (!date) return "";

  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now - targetDate;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60)
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;

  return formatDate(date);
}

/**
 * Check if date is today
 */
export function isToday(date) {
  if (!date) return false;

  const today = new Date();
  const targetDate = new Date(date);

  return today.toDateString() === targetDate.toDateString();
}

/**
 * Check if date is within range
 */
export function isWithinDays(date, days) {
  if (!date) return false;

  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = targetDate - now;
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  return diffInDays >= 0 && diffInDays <= days;
}

/**
 * Get start of day
 */
export function getStartOfDay(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Get end of day
 */
export function getEndOfDay(date = new Date()) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Get date range for common periods
 */
export function getDateRange(period) {
  const now = new Date();
  const startOfToday = getStartOfDay(now);
  const endOfToday = getEndOfDay(now);

  switch (period) {
    case "today":
      return { start: startOfToday, end: endOfToday };

    case "yesterday": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: getStartOfDay(yesterday),
        end: getEndOfDay(yesterday),
      };
    }

    case "this_week": {
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return { start: startOfWeek, end: endOfToday };
    }

    case "this_month": {
      const startOfMonth = new Date(startOfToday);
      startOfMonth.setDate(1);
      return { start: startOfMonth, end: endOfToday };
    }

    case "last_30_days": {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return { start: thirtyDaysAgo, end: endOfToday };
    }

    default:
      return { start: startOfToday, end: endOfToday };
  }
}

/**
 * Format date for HTML input
 */
export function formatDateForInput(date) {
  if (!date) return "";

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Format datetime for HTML input
 */
export function formatDateTimeForInput(date) {
  if (!date) return "";

  const d = new Date(date);
  const datePart = formatDateForInput(d);
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${datePart}T${hours}:${minutes}`;
}
