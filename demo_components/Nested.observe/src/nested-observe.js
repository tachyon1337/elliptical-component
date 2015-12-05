(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root._utils=root._utils || {};
        root._utils.forEach=factory();
        root.returnExports = root._utils.forEach;
    }
}(this, function () {
    var hasOwn = Object.prototype.hasOwnProperty;
    var toString = Object.prototype.toString;

    return function forEach (obj, fn, ctx) {
        if (toString.call(fn) !== '[object Function]') {
            throw new TypeError('iterator must be a function');
        }
        var l = obj.length;
        if (l === +l) {
            for (var i = 0; i < l; i++) {
                fn.call(ctx, obj[i], i, obj);
            }
        } else {
            for (var k in obj) {
                if (hasOwn.call(obj, k)) {
                    fn.call(ctx, obj[k], k, obj);
                }
            }
        }
    };

}));









(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('foreach'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['foreach'], factory);
    } else {
        // Browser globals (root is window)
        root._utils.jsonPointer=factory(root._utils.forEach);
        root.returnExports = root._utils.jsonPointer;
    }
}(this, function (forEach) {

    /**
     * Convenience wrapper around the api.
     * Calls `.get` when called with an `object` and a `pointer`.
     * Calls `.set` when also called with `value`.
     * If only supplied `object`, returns a partially applied function, mapped to the object.
     *
     * @param obj
     * @param pointer
     * @param value
     * @returns {*}
     */
    var each=forEach;
    function api (obj, pointer, value) {
        // .set()
        if (arguments.length === 3) {
            return api.set(obj, pointer, value);
        }
        // .get()
        if (arguments.length === 2) {
            return api.get(obj, pointer);
        }
        // Return a partially applied function on `obj`.
        var wrapped = api.bind(api, obj);

        // Support for oo style
        for (var name in api) {
            if (api.hasOwnProperty(name)) {
                wrapped[name] = api[name].bind(wrapped, obj);
            }
        }
        return wrapped;
    }


    /**
     * Lookup a json pointer in an object
     *
     * @param obj
     * @param pointer
     * @returns {*}
     */
    api.get = function get (obj, pointer) {
        var tok,
            refTokens = api.parse(pointer);
        while (refTokens.length) {
            tok = refTokens.shift();
            if (!obj.hasOwnProperty(tok)) {
                throw new Error('Invalid reference token: ' + tok);
            }
            obj = obj[tok];
        }
        return obj;
    };

    /**
     * Sets a value on an object
     *
     * @param obj
     * @param pointer
     * @param value
     */
    api.set = function set (obj, pointer, value) {
        var refTokens = api.parse(pointer),
            tok,
            nextTok = refTokens[0];
        while (refTokens.length > 1) {
            tok = refTokens.shift();
            nextTok = refTokens[0];

            if (!obj.hasOwnProperty(tok)) {
                if (nextTok.match(/^\d+$/)) {
                    obj[tok] = [];
                } else {
                    obj[tok] = {};
                }
            }
            obj = obj[tok];
        }
        obj[nextTok] = value;
        return this;
    };

    /**
     * Removes an attribute
     *
     * @param obj
     * @param pointer
     */
    api.remove = function (obj, pointer) {
        var refTokens = api.parse(pointer);
        var finalToken = refTokens.pop();
        if (finalToken === undefined) {
            throw new Error('Invalid JSON pointer for remove: "' + pointer + '"');
        }
        delete api.get(obj, api.compile(refTokens))[finalToken];
    };

    /**
     * Returns a (pointer -> value) dictionary for an object
     *
     * @param obj
     * @param {function} descend
     * @returns {}
     */
    api.dict = function dict (obj, descend) {
        var results = {};
        api.walk(obj, function (value, pointer) {
            results[pointer] = value;
        }, descend);
        return results;
    };

    /**
     * Iterates over an object
     * Iterator: function (value, pointer) {}
     *
     * @param obj
     * @param {function} iterator
     * @param {function} descend
     */
    api.walk = function walk (obj, iterator, descend) {
        var refTokens = [];

        descend = descend || function (value) {
            var type = Object.prototype.toString.call(value);
            return type === '[object Object]' || type === '[object Array]';
        };

        (function next (cur) {
            each(cur, function (value, key) {
                refTokens.push(String(key));
                if (descend(value)) {
                    next(value);
                } else {
                    iterator(value, api.compile(refTokens));
                }
                refTokens.pop();
            });
        }(obj));
    };

    /**
     * Tests if an object has a value for a json pointer
     *
     * @param obj
     * @param pointer
     * @returns {boolean}
     */
    api.has = function has (obj, pointer) {
        try {
            api.get(obj, pointer);
        } catch (e) {
            return false;
        }
        return true;
    };

    /**
     * Escapes a reference token
     *
     * @param str
     * @returns {string}
     */
    api.escape = function escape (str) {
        return str.toString().replace(/~/g, '~0').replace(/\//g, '~1');
    };

    /**
     * Unescapes a reference token
     *
     * @param str
     * @returns {string}
     */
    api.unescape = function unescape (str) {
        return str.replace(/~1/g, '/').replace(/~0/g, '~');
    };

    /**
     * Converts a json pointer into a array of reference tokens
     *
     * @param pointer
     * @returns {Array}
     */
    api.parse = function parse (pointer) {
        if (pointer === '') { return []; }
        if (pointer.charAt(0) !== '/') { throw new Error('Invalid JSON pointer: ' + pointer); }
        return pointer.substring(1).split(/\//).map(api.unescape);
    };

    /**
     * Builds a json pointer from a array of reference tokens
     *
     * @param refTokens
     * @returns {string}
     */
    api.compile = function compile (refTokens) {
        if (refTokens.length === 0) { return ''; }
        return '/' + refTokens.map(api.escape).join('/');
    };

    return api;


}));










(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('json-pointer'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['json-pointer'], factory);
    } else {
        // Browser globals (root is window)
        root.Nested=factory(root._utils.jsonPointer);
        root.returnExports = root.Nested;
    }
}(this, function (jsonPointer) {

    var pointer = jsonPointer;
    var Nested=Object.create(null);
// This weak map is used for `.deliverChangeRecords(callback)` calls, where the
// provided callback has to mapped to its corresponding delegate.
    var delegates = new WeakMap; // <callback, delegate>

// When using `.observe(obj, callback)`, instead of forwarding the provided
// `callback` to `Object.observe(obj, callback)` directly, a delegate for the
// `callback` is created. This delegate transforms changes before forwarding
// them to the actual `callback`.
    var Delegate = function(callback) {
        this.callback  = callback;
        this.observers = new WeakMap;

        var self = this;
        this.handleChangeRecords = function(records) {
            try {
                var changes = records.map(self.transform, self);
                changes = Array.prototype.concat.apply([], changes); // flatten
                self.callback(changes)
            } catch (err) {
                if (Nested.debug) console.error(err.stack)
            }
        }
    };

// This method transforms the received change record with using the
// corresponding observer for the object that got changed.
    Delegate.prototype.transform = function(record) {
        var observers = this.observers.get(record.object);
        observers = observers.filter(function(value, index, self) {
            return self.indexOf(value) === index
        });
        return observers.map(function(observer) {
            return observer.transform(record)
        })
    };

// Each callback/object pair gets its own observer, which is used to track
// positions of nested objects and transforms change records accordingly.
    var Observer = function(root, delegate, accept) {
        this.root     = root;
        this.delegate = delegate;
        this.callback = delegate.handleChangeRecords;
        this.accept   = accept;
        this.paths    = new WeakMap
    }

// Recursively observe an object and its nested objects.
    Observer.prototype.observe = function(obj, path, visited) {
        if (!path)    path = '';
        if (!visited) visited = new WeakMap;

        if (visited.has(obj)) {
            return
        }

        visited.set(obj, true);

        // if the object is already observed, i.e., already somewhere else in the
        // nested structure -> do not observe it again
        if (!hasAt(this.delegate.observers, obj, this)) {
            if (Array.isArray(obj) && !this.accept) {
                Object.observe(obj, this.callback, ['add', 'update', 'delete', 'splice'])
            } else {
                Object.observe(obj, this.callback, this.accept)
            }
        }

        // track path and belonging
        addAt(this.paths, obj, path);
        addAt(this.delegate.observers, obj, this);

        // traverse the properties to find nested objects and observe them, too
        for (var key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !==null) {
                this.observe(obj[key], path + '/' + pointer.escape(key), visited)
            }
        }
    };

// Recursively unobserve an object and its nested objects.
    Observer.prototype.unobserve = function(obj, path) {
        console.log(path);
        if (!obj)  obj = this.root;
        if (!path) path = '';

        if (!hasAt(this.delegate.observers, obj, this)) {
            return
        }

        // clean up
        removeAt(this.paths, obj, path);
        removeAt(this.delegate.observers, obj, this);

        if (!this.paths.has(obj)) {
            Object.unobserve(obj, this.callback)
        }

        // traverse the properties to find nested objects and unobserve them, too
        for (var key in obj) {
            if (typeof obj[key] === 'object') {
                this.unobserve(obj[key], path + '/' + pointer.escape(key))
            }
        }
    };

// Transform a change record, ie., add the following properties:
// - **root** - the root of the nested structure
// - **path** - a [JSON Pointer](http://tools.ietf.org/html/rfc6901)
//              (absolute from the root) to the changed property
    Observer.prototype.transform = function(change) {
        var key = String(change.name || change.index);

        var path = this.paths.get(change.object)[0] + '/' + pointer.escape(key);
        var record = {
            root: this.root,
            path: path
        };

        // the original change record ist not extensible -> copy
        for (var prop in change) {
            record[prop] = change[prop]
        }

        // unobserve deleted/replaced objects
        var deleted = change.oldValue && [change.oldValue] || change.removed || [];
        deleted.forEach(function(oldValue) {
            if (!oldValue || typeof oldValue !== 'object') {
                return
            }

            var invalidPaths = this.paths.get(oldValue).filter(function(path) {
                return !pointer.has(this.root, path) || pointer.get(this.root, path) !== oldValue
            }, this);

            //this.unobserve(oldValue, invalidPaths[0])
        }, this);

        // observe added/updated objects
        var value = change.object[key];
        if (typeof value === 'object') {
            var desc = Object.getOwnPropertyDescriptor(change.object, key);
            if (desc.enumerable === true) {
                this.observe(value, path)
            } else {
                this.unobserve(value, path)
            }
        }

        Object.preventExtensions(record);

        return record
    };

// Corresponds to `Object.observe()` but for nested objects.

    Nested.observe = function(obj, callback, accept) {
        if(obj===undefined){return false;}
        var delegate;

        if (!delegates.has(callback)) {
            delegate = new Delegate(callback);
            delegates.set(callback, delegate)
        } else {
            delegate = delegates.get(callback)
        }

        var observers = delegate.observers;
        if (observers.has(obj)) {
            return
        }

        var observer = new Observer(obj, delegate, accept);
        observer.observe(obj)
    };

// Corresponds to `Object.unobserve()` but for nested objects.
    Nested.unobserve = function(obj, callback) {
        if (!delegates.has(callback)) return;
        var delegate = delegates.get(callback);

        if (!delegate.observers.has(obj)) {
            return
        }
        console.log('nested unobserve');
        var observers = delegate.observers.get(obj);
        observers.forEach(function(observer) {
            observer.unobserve()
        })
    };

// Corresponds to `Object.deliverChangeRecords()` but for nested objects.
    Nested.deliverChangeRecords = function(callback) {

        if (typeof callback !== 'function') {
            throw new TypeError('Callback must be a function, given: ' + callback)
        }

        if (!delegates.has(callback)) return;

        var delegate = delegates.get(callback);
        Object.deliverChangeRecords(delegate.handleChangeRecords)
    };

// whether to log exceptions thrown during change record delivery
    Nested.debug = false;

// Helper function to check if a value exists in the array at the provided
// position in the provided WeakMap.
    function hasAt(map, key, value) {
        if (!map.has(key)) return false;
        return map.get(key).indexOf(value) !== -1
    }

// Helper function to add a value to an array at the provided position
// in the provided WeakMap.
    function addAt(map, key, value) {
        var set = (!map.has(key) && map.set(key, []), map.get(key));
        // if (set.indexOf(value) === -1)
        set.push(value)
    }

// Helper function to remove a value from the array at the provided position
// in the provided WeakMap.
    function removeAt(map, key, value) {
        // if (!map.has(key)) return
        var set = map.get(key);

        var index = set.indexOf(value);
        /*if (index > -1) */
        set.splice(index, 1);

        // if the set is empty, remove it from the WeakMap
        if (!set.length) map.delete(key)

    }

    return Nested;

}));

