/**
 * Global Error Handler Middleware
 * Xử lý lỗi toàn cục trong ứng dụng
 */

export class GlobalErrorHandler {
  static handle(error) {
    // Log error with context
    console.error("[Error]", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Có thể gửi đến error tracking service (Sentry, etc.)
    // ErrorTrackingService.captureException(error);
  }

  static async handleAsync(error) {
    this.handle(error);
  }
}

// Setup global error handlers
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    GlobalErrorHandler.handle(event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    GlobalErrorHandler.handleAsync(event.reason);
  });
}
