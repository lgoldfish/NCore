import { isFunction, isString } from 'lang';

class NCore {
    _listeners = {};
    _oneTimeListeners = {};

    on(type, fun) {
        if (!isString(type) || !isFunction(fun)) {
            throw new Error('on: require two params');
        }
        if (!this._listeners[type]) {
            this._listeners[type] = [];
        }
        const arr = this._listeners[type];
        arr.indexOf(fun) === -1 && arr.push(fun);

        return this;
    }

    once(type, fun) {
        if (!isString(type) || !isFunction(fun)) {
            throw new Error('once: require two params');
        }

        if (!this._oneTimeListeners[type]) {
            this._oneTimeListeners[type] = [];
        }

        const arr = this._oneTimeListeners[type];
        arr.indexOf(fun) === -1 && arr.push(fun);

        return this;
    }

    off(type, fun) {
        if (!isString(type) || !isFunction(fun)) {
            throw new Error('off: require two params');
        }

        const arr = this._listeners[type] || [];
        for (let i = arr.length - 1; i >= 0; i -= 1) {
            if (arr[i] === fun) {
                arr.splice(i, 1);
            }
        }

        const oneTimeArr = this._oneTimeListeners[type] || [];
        for (let i = oneTimeArr.length - 1; i >= 0; i -= 1) {
            if (oneTimeArr[i] === fun) {
                oneTimeArr.splice(i, 1);
            }
        }

        return this;
    }

    fire(type, data) {
        const arr = this._listeners[type] || [];
        for (let i = 0; i < arr.length; i += 1) {
            arr[i](data);
        }

        const oneTimeArr = this._oneTimeListeners[type] || [];
        for (let i = 0; i < oneTimeArr.length; i += 1) {
            oneTimeArr[i](data);
        }

        this._oneTimeListeners[type] && (this._oneTimeListeners[type].length = 0);

        return this;
    }

}

export default NCore;
