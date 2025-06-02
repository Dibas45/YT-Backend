class ApiError extends Error {
  constructor(message, 
    statusCode = 500,
    errors=[],
    stack=''
) {
    super(message);
    this.statusCode = statusCode;
    this.data=null;
    this.message = message;
    this.success = false;
    this.errors = errors; // Array of error details

    if (stack) {
      this.stack = stack;
    }
    else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export {ApiError}