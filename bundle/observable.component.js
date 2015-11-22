
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
    }
}(this, function () {

    if(!Object.observe){
        (function(extend, global){
            "use strict";

            var isCallable = (function(toString){
                var s = toString.call(toString),
                    u = typeof u;
                return typeof global.alert === "object" ?
                    function isCallable(f){
                        return s === toString.call(f) || (!!f && typeof f.toString == u && typeof f.valueOf == u && /^\s*\bfunction\b/.test("" + f));
                    }:
                    function isCallable(f){
                        return s === toString.call(f);
                    }
                    ;
            })(extend.prototype.toString);
            // isNode & isElement from http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
            //Returns true if it is a DOM node
            var isNode = function isNode(o){
                return (
                    typeof Node === "object" ? o instanceof Node :
                    o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
                );
            };
            //Returns true if it is a DOM element
            var isElement = function isElement(o){
                return (
                    typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                    o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
                );
            };
            var _doCheckCallback=function(f){
                setTimeout(f, 10);
            };
            var _clearCheckCallback=function(id){
                clearTimeout(id);
            };
            var isNumeric=function isNumeric(n){
                return !isNaN(parseFloat(n)) && isFinite(n);
            };
            var sameValue = function sameValue(x, y){
                if(x===y){
                    return x !== 0 || 1 / x === 1 / y;
                }
                return x !== x && y !== y;
            };
            var isAccessorDescriptor = function isAccessorDescriptor(desc){
                if (typeof(desc) === 'undefined'){
                    return false;
                }
                return ('get' in desc || 'set' in desc);
            };
            var isDataDescriptor = function isDataDescriptor(desc){
                if (typeof(desc) === 'undefined'){
                    return false;
                }
                return ('value' in desc || 'writable' in desc);
            };

            var inArray=function(arr,val){
                var bool=false;
                arr.forEach(function(v){
                    if(v===val){
                        bool=true;
                    }
                });
                return bool;
            };

            var validateArguments = function validateArguments(O, callback, accept){
                if(typeof(O)!=='object'){
                    // Throw Error
                    throw new TypeError("Object.observeObject called on non-object");
                }
                if(isCallable(callback)===false){
                    // Throw Error
                    throw new TypeError("Object.observeObject: Expecting function");
                }
                if(Object.isFrozen(callback)===true){
                    // Throw Error
                    throw new TypeError("Object.observeObject: Expecting unfrozen function");
                }
                if (accept !== undefined) {
                    if (!Array.isArray(accept)) {
                        throw new TypeError("Object.observeObject: Expecting acceptList in the form of an array");
                    }
                }
            };

            var Observer = (function Observer(){
                var wraped = [];

                var Observer = function Observer(O, callback, accept){

                    if (Array.isArray(O)) {
                        Observer._oldValue= O.concat([]);
                    }

                    validateArguments(O, callback, accept);
                    if (!accept) {
                        accept = ["add", "update", "delete", "slice"];
                    }

                    Object.getNotifier(O).addListener(callback, accept);
                    if(wraped.indexOf(O)===-1){
                        wraped.push(O);
                    }else{
                        Object.getNotifier(O)._checkPropertyListing();
                    }
                };

                Observer.prototype.deliverChangeRecords = function Observer_deliverChangeRecords(O){
                    Object.getNotifier(O).deliverChangeRecords();
                };

                wraped.lastScanned = 0;
                var f = (function f(wrapped){
                    return function _f(){
                        var i = 0, l = wrapped.length, startTime = new Date(), takingTooLong=false;
                        for(i=wrapped.lastScanned; (i<l)&&(!takingTooLong); i++){
                            if(_indexes.indexOf(wrapped[i]) > -1){
                                Object.getNotifier(wrapped[i])._checkPropertyListing();
                                takingTooLong=((new Date())-startTime)>500; // make sure we don't take more than 100 milliseconds to scan all objects
                            }else{
                                wrapped.splice(i, 1);
                                i--;
                                l--;
                            }
                        }
                        wrapped.lastScanned=i<l?i:0; // reset wrapped so we can make sure that we pick things back up
                        _doCheckCallback(_f);
                    };
                })(wraped);
                _doCheckCallback(f);
                return Observer;
            })();

            var Notifier = function Notifier(watching){
                var _listeners = [], _acceptLists = [], _updates = [], _updater = false, properties = [], values = [];
                var self = this;

                Object.defineProperty(self, '_watching', {
                    enumerable: true,
                    get: (function(watched){
                        return function(){
                            return watched;
                        };
                    })(watching)
                });
                var wrapProperty = function wrapProperty(object, prop){
                    var propType = typeof(object[prop]), descriptor = Object.getOwnPropertyDescriptor(object, prop);
                    if((prop==='getNotifier')||isAccessorDescriptor(descriptor)||(!descriptor.enumerable)){
                        return false;
                    }
                    if((object instanceof Array)&&isNumeric(prop)){
                        var idx = properties.length;
                        properties[idx] = prop;
                        values[idx] = object[prop];
                        return true;
                    }
                    (function(idx, prop){
                        properties[idx] = prop;
                        values[idx] = object[prop];
                        Object.defineProperty(object, prop, {
                            get: function(){
                                return values[idx];
                            },
                            set: function(value){
                                if(!sameValue(values[idx], value)){
                                    Object.getNotifier(object).queueUpdate(object, prop, 'update', values[idx]);
                                    values[idx] = value;
                                }
                            }
                        });
                    })(properties.length, prop);
                    return true;
                };
                self._checkPropertyListing = function _checkPropertyListing(dontQueueUpdates) {
                    var object = self._watching, keys = Object.keys(object), i=0, l=keys.length;
                    var newKeys = [], oldKeys = properties.slice(0), updates = [];
                    var prop, queueUpdates = !dontQueueUpdates, propType, value, idx, aLength;

                    if(object instanceof Array){
                        aLength = self._oldLength;
                    }

                    for(i=0; i<l; i++){
                        prop = keys[i];
                        value = object[prop];
                        propType = typeof(value);
                        if((idx = properties.indexOf(prop))===-1){
                            if(wrapProperty(object, prop)&&queueUpdates){
                                self.queueUpdate(object, prop, 'add', null, object[prop]);
                            }
                        }else{
                            if(!(object instanceof Array)||(isNumeric(prop))){
                                if(values[idx] !== value){
                                    if(queueUpdates){
                                        self.queueUpdate(object, prop, 'update', values[idx], value);
                                    }
                                    values[idx] = value;
                                }
                            }
                            oldKeys.splice(oldKeys.indexOf(prop), 1);
                        }
                    }

                    if(object instanceof Array && object.length !== aLength){
                        if(queueUpdates){
                            self.queueUpdate(object, 'length', 'update', aLength, object);
                        }
                        self._oldLength = object.length;
                    }

                    if(queueUpdates){
                        l = oldKeys.length;
                        for(i=0; i<l; i++){
                            idx = properties.indexOf(oldKeys[i]);
                            self.queueUpdate(object, oldKeys[i], 'delete', values[idx]);
                            properties.splice(idx,1);
                            values.splice(idx,1);
                        }
                    }
                };
                self.addListener = function Notifier_addListener(callback, accept){
                    var idx = _listeners.indexOf(callback);
                    if(idx===-1){
                        _listeners.push(callback);
                        _acceptLists.push(accept);
                    }
                    else {
                        _acceptLists[idx] = accept;
                    }
                };
                self.removeListener = function Notifier_removeListener(callback){
                    var idx = _listeners.indexOf(callback);
                    if(idx>-1){
                        _listeners.splice(idx, 1);
                        _acceptLists.splice(idx, 1);
                    }
                };
                self.listeners = function Notifier_listeners(){
                    return _listeners;
                };
                self.queueUpdate = function Notifier_queueUpdate(what, prop, type, was){
                    this.queueUpdates([{
                        type: type,
                        object: what,
                        name: prop,
                        oldValue: was
                    }]);
                };
                self.queueUpdates = function Notifier_queueUpdates(updates){
                    var self = this, i = 0, l = updates.length||0, update;
                    for(i=0; i<l; i++){
                        update = updates[i];
                        _updates.push(update);
                    }
                    if(_updater){
                        _clearCheckCallback(_updater);
                    }
                    _updater = _doCheckCallback(function(){
                        _updater = false;
                        self.deliverChangeRecords();
                    });
                };
                self.deliverChangeRecords = function Notifier_deliverChangeRecords(){
                    var i = 0, l = _listeners.length,
                    //keepRunning = true, removed as it seems the actual implementation doesn't do this
                    // In response to BUG #5
                        retval;

                    for(i=0; i<l; i++){
                        if(_listeners[i]){
                            var currentUpdates;
                            if (_acceptLists[i]) {
                                currentUpdates = [];
                                for (var j = 0, updatesLength = _updates.length; j < updatesLength; j++) {
                                    if (_acceptLists[i].indexOf(_updates[j].type) !== -1) {
                                        currentUpdates.push(_updates[j]);
                                    }
                                }
                            }
                            else {
                                currentUpdates = _updates;
                            }
                            if (currentUpdates.length) {
                                //support 'splice' for arrays

                                if(inArray(_acceptLists[i],'splice')){
                                    var spliceUpdates=self._arrayObserverSplice(currentUpdates);
                                    currentUpdates=(spliceUpdates) ? spliceUpdates : currentUpdates;
                                }

                                if(_listeners[i]===console.log){
                                    console.log(currentUpdates);
                                }else{
                                    _listeners[i](currentUpdates);
                                }
                            }
                        }
                    }
                    _updates=[];
                };
                self.notify = function Notifier_notify(changeRecord) {
                    if (typeof changeRecord !== "object" || typeof changeRecord.type !== "string") {
                        throw new TypeError("Invalid changeRecord with non-string 'type' property");
                    }
                    changeRecord.object = watching;
                    self.queueUpdates([changeRecord]);
                };
                self._checkPropertyListing(true);
                self._arrayObserverSplice=function(updates){
                    var currentValue=updates[0].object;
                    if (!Array.isArray(currentValue)) {
                        return false;
                    }
                    var oldValue=Observer._oldValue;
                    if(oldValue===undefined){
                        return false;
                    }
                    var oldLength=oldValue.length;
                    var currentLength=currentValue.length;
                    if(currentLength===oldLength){
                        return false;
                    }
                    var cr=self._spliceChangeRecord();
                    cr.object=currentValue;
                    var oldLastIndex=oldLength -1;
                    var currentLastIndex=currentLength-1;
                    if(currentLength > oldLength){
                        //add
                        cr.addedCount=currentLength-oldLength;
                        //get the index
                        //test for push
                        if(!(oldValue[oldLastIndex]===currentValue[currentLastIndex])){
                            cr.index=oldLastIndex +1;
                        }else if(!(oldValue[0]===currentValue[0])){//unshift
                            cr.index=0
                        }else{
                            //iterate for arbitrary splice
                            for(var i=0;i<oldLength;i++){
                                if(!(oldValue[i]===currentValue[i])){
                                    cr.index=i;
                                    break;
                                }
                            }
                        }
                    }else{
                        //delete
                        var removedCount=oldLength-currentLength;
                        //test the end
                        if(!(oldValue[oldLastIndex]===currentValue[currentLastIndex])){
                            cr.index=currentLastIndex + 1;
                        }else if(!(oldValue[0]===currentValue[0])){//shift
                            cr.index=0;
                        }else{
                            //iterate for arbitrary splice
                            for(var i=0;i<oldLength;i++){
                                if(!(oldValue[i]===currentValue[i])){
                                    cr.index=i;
                                    break;
                                }
                            }
                        }
                        cr.removed=self._removedArray(oldValue,cr.index,removedCount);
                    }

                    Observer._oldValue=currentValue.concat([]);//reset oldValue to the current value
                    return [cr];

                };
                self._spliceChangeRecord=function(){
                    return{
                        addedCount:0,
                        index:undefined,
                        object:[],
                        removed:[],
                        type:'splice'
                    }
                };
                self._removedArray=function(arr,index,count){
                    var rm=[];
                    var length=index+count;
                    for(var i=index;i<length;i++){
                        rm.push(arr[i])
                    }
                    return rm;
                }
            };

            var _notifiers=[], _indexes=[];
            extend.getNotifier = function Object_getNotifier(O){
                var idx = _indexes.indexOf(O), notifier = idx>-1?_notifiers[idx]:false;
                if(!notifier){
                    idx = _indexes.length;
                    _indexes[idx] = O;
                    notifier = _notifiers[idx] = new Notifier(O);
                }
                return notifier;
            };
            extend.observe = function Object_observe(O, callback, accept){
                // For Bug 4, can't observe DOM elements tested against canry implementation and matches
                if(!isElement(O)){
                    return new Observer(O, callback, accept);
                }
            };
            extend.unobserve = function Object_unobserve(O, callback){
                validateArguments(O, callback);
                var idx = _indexes.indexOf(O),
                    notifier = idx>-1?_notifiers[idx]:false;
                if (!notifier){
                    return;
                }
                notifier.removeListener(callback);
                if (notifier.listeners().length === 0){
                    _indexes.splice(idx, 1);
                    _notifiers.splice(idx, 1);
                }
            };
        })(Object, this);
    }

}));


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
        if(obj===undefined || typeof obj !=='object'){return false;}
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

