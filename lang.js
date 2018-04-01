export function isString(str) {
    return typeof str === 'string';
}

export function isNumber(num) {
    return typeof num === 'number';
}

export function isArray(arr) {
    return Array.isArray(arr);
}

export function isFunction(fun) {
    return typeof fun === 'function';
}

export function sleep(ms = 0) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
