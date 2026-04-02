// Safely get string value from category/brand (handles string, object, null)
export const getSafeString = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value.name) return value.name;
    if (value._id) return value.name || '';
    return '';
  }
  return String(value);
};