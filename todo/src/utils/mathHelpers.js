// Round to 2 decimal places
export const roundToTwoDecimals = (num) => {
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};