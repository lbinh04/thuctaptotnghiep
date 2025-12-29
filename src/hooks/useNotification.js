import { toast } from "react-toastify";
import { useCallback } from "react";

/**
 * Custom hook để quản lý toast notifications
 * - Centralized toast management
 * - Consistent error/success messaging
 * - Auto-dismiss with customizable duration
 */
export const useNotification = () => {
  const notify = useCallback((message, type = "success", options = {}) => {
    const defaultOptions = {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    const finalOptions = { ...defaultOptions, ...options };

    switch (type) {
      case "success":
        toast.success(message, finalOptions);
        break;
      case "error":
        toast.error(message, finalOptions);
        break;
      case "warning":
        toast.warning(message, finalOptions);
        break;
      case "info":
        toast.info(message, finalOptions);
        break;
      default:
        toast(message, finalOptions);
    }
  }, []);

  return {
    success: (message, options) => notify(message, "success", options),
    error: (message, options) => notify(message, "error", options),
    warning: (message, options) => notify(message, "warning", options),
    info: (message, options) => notify(message, "info", options),
    notify,
  };
};