/*
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function(global) {
  'use strict';

  var testingExposeCycleCount = global.testingExposeCycleCount;

  // Detect and do basic sanity checking on Object/Array.observe.
  function detectObjectObserve() {
    if (typeof Object.observe !== 'function' ||
        typeof Array.observe !== 'function') {
      return false;
    }

    var records = [];

    function callback(recs) {
      records = recs;
    }

    var test = {};
    var arr = [];
    Object.observe(test, callback);
    Array.observe(arr, callback);
    test.id = 1;
    test.id = 2;
    delete test.id;
    arr.push(1, 2);
    arr.length = 0;

    Object.deliverChangeRecords(callback);
    if (records.length !== 5)
      return false;

    if (records[0].type != 'add' ||
        records[1].type != 'update' ||
        records[2].type != 'delete' ||
        records[3].type != 'splice' ||
        records[4].type != 'splice') {
      return false;
    }

    Object.unobserve(test, callback);
    Array.unobserve(arr, callback);

    return true;
  }

  var hasObserve = detectObjectObserve();

  function detectEval() {
    // Don't test for eval if we're running in a Chrome App environment.
    // We check for APIs set that only exist in a Chrome App context.
    if (typeof chrome !== 'undefined' && chrome.app && chrome.app.runtime) {
      return false;
    }

    // Firefox OS Apps do not allow eval. This feature detection is very hacky
    // but even if some other platform adds support for this function this code
    // will continue to work.
    if (typeof navigator != 'undefined' && navigator.getDeviceStorage) {
      return false;
    }

    try {
      var f = new Function('', 'return true;');
      return f();
    } catch (ex) {
      return false;
    }
  }

  var hasEval = detectEval();

  function isIndex(s) {
    return +s === s >>> 0 && s !== '';
  }

  function toNumber(s) {
    return +s;
  }

  function isObject(obj) {
    return obj === Object(obj);
  }

  var numberIsNaN = global.Number.isNaN || function(value) {
    return typeof value === 'number' && global.isNaN(value);
  };

  function areSameValue(left, right) {
    if (left === right)
      return left !== 0 || 1 / left === 1 / right;
    if (numberIsNaN(left) && numberIsNaN(right))
      return true;

    return left !== left && right !== right;
  }

  var createObject = ('__proto__' in {}) ?
    function(obj) { return obj; } :
    function(obj) {
      var proto = obj.__proto__;
      if (!proto)
        return obj;
      var newObject = Object.create(proto);
      Object.getOwnPropertyNames(obj).forEach(function(name) {
        Object.defineProperty(newObject, name,
                             Object.getOwnPropertyDescriptor(obj, name));
      });
      return newObject;
    };

  var identStart = '[\$_a-zA-Z]';
  var identPart = '[\$_a-zA-Z0-9]';
  var identRegExp = new RegExp('^' + identStart + '+' + identPart + '*' + '$');

  function getPathCharType(char) {
    if (char === undefined)
      return 'eof';

    var code = char.charCodeAt(0);

    switch(code) {
      case 0x5B: // [
      case 0x5D: // ]
      case 0x2E: // .
      case 0x22: // "
      case 0x27: // '
      case 0x30: // 0
        return char;

      case 0x5F: // _
      case 0x24: // $
        return 'ident';

      case 0x20: // Space
      case 0x09: // Tab
      case 0x0A: // Newline
      case 0x0D: // Return
      case 0xA0:  // No-break space
      case 0xFEFF:  // Byte Order Mark
      case 0x2028:  // Line Separator
      case 0x2029:  // Paragraph Separator
        return 'ws';
    }

    // a-z, A-Z
    if ((0x61 <= code && code <= 0x7A) || (0x41 <= code && code <= 0x5A))
      return 'ident';

    // 1-9
    if (0x31 <= code && code <= 0x39)
      return 'number';

    return 'else';
  }

  var pathStateMachine = {
    'beforePath': {
      'ws': ['beforePath'],
      'ident': ['inIdent', 'append'],
      '[': ['beforeElement'],
      'eof': ['afterPath']
    },

    'inPath': {
      'ws': ['inPath'],
      '.': ['beforeIdent'],
      '[': ['beforeElement'],
      'eof': ['afterPath']
    },

    'beforeIdent': {
      'ws': ['beforeIdent'],
      'ident': ['inIdent', 'append']
    },

    'inIdent': {
      'ident': ['inIdent', 'append'],
      '0': ['inIdent', 'append'],
      'number': ['inIdent', 'append'],
      'ws': ['inPath', 'push'],
      '.': ['beforeIdent', 'push'],
      '[': ['beforeElement', 'push'],
      'eof': ['afterPath', 'push']
    },

    'beforeElement': {
      'ws': ['beforeElement'],
      '0': ['afterZero', 'append'],
      'number': ['inIndex', 'append'],
      "'": ['inSingleQuote', 'append', ''],
      '"': ['inDoubleQuote', 'append', '']
    },

    'afterZero': {
      'ws': ['afterElement', 'push'],
      ']': ['inPath', 'push']
    },

    'inIndex': {
      '0': ['inIndex', 'append'],
      'number': ['inIndex', 'append'],
      'ws': ['afterElement'],
      ']': ['inPath', 'push']
    },

    'inSingleQuote': {
      "'": ['afterElement'],
      'eof': ['error'],
      'else': ['inSingleQuote', 'append']
    },

    'inDoubleQuote': {
      '"': ['afterElement'],
      'eof': ['error'],
      'else': ['inDoubleQuote', 'append']
    },

    'afterElement': {
      'ws': ['afterElement'],
      ']': ['inPath', 'push']
    }
  };

  function noop() {}

  function parsePath(path) {
    var keys = [];
    var index = -1;
    var c, newChar, key, type, transition, action, typeMap, mode = 'beforePath';

    var actions = {
      push: function() {
        if (key === undefined)
          return;

        keys.push(key);
        key = undefined;
      },

      append: function() {
        if (key === undefined)
          key = newChar;
        else
          key += newChar;
      }
    };

    function maybeUnescapeQuote() {
      if (index >= path.length)
        return;

      var nextChar = path[index + 1];
      if ((mode == 'inSingleQuote' && nextChar == "'") ||
          (mode == 'inDoubleQuote' && nextChar == '"')) {
        index++;
        newChar = nextChar;
        actions.append();
        return true;
      }
    }

    while (mode) {
      index++;
      c = path[index];

      if (c == '\\' && maybeUnescapeQuote(mode))
        continue;

      type = getPathCharType(c);
      typeMap = pathStateMachine[mode];
      transition = typeMap[type] || typeMap['else'] || 'error';

      if (transition == 'error')
        return; // parse error;

      mode = transition[0];
      action = actions[transition[1]] || noop;
      newChar = transition[2] === undefined ? c : transition[2];
      action();

      if (mode === 'afterPath') {
        return keys;
      }
    }

    return; // parse error
  }

  function isIdent(s) {
    return identRegExp.test(s);
  }

  var constructorIsPrivate = {};

  function Path(parts, privateToken) {
    if (privateToken !== constructorIsPrivate)
      throw Error('Use Path.get to retrieve path objects');

    for (var i = 0; i < parts.length; i++) {
      this.push(String(parts[i]));
    }

    if (hasEval && this.length) {
      this.getValueFrom = this.compiledGetValueFromFn();
    }
  }

  // TODO(rafaelw): Make simple LRU cache
  var pathCache = {};

  function getPath(pathString) {
    if (pathString instanceof Path)
      return pathString;

    if (pathString == null || pathString.length == 0)
      pathString = '';

    if (typeof pathString != 'string') {
      if (isIndex(pathString.length)) {
        // Constructed with array-like (pre-parsed) keys
        return new Path(pathString, constructorIsPrivate);
      }

      pathString = String(pathString);
    }

    var path = pathCache[pathString];
    if (path)
      return path;

    var parts = parsePath(pathString);
    if (!parts)
      return invalidPath;

    path = new Path(parts, constructorIsPrivate);
    pathCache[pathString] = path;
    return path;
  }

  Path.get = getPath;

  function formatAccessor(key) {
    if (isIndex(key)) {
      return '[' + key + ']';
    } else {
      return '["' + key.replace(/"/g, '\\"') + '"]';
    }
  }

  Path.prototype = createObject({
    __proto__: [],
    valid: true,

    toString: function() {
      var pathString = '';
      for (var i = 0; i < this.length; i++) {
        var key = this[i];
        if (isIdent(key)) {
          pathString += i ? '.' + key : key;
        } else {
          pathString += formatAccessor(key);
        }
      }

      return pathString;
    },

    getValueFrom: function(obj, defaultValue) {
      for (var i = 0; i < this.length; i++) {
        var key = this[i];
        if (obj == null || !(key in obj))
          return defaultValue;
        obj = obj[key];
      }
      return obj;
    },

    iterateObjects: function(obj, observe) {
      for (var i = 0; i < this.length; i++) {
        if (i)
          obj = obj[this[i - 1]];
        if (!isObject(obj))
          return;
        observe(obj, this[i]);
      }
    },

    compiledGetValueFromFn: function() {
      var str = '';
      var pathString = 'obj';
      str += 'if (obj != null';
      var i = 0;
      var key;
      for (; i < (this.length - 1); i++) {
        key = this[i];
        pathString += isIdent(key) ? '.' + key : formatAccessor(key);
        str += ' &&\n    ' + pathString + ' != null';
      }

      key = this[i];
      var keyIsIdent = isIdent(key);
      var keyForInOperator = keyIsIdent ? '"' + key.replace(/"/g, '\\"') + '"' : key;
      str += ' &&\n    ' + keyForInOperator + ' in ' + pathString + ')\n';
      pathString += keyIsIdent ? '.' + key : formatAccessor(key);

      str += '  return ' + pathString + ';\nelse\n  return defaultValue;';
      return new Function('obj', 'defaultValue', str);
    },

    setValueFrom: function(obj, value) {
      if (!this.length)
        return false;

      for (var i = 0; i < this.length - 1; i++) {
        if (!isObject(obj))
          return false;
        obj = obj[this[i]];
      }

      if (!isObject(obj))
        return false;

      obj[this[i]] = value;
      return true;
    }
  });

  var invalidPath = new Path('', constructorIsPrivate);
  invalidPath.valid = false;
  invalidPath.getValueFrom = invalidPath.setValueFrom = function() {};

  var MAX_DIRTY_CHECK_CYCLES = 1000;

  function dirtyCheck(observer) {
    var cycles = 0;
    while (cycles < MAX_DIRTY_CHECK_CYCLES && observer.check_()) {
      cycles++;
    }
    if (testingExposeCycleCount)
      global.dirtyCheckCycleCount = cycles;

    return cycles > 0;
  }

  function objectIsEmpty(object) {
    for (var prop in object)
      return false;
    return true;
  }

  function diffIsEmpty(diff) {
    return objectIsEmpty(diff.added) &&
           objectIsEmpty(diff.removed) &&
           objectIsEmpty(diff.changed);
  }

  function diffObjectFromOldObject(object, oldObject) {
    var added = {};
    var removed = {};
    var changed = {};
    var prop;

    for (prop in oldObject) {
      var newValue = object[prop];

      if (newValue !== undefined && newValue === oldObject[prop])
        continue;

      if (!(prop in object)) {
        removed[prop] = undefined;
        continue;
      }

      if (newValue !== oldObject[prop])
        changed[prop] = newValue;
    }

    for (prop in object) {
      if (prop in oldObject)
        continue;

      added[prop] = object[prop];
    }

    if (Array.isArray(object) && object.length !== oldObject.length)
      changed.length = object.length;

    return {
      added: added,
      removed: removed,
      changed: changed
    };
  }

  var eomTasks = [];
  function runEOMTasks() {
    if (!eomTasks.length)
      return false;

    for (var i = 0; i < eomTasks.length; i++) {
      eomTasks[i]();
    }
    eomTasks.length = 0;
    return true;
  }

  var runEOM = hasObserve ? (function(){
    return function(fn) {
      return Promise.resolve().then(fn);
    };
  })() :
  (function() {
    return function(fn) {
      eomTasks.push(fn);
    };
  })();

  var observedObjectCache = [];

  function newObservedObject() {
    var observer;
    var object;
    var discardRecords = false;
    var first = true;

    function callback(records) {
      if (observer && observer.state_ === OPENED && !discardRecords)
        observer.check_(records);
    }

    return {
      open: function(obs) {
        if (observer)
          throw Error('ObservedObject in use');

        if (!first)
          Object.deliverChangeRecords(callback);

        observer = obs;
        first = false;
      },
      observe: function(obj, arrayObserve) {
        object = obj;
        if (arrayObserve)
          Array.observe(object, callback);
        else
          Object.observe(object, callback);
      },
      deliver: function(discard) {
        discardRecords = discard;
        Object.deliverChangeRecords(callback);
        discardRecords = false;
      },
      close: function() {
        observer = undefined;
        Object.unobserve(object, callback);
        observedObjectCache.push(this);
      }
    };
  }

  /*
   * The observedSet abstraction is a perf optimization which reduces the total
   * number of Object.observe observations of a set of objects. The idea is that
   * groups of Observers will have some object dependencies in common and this
   * observed set ensures that each object in the transitive closure of
   * dependencies is only observed once. The observedSet acts as a write barrier
   * such that whenever any change comes through, all Observers are checked for
   * changed values.
   *
   * Note that this optimization is explicitly moving work from setup-time to
   * change-time.
   *
   * TODO(rafaelw): Implement "garbage collection". In order to move work off
   * the critical path, when Observers are closed, their observed objects are
   * not Object.unobserve(d). As a result, it's possible that if the observedSet
   * is kept open, but some Observers have been closed, it could cause "leaks"
   * (prevent otherwise collectable objects from being collected). At some
   * point, we should implement incremental "gc" which keeps a list of
   * observedSets which may need clean-up and does small amounts of cleanup on a
   * timeout until all is clean.
   */

  function getObservedObject(observer, object, arrayObserve) {
    var dir = observedObjectCache.pop() || newObservedObject();
    dir.open(observer);
    dir.observe(object, arrayObserve);
    return dir;
  }

  var observedSetCache = [];

  function newObservedSet() {
    var observerCount = 0;
    var observers = [];
    var objects = [];
    var rootObj;
    var rootObjProps;

    function observe(obj, prop) {
      if (!obj)
        return;

      if (obj === rootObj)
        rootObjProps[prop] = true;

      if (objects.indexOf(obj) < 0) {
        objects.push(obj);
        Object.observe(obj, callback);
      }

      observe(Object.getPrototypeOf(obj), prop);
    }

    function allRootObjNonObservedProps(recs) {
      for (var i = 0; i < recs.length; i++) {
        var rec = recs[i];
        if (rec.object !== rootObj ||
            rootObjProps[rec.name] ||
            rec.type === 'setPrototype') {
          return false;
        }
      }
      return true;
    }

    function callback(recs) {
      if (allRootObjNonObservedProps(recs))
        return;

      var i, observer;
      for (i = 0; i < observers.length; i++) {
        observer = observers[i];
        if (observer.state_ == OPENED) {
          observer.iterateObjects_(observe);
        }
      }

      for (i = 0; i < observers.length; i++) {
        observer = observers[i];
        if (observer.state_ == OPENED) {
          observer.check_();
        }
      }
    }

    var record = {
      objects: objects,
      get rootObject() { return rootObj; },
      set rootObject(value) {
        rootObj = value;
        rootObjProps = {};
      },
      open: function(obs, object) {
        observers.push(obs);
        observerCount++;
        obs.iterateObjects_(observe);
      },
      close: function(obs) {
        observerCount--;
        if (observerCount > 0) {
          return;
        }

        for (var i = 0; i < objects.length; i++) {
          Object.unobserve(objects[i], callback);
          Observer.unobservedCount++;
        }

        observers.length = 0;
        objects.length = 0;
        rootObj = undefined;
        rootObjProps = undefined;
        observedSetCache.push(this);
        if (lastObservedSet === this)
          lastObservedSet = null;
      },
    };

    return record;
  }

  var lastObservedSet;

  function getObservedSet(observer, obj) {
    if (!lastObservedSet || lastObservedSet.rootObject !== obj) {
      lastObservedSet = observedSetCache.pop() || newObservedSet();
      lastObservedSet.rootObject = obj;
    }
    lastObservedSet.open(observer, obj);
    return lastObservedSet;
  }

  var UNOPENED = 0;
  var OPENED = 1;
  var CLOSED = 2;
  var RESETTING = 3;

  var nextObserverId = 1;

  function Observer() {
    this.state_ = UNOPENED;
    this.callback_ = undefined;
    this.target_ = undefined; // TODO(rafaelw): Should be WeakRef
    this.directObserver_ = undefined;
    this.value_ = undefined;
    this.id_ = nextObserverId++;
  }

  Observer.prototype = {
    open: function(callback, target) {
      if (this.state_ != UNOPENED)
        throw Error('Observer has already been opened.');

      addToAll(this);
      this.callback_ = callback;
      this.target_ = target;
      this.connect_();
      this.state_ = OPENED;
      return this.value_;
    },

    close: function() {
      if (this.state_ != OPENED)
        return;

      removeFromAll(this);
      this.disconnect_();
      this.value_ = undefined;
      this.callback_ = undefined;
      this.target_ = undefined;
      this.state_ = CLOSED;
    },

    deliver: function() {
      if (this.state_ != OPENED)
        return;

      dirtyCheck(this);
    },

    report_: function(changes) {
      try {
        this.callback_.apply(this.target_, changes);
      } catch (ex) {
        Observer._errorThrownDuringCallback = true;
        console.error('Exception caught during observer callback: ' +
                       (ex.stack || ex));
      }
    },

    discardChanges: function() {
      this.check_(undefined, true);
      return this.value_;
    }
  };

  var collectObservers = !hasObserve;
  var allObservers;
  Observer._allObserversCount = 0;

  if (collectObservers) {
    allObservers = [];
  }

  function addToAll(observer) {
    Observer._allObserversCount++;
    if (!collectObservers)
      return;

    allObservers.push(observer);
  }

  function removeFromAll(observer) {
    Observer._allObserversCount--;
  }

  var runningMicrotaskCheckpoint = false;

  global.Platform = global.Platform || {};

  global.Platform.performMicrotaskCheckpoint = function() {
    if (runningMicrotaskCheckpoint)
      return;

    if (!collectObservers)
      return;

    runningMicrotaskCheckpoint = true;

    var cycles = 0;
    var anyChanged, toCheck;

    do {
      cycles++;
      toCheck = allObservers;
      allObservers = [];
      anyChanged = false;

      for (var i = 0; i < toCheck.length; i++) {
        var observer = toCheck[i];
        if (observer.state_ != OPENED)
          continue;

        if (observer.check_())
          anyChanged = true;

        allObservers.push(observer);
      }
      if (runEOMTasks())
        anyChanged = true;
    } while (cycles < MAX_DIRTY_CHECK_CYCLES && anyChanged);

    if (testingExposeCycleCount)
      global.dirtyCheckCycleCount = cycles;

    runningMicrotaskCheckpoint = false;
  };

  if (collectObservers) {
    global.Platform.clearObservers = function() {
      allObservers = [];
    };
  }

  function ObjectObserver(object) {
    Observer.call(this);
    this.value_ = object;
    this.oldObject_ = undefined;
  }

  ObjectObserver.prototype = createObject({
    __proto__: Observer.prototype,

    arrayObserve: false,

    connect_: function(callback, target) {
      if (hasObserve) {
        this.directObserver_ = getObservedObject(this, this.value_,
                                                 this.arrayObserve);
      } else {
        this.oldObject_ = this.copyObject(this.value_);
      }

    },

    copyObject: function(object) {
      var copy = Array.isArray(object) ? [] : {};
      for (var prop in object) {
        copy[prop] = object[prop];
      }
      if (Array.isArray(object))
        copy.length = object.length;
      return copy;
    },

    check_: function(changeRecords, skipChanges) {
      var diff;
      var oldValues;
      if (hasObserve) {
        if (!changeRecords)
          return false;

        oldValues = {};
        diff = diffObjectFromChangeRecords(this.value_, changeRecords,
                                           oldValues);
      } else {
        oldValues = this.oldObject_;
        diff = diffObjectFromOldObject(this.value_, this.oldObject_);
      }

      if (diffIsEmpty(diff))
        return false;

      if (!hasObserve)
        this.oldObject_ = this.copyObject(this.value_);

      this.report_([
        diff.added || {},
        diff.removed || {},
        diff.changed || {},
        function(property) {
          return oldValues[property];
        }
      ]);

      return true;
    },

    disconnect_: function() {
      if (hasObserve) {
        this.directObserver_.close();
        this.directObserver_ = undefined;
      } else {
        this.oldObject_ = undefined;
      }
    },

    deliver: function() {
      if (this.state_ != OPENED)
        return;

      if (hasObserve)
        this.directObserver_.deliver(false);
      else
        dirtyCheck(this);
    },

    discardChanges: function() {
      if (this.directObserver_)
        this.directObserver_.deliver(true);
      else
        this.oldObject_ = this.copyObject(this.value_);

      return this.value_;
    }
  });

  function ArrayObserver(array) {
    if (!Array.isArray(array))
      throw Error('Provided object is not an Array');
    ObjectObserver.call(this, array);
  }

  ArrayObserver.prototype = createObject({

    __proto__: ObjectObserver.prototype,

    arrayObserve: true,

    copyObject: function(arr) {
      return arr.slice();
    },

    check_: function(changeRecords) {
      var splices;
      if (hasObserve) {
        if (!changeRecords)
          return false;
        splices = projectArraySplices(this.value_, changeRecords);
      } else {
        splices = calcSplices(this.value_, 0, this.value_.length,
                              this.oldObject_, 0, this.oldObject_.length);
      }

      if (!splices || !splices.length)
        return false;

      if (!hasObserve)
        this.oldObject_ = this.copyObject(this.value_);

      this.report_([splices]);
      return true;
    }
  });

  ArrayObserver.applySplices = function(previous, current, splices) {
    splices.forEach(function(splice) {
      var spliceArgs = [splice.index, splice.removed.length];
      var addIndex = splice.index;
      while (addIndex < splice.index + splice.addedCount) {
        spliceArgs.push(current[addIndex]);
        addIndex++;
      }

      Array.prototype.splice.apply(previous, spliceArgs);
    });
  };

  function PathObserver(object, path, defaultValue) {
    Observer.call(this);

    this.object_ = object;
    this.path_ = getPath(path);
    this.defaultValue_ = defaultValue;
    this.directObserver_ = undefined;
  }

  PathObserver.prototype = createObject({
    __proto__: Observer.prototype,

    get path() {
      return this.path_;
    },

    connect_: function() {
      if (hasObserve)
        this.directObserver_ = getObservedSet(this, this.object_);

      this.check_(undefined, true);
    },

    disconnect_: function() {
      this.value_ = undefined;

      if (this.directObserver_) {
        this.directObserver_.close(this);
        this.directObserver_ = undefined;
      }
    },

    iterateObjects_: function(observe) {
      this.path_.iterateObjects(this.object_, observe);
    },

    check_: function(changeRecords, skipChanges) {
      var oldValue = this.value_;
      this.value_ = this.path_.getValueFrom(this.object_, this.defaultValue_);
      if (skipChanges || areSameValue(this.value_, oldValue))
        return false;

      this.report_([this.value_, oldValue, this]);
      return true;
    },

    setValue: function(newValue) {
      if (this.path_)
        this.path_.setValueFrom(this.object_, newValue);
    }
  });

  function CompoundObserver(reportChangesOnOpen) {
    Observer.call(this);

    this.reportChangesOnOpen_ = reportChangesOnOpen;
    this.value_ = [];
    this.directObserver_ = undefined;
    this.observed_ = [];
  }

  var observerSentinel = {};

  CompoundObserver.prototype = createObject({
    __proto__: Observer.prototype,

    connect_: function() {
      if (hasObserve) {
        var object;
        var needsDirectObserver = false;
        for (var i = 0; i < this.observed_.length; i += 2) {
          object = this.observed_[i];
          if (object !== observerSentinel) {
            needsDirectObserver = true;
            break;
          }
        }

        if (needsDirectObserver)
          this.directObserver_ = getObservedSet(this, object);
      }

      this.check_(undefined, !this.reportChangesOnOpen_);
    },

    disconnect_: function() {
      for (var i = 0; i < this.observed_.length; i += 2) {
        if (this.observed_[i] === observerSentinel)
          this.observed_[i + 1].close();
      }
      this.observed_.length = 0;
      this.value_.length = 0;

      if (this.directObserver_) {
        this.directObserver_.close(this);
        this.directObserver_ = undefined;
      }
    },

    addPath: function(object, path) {
      if (this.state_ != UNOPENED && this.state_ != RESETTING)
        throw Error('Cannot add paths once started.');

      path = getPath(path);
      this.observed_.push(object, path);
      if (!this.reportChangesOnOpen_)
        return;
      var index = this.observed_.length / 2 - 1;
      this.value_[index] = path.getValueFrom(object);
    },

    addObserver: function(observer) {
      if (this.state_ != UNOPENED && this.state_ != RESETTING)
        throw Error('Cannot add observers once started.');

      this.observed_.push(observerSentinel, observer);
      if (!this.reportChangesOnOpen_)
        return;
      var index = this.observed_.length / 2 - 1;
      this.value_[index] = observer.open(this.deliver, this);
    },

    startReset: function() {
      if (this.state_ != OPENED)
        throw Error('Can only reset while open');

      this.state_ = RESETTING;
      this.disconnect_();
    },

    finishReset: function() {
      if (this.state_ != RESETTING)
        throw Error('Can only finishReset after startReset');
      this.state_ = OPENED;
      this.connect_();

      return this.value_;
    },

    iterateObjects_: function(observe) {
      var object;
      for (var i = 0; i < this.observed_.length; i += 2) {
        object = this.observed_[i];
        if (object !== observerSentinel)
          this.observed_[i + 1].iterateObjects(object, observe);
      }
    },

    check_: function(changeRecords, skipChanges) {
      var oldValues;
      for (var i = 0; i < this.observed_.length; i += 2) {
        var object = this.observed_[i];
        var path = this.observed_[i+1];
        var value;
        if (object === observerSentinel) {
          var observable = path;
          value = this.state_ === UNOPENED ?
              observable.open(this.deliver, this) :
              observable.discardChanges();
        } else {
          value = path.getValueFrom(object);
        }

        if (skipChanges) {
          this.value_[i / 2] = value;
          continue;
        }

        if (areSameValue(value, this.value_[i / 2]))
          continue;

        oldValues = oldValues || [];
        oldValues[i / 2] = this.value_[i / 2];
        this.value_[i / 2] = value;
      }

      if (!oldValues)
        return false;

      // TODO(rafaelw): Having observed_ as the third callback arg here is
      // pretty lame API. Fix.
      this.report_([this.value_, oldValues, this.observed_]);
      return true;
    }
  });

  function identFn(value) { return value; }

  function ObserverTransform(observable, getValueFn, setValueFn,
                             dontPassThroughSet) {
    this.callback_ = undefined;
    this.target_ = undefined;
    this.value_ = undefined;
    this.observable_ = observable;
    this.getValueFn_ = getValueFn || identFn;
    this.setValueFn_ = setValueFn || identFn;
    // TODO(rafaelw): This is a temporary hack. PolymerExpressions needs this
    // at the moment because of a bug in it's dependency tracking.
    this.dontPassThroughSet_ = dontPassThroughSet;
  }

  ObserverTransform.prototype = {
    open: function(callback, target) {
      this.callback_ = callback;
      this.target_ = target;
      this.value_ =
          this.getValueFn_(this.observable_.open(this.observedCallback_, this));
      return this.value_;
    },

    observedCallback_: function(value) {
      value = this.getValueFn_(value);
      if (areSameValue(value, this.value_))
        return;
      var oldValue = this.value_;
      this.value_ = value;
      this.callback_.call(this.target_, this.value_, oldValue);
    },

    discardChanges: function() {
      this.value_ = this.getValueFn_(this.observable_.discardChanges());
      return this.value_;
    },

    deliver: function() {
      return this.observable_.deliver();
    },

    setValue: function(value) {
      value = this.setValueFn_(value);
      if (!this.dontPassThroughSet_ && this.observable_.setValue)
        return this.observable_.setValue(value);
    },

    close: function() {
      if (this.observable_)
        this.observable_.close();
      this.callback_ = undefined;
      this.target_ = undefined;
      this.observable_ = undefined;
      this.value_ = undefined;
      this.getValueFn_ = undefined;
      this.setValueFn_ = undefined;
    }
  };

  var expectedRecordTypes = {
    add: true,
    update: true,
    delete: true
  };

  function diffObjectFromChangeRecords(object, changeRecords, oldValues) {
    var added = {};
    var removed = {};

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];
      if (!expectedRecordTypes[record.type]) {
        console.error('Unknown changeRecord type: ' + record.type);
        console.error(record);
        continue;
      }

      if (!(record.name in oldValues))
        oldValues[record.name] = record.oldValue;

      if (record.type == 'update')
        continue;

      if (record.type == 'add') {
        if (record.name in removed)
          delete removed[record.name];
        else
          added[record.name] = true;

        continue;
      }

      // type = 'delete'
      if (record.name in added) {
        delete added[record.name];
        delete oldValues[record.name];
      } else {
        removed[record.name] = true;
      }
    }

    var prop;
    for (prop in added)
      added[prop] = object[prop];

    for (prop in removed)
      removed[prop] = undefined;

    var changed = {};
    for (prop in oldValues) {
      if (prop in added || prop in removed)
        continue;

      var newValue = object[prop];
      if (oldValues[prop] !== newValue)
        changed[prop] = newValue;
    }

    return {
      added: added,
      removed: removed,
      changed: changed
    };
  }

  function newSplice(index, removed, addedCount) {
    return {
      index: index,
      removed: removed,
      addedCount: addedCount
    };
  }

  var EDIT_LEAVE = 0;
  var EDIT_UPDATE = 1;
  var EDIT_ADD = 2;
  var EDIT_DELETE = 3;

  function ArraySplice() {}

  ArraySplice.prototype = {

    // Note: This function is *based* on the computation of the Levenshtein
    // "edit" distance. The one change is that "updates" are treated as two
    // edits - not one. With Array splices, an update is really a delete
    // followed by an add. By retaining this, we optimize for "keeping" the
    // maximum array items in the original array. For example:
    //
    //   'xxxx123' -> '123yyyy'
    //
    // With 1-edit updates, the shortest path would be just to update all seven
    // characters. With 2-edit updates, we delete 4, leave 3, and add 4. This
    // leaves the substring '123' intact.
    calcEditDistances: function(current, currentStart, currentEnd,
                                old, oldStart, oldEnd) {
      // "Deletion" columns
      var rowCount = oldEnd - oldStart + 1;
      var columnCount = currentEnd - currentStart + 1;
      var distances = new Array(rowCount);

      var i, j;

      // "Addition" rows. Initialize null column.
      for (i = 0; i < rowCount; i++) {
        distances[i] = new Array(columnCount);
        distances[i][0] = i;
      }

      // Initialize null row
      for (j = 0; j < columnCount; j++)
        distances[0][j] = j;

      for (i = 1; i < rowCount; i++) {
        for (j = 1; j < columnCount; j++) {
          if (this.equals(current[currentStart + j - 1], old[oldStart + i - 1]))
            distances[i][j] = distances[i - 1][j - 1];
          else {
            var north = distances[i - 1][j] + 1;
            var west = distances[i][j - 1] + 1;
            distances[i][j] = north < west ? north : west;
          }
        }
      }

      return distances;
    },

    // This starts at the final weight, and walks "backward" by finding
    // the minimum previous weight recursively until the origin of the weight
    // matrix.
    spliceOperationsFromEditDistances: function(distances) {
      var i = distances.length - 1;
      var j = distances[0].length - 1;
      var current = distances[i][j];
      var edits = [];
      while (i > 0 || j > 0) {
        if (i == 0) {
          edits.push(EDIT_ADD);
          j--;
          continue;
        }
        if (j == 0) {
          edits.push(EDIT_DELETE);
          i--;
          continue;
        }
        var northWest = distances[i - 1][j - 1];
        var west = distances[i - 1][j];
        var north = distances[i][j - 1];

        var min;
        if (west < north)
          min = west < northWest ? west : northWest;
        else
          min = north < northWest ? north : northWest;

        if (min == northWest) {
          if (northWest == current) {
            edits.push(EDIT_LEAVE);
          } else {
            edits.push(EDIT_UPDATE);
            current = northWest;
          }
          i--;
          j--;
        } else if (min == west) {
          edits.push(EDIT_DELETE);
          i--;
          current = west;
        } else {
          edits.push(EDIT_ADD);
          j--;
          current = north;
        }
      }

      edits.reverse();
      return edits;
    },

    /**
     * Splice Projection functions:
     *
     * A splice map is a representation of how a previous array of items
     * was transformed into a new array of items. Conceptually it is a list of
     * tuples of
     *
     *   <index, removed, addedCount>
     *
     * which are kept in ascending index order of. The tuple represents that at
     * the |index|, |removed| sequence of items were removed, and counting forward
     * from |index|, |addedCount| items were added.
     */

    /**
     * Lacking individual splice mutation information, the minimal set of
     * splices can be synthesized given the previous state and final state of an
     * array. The basic approach is to calculate the edit distance matrix and
     * choose the shortest path through it.
     *
     * Complexity: O(l * p)
     *   l: The length of the current array
     *   p: The length of the old array
     */
    calcSplices: function(current, currentStart, currentEnd,
                          old, oldStart, oldEnd) {
      var prefixCount = 0;
      var suffixCount = 0;

      var minLength = Math.min(currentEnd - currentStart, oldEnd - oldStart);
      if (currentStart == 0 && oldStart == 0)
        prefixCount = this.sharedPrefix(current, old, minLength);

      if (currentEnd == current.length && oldEnd == old.length)
        suffixCount = this.sharedSuffix(current, old, minLength - prefixCount);

      currentStart += prefixCount;
      oldStart += prefixCount;
      currentEnd -= suffixCount;
      oldEnd -= suffixCount;

      if (currentEnd - currentStart == 0 && oldEnd - oldStart == 0)
        return [];

      var splice;
      if (currentStart == currentEnd) {
        splice = newSplice(currentStart, [], 0);
        while (oldStart < oldEnd)
          splice.removed.push(old[oldStart++]);

        return [ splice ];
      } else if (oldStart == oldEnd)
        return [ newSplice(currentStart, [], currentEnd - currentStart) ];

      var ops = this.spliceOperationsFromEditDistances(
          this.calcEditDistances(current, currentStart, currentEnd,
                                 old, oldStart, oldEnd));

      var splices = [];
      var index = currentStart;
      var oldIndex = oldStart;
      for (var i = 0; i < ops.length; i++) {
        switch(ops[i]) {
          case EDIT_LEAVE:
            if (splice) {
              splices.push(splice);
              splice = undefined;
            }

            index++;
            oldIndex++;
            break;
          case EDIT_UPDATE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
          case EDIT_ADD:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.addedCount++;
            index++;
            break;
          case EDIT_DELETE:
            if (!splice)
              splice = newSplice(index, [], 0);

            splice.removed.push(old[oldIndex]);
            oldIndex++;
            break;
        }
      }

      if (splice) {
        splices.push(splice);
      }
      return splices;
    },

    sharedPrefix: function(current, old, searchLength) {
      for (var i = 0; i < searchLength; i++)
        if (!this.equals(current[i], old[i]))
          return i;
      return searchLength;
    },

    sharedSuffix: function(current, old, searchLength) {
      var index1 = current.length;
      var index2 = old.length;
      var count = 0;
      while (count < searchLength && this.equals(current[--index1], old[--index2]))
        count++;

      return count;
    },

    calculateSplices: function(current, previous) {
      return this.calcSplices(current, 0, current.length, previous, 0,
                              previous.length);
    },

    equals: function(currentValue, previousValue) {
      return currentValue === previousValue;
    }
  };

  var arraySplice = new ArraySplice();

  function calcSplices(current, currentStart, currentEnd,
                       old, oldStart, oldEnd) {
    return arraySplice.calcSplices(current, currentStart, currentEnd,
                                   old, oldStart, oldEnd);
  }

  function intersect(start1, end1, start2, end2) {
    // Disjoint
    if (end1 < start2 || end2 < start1)
      return -1;

    // Adjacent
    if (end1 == start2 || end2 == start1)
      return 0;

    // Non-zero intersect, span1 first
    if (start1 < start2) {
      if (end1 < end2)
        return end1 - start2; // Overlap
      else
        return end2 - start2; // Contained
    } else {
      // Non-zero intersect, span2 first
      if (end2 < end1)
        return end2 - start1; // Overlap
      else
        return end1 - start1; // Contained
    }
  }

  function mergeSplice(splices, index, removed, addedCount) {

    var splice = newSplice(index, removed, addedCount);

    var inserted = false;
    var insertionOffset = 0;

    for (var i = 0; i < splices.length; i++) {
      var current = splices[i];
      current.index += insertionOffset;

      if (inserted)
        continue;

      var intersectCount = intersect(splice.index,
                                     splice.index + splice.removed.length,
                                     current.index,
                                     current.index + current.addedCount);

      if (intersectCount >= 0) {
        // Merge the two splices

        splices.splice(i, 1);
        i--;

        insertionOffset -= current.addedCount - current.removed.length;

        splice.addedCount += current.addedCount - intersectCount;
        var deleteCount = splice.removed.length +
                          current.removed.length - intersectCount;

        if (!splice.addedCount && !deleteCount) {
          // merged splice is a noop. discard.
          inserted = true;
        } else {
          removed = current.removed;

          if (splice.index < current.index) {
            // some prefix of splice.removed is prepended to current.removed.
            var prepend = splice.removed.slice(0, current.index - splice.index);
            Array.prototype.push.apply(prepend, removed);
            removed = prepend;
          }

          if (splice.index + splice.removed.length > current.index + current.addedCount) {
            // some suffix of splice.removed is appended to current.removed.
            var append = splice.removed.slice(current.index + current.addedCount - splice.index);
            Array.prototype.push.apply(removed, append);
          }

          splice.removed = removed;
          if (current.index < splice.index) {
            splice.index = current.index;
          }
        }
      } else if (splice.index < current.index) {
        // Insert splice here.

        inserted = true;

        splices.splice(i, 0, splice);
        i++;

        var offset = splice.addedCount - splice.removed.length;
        current.index += offset;
        insertionOffset += offset;
      }
    }

    if (!inserted)
      splices.push(splice);
  }

  function createInitialSplices(array, changeRecords) {
    var splices = [];

    for (var i = 0; i < changeRecords.length; i++) {
      var record = changeRecords[i];
      switch(record.type) {
        case 'splice':
          mergeSplice(splices, record.index, record.removed.slice(), record.addedCount);
          break;
        case 'add':
        case 'update':
        case 'delete':
          if (!isIndex(record.name))
            continue;
          var index = toNumber(record.name);
          if (index < 0)
            continue;
          mergeSplice(splices, index, [record.oldValue], 1);
          break;
        default:
          console.error('Unexpected record type: ' + JSON.stringify(record));
          break;
      }
    }

    return splices;
  }

  function projectArraySplices(array, changeRecords) {
    var splices = [];

    createInitialSplices(array, changeRecords).forEach(function(splice) {
      if (splice.addedCount == 1 && splice.removed.length == 1) {
        if (splice.removed[0] !== array[splice.index])
          splices.push(splice);

        return;
      }

      splices = splices.concat(calcSplices(array, splice.index, splice.index + splice.addedCount,
                                           splice.removed, 0, splice.removed.length));
    });

    return splices;
  }

  // Export the observe-js object for **Node.js**, with backwards-compatibility
  // for the old `require()` API. Also ensure `exports` is not a DOM Element.
  // If we're in the browser, export as a global object.

  var expose = global;

  if (typeof exports !== 'undefined' && !exports.nodeType) {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports;
    }
    expose = exports;
  }

  expose.Observer = Observer;
  expose.Observer.runEOM_ = runEOM;
  expose.Observer.observerSentinel_ = observerSentinel; // for testing.
  expose.Observer.hasObjectObserve = hasObserve;
  expose.ArrayObserver = ArrayObserver;
  expose.ArrayObserver.calculateSplices = function(current, previous) {
    return arraySplice.calculateSplices(current, previous);
  };

  expose.ArraySplice = ArraySplice;
  expose.ObjectObserver = ObjectObserver;
  expose.PathObserver = PathObserver;
  expose.CompoundObserver = CompoundObserver;
  expose.Path = Path;
  expose.ObserverTransform = ObserverTransform;

})(typeof global !== 'undefined' && global && typeof module !== 'undefined' && module ? global : this || window);

// Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
// This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
// The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
// The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
// Code distributed by Google as part of the polymer project is also
// subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt

(function(global) {
  'use strict';

  var filter = Array.prototype.filter.call.bind(Array.prototype.filter);

  function getTreeScope(node) {
    while (node.parentNode) {
      node = node.parentNode;
    }

    return typeof node.getElementById === 'function' ? node : null;
  }

  Node.prototype.bind = function(name, observable) {
    console.error('Unhandled binding to Node: ', this, name, observable);
  };

  Node.prototype.bindFinished = function() {};

  function updateBindings(node, name, binding) {
    var bindings = node.bindings_;
    if (!bindings)
      bindings = node.bindings_ = {};

    if (bindings[name])
      bindings[name].close();

    return bindings[name] = binding;
  }

  function returnBinding(node, name, binding) {
    return binding;
  }

  function sanitizeValue(value) {
    return value == null ? '' : value;
  }

  function updateText(node, value) {
    node.data = sanitizeValue(value);
  }

  function textBinding(node) {
    return function(value) {
      return updateText(node, value);
    };
  }

  var maybeUpdateBindings = returnBinding;

  Object.defineProperty(Platform, 'enableBindingsReflection', {
    get: function() {
      return maybeUpdateBindings === updateBindings;
    },
    set: function(enable) {
      maybeUpdateBindings = enable ? updateBindings : returnBinding;
      return enable;
    },
    configurable: true
  });

  Text.prototype.bind = function(name, value, oneTime) {
    if (name !== 'textContent')
      return Node.prototype.bind.call(this, name, value, oneTime);

    if (oneTime)
      return updateText(this, value);

    var observable = value;
    updateText(this, observable.open(textBinding(this)));
    return maybeUpdateBindings(this, name, observable);
  }

  function updateAttribute(el, name, conditional, value) {
    if (conditional) {
      if (value)
        el.setAttribute(name, '');
      else
        el.removeAttribute(name);
      return;
    }

    el.setAttribute(name, sanitizeValue(value));
  }

  function attributeBinding(el, name, conditional) {
    return function(value) {
      updateAttribute(el, name, conditional, value);
    };
  }

  Element.prototype.bind = function(name, value, oneTime) {
    var conditional = name[name.length - 1] == '?';
    if (conditional) {
      this.removeAttribute(name);
      name = name.slice(0, -1);
    }

    if (oneTime)
      return updateAttribute(this, name, conditional, value);


    var observable = value;
    updateAttribute(this, name, conditional,
        observable.open(attributeBinding(this, name, conditional)));

    return maybeUpdateBindings(this, name, observable);
  };

  var checkboxEventType;
  (function() {
    // Attempt to feature-detect which event (change or click) is fired first
    // for checkboxes.
    var div = document.createElement('div');
    var checkbox = div.appendChild(document.createElement('input'));
    checkbox.setAttribute('type', 'checkbox');
    var first;
    var count = 0;
    checkbox.addEventListener('click', function(e) {
      count++;
      first = first || 'click';
    });
    checkbox.addEventListener('change', function() {
      count++;
      first = first || 'change';
    });

    var event = document.createEvent('MouseEvent');
    event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false,
        false, false, false, 0, null);
    checkbox.dispatchEvent(event);
    // WebKit/Blink don't fire the change event if the element is outside the
    // document, so assume 'change' for that case.
    checkboxEventType = count == 1 ? 'change' : first;
  })();

  function getEventForInputType(element) {
    switch (element.type) {
      case 'checkbox':
        return checkboxEventType;
      case 'radio':
      case 'select-multiple':
      case 'select-one':
        return 'change';
      case 'range':
        if (/Trident|MSIE/.test(navigator.userAgent))
          return 'change';
      default:
        return 'input';
    }
  }

  function updateInput(input, property, value, santizeFn) {
    input[property] = (santizeFn || sanitizeValue)(value);
  }

  function inputBinding(input, property, santizeFn) {
    return function(value) {
      return updateInput(input, property, value, santizeFn);
    }
  }

  function noop() {}

  function bindInputEvent(input, property, observable, postEventFn) {
    var eventType = getEventForInputType(input);

    function eventHandler() {
      var isNum = property == 'value' && input.type == 'number';
      observable.setValue(isNum ? input.valueAsNumber : input[property]);
      observable.discardChanges();
      (postEventFn || noop)(input);
      Platform.performMicrotaskCheckpoint();
    }
    input.addEventListener(eventType, eventHandler);

    return {
      close: function() {
        input.removeEventListener(eventType, eventHandler);
        observable.close();
      },

      observable_: observable
    }
  }

  function booleanSanitize(value) {
    return Boolean(value);
  }

  // |element| is assumed to be an HTMLInputElement with |type| == 'radio'.
  // Returns an array containing all radio buttons other than |element| that
  // have the same |name|, either in the form that |element| belongs to or,
  // if no form, in the document tree to which |element| belongs.
  //
  // This implementation is based upon the HTML spec definition of a
  // "radio button group":
  //   http://www.whatwg.org/specs/web-apps/current-work/multipage/number-state.html#radio-button-group
  //
  function getAssociatedRadioButtons(element) {
    if (element.form) {
      return filter(element.form.elements, function(el) {
        return el != element &&
            el.tagName == 'INPUT' &&
            el.type == 'radio' &&
            el.name == element.name;
      });
    } else {
      var treeScope = getTreeScope(element);
      if (!treeScope)
        return [];
      var radios = treeScope.querySelectorAll(
          'input[type="radio"][name="' + element.name + '"]');
      return filter(radios, function(el) {
        return el != element && !el.form;
      });
    }
  }

  function checkedPostEvent(input) {
    // Only the radio button that is getting checked gets an event. We
    // therefore find all the associated radio buttons and update their
    // check binding manually.
    if (input.tagName === 'INPUT' &&
        input.type === 'radio') {
      getAssociatedRadioButtons(input).forEach(function(radio) {
        var checkedBinding = radio.bindings_.checked;
        if (checkedBinding) {
          // Set the value directly to avoid an infinite call stack.
          checkedBinding.observable_.setValue(false);
        }
      });
    }
  }

  HTMLInputElement.prototype.bind = function(name, value, oneTime) {
    if (name !== 'value' && name !== 'checked')
      return HTMLElement.prototype.bind.call(this, name, value, oneTime);

    this.removeAttribute(name);
    var sanitizeFn = name == 'checked' ? booleanSanitize : sanitizeValue;
    var postEventFn = name == 'checked' ? checkedPostEvent : noop;

    if (oneTime)
      return updateInput(this, name, value, sanitizeFn);


    var observable = value;
    var binding = bindInputEvent(this, name, observable, postEventFn);
    updateInput(this, name,
                observable.open(inputBinding(this, name, sanitizeFn)),
                sanitizeFn);

    // Checkboxes may need to update bindings of other checkboxes.
    return updateBindings(this, name, binding);
  }

  HTMLTextAreaElement.prototype.bind = function(name, value, oneTime) {
    if (name !== 'value')
      return HTMLElement.prototype.bind.call(this, name, value, oneTime);

    this.removeAttribute('value');

    if (oneTime)
      return updateInput(this, 'value', value);

    var observable = value;
    var binding = bindInputEvent(this, 'value', observable);
    updateInput(this, 'value',
                observable.open(inputBinding(this, 'value', sanitizeValue)));
    return maybeUpdateBindings(this, name, binding);
  }

  function updateOption(option, value) {
    var parentNode = option.parentNode;;
    var select;
    var selectBinding;
    var oldValue;
    if (parentNode instanceof HTMLSelectElement &&
        parentNode.bindings_ &&
        parentNode.bindings_.value) {
      select = parentNode;
      selectBinding = select.bindings_.value;
      oldValue = select.value;
    }

    option.value = sanitizeValue(value);

    if (select && select.value != oldValue) {
      selectBinding.observable_.setValue(select.value);
      selectBinding.observable_.discardChanges();
      Platform.performMicrotaskCheckpoint();
    }
  }

  function optionBinding(option) {
    return function(value) {
      updateOption(option, value);
    }
  }

  HTMLOptionElement.prototype.bind = function(name, value, oneTime) {
    if (name !== 'value')
      return HTMLElement.prototype.bind.call(this, name, value, oneTime);

    this.removeAttribute('value');

    if (oneTime)
      return updateOption(this, value);

    var observable = value;
    var binding = bindInputEvent(this, 'value', observable);
    updateOption(this, observable.open(optionBinding(this)));
    return maybeUpdateBindings(this, name, binding);
  }

  HTMLSelectElement.prototype.bind = function(name, value, oneTime) {
    if (name === 'selectedindex')
      name = 'selectedIndex';

    if (name !== 'selectedIndex' && name !== 'value')
      return HTMLElement.prototype.bind.call(this, name, value, oneTime);

    this.removeAttribute(name);

    if (oneTime)
      return updateInput(this, name, value);

    var observable = value;
    var binding = bindInputEvent(this, name, observable);
    updateInput(this, name,
                observable.open(inputBinding(this, name)));

    // Option update events may need to access select bindings.
    return updateBindings(this, name, binding);
  }
})(this);

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical=root.elliptical || {};
        root.elliptical.observable=root.elliptical.observable || {};
        root.elliptical.observable.report = factory(root.elliptical.utils);
        root.returnExports=root.elliptical.observable.report;
    }
}(this, function (utils) {

    var string=utils.string;


    return {

        /**
         * converts a delimited path into an array of props
         * 'items.0.FirstName' --> [items,0,FirstName]
         *
         * @param path {String}
         * @param separator {String}
         * @returns {Array}
         */
        splitPath:function(path,separator){
            if (typeof separator == 'undefined') {
                separator = '.';
            }
            if ((typeof path ==='undefined') || path === '') {
                return [];
            } else {
                if (Array.isArray(path)) {
                    return path.slice(0);
                } else {
                    return path.toString().split(separator);
                }
            }
        },

        /**
         * resolves the value of an object path
         * obj, 'items.0.FirstName'  --> 'John'
         *
         * @param obj {Object}
         * @param path {String}
         * @returns value {Object}
         */
        getObjValueByPath: function(obj,path){
            try{
                var pathArray=this.splitPath(path);
                var a=obj;
                pathArray.forEach(function(p){
                    var b=a[p];
                    a=b;
                });
                return a;
            }catch(ex){
                return undefined;
            }
        },

        /**
         * sets the value of an object path
         * @param obj {Object}
         * @param path {String}
         * @param value {Object}
         */
        setObjValueByPath:function(obj,path,value){
            try{
                var pathArray=this.splitPath(path);
                var a=obj;
                var len=pathArray.length;
                var max=len-1;
                for(var i=0;i<len;i++){
                    if(i===max){
                        a[pathArray[i]]=value;
                    } else{
                        var b=a[pathArray[i]];
                        a=b;
                    }
                }
            }catch(ex){

            }
        },

        /**
         * maps dot normalized path a.i.b to bracket format: a[i]b
         * @param path {String}
         * @returns {String}
         */
        bracketPathFormat:function(path){
            var arr=this.splitPath(path);
            var num=utils.isNumeric;
            if(arr && arr.length){
                var mapped=arr.map(function(v){
                    return (num(v)) ? '['+ v.toString() + ']' : v;
                });

                return mapped.join('.').replace(/.\[/,'[');

            }else{
                return path;
            }
        },

        /**
         * returns an object of changed props when comparing new object with old object
         * @param n {Object}
         * @param o {Object}
         * @returns {Object}
         */
        objChangedProps:function(n,o){
            var obj={};
            var keys= this.keys(n);
            keys.forEach(function(v){
                if(!(utils.isEqual(n[v],o[v]))){
                    obj[v]=n[v];
                }
            });
            return obj;
        },

        /**
         *
         * @param obj
         * @param index
         * @returns {boolean}
         */
        isPropertyArray:function(obj,index){
            try{
                var o=obj[Object.keys(obj)[index]];
                return !!((Array.isArray(o)));
            }catch(ex){
                return false;
            }
        },

        /**
         * gets the value of an object prop by index
         * @param obj {Object}
         * @param index {Number}
         * @returns value
         */
        propertyByIndex:function(obj,index){
            return obj[Object.keys(obj)[index]];
        },


        /**
         * change record entity
         */
        changeRecord:{
            get entity(){
                return{
                    object:undefined,
                    value:undefined,
                    oldValue:undefined,
                    path:undefined,
                    name:undefined,
                    root:undefined

                }
            },

            get result(){
                return {
                    added:[],
                    changed:[],
                    removed:[]
                };
            }
        },

        /**
         *
         * @param obj
         * @returns {Array}
         */
        keys:function(obj){
            var keys=[];
            for(var prop in obj){
                if (obj.hasOwnProperty(prop)) {
                    keys.push(prop);
                }
            }
            return keys;
        },

        /**
         *
         * @param obj
         * @returns {*}
         */
        isArrayList: function (obj) {
            if (Array.isArray(obj)) {
                return obj;
            } else {
                var keys = this.keys(obj).length;
                if (keys > 1) {
                    return null;
                } else {
                    //else if keys <=1, test if first prop is an array list
                    var o = obj[Object.keys(obj)[0]];
                    return (Array.isArray(o)) ? o : null;
                }
            }

        },

        /**
         *
         * @param p
         * @returns {void|string|*|Chartist.Svg|XML}
         */
        pathReplace:function(p){
            var n= p.replace(/\//g,'.');
            if(string.firstChar(n)==='.'){
                n=string.trimFirstChar(n);
            }
            return n;
        },

        /**
         *
         * @param obj
         * @param changeRecords
         * @returns {*}
         */
        objDiffReport:function(obj,changeRecords){
            var result=this.changeRecord.result;
            var self=this;
            var _o=this.isArrayList(obj);
            var path_;
            if(changeRecords && changeRecords.length){
                changeRecords.forEach(function(c){
                    if(_o){
                        if(c.addedCount && c.addedCount>0 && c.type==='splice'){
                            result.added.push(c.object[c.index]);
                        }
                        if(c.removed && c.removed.length>0 && c.type==='splice'){
                            result.removed=result.removed.concat(c.removed);
                        }
                        if(c.type==='update'){
                            path_=self.pathReplace(c.path);
                            var u_={
                                object: c.object,
                                value: c.value,
                                oldValue: c.oldValue,
                                path: path_,
                                name: c.name,
                                root: c.root
                            };
                            result.changed.push(u_);
                        }
                    }else{
                        path_=self.pathReplace(c.path);
                        var chg_={
                            object: c.object,
                            value:c.object[c.name],
                            oldValue: c.oldValue,
                            path:path_,
                            name: c.name,
                            root: c.root
                        };

                        result.changed.push(chg_);
                    }
                });
            }

            return result;
        }


    };
}));


(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('observe-js'),require('nested-observe'),require('./report'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['observe-js','nested-observe','./report'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root,root.Nested,root.elliptical.observable);
    }
}(this, function (global,Nested,observable) {

    var report=observable.report;

    /* necessary  private method/variable definitions copied over from observe-js ************************************************** */

    // Detect and do basic sanity checking on Object/Array.observe.
    function detectObjectObserve() {
        if (typeof Object.observe !== 'function' ||
            typeof Array.observe !== 'function') {
            return false;
        }

        var records = [];

        function callback(recs) {
            records = recs;
        }

        var test = {};
        var arr = [];
        Object.observe(test, callback);
        Array.observe(arr, callback);
        test.id = 1;
        test.id = 2;
        delete test.id;
        arr.push(1, 2);
        arr.length = 0;

        Object.deliverChangeRecords(callback);
        if (records.length !== 5)
            return false;

        if (records[0].type != 'add' ||
            records[1].type != 'update' ||
            records[2].type != 'delete' ||
            records[3].type != 'splice' ||
            records[4].type != 'splice') {
            return false;
        }

        Object.unobserve(test, callback);
        Array.unobserve(arr, callback);

        return true;
    }

    var hasObserve = detectObjectObserve();

    var OPENED = 1;

    function diffObjectFromOldObject(object, oldObject) {
        var added = {};
        var removed = {};
        var changed = {};
        var prop;

        for (prop in oldObject) {
            var newValue = object[prop];

            if (newValue !== undefined && newValue === oldObject[prop])
                continue;

            if (!(prop in object)) {
                removed[prop] = undefined;
                continue;
            }

            if (newValue !== oldObject[prop])
                changed[prop] = newValue;
        }

        for (prop in object) {
            if (prop in oldObject)
                continue;

            added[prop] = object[prop];
        }

        if (Array.isArray(object) && object.length !== oldObject.length)
            changed.length = object.length;

        return {
            added: added,
            removed: removed,
            changed: changed
        };
    }
    function getObservedObject(observer, object, arrayObserve) {
        var dir = observedObjectCache.pop() || newObservedObject();
        dir.open(observer);
        dir.observe(object, arrayObserve);
        return dir;
    }

    var observedObjectCache = [];

    function newObservedObject() {
        var observer;
        var object;
        var discardRecords = false;
        var first = true;

        function callback(records) {
            if (observer && observer.state_ === OPENED && !discardRecords)
                observer.check_(records);
        }
        return {
            open: function(obs) {
                if (observer)
                    throw Error('ObservedObject in use');

                if (!first)
                    Object.deliverChangeRecords(callback);

                observer = obs;
                first = false;
            },
            observe: function(obj, arrayObserve) {
                object = obj;
                if (arrayObserve)
                    Array.observe(object, callback);
                else
                    Object.observe(object, callback);
            },
            deliver: function(discard) {
                discardRecords = discard;
                Object.deliverChangeRecords(callback);
                discardRecords = false;
            },
            close: function() {
                observer = undefined;
                Object.unobserve(object, callback);
                observedObjectCache.push(this);
            }
        };
    }

    var expectedRecordTypes = {
        add: true,
        update: true,
        delete: true
    };


    function diffObjectFromChangeRecords(object, changeRecords, oldValues) {
        var added = {};
        var removed = {};

        for (var i = 0; i < changeRecords.length; i++) {
            var record = changeRecords[i];
            if (!expectedRecordTypes[record.type]) {
                console.error('Unknown changeRecord type: ' + record.type);
                console.error(record);
                continue;
            }

            if (!(record.name in oldValues))
                oldValues[record.name] = record.oldValue;

            if (record.type == 'update')
                continue;

            if (record.type == 'add') {
                if (record.name in removed)
                    delete removed[record.name];
                else
                    added[record.name] = true;

                continue;
            }

            // type = 'delete'
            if (record.name in added) {
                delete added[record.name];
                delete oldValues[record.name];
            } else {
                removed[record.name] = true;
            }
        }

        for (var prop in added)
            added[prop] = object[prop];

        for (var prop in removed)
            removed[prop] = undefined;

        var changed = {};
        for (var prop in oldValues) {
            if (prop in added || prop in removed)
                continue;

            var newValue = object[prop];
            if (oldValues[prop] !== newValue)
                changed[prop] = newValue;
        }

        return {
            added: added,
            removed: removed,
            changed: changed
        };
    }
    /* end of private method/variable declarations ****************************************************************/

    /* observable component only uses the Polymer ObjectObserver and PathObserver implementations. It also uses
     its own object change report implementation
     */

    /* overwrite the ObjectObserver Constructor
     *  Note: if no id prop is passed to the constructor, the entire implementation defaults to the standard polymer one, including
     *  the change reporting
     * */

    //first, save the prototype
    var ObjectObserver_prototype=ObjectObserver.prototype;

    //modify the constructor
    ObjectObserver= function(object,override){
        Observer.call(this);
        this.value_ = object;
        this.oldObject_ = undefined;
        /* modification */
        this._override=override;
    };
    //reassign the old prototype back to the modified constructor
    ObjectObserver.prototype=ObjectObserver_prototype;

    //modifications to prototype methods to allow component report
    ObjectObserver.prototype.connect_=function(){
        /* modification
         * if __override exists on the Observer prototype, we implement component assignment
         *
         note: observable component shims Object.observe, so there is no hasObserve if..else condition for component implementation
         */
        if(this._override !==undefined){
            //component assignment, use nested-observe for deliver changes, allowing for deep observe changes
            Nested.observe(this.value_,this.check_.bind(this));
        }else{
            //polymer assignment
            if (hasObserve) {
                this.directObserver_ = getObservedObject(this, this.value_,
                    this.arrayObserve);
            } else {
                this.oldObject_ = this.copyObject(this.value_);
            }
        }

    };
    ObjectObserver.prototype.check_=function(changeRecords, skipChanges) {
        /* modification
         * if _override not undefined on the Observer prototype, we implement component deep change reporting
         * */

        if(this._override !==undefined){
            //component reporting
            var diff_;
            if (!changeRecords){
                return false;
            }
            diff_=report.objDiffReport(this.value_,changeRecords);
            this.callback_.call(this,diff_);

            return true;

        }else{
            //polymer reporting
            var diff;
            var oldValues;
            if (hasObserve) {
                if (!changeRecords)
                    return false;

                oldValues = {};
                diff = diffObjectFromChangeRecords(this.value_, changeRecords,
                    oldValues);
            } else {
                oldValues = this.oldObject_;
                diff = diffObjectFromOldObject(this.value_, this.oldObject_);
            }

            if (diffIsEmpty(diff))
                return false;

            if (!hasObserve)
                this.oldObject_ = this.copyObject(this.value_);

            this.report_([
                diff.added || {},
                diff.removed || {},
                diff.changed || {},
                function(property) {
                    return oldValues[property];
                }
            ]);

            return true;
        }

    };

    ObjectObserver.prototype.disconnect_=function(){
        //component disconnect
        if(this._override !==undefined){
            Nested.unobserve(this.value_,function(){});
        }else{
            //polymer disconnect
            if (hasObserve) {
                this.directObserver_.close();
                this.directObserver_ = undefined;
            } else {
                this.oldObject_ = undefined;
            }
        }
    };



    global.ObjectObserver=ObjectObserver;



    return global;

}));

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical=root.elliptical || {};
        root.elliptical.observable=root.elliptical.observable || {};
        root.elliptical.observable.cache = factory();
        root.returnExports = root.elliptical.observable.cache;
    }
}(this, function () {

    return {
        /**
         *
         * @private
         */
        _initCache:function(){
            var $cache=this.$cache();
            this._data.set('$cache',$cache);
        },

        /**
         *
         * @returns {{reset: Function, set: Function, get: Function}}
         */
        $cache:function(){
            var cache={};
            var count=1;
            return {
                reset:function(){
                    count=1;
                    cache={};
                },

                set:function(node,data){
                    if(!node.__data){
                        node.__data=count++;
                    }
                    cache[node.__data]=data;
                },

                get:function(node){
                    return cache[node.__data];
                }
            }
        },

        _disposeCache:function(){
            var $cache=this._data.get('$cache');
            $cache=null;
        },

        /**
         *
         * @private
         */
        _dispose:function(){
            this._disposeCache();
            if(this._super){
                this._super();
            }
        }
    };


}));


