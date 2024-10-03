const DEBUG_LEVELS = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
};

let currentDebugLevel = DEBUG_LEVELS.NONE;

export function debug(level, message) {
    if (level <= currentDebugLevel) {
        console.log(message);
    }
}

export function setDebugLevel(level) {
    currentDebugLevel = level;
}

export { DEBUG_LEVELS };
