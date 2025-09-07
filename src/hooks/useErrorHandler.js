import React from "react";

/**
 * Hook for handling async errors in components
 */
export const useErrorHandler = () => {
  const throwError = React.useCallback((error) => {
    // This will trigger the nearest error boundary
    throw error;
  }, []);

  const handleAsyncError = React.useCallback(
    (asyncFn) => {
      return async (...args) => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          throwError(error);
        }
      };
    },
    [throwError]
  );

  return { throwError, handleAsyncError };
};

export default useErrorHandler;
