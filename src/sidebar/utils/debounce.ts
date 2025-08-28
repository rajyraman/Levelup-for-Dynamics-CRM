/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
): ((...args: T) => void) => {
  let timeout: number;

  return function executedFunction(...args: T) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
