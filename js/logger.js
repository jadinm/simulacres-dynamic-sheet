class Logger {
    static TRACE = 0
    static DEBUG = 1
    static INFO = 2
    static WARNING = 3
    static ERROR = 4

    constructor(max_log_level = this.constructor.ERROR) {
        this.max_log_level = max_log_level
    }

    trace(...opts) {
        if (this.max_log_level <= this.constructor.TRACE)
            console.trace(...opts)
    }

    debug(...opts) {
        if (this.max_log_level <= this.constructor.DEBUG)
            console.debug(...opts)
    }

    info(...opts) {
        if (this.max_log_level <= this.constructor.INFO)
            console.info(...opts)
    }

    warn(...opts) {
        if (this.max_log_level <= this.constructor.WARNING)
            console.warn(...opts)
    }

    error(...opts) {
        if (this.max_log_level <= this.constructor.ERROR)
            console.error(...opts)
    }
}

const logger = debug ? new Logger(Logger.DEBUG) : new Logger()