//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-event'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-event'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.observable=root.elliptical.observable || {};
        root.elliptical.observable.pubsub = factory(root.elliptical.Event);
        root.returnExports = root.elliptical.observable.pubsub;
    }
}(this, function (Event) {

    return {

        /**
         * publish data to channel
         * @param {string} channel
         * @param {object} data
         * @private
         */
        _publish: function(channel,data){
            Event.emit(channel,data);
        },

        /**
         * subscribe to data/message over channel
         * @param {string} channel
         * @param {function} fn
         * @private
         */
        _subscribe:function(channel,fn){
            var subscriptions=this._data.get('subscriptions');
            if(!subscriptions){
                subscriptions=new Map();
            }
            subscriptions.set(channel,fn);
            this._data.set('subscriptions',subscriptions);
            Event.on(channel,fn);
        },

        _subscriptions: $.noop,

        /**
         * unbind subscriptions
         * @private
         */
        _unbindSubscriptions:function(){
            var subscriptions=this._data.get('subscriptions');
            subscriptions.forEach(function(fn,channel){
                Event.off(channel,fn);
            });
        },

        _disposePubSub:function(){
            this._unbindSubscriptions();
        },

        /**
         *
         * @private
         */
        _dispose:function(){
            this._disposePubSub();
            if(this._super){
                this._super();
            }
        }


    };
}));


