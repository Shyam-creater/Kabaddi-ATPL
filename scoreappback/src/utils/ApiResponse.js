class ApiResponse {
    static success(message, data = {}) {
        return { success: true, message, data };
    }
}

module.exports = ApiResponse;
