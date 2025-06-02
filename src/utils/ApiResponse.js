class ApiResponse{
    constructor(statusCode, message, data) {
        this.statusCode = statusCode; // HTTP status code
        this.message = message; // Response message
        this.data = data; // Optional data payload
        this.success = statusCode >= 200 && statusCode < 300; // Determine success based on status code
    }
}

export {ApiResponse}