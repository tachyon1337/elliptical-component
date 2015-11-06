//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'), require('component-extensions'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils', 'component-extensions'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(elliptical.utils, elliptical.extensions);
    }
}(this, function (utils, extensions) {

    /** options */
    var options = {
        $providers: {
            location: function (url) {
                window.location = url;
            }
        },
        mqMaxWidth: 1024
    };

    /**
     * array of css only custom elements
     * @type {string[]}
     */
    var cssCustomElements = ['ui-container',
        'ui-overlay',
        'ui-modal',
        'ui-menu',
        'menu-item',
        'ui-brand',
        'ui-toggle',
        'menu-item-dropdown',
        'menu-item-search',
        'menu-divider',
        'grid-row',
        'grid-columns',
        'ui-select',
        'ui-input-icon',
        'flex-table',
        'ui-dropdown',
        'ui-mega-dropdown',
        'ui-media-object',
        'ui-box',
        'ui-breadcrumb',
        'breadcrumb-item',
        'ui-radio-list',
        'ui-checkbox-list',
        'flex-box',
        'flex-list',
        'flex-label',
        'ui-badge',
        'ui-tip',
        'ui-columns',
        'column-item',
        'ui-social',
        'social-icon',
        'touch-ui-drawer',
        'touch-ui-menu',
        'touch-ui-dropdown',
        'touch-ui-toggle',
        'touch-ui-brand',
        'touch-icons',
        'touch-icon',
        'ui-icons',
        'screen-icon',
        'touch-template',
        'empty-template'
    ];

    //extend options
    $.extend($.Widget.prototype.options, options);

    /**
     * extend jquery ui widget with component extensions
     */
    Object.assign($.Widget.prototype, extensions.base);

    /**
     * location handler
     * @param url {String}
     * @private
     */
    $.Widget.prototype._location = function (url) {
        var fn = $.Widget.prototype.options.$providers.location;
        fn(url);
    };

    /**
     * use _getCreateEventData as a 'reserved hook' to bind the internal store to the instance
     * @private
     */
    $.Widget.prototype._getCreateEventData = function () {
        //this._data=$.widget.extend({},this._data);
        //set our own data store record of an instance
        $.data(this.element[0], 'custom-' + this.widgetName, this.widgetName);


        /* fire this to hook the original method */
        this._onCreateEventData();
    };

    /**
     * replaces _getCreateEventData for the instance method hook
     * @private
     */
    $.Widget.prototype._onCreateEventData = $.noop;


    /**
     *
     * @param element
     * @param camelCase
     * @returns {Object}
     * @private
     */
    $.Widget.prototype._getAttrs = function (element, camelCase) {
        return getOptions(element, camelCase);
    };

    /**
     *
     * @param options {object}
     * @public
     */
    $.Widget.prototype.setOptions = function (options) {
        this._setOptions(options);
    };


    /* replace show,hide with css3 transitions */
    $.each({show: "fadeIn", hide: "fadeOut"}, function (method, defaultEffect) {
        $.Widget.prototype["_" + method] = function (element, options, callback) {
            var _event = (options) ? options.event : null;
            if (typeof options === "string") {
                options = {effect: options};
            }
            var hasOptions,
                effectName = !options ?
                    method :
                    options === true || typeof options === "number" ?
                        defaultEffect :
                    options.effect || defaultEffect;
            options = options || {};
            if (typeof options === "number") {
                options = {duration: options};
            }
            hasOptions = !$.isEmptyObject(options);
            options.complete = callback;
            if (options.delay) {
                element.delay(options.delay);
            }

            if (!options.duration) {
                options.duration = 300; //default value
            }

            //we are using our own CSS3 Transitions/animations implementation instead of jQuery UI Effects

            var obj = {};
            obj.duration = options.duration;
            obj.preset = options.effect;

            //test for css3 support; if not, then on 'show' or 'hide', just call the jquery methods
            if ($('html').hasClass('no-css3dtransforms') || options.effect === 'none') {
                if (_event === 'show') {
                    element.show();
                    if (callback) {
                        callback();

                    }
                } else if (_event === 'hide') {
                    element.hide();
                    if (callback) {
                        callback();

                    }
                }

            } else {
                this._transition(element, obj, callback);
            }
        };
    });

    /**
     * getters & setters for widget providers
     *
     */
    $.widget.$providers = function (opts) {
        for (var key in opts) {
            if (opts.hasOwnProperty(key)) {
                $.Widget.prototype.options.$providers[key] = opts[key];
            }
        }
    };

    /**
     * getter/setter
     * @type {{options: void}}
     */
    $.widget.config = {
        options: Object.defineProperties({}, {
            'mqMaxWidth': {
                get: function () {
                    return $.Widget.prototype.options.mqMaxWidth;
                },
                set: function (val) {
                    $.Widget.prototype.options.mqMaxWidth = val;

                }
            }
        })
    };


    /** custom elements implementation ********************************************************************



    /// PUBLIC -------------------------------------------------------------------------------------------*/
    //init definition map
    $.elliptical=$.elliptical || {};
    $.elliptical.definitions=new Map();


    /**
     * register the element as a custom element, binds life cycle callback handlers, uses the created callback to
     * upgrade(template transposition) and instantiate an element factory(extension of jquery ui widget)
     * @param name {String}
     * @param tagName {String}
     * @param ElementProto {Object}
     * @param registerDef {Boolean}
     */
    $.widget.register = function (name, tagName, ElementProto, registerDef) {
        //record the element definition
        var regElement_ = {};
        regElement_.name = name;
        regElement_.tagName = tagName;

        if (registerDef === undefined) {
            registerDef = true;
        }

        //define the object
        var proto = Object.create(ElementProto);
        proto._tagName = tagName;
        var object_ = {prototype: proto};

        /* custom element callbacks
         *  pass them onto the element instance, where the UI factory can hook into them
         * */
        proto.attachedCallback = function () {
            if (this._attachedCallback) {
                this._attachedCallback();
            }
        };

        proto.detachedCallback = function () {
            if (this._detachedCallback) {
                this._detachedCallback();
            }
        };

        proto.createdCallback = function () {
            _HTML5Imports.instantiate(this, name);

        };

        proto.attributeChangedCallback = function (n, o, v) {
            if (n === 'loaded') {
                this.removeAttribute('ui-preload');
            }

            if (this._attributeChangedCallback) {
                this._attributeChangedCallback(n, o, v);
            }
        };

        /* register the element */
        if (ElementProto._name === 'HTMLElement') {
            document.registerElement(tagName, object_);

        } else {
            regElement_.tagName = '[is="' + tagName + '"]';
            object_ = setOptionsExtensionType(ElementProto._name, object_);
            document.registerElement(tagName, object_);
        }

        if (registerDef) {
            addElementDefinition(regElement_);
        }
    };

    /**
     * register a custom tag as a custom element
     * @param tag
     * @param ElementProto
     */
    $.widget.registerElement = function (tag, ElementProto) {
        registerElement(tag, ElementProto);
    };

    /**
     * register an array of custom tags as custom elements
     * @param arr
     */
    $.widget.registerElements = function (arr) {
        registerElements(arr);
    };



    /// Custom Element Factory ===================================================


    /* define the base element  */
    $.widget('elliptical.element',{

        /**
         * should never be overwritten, _initElement becomes the de facto dev hook
         * @private
         */
        _create:function(){
            /* init events array */
            this._destroyed=false;
            this._data={
                _store:new Map(),
                get:function(key){
                    return this._store.get(key);
                },
                set:function(key,val){
                    this._store.set(key,val);
                },
                click:'touchclick',
                hover:'touchhover'
            };
            this._data.events=[];
            $.extend(this.options, $.Widget.prototype.options);

            this._onBeforeCreate();
        },

        _onBeforeCreate:function(){
            (this.options.proxyUpgrade) ? this._proxyUpgradeElement() : this._upgradeElement();
        },

        //no template transposition for the element
        _proxyUpgradeElement:function(){
            if(this.element[0].dataset){
                this.element[0].dataset.upgraded=true;
            }
            this._onCreate();
        },

        _upgradeElement:function(){
            var self=this;
            var upgraded = upgradedDataSet(this.element[0]);
            if(upgraded===null){
                this._destroy();
            }
            if(upgraded==='true'){
                this._onCreate();
            }else{
                var tagName=this._tagName;
                window._HTML5Imports.upgradeElement(tagName, this.element[0],function(element){
                    upgraded = upgradedDataSet(element);
                    if(upgraded==='true'){
                        self._onCreate();
                    }else{
                        self.destroy();
                    }
                });
            }
        },

        _onCreate: function(){
            if(this._created){
                return;
            }else{
                this._created=true;
            }
            this._setOptionsFromAttribute();
            this._publishLoaded();
            this._initElement();
            this.__onInit();
            this._delegateEventListener();
            this._setChildrenAttributes();
            var evt_ = this.widgetName.toLowerCase() + '.loaded';
            $(window).trigger(evt_, { target: this.element });
            this.__componentCallbacks();
        },

        _publishLoaded: function(){
            this._triggerEvent('loaded',this.element);
        },

        /**
         * init Element
         */
        _initElement: $.noop,

        /**
         * generally, should not overwrite this
         * @private
         */
        __onInit:function(){
            this._events();
            this._onInit();
        },

        /**
         * @private
         */
        _onInit: $.noop,


        /**
         * called by default by _onInit; event listener registrations should go here, although this is not a requirement
         */
        _events: $.noop,

        /**
         * event facade
         * register an event listener that is automatically disposed on _destroy()
         * if unbind=true, it is destroyed on any call to _unbindEvents() within the $.element lifecycle
         * NOTE: using the _event facade for event handling not a requirement, just a convenience. The convenience of this
         * facade pattern is not in writing event handlers per se, but in automating the cleanup
         *
         *
         * NOTE: the facade wrapper supports event delegation but does not automatically delegate
         * this._event(li,click,function(event){}) ---> no delegation, listener is attached to each li
         * this._event(ul,click,'li',function(event){}) -->delegation, listener is attached to ul, li clicks bubble up
         *
         * @param element {Object}
         * @param event {String}
         * @param selector {String}
         * @param unbind {Boolean}
         * @param callback {Function}
         * @private
         */
        _event: function (element, event, selector,unbind,callback) {
            var obj = {};
            obj.element = element;
            obj.event = event;

            //support 3-5 params
            var length=arguments.length;
            if(length===3){
                callback=(typeof selector==='function') ? selector : null;
                unbind=false;
                selector=null;
            }else if(length===4){
                callback=(typeof unbind==='function') ? unbind : null;
                if(typeof selector==='boolean'){
                    unbind=selector;
                    selector=null;
                }else{
                    unbind=false;
                }
            }
            obj.selector=selector;
            obj.unbind = unbind;
            obj.callback=callback;
            if(!this._data || !this._data.events){
                return;
            }
            var arr = this._data.events;
            if ($.inArray(obj, arr) === -1) {
                this._data.events.push(obj);
            }
            if(selector){
                element.on(event,selector,function(){
                    var args = [].slice.call(arguments);
                    if(callback){
                        callback.apply(this,args);
                    }
                });
            }else{
                element.on(event,function(){
                    var args = [].slice.call(arguments);
                    if(callback){
                        callback.apply(this,args);
                    }
                });
            }

        },

        /**
         * unbinds registered event listeners. When called from _destroy(), all events are disposed, regardless.
         * If called during the $.element lifecycle, events are disposed if unbind flag was set at registration
         * @param destroy {Boolean}
         * @private
         */
        _unbindEvents: function (destroy) {
            if (typeof destroy === 'undefined') {
                destroy = false;
            }
            if(!this._data || !this._data.events){
                return;
            }
            var events=this._data.events;
            $.each(events, function (index, obj) {
                if (!destroy) {
                    if (obj.unbind) {
                        (obj.selector) ? obj.element.off(obj.event,obj.selector) : obj.element.off(obj.event);
                        events.splice(index,1);
                    }
                } else {
                    (obj.selector) ? obj.element.off(obj.event,obj.selector) : obj.element.off(obj.event);
                    obj=null;
                }
            });

            if (destroy) {
                events.length=0;
                this._onUnbindEvents();
            }

        },

        /**
         * additional event cleanup, if needed, should be placed here. Invoked on _destroy()
         * @private
         */
        _onUnbindEvents: $.noop,

        _hide:function(){
            this.element.hide();
        },

        _show:function(){
            this.element.show();
        },

        _delegateEventListener:function(){
            this._event(this.element,this._data.click,'[on-click]',this._listenerCallback.bind(this));
        },

        _listenerCallback:function(event){
            var target=$(event.currentTarget);
            var fn=target.attr('on-click');
            if(fn){
                if(this[fn]){
                    this[fn](event);
                }
            }
        },


        /**
         * destroy event
         * @private
         */
        _destroy: function () {
            if(!this._data){
                return;
            }
            this._triggerEvent('destroyed',this.element);
            this._unbindEvents(true);
            this._dispose();
            this._onDestroy();
            $.removeData(this.element[0],'custom-' + this.widgetName);
            this._data._store=null;
            this._data.events.length=0;
            this._destroyed=true;

        },


        /* custom element lifecycle callback events */

        __componentCallbacks:function(){
           var node=this.element[0];
            node._attachedCallback=this._attachedCallback;
            node._detachedCallback=this._detachedCallback;
            node._attributeChangedCallback=this._attributeChangedCallback;
        },

        _distributeContent:function(tagName,element,callback){
            _HTML5Imports.upgradeElement(tagName, element,callback);
        },

        _attachedCallback: $.noop,

        _detachedCallback: $.noop,

        _attributeChangedCallback: $.noop,


        /**
         * for cleanup
         * @private
         */
        _dispose: $.noop,


        /**
         * for cleanup
         * @private
         */
        _onDestroy: $.noop,


        runInit:function(){
            this._initElement();
        },

        service:function(name){
            if(name===undefined && this.options){
                name=this.options.service;
            }
            if(this.__serviceLocator){
                return this.__serviceLocator(name);
            }else{
                var protoLocator= $.elliptical.element.prototype.__serviceLocator;
                if(protoLocator){
                    return protoLocator(name);
                }
            }
        },

        serviceAsync:function(name,callback){
            if(typeof name==='function'){
                callback=name;
                name=undefined;
            }
            var self=this;
            var INTERVAL=300;
            var MAX_COUNT=5;
            var count=0;
            var service=this.service(name);
            if(service && service!==undefined){
                callback(service);
            }else{
                var intervalId=setInterval(function(){
                    service=self.service(name);
                    if(service && service !==undefined){
                        clearInterval(intervalId);
                        callback(service);
                    }else if(count > MAX_COUNT){
                        clearInterval(intervalId);
                        callback(null);
                    }else{
                        count++;
                    }
                },INTERVAL);
            }
        }

    });



    /// a factory wrapper that returns an $.element factory for the supplied base function
    /// the $.element factory will register the element as a jquery ui widget with baseObject or base(if base is not undefined);
    /// register the element as a WC3 custom element (document.registerElement)
    $.elementFactory=function(baseObject){

        return function (ElementProto,name,tagName, base, prototype) {

            //widget base object
            var base_= null;
            //widget string namespace
            var name_=null;
            //registered element tag name
            var tagName_=null;
            //registered element prototype
            var ElementProto_=null;
            //widget prototype
            var prototype_=null;

            var objName;

            /* support 2-5 params */
            var length=arguments.length;
            if(length < 2){
                throw "Error: Element requires a minimum of two parameter types: string name and a singleton for the prototype"
            }else if(length===2){
                prototype_ = name;
                if(typeof ElementProto==='object'){
                    throw "Error: Element requires a string name parameter";
                }
                if(typeof name!=='object'){
                    throw "Error: Element requires a singleton for the prototype";
                }
                objName=parseElementNameParams(ElementProto);
                name_=objName.name;
                tagName_=objName.tagName;
                if(objName.err){
                    throw "Error: Element requires a string tag name or a namespaced name";
                }
            }else if(length===3){
                prototype_=tagName;
                if(typeof ElementProto==='object'){
                    if(typeof name!=='string'){
                        throw "Error: Element requires a string name parameter";
                    }
                    if(typeof tagName!=='object'){
                        throw "Error: Element requires a singleton for the prototype";
                    }
                    ElementProto_=ElementProto;
                    objName=parseElementNameParams(name);
                    name_=objName.name;
                    tagName_=objName.tagName;
                }else{
                    if(typeof name!=='string'){
                        objName=parseElementNameParams(ElementProto);
                        name_=objName.name;
                        tagName_=objName.tagName;
                        base_=name;
                    }else{
                        name_=ElementProto;
                        tagName_=name;
                    }
                }
            }else if(length===4){
                prototype_=base;
                if(typeof ElementProto==='object'){
                    ElementProto_=ElementProto;
                    if(typeof name!=='string'){
                        throw "Error: Element requires a string name parameter or tag name";
                    }
                    if(typeof tagName==='string'){
                        name_=name;
                        tagName_=tagName;
                    }else{
                        objName=parseElementNameParams(name);
                        name_=objName.name;
                        tagName_=objName.tagName;
                        base_=tagName;
                    }
                }else{
                    name_=ElementProto;
                    tagName_=name;
                    base_=tagName;
                }
            }else{
                prototype_=prototype;
                ElementProto_=ElementProto;
                name_=name;
                tagName_=tagName;
                base_=base;
            }


            if(!base_){
                base_=baseObject;
            }

            if(!tagName_){
                tagName_=name_.replace('.','-');
            }


            /* if no ElementPrototype defined, assign the HTMLElement prototype */
            if(!ElementProto_){
                var __proto__=HTMLElement.prototype;
                __proto__._name='HTMLElement';
                ElementProto_=__proto__;
            }

            //store the tagName as a "private variable" on the singleton
            prototype_._tagName=tagName_;

            /* implement using the extended jQuery UI factory */
            $.widget(name_, base_, prototype_);

            //method Name from namespaced name
            var methodName=name_.split('.')[1];

            /* register the element as a WC3 custom element */
            try{
                $.widget.register(methodName,tagName_,ElementProto_);
            }catch(ex){

            }


        };
    };


    /// create the element factory
    $.element = $.elementFactory($.elliptical.element);


    ///css custom element registration
    registerCssCustomElements();

    /* make public props/methods available on $.element */
    for(var key in $.widget){
        $.element[key]= $.widget[key];
    }



    /// PRIVATE----------------------------------------------------------------------------------------------

    /**
     * registers a custom element with document.registerElement
     * @private
     * @param tag {String}
     * @param ElementProto {Object}
     *
     */
    function registerElement(tag, ElementProto) {
        if (typeof ElementProto === 'undefined') {
            ElementProto = HTMLElement.prototype;
            ElementProto._name = 'HTMLElement';
        }
        var proto = Object.create(ElementProto);
        proto._tagName = tag;
        var options = {prototype: proto};

        /* register the element */
        if (ElementProto._name === 'HTMLElement') {
            document.registerElement(tag, options);
        } else {
            options = setOptionsExtensionType(ElementProto._name, options);
            document.registerElement(tag, options);
        }
    }

    /**
     * @private
     * registers an array of custom elements
     * @param arr {Array}
     *
     */
    function registerElements(arr) {
        if (typeof arr === 'string') { //support simple passing of a string tagName
            registerElement(arr);
        } else {
            if (arr.length > 0) {
                arr.forEach(function (t) {
                    (typeof t === 'string') ? registerElement(t) : registerElement(t.name, t.prototype);
                });
            }
        }
    }

    /**
     * sets the extends property of the options object to pass to document.registerElement for HTML element interfaces that inherit from HTMLElement
     * options object={prototype:proto,extends:name}
     * ex: HTMLInputElement-->obj.extends='input'
     * @private
     * @param name {String}
     * @param obj {Object}
     * @returns {Object}
     */
    function setOptionsExtensionType(name, obj) {
        var type = name.replace(/HTML/g, '').replace(/Element/g, '');
        type = type.toLowerCase();
        obj.extends = type;
        return obj;
    }

    function addElementDefinition(obj) {
        var value=$.elliptical.defintions.get(obj.tagName);
        if(value===undefined){
            $.elliptical.defintions.set(obj.tagName,obj);
        }
    }


    /**
     * returns an options object from declarative element attributes
     * @param element {Object}
     * @param camelCase {Boolean}
     * @returns {Object}
     */
    function getOptions(element, camelCase) {
        if (camelCase === undefined) {
            camelCase = true;
        }
        var opts = {};
        $.each(element.attributes, function (i, obj) {
            var opt = obj.name;
            var val = obj.value;
            if (!testAttr(opt)) {
                var patt = /data-/;
                if (patt.test(opt)) {
                    opt = opt.replace('data-', '');
                }
                if (camelCase && camelCase !== 'false') {
                    (opt !== 'template') ? opts[opt.toCamelCase()] = booleanCheck(val) : (opts[opt] = booleanCheck(val));

                } else {
                    opts[opt.toCamelCase()] = booleanCheck(val);
                }
            }
        });

        return opts;
    }

    /**
     *  converts a boolean string to a boolean type
     * @param val {string}
     * @returns {boolean}
     */
    function booleanCheck(val) {
        if (val === 'false') {
            val = false;
        }
        if (val === 'true') {
            val = true;
        }
        return val;
    }

    /**
     *
     * @param attr {String}
     * @returns {boolean}
     */
    function testAttr(attr) {
        var patt = /href|tcmuri|rowspan|colspan|class|nowrap|cellpadding|cellspacing/;
        return patt.test(attr);
    }

    /**
     *
     * @param node
     * @returns {*}
     */
    function upgradedDataSet(node){
        if(!node){
            return null;
        }
        var dataSet=node.dataset;
        if(dataSet !==undefined){
            return node.dataset.upgraded;
        }else{
            return undefined;
        }

    }

    /**
     * 
     * @param s
     * @returns {{tagName: *, name: *, err: *}}
     */
    function parseElementNameParams(s){
        var tagName=null;
        var name=null;
        var err=null;
        var arrNamespace=s.split('.');
        var arrTagName=s.split('-');
        if(arrNamespace.length > 1){
            name=s;
            tagName= s.replace('.','-');
        }else if(arrTagName.length > 1){
            tagName=s;
            name= arrTagName[0] + '.' + $.utils.string.dashToCamelCase(s);
        }else{
            err=true;
        }
        return {
            tagName:tagName,
            name:name,
            err:err
        }
    }


    /**
     *  preregisters css custom elements
     */
    function registerCssCustomElements(){
        cssCustomElements.forEach(function (t) {
            registerElement(t);
        });
    }


    return $;


}));