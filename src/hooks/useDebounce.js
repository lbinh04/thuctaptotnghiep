import { useRef, useCallback } from "react";

/**
 * Hook để debounce function calls
 * Ngăn chặn multiple submissions, API calls, etc.
 *
 * @param {Function} callback - Function để debounce
 * @param {number} delay - Độ trễ in ms (default: 500)
 * @returns {Function} - Debounced function
 */
export const useDebounce = (callback, delay = 500) => {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

/**
 * Hook để throttle function calls
 * Execute function at most once per specified interval
 *
 * @param {Function} callback - Function để throttle
 * @param {number} limit - Time limit in ms (default: 1000)
 * @returns {Function} - Throttled function
 */
export const useThrottle = (callback, limit = 1000) => {
  const inThrottle = useRef(false);

  return useCallback(
    (...args) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    },
    [callback, limit]
  );
};

/**
 * Hook để prevent double submission
 * Useful cho form submissions, button clicks
 *
 * @param {number} duration - Duration to prevent double submission (default: 1000ms)
 * @returns {Object} - { isSubmitting, handleSubmit, reset }
 */
export const usePreventDoubleSubmit = (duration = 1000) => {
  const [isSubmitting, setIsSubmitting] = useRef(false);
  const timeoutRef = useRef(null);

  const handleSubmit = useCallback(
    (fn) => {
      return async (...args) => {
        if (isSubmitting.current) {
          console.warn("Submission already in progress");
          return;
        }

        isSubmitting.current = true;

        try {
          return await fn(...args);
        } finally {
          setTimeout(() => {
            isSubmitting.current = false;
          }, duration);
        }
      };
    },
    [duration]
  );

  const reset = useCallback(() => {
    isSubmitting.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { isSubmitting: isSubmitting.current, handleSubmit, reset };
};
