/**
 * Centralized Logger for Monev
 * Only logs in development, suppresses in production
 */

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug';

interface Logger {
    log: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
    group: (...args: unknown[]) => void;
    groupEnd: () => void;
    time: (label: string) => void;
    timeEnd: (label: string) => void;
}

const isDev = process.env.NODE_ENV === 'development';
const isClient = typeof window !== 'undefined';

// Create noop functions for production
const noop = () => {};
const noopTime = (_label: string) => {};

/**
 * Development logger - full functionality
 */
const devLogger: Logger = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console),
    group: console.group?.bind(console) || noop,
    groupEnd: console.groupEnd?.bind(console) || noop,
    time: console.time?.bind(console) || noopTime,
    timeEnd: console.timeEnd?.bind(console) || noopTime,
};

/**
 * Production logger - only errors, no debug info
 */
const prodLogger: Logger = {
    log: noop,
    error: console.error.bind(console), // Keep errors for monitoring
    warn: noop,
    info: noop,
    debug: noop,
    group: noop,
    groupEnd: noop,
    time: noopTime,
    timeEnd: noopTime,
};

/**
 * Main logger instance
 * Automatically switches between dev and prod modes
 */
export const logger: Logger = isDev ? devLogger : prodLogger;

/**
 * Create a namespaced logger for specific modules
 * @example const log = createLogger('API');
 *          log.info('User logged in'); // [API] User logged in
 */
export function createLogger(namespace: string): Logger {
    const prefix = `[${namespace}]`;

    if (!isDev) {
        // Production: only errors with namespace
        return {
            ...prodLogger,
            error: (...args: unknown[]) => console.error(prefix, ...args),
        };
    }

    // Development: all logs with namespace
    return {
        log: (...args: unknown[]) => console.log(prefix, ...args),
        error: (...args: unknown[]) => console.error(prefix, ...args),
        warn: (...args: unknown[]) => console.warn(prefix, ...args),
        info: (...args: unknown[]) => console.info(prefix, ...args),
        debug: (...args: unknown[]) => console.debug(prefix, ...args),
        group: (...args: unknown[]) => {
            if (console.group) {
                console.group(prefix, ...args);
            }
        },
        groupEnd: () => {
            if (console.groupEnd) {
                console.groupEnd();
            }
        },
        time: (label: string) => {
            if (console.time) {
                console.time(`${prefix} ${label}`);
            }
        },
        timeEnd: (label: string) => {
            if (console.timeEnd) {
                console.timeEnd(`${prefix} ${label}`);
            }
        },
    };
}

/**
 * Conditional logging - only logs if condition is true
 * Useful for verbose debugging that should be rare
 */
export function logIf(condition: boolean, ...args: unknown[]): void {
    if (condition && isDev) {
        console.log(...args);
    }
}

/**
 * Performance measurement helper
 */
export function measurePerformance(name: string, fn: () => void | Promise<void>): void | Promise<void> {
    if (!isDev) {
        return fn();
    }

    console.time(name);
    const result = fn();
    
    if (result instanceof Promise) {
        return result.finally(() => console.timeEnd(name));
    }
    
    console.timeEnd(name);
    return result;
}

// Export default logger
export default logger;