//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'),require('./report'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils','./report'], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.observable=root.elliptical.observable || {};
        root.elliptical.observable.scope = factory(root.elliptical.utils,root.elliptical.observable.report);
        root.returnExports = root.elliptical.observable.scope;
    }
}(this, function (utils,report) {
    var object=utils.object;

    return {

        /**
         *
         * @private
         */
        _initScopeElement:function(){
            var scopeBind=(this.options) ? this.options.scopeBind : this.scopeBind;
            var idProp=(this.options) ? this.options.idProp : this.idProp;
            if(scopeBind===undefined) scopeBind=true;
            this._data.set('scopeTimeoutId',null);
            this._data.set('scopeObserver',null);
            this._data.set('scopeId',idProp);
            this.__initScope();
            if(this.__bindByDataAttribute()) this._setObservable();
            else{
                if(scopeBind){
                    this.__initScopeObservable();
                }
            }
        },

        /**
         * init a $scope on the instance
         * @private
         */
        __initScope:function(){
            this.$scope={};
        },

        /**
         * init a watcher that binds an observable to the $scope when it becomes non-empty
         * terminates itself when it calls _setObservable
         * the init watcher avoids the initial $scope setting by the developer firing a change event
         * since an inherited parent's _initElement event is sequentially is going to fire before the element's _initElement
         * @private
         */
        __initScopeObservable:function(){
            var self = this;
            var MAX_COUNT=5;
            var count=0;
            var timeoutId=setInterval(function(){
                self._data.set('scopeTimeoutId',timeoutId);
                var isEmpty=object.isEmpty(self.$scope);
                if(!isEmpty){
                    clearInterval(timeoutId);
                    self._setObservable();
                }else {
                    if(count <= MAX_COUNT){
                        count++;
                    }else{
                        clearInterval(timeoutId);
                    }
                }
            },300);
        },

        /**
         *
         * @returns {boolean}
         * @private
         */
        __bindByDataAttribute:function(){
            var data=(this.options) ? this.options.data : this.data;
            if(data===undefined)return false;
            data=JSON.parse(data);
            var scope=(this.options) ? this.options.scope : this.scope;
            if(scope) this.$scope[scope]=data;
            else{
                this.$scope=data;
            }
            return true;
        },

        /**
         * set the observable
         * @private
         */
        _setObservable:function(){
            if(this._data.get('scopeObserver')) return;
            var $scope = this.$scope;
            var self=this;
            var observer = new ObjectObserver($scope,true);
            observer.open(function (result) {
                self.__onScopeChange(result);
            });
            /* save reference to the observer instance */
            this._data.set('scopeObserver',observer);
        },

        /**
         * destroy the scope observable
         * @private
         */
        __destroyObservable:function(){
            var scopeObserver=this._data.get('scopeObserver');
            if(scopeObserver){
                scopeObserver.disconnect_();
                scopeObserver=null;
                this.$scope=null;
            }
        },

        /**
         * reset observable
         * @private
         */
        __resetObservable: function(){
            this.__destroyObservable();
            this._setObservable();
        },


        /**
         * returns scope length...(-1)==object, not array
         * @returns {Number}
         * @controller
         */
        __scopeLength:function(obj){
            var scope=(typeof obj==='undefined') ? this.$scope : obj;
            if(report.isPropertyArray(scope,0)){
                var arr=report.propertyByIndex(scope,0);
                return arr.length;
            }else{
                return -1;  //object
            }
        },


        /**
         * recycles the observable
         * @private
         */
        __recycle:function(){
            this.__destroyObservable();
            this._setObservable();
        },


        /**
         * hook for scope observable change
         *
         * @param result {Object}
         * @controller
         */
        __onScopeChange:function(result){
            this._onScopeChange(result);
        },


        /**
         * returns changed object properties from the result param in _onScopeChange
         * @param obj
         * @returns {Object}
         * @private
         */
        _objectChange:function(obj){
            if(obj !==undefined){
                if(obj.object && obj.oldObject){
                    return report.objChangedProps(obj.object,obj.oldObject);
                }else{
                    var chg_={};
                    chg_[obj.name]=obj.value;
                    return chg_;
                }
            }
        },

        _disposeScope:function(){
            this.__destroyObservable();
        },

        /**
         * destroy clean-up
         * @private
         */
        _dispose:function(){
            this._disposeScope();
            if(this._super){
                this._super();
            }
        },

        /**
         *
         * @private
         */
        _onScopeChange: function (){},

        /**
         *
         * @private
         */
        _onScopeBind: function(){},

        /**
         * asynchronous $scope property setter for browsers that have polyfilled Object.observe
         * if Object.observe is native, defaults to a simple synchronous setter
         * @param prop {String}
         * @param value {Object} []
         * @param obj {Object} [optional object property on the $scope]
         */
        _scopeSetter: function (prop, value, obj) {
            var delay=(this.options) ? this.options.scopeSetterDelay : this.scopeSetterDelay;
            if(delay===undefined)delay=300;
            var polyfilled = (window.__observePolyfill !== undefined);
            var $scope = this.$scope;
            if (typeof obj === 'undefined') {
                if (polyfilled) {
                    setTimeout(function () {
                        $scope[prop] = value;
                    }, delay);
                } else {
                    $scope[prop] = value; //just set if native observe
                }
            } else {
                if (polyfilled) {
                    setTimeout(function () {
                        $scope[obj][prop] = value;
                    }, delay);
                } else {
                    $scope[obj][prop] = value; //just set if native observe
                }
            }
        },

        /**
         * gives the difference between two objects
         * @param n {Object}
         * @param o {Object}
         * @returns {Object}
         * @public
         */
        _changeReport:function(n,o){
            return report.objChangedProps(n,o);
        },

        /**
         *
         * @param val
         */
        $setScope: function(val){
            if(val!==undefined) this.$scope=val;
            this._setObservable();
            this._onScopeBind();
        }
    };
}));
//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals (root is window)
        root.elliptical.observable=root.elliptical.observable || {};
        root.elliptical.observable.template = factory(root.elliptical.utils,root.elliptical.observable.report);
        root.returnExports = root.elliptical.observable.template;
    }
}(this, function (utils,report) {
    var INTERVAL_COUNT=8;
    var INTERVAL_DELAY=500;
    var random=utils.random;
    var object=utils.object;
    var string=utils.string;

    return {

        /**
         *
         * @private
         */
        _initTemplateElement:function(){
            var scopeBind=(this.options) ? this.options.scopeBind : this.scopeBind;
            if (scopeBind === undefined) scopeBind=true;
            if(scopeBind){
                this._watch();
            }
            this._setAutoRebind();
            this._initPathObservers();
            this._data.set('templateId',null);
            this._data.set('templateNode',null);

        },

        /**
         *
         * @private
         */
        _setAutoRebind: function(){
            var autoRebind=(this.options) ? this.options.autoRebind : this.autoRebind;
            if (autoRebind === undefined) autoRebind=true;
            this._data.set('autoRebind',autoRebind);
        },

        /**
         *
         * @private
         */
        _initPathObservers:function(){
            this._data.set('pathObservers',[]);
        },



        /**
         *
         * @private
         */
        _watch:function(){
            var count=0;
            var self=this;
            var intervalId=setInterval(function(){
                if(self.__isReady()){
                    var templateId=self._getTemplateId();
                    if(templateId){
                        self._data.set('templateId',templateId);
                        clearInterval(intervalId);
                        self.__render();
                    }else{
                        var templateNode=self._getTemplateNode();
                        if(templateNode){
                            clearInterval(intervalId);
                            self._data.set('templateNode',templateNode);
                            templateId=self._setTemplateId(templateNode);
                            self._precompileTemplate(templateNode,templateId);
                            self.__render();
                        }else{
                            if(count > INTERVAL_COUNT){
                                clearInterval(intervalId);
                            }
                            count++;
                        }
                    }
                }else{
                    if(count > INTERVAL_COUNT){
                        clearInterval(intervalId);
                    }
                    count++;
                }
            },INTERVAL_DELAY);

        },

        /**
         *
         * @returns {*}
         * @private
         */
        __isReady:function(){
            if(object.isEmpty(this.$scope)){
                return false;
            }else{
                return this._isReady();
            }
        },

        /**
         *
         * @returns {boolean}
         * @private
         */
        _isReady:function(){
            return true;
        },

        /**
         *
         * @returns {*}
         * @private
         */
        _getTemplateId:function(){
            var node=this._getTemplateNode();
            if(node){
                var attr=node.getAttribute('template');
                if(attr==='') return null;
                else{
                    return attr;
                }
            }else{
                return null;
            }
        },

        /**
         *
         * @returns {*}
         * @private
         */
        _getTemplateNode:function(){
            var element=this.element;
            var template=element.selfFind('[template]');
            if(template[0]){
                return template[0];
            }else{
                return null;
            }
        },

        /**
         *
         * @param node
         * @returns {string}
         * @private
         */
        _setTemplateId:function(node){
            var id='tmpl-' + random.str(6);
            node.setAttribute('template',id);
            this._data.set('templateId',id);
            return id;
        },

        /**
         *
         * @private
         */
        _setVisibility:function(){
            var templateNode=this._data.get('templateNode');
            if(templateNode){
                templateNode.classList.add('visible');
            }
        },

        /**
         *
         * @private
         */
        _connectDOMObserver:function(){
            var templateNode=this._data.get('templateNode');
            $(templateNode).mutationSummary('connect', this.__onMutation.bind(this), [{ all: true }]);
        },

        /**
         *
         * @param summary
         * @private
         */
        __onMutation:function(summary){
            if(summary.added){
                this._onMutationAdded(summary.added)
            }
            if(summary.removed){
                this._onMutationRemoved(summary.removed);
            }
        },

        /**
         *
         * @param added
         * @private
         */
        _onMutationAdded:function(added){},

        /**
         *
         * @param removed
         * @private
         */
        _onMutationRemoved:function(removed){},

        /**
         *
         * @private
         */
        __render:function(){
            var self=this;
            var twoWayBind=(this.options) ? this.options.twoWayBind : this.twoWayBind;
            if(twoWayBind===undefined) twoWayBind=true;
            var templateNode=this._data.get('templateNode');
            var templateId=this._data.get('templateId');
            this._render(templateNode,templateId,this.$scope,function(err,out){
                if(twoWayBind){
                   self.__dataBind(templateNode);
                }
                self._setVisibility();
                self._connectDOMObserver();
            });
        },

        /**
         *
         * @param templateNode
         * @private
         */
        __dataBind:function(templateNode){
            var pathObservers=this._data.get('pathObservers');
            var self=this;

            var parseNode =function(node){
                if (node.nodeType !== 3) {
                    if (node.hasAttributes && node.hasAttributes()) {
                        parseNodeAttributes(node);
                    }
                }
            };

            var parseNodeAttributes =function(node){
                $.each(node.attributes,function(i,attribute){
                    if(attribute && attribute.name==='data-bind' && attribute.value !==undefined && attribute.value !==''){
                        var value=attribute.value.trim();
                        var ntuple=value.split(':');
                        var bindingType=ntuple[0];
                        (bindingType==='text') ? bindTextNodeObserver(node,ntuple) : bindAttributeObserver(node,ntuple);
                    }

                });
            };

            var bindTextNodeObserver =function(node,tuple){
                var fn={};
                if(tuple.length > 2){
                    fn=parseFunction(tuple[2]);
                }
                var path = tuple[1];
                var value = report.getObjValueByPath(self.$scope, path);

                /* if the tuple has a function attached, evaluate the value from the function */
                if(!object.isEmpty(fn)){
                    value=eval_(value,fn);
                    //update the path value of scope
                    utils.setObjValueByPath(self.$scope,path,value);
                }
                var text=self.__createTextNode(node,value);
                path=report.bracketPathFormat(path);
                var observer = new PathObserver(self.$scope, path);
                text.bind('textContent', observer);

                pathObservers.push(observer);

            };

            var bindAttributeObserver =function(node,tuple){
                var fn={};
                var attr=tuple[0];
                if(tuple.length > 2){
                    fn=parseFunction(tuple[2]);
                }
                var path = tuple[1];
                var value = report.getObjValueByPath(self.$scope, path);

                /* if the tuple has a function attached, evaluate the value from the function */
                if(!object.isEmpty(fn)){
                    value=eval_(value,fn);
                    //update the path value of scope
                    utils.setObjValueByPath(self.$scope,path,value);
                }
                path=report.bracketPathFormat(path);
                var observer = new PathObserver(self.$scope, path);
                node.bind(attr, observer);

                pathObservers.push(observer);

            };

            var parseFunction =function (sFunc){
                var argList;
                var args=sFunc.match(/\((.*?)\)/g);
                if(!args){
                    args='';
                }
                var func=sFunc.replace(args,'');
                args=args.replace('(','');
                args=args.replace(')','');
                if(args.length < 1){
                    argList=[]
                }else{
                    argList=args.split(',');
                }

                return{
                    func:func,
                    args:argList
                }
            };

            var eval_ =function(value,fn){
                var func=fn.func;
                var f,args;
                if(window.dust.helpers.inline[func]){//dust.helpers.inline
                    f=window.dust.helpers.inline[func];
                    args=fn.args;
                    (args.length >0) ? args.unshift(value) : args.push(value);
                    return f.apply(this,args);
                }else if(window[func]){//window
                    f=window[func];
                    args=fn.args;
                    (args.length >0) ? args.unshift(value) : args.push(value);
                    return f.apply(this,args);
                }else if(self[func]){ //element prototype
                    f=self[func];
                    args=fn.args;
                    (args.length >0) ? args.unshift(value) : args.push(value);
                    return f.apply(self,args);
                }else{
                    return value;
                }
            };


            this._traverseDOM(templateNode,parseNode);
        },

        /**
         * standard walk-the-dom recursion
         * @param node {Element}
         * @param func {Function}
         * @private
         */
        _traverseDOM:function(node,func){
            func(node);
            node = node.firstChild;
            while (node) {
                this._traverseDOM(node, func);
                node = node.nextSibling;
            }
        },

        /**
         *
         * @param node
         * @param value
         * @returns {*|Text}
         * @private
         */
        __createTextNode: function(node,value){
            var $node=$(node);
            var text=$node.text();
            if(text)  text=text.replace(value,'');
            else{
                text=value;
            }
            $node.text(text);
            var textNode=document.createTextNode(value);
            node.appendChild(textNode);

            return textNode;
        },

        /**
         *
         * @param result
         * @private
         */
        __onScopeChange: function(result){
            if(!this._passScopeFilter(result)) return;
            var autoRebind=this._data.get('autoRebind');
            if(autoRebind){
                if(result.removed && result.removed.length && result.removed.length > 0) {
                    this._rebind();
                }else if(result.added && result.added.length && result.added.length > 0){
                    this._rebind();
                }
            }

            this._onScopeChange(result);
        },

        /**
         *
         * @param result
         * @returns {*}
         * @private
         */
        _passScopeFilter:function(result){
            if(result.changed.length > 0){
                return this._filterScopeChange(result.changed);
            }else if(result.added >0){
                return this._filterScopeChange(result.added);
            }else if(result.removed.length > 0){
                return this._filterScopeChange(result.removed);
            }
        },

        /**
         *
         * @param arr
         * @returns {boolean}
         * @private
         */
        _filterScopeChange:function(arr){
            var bool=false;
            arr.forEach(function(record){
                if(string.firstChar(record.name)!=='$') bool=true;
            });
            return bool;
        },

        /**
         *
         * @private
         */
        _rebind:function(){
            this._disposeTemplate();
            this._initPathObservers();
            this.__render();
        },

        /**
         *
         * @private
         */
        _disconnectDOMObserver:function(){
            var templateNode=this._data.get('templateNode');
            $(templateNode).mutationSummary('disconnect');
        },

        /**
         *
         * @private
         */
        _disconnectPathObservers:function(){
            var pathObservers=this._data.get('pathObservers');
            pathObservers.forEach(function(observer){
                observer.disconnect_();
            });
            pathObservers=null;
        },

        /**
         *
         * @private
         */
        _disposeTemplate:function(){
            this._disconnectDOMObserver();
            this._disconnectPathObservers();
        },

        _dispose:function(){
            this._disposeTemplate();
            if(this._super){
                this._super();
            }
        },

        /**
         *
         */
        $rebind:function(){
            this._rebind();
        }

    };
}));