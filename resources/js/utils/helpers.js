// Utility functions for formatting

/**
 * Format currency to Indonesian Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date to Indonesian locale
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date for display in tables
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
};

/**
 * Format date with time for detailed view
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string with time
 */
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Format number with thousand separators
 * @param {number} number - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (number) => {
  return new Intl.NumberFormat('id-ID').format(number);
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

/**
 * Get current date in WIB (UTC+7) format YYYY-MM-DD
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const getCurrentDateWIB = () => {
  // Create date object from current timestamp + 7 hours (WIB offset)
  // We add 7 hours to the UTC timestamp so that when we call toISOString() (which prints UTC),
  // it actually prints the time 7 hours ahead (which is WIB time).
  const now = new Date();
  const wibOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
  const wibDate = new Date(now.getTime() + wibOffset);
  return wibDate.toISOString().split('T')[0];
};