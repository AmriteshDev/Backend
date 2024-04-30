class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went worng",
        errors = [],
        statck = ""
    ) {
        super(message)
        this.statusCode = statusCode,
            this.errors = errors,
            this.data = null,
            this.success = false,
            this.message = message

        if (statck) {
            this.statck = statck
        }
        else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export { ApiError }