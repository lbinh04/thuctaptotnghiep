import { useState, useCallback } from "react";

/**
 * Custom hook để quản lý loading state
 * - Track loading status
 * - Error handling
 * - Auto reset
 */
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args) => {
      setStatus("pending");
      setIsLoading(true);
      setData(null);
      setError(null);

      try {
        const response = await asyncFunction(...args);
        setData(response);
        setStatus("success");
        return response;
      } catch (error) {
        setError(error);
        setStatus("error");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { execute, reset, status, data, error, isLoading };
};

/**
 * Hook cho submit form với loading state
 */
export const useFormSubmit = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (submitFn) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await submitFn();
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return { handleSubmit, reset, isLoading, error };
};
