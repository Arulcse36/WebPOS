// Format date and time for display
export const formatDateTime = (date = null) => {
  const now = date ? new Date(date) : new Date();
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  return now.toLocaleString('en-IN', options);
};

// Format date for input field (YYYY-MM-DDTHH:MM)
export const formatForInput = (date = null) => {
  const now = date ? new Date(date) : new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Format currency with 2 decimal places
export const formatCurrency = (amt) => {
  const num = Number(amt);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Format quantity for display (max 3 decimal places, remove trailing zeros)
export const formatQuantityDisplay = (qty) => {
  if (!qty && qty !== 0) return "0";
  const rounded = Math.round(qty * 1000) / 1000;
  return parseFloat(rounded.toString()).toString();
};