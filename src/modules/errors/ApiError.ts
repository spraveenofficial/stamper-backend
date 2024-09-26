class ApiError extends Error {
  statusCode: number;

  isOperational: boolean;

  override stack?: string;
  success: boolean;

  constructor(statusCode: number, message: string, isOperational = true, stack = '', success = false) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.success = success;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
