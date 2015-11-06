/*!
 * @license jquery-mutation-summary
 * Copyright © 2012, 2013, 2014, Joel Purra <http://joelpurra.com/>
 * Released under MIT, BSD and GPL license. Comply with at least one.
 *
 * A jQuery wrapper/plugin for mutation-summary, the DOM mutation-observers wrapper.
 * http://joelpurra.github.com/jquery-mutation-summary
 * 
 * "Mutation Summary is a JavaScript library that makes observing changes to the DOM fast, easy and safe."
 * http://code.google.com/p/mutation-summary/
 */

/*jslint white: true, browser: true*/
/*global jQuery, MutationSummary*/

(function($, global) {
    "use strict"; // jshint ;_;
    var tag = "JqueryMutationSummary",
        eventNamespace = "." + tag,
        JqueryMutationSummary = function(element, options) {
            this.$element = $(element);
            this.options = $.extend(true, {}, this.internalDefaults, $.fn.mutationSummary.defaults, options);
        },
        JqueryMutationSummaryInner = function($element, configuration) {
            this.$element = $element;
            this.configuration = configuration;
        },
        privateFunctions = {};

    $.extend(true, privateFunctions, {
        getConfiguration: function(callback, observeOwnChanges, queries) {
            var configuration;

            if ($.isFunction(callback)) {
                if ($.isArray(observeOwnChanges)) {
                    queries = observeOwnChanges;
                    observeOwnChanges = false;
                }

                configuration = {
                    callback: callback,
                    observeOwnChanges: observeOwnChanges === true,
                    queries: queries || []
                };
            } else {
                configuration = callback;
            }

            return configuration;
        }
    });

    JqueryMutationSummary.prototype = {

        constructor: JqueryMutationSummary

        ,
        internalDefaults: {
            mutationSummaries: []
        }

        ,
        connect: function(callback, observeOwnChanges, queries) {
            var configuration = privateFunctions.getConfiguration(callback, observeOwnChanges, queries);

            var inner = new JqueryMutationSummaryInner(this.$element, configuration);

            this.options.mutationSummaries.push(inner);

            inner.start();
        }

        ,
        disconnect: function(callback, observeOwnChanges, queries) {
            // Pass as reference to inner function
            var summaries = this.options.mutationSummaries;

            // If any parameters were passed, only disconnect any matching summaries
            $.each(summaries, function(index) {
                // Take care of deleted summaries
                if (this === undefined) {
                    return;
                }

                if (this.configurationMatches(callback, observeOwnChanges, queries)) {
                    this.stop();

                    delete summaries[index];
                }
            });
        }
    };

    JqueryMutationSummaryInner.prototype = {
        constructor: JqueryMutationSummaryInner

        ,
        getCallbackWrapper: function() {
            function callbackWrapper(summaries) {
                // Pass extra info in the callback, since it's so wrapped
                summaries.observer = this.observer;
                summaries.configuration = $.extend(true, {}, this.configuration);

                this.originalCallback(summaries);
            };

            return $.proxy(callbackWrapper, this);
        }

        ,
        configurationMatches: function(callback, observeOwnChanges, queries) {
            var matchWith = privateFunctions.getConfiguration(callback, observeOwnChanges, queries),
                isMatch = true;

            isMatch = isMatch && (callback === undefined || this.configuration.callback === matchWith.callback);
            isMatch = isMatch && (observeOwnChanges === undefined || this.configuration.observeOwnChanges === matchWith.observeOwnChanges);
            isMatch = isMatch && (queries === undefined || this.configuration.queries === matchWith.queries);

            return isMatch;
        }

        ,
        start: function() {
            var rawElement = this.$element.get(0);

            this.originalCallback = this.configuration.callback;
            this.wrappedCallback = this.getCallbackWrapper();
            this.wrappedConfiguration = $.extend(true, {}, this.configuration);

            if (this.$element.length === 1) {
                // mutation-summary fails if passing global
                if (rawElement !== global) {
                    this.wrappedConfiguration.rootNode = rawElement;
                }
            }

            this.wrappedConfiguration.callback = this.wrappedCallback;

            this.observer = new MutationSummary(this.wrappedConfiguration);
        }

        ,
        stop: function() {
            // Any changes from the last callback will be passed here
            // http://code.google.com/p/mutation-summary/wiki/APIReference#Methods
            var finalSummary = this.observer.disconnect();

            if (finalSummary !== undefined) {
                this.wrappedCallback(finalSummary);
            }

            delete this.observer;
        }
    };

    // Add jQuery method
    // $("#element").mutationSummary();
    // $("#element").mutationSummary("method", arguments);
    $.fn.extend({
        mutationSummary: function(option) {
            var callArguments = arguments;

            return this.each(function() {
                var $this = $(this),
                    data = $this.data(tag),
                    options = typeof option === "object" && option;

                // Store javascript object as element data
                if (!data) {
                    $this.data(tag, (data = new JqueryMutationSummary(this, options)));
                }

                // Pass arguments to methods
                if (typeof option === "string") {
                    data[option].apply(data, Array.prototype.slice.call(callArguments, 1));
                }
            });
        }
    });

    $.fn.mutationSummary.defaults = {};

    $.fn.mutationSummary.Constructor = JqueryMutationSummary;
}(jQuery, this));

/*
 * =============================================================
 * jQuery.utils
 * =============================================================
 *
 *
 *
 * Dependencies:
 * jQuery 2.0+
 *
 *
 */

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
    var utils={};
    utils.datetime={

        isDate: function(obj){
            return (/Date/).test(Object.prototype.toString.call(obj)) && !isNaN(obj.getTime());
        },

        isLeapYear: function(year){
            return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
        },

        getDaysInMonth: function(year, month){
            return [31, this.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        },

        setToStartOfDay: function(date){
            if (this.isDate(date)) date.setHours(0,0,0,0);
        },

        compareDates: function(a,b){
            // weak date comparison (use setToStartOfDay(date) to ensure correct result)
            return a.getTime() === b.getTime();
        },

        /**
         *
         * @returns {string}
         */
        currentDate: function () {
            var currentDate = new Date();
            var day = currentDate.getDate();
            var month = currentDate.getMonth() + 1;
            var year = currentDate.getFullYear();
            return (month + '/' + day + '/' + year);
        }
    };

    utils.array={
        isArray: function(obj){
            return (/Array/).test(Object.prototype.toString.call(obj));
        },

        toStringFromArray:function(arr,index){
            var length=arr.length;
            var s='';
            for (var i=0;i<length;i++){
                if(index !==undefined){
                    if(i!==index){
                        s+=arr[i];

                    }
                }else{
                    s+=arr[i];
                }
            }
            return s;
        },

        toNamespaceFromArray:function(arr){
            var length=arr.length;
            var maxIndex=length-1;
            var s='';
            for (var i=0;i<length;i++){
                s+=arr[i].toString();
                if(i!==maxIndex){
                    s+='.';
                }
            }

            return s.toLowerCase();
        }
    };

    utils.string={
        dashToCamelCase:function(s){
            return s.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
        },

        random:function(){
            return Math.floor((Math.random()*100000)+1).toString();
        },

        camelCaseToArray: function(s){
            return s.match(/[A-Z]?[a-z]+/g);
        },

        tagNameToNamespace:function(s){
            s= s.replace(/-/g,'.');
            return s.toLowerCase();
        }
    };

    utils.color={
        rgb2hex: function(rgb){
            if (  rgb.search("rgb") == -1 ) {
                return rgb;
            }
            else if ( rgb == 'rgba(0, 0, 0, 0)' ) {
                return 'transparent';
            }
            else {
                rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
                function hex(x) {
                    return ("0" + parseInt(x).toString(16)).slice(-2);
                }
                return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
            }
        }
    };

    utils.url={
        /**
         *
         * @param ji {String}
         * @returns {String}
         */
        queryString: function (ji) {
            var hu = window.location.search.substring(1);
            var gy = hu.split("&");
            for (i = 0; i < gy.length; i++) {
                var ft = gy[i].split("=");
                if (ft[0] == ji) {
                    return ft[1];
                }
            }
            return null;
        },

        /**
         *
         * @returns {Array}
         */
        queryStringObjectArray: function () {
            var arr = [];
            var hu = window.location.search.substring(1);
            var gy = hu.split("&");
            for (i = 0; i < gy.length; i++) {
                var ft = gy[i].split("=");
                if (ft[0] == ji) {
                    return ft[1];
                }
                var obj = {};
                obj.prop = ft[0];
                obj.val = ft[1];
                arr.push(obj);
            }

            return arr;
        },

        /**
         *
         * @returns {Array}
         */
        queryStringFilterArray: function () {
            var arr = [];
            var hu = window.location.search.substring(1);
            var gy = hu.split("&");
            for (i = 0; i < gy.length; i++) {
                var ft = gy[i].split("=");
                var obj = {};
                obj.filter = ft[0];
                obj.val = ft[1];
                if (obj.filter != '') {
                    arr.push(obj);
                }

            }

            return arr;
        }
    };

    utils.image={
        /**
         *
         * @param img {Object}
         * @param data {Object}
         * @returns {Object}
         */
        aspectRatio: function (img, data) {
            var width = img.width();
            var height = img.height();
            var aRatio = height / width;
            data.aspectRatio = aRatio;
            if (typeof data.height != 'undefined') {
                data.width = parseInt((1 / aRatio) * data.height);
            } else if (typeof data.width != 'undefined') {
                data.height = parseInt(aRatio * data.width);
            }

            return data;
        }
    };


    $.utils = $.utils || {};
    $.extend($.utils, utils);

    /* String/Number prototypes  */
    String.prototype.toCamelCase=function(){
        return this.replace(/[-_]([a-z])/g, function (g) { return g[1].toUpperCase(); });
    };
    String.prototype.toTitleCase=function(){
        return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };
    String.prototype.toPixel = function(){
        var val=parseInt(this,10);
        val = val.toString() + 'px';
        return val;
    };
    String.prototype.toArrayFromCamelCase = function(){
        return this.match(/[A-Z]?[a-z]+/g);
    };
    String.prototype.toFloatPixel = function(){
        return this.toString() + 'px';
    };
    String.prototype.toInteger=function(){
        return parseInt(this.replace('px',''),10);
    };
    String.prototype.toMillisecond = function(){
        var val=parseInt(this,10);
        val = val.toString() + 'ms';
        return val;
    };
    String.prototype.toNode=function(){
        var parsed=$.parseHTML(this);
        if(parsed[0]){
            return parsed[0]
        }else{
            return null;
        }
    };
    Number.prototype.toPixel = function(){
        var val=parseInt(this,10);
        val = val.toString() + 'px';
        return val;
    };
    Number.prototype.toFloatPixel = function(){
        return this.toString() + 'px';
    };
    Number.prototype.toMillisecond = function(){
        var val=parseInt(this,10);
        val = val.toString() + 'ms';
        return val;
    };




    /**
     * replaces an element's class based on a wildcard pattern
     * @param removals {String}
     * @param additions {String}
     * @returns {Object}
     * @public
     *
     * ex: average rating
     *     $span.alterClass('icon-star-*', 'icon-star-3');
     *     $span.icon-star-2 => $span.icon-star-3
     */
    $.fn.alterClass = function ( removals, additions ) {

        var self = this;

        if ( removals.indexOf( '*' ) === -1 ) {
            // Use native jQuery methods if there is no wildcard matching
            self.removeClass( removals );
            return !additions ? self : self.addClass( additions );
        }

        var patt = new RegExp( '\\s' +
            removals.
                replace( /\*/g, '[A-Za-z0-9-_]+' ).
                split( ' ' ).
                join( '\\s|\\s' ) +
            '\\s', 'g' );

        self.each( function ( i, it ) {
            var cn = ' ' + it.className + ' ';
            while ( patt.test( cn ) ) {
                cn = cn.replace( patt, ' ' );
            }
            it.className = $.trim( cn );
        });

        return !additions ? self : self.addClass( additions );
    };

    /**
     * extends jQuery 'find' to additionally filter the jQuery object against the selector
     * example uses: querying mutation records
     * @param selector {String}
     * @returns {Object}
     * @public
     */
    $.fn.selfFind = function(selector) {
        return this.find(selector).add(this.filter(selector))
    };

    /**
     * clear select list
     * @param opts
     * @returns {$.fn}
     */
    $.fn.clearSelect=function(opts){
        (typeof opts.defaultOption ==='undefined') ? this.children.remove() : this.children('option:not(:first)').remove();
        return this;

    };

    $.fn.findTextNodes=function(){
        return this.contents().filter(function(){return this.nodeType===3});
    };

    $.fn.findTextNodeDescendants=function(){
        return this.find('*').contents().filter(function(){return this.nodeType===3});
    };

    //no chaining
    $.fn.isVisible=function(){
        var _isVisible=this.is(':visible');
        var visibility=this.css( 'visibility');
        return(_isVisible && visibility==='visible');
    };

    //no chaining
    $.fn.query=function(selector,callback) {
        var self = this;
        var count = 0;
        var result = this.find(selector);
        if (result[0]) {
            callback(result);
        }
        var timeOutId = setInterval(function () {
            result = self.find(selector);
            if (result[0] || (count > 4)) {
                clearInterval(timeOutId);
                callback(result);
            } else count++;
        }, 500);
    };

    $.fn.detachClass=function(klass){
        return this.each(function(){
            if($(this).length===1){
                $(this).removeClass(klass);
            }else if($(this).length>1){
                $.each($(this),function(index,node){
                    $(node).removeClass(klass);
                });
            }
        });

    };

    //no chaining
    $.fn.removeAnimation=function(interval,f){
        var element=this;
        var g=function(){ element.removeClass('hide-important')};
        setTimeout(function(){
            element.addClass('hide-important');
            f();
            setTimeout(g,100);
        },interval);
    };

    //no chaining
    $.fn.timeout=function(interval,f){
        setTimeout(function(){
            f();
        },interval);
    };

    /**
     *  returns first matched children in an iterative children query as "children"
     * @param selector
     * @returns {*|jQuery|HTMLElement}
     */
    $.fn.closestChildren=function(selector){
        if (!selector || selector === '') {
            return $();
        }
        var result=$();
        this.each(function() {
            var $this = $(this);
            var queue = [];
            queue.push($this);
            while (queue.length > 0) {
                var node = queue.shift();
                var children = node.children();
                for (var i = 0; i < children.length; ++i) {
                    var $child = $(children[i]);
                    if ($child.is(selector)) {
                        result=children;
                        return false;
                    } else {
                        queue.push($child);
                    }
                }
            }
        });
        var elements = [];
        $.each(result, function (index, element) {
            if ($(element).is(selector)) {
                elements.push(element);
            }
        });
        return $(elements);
    };

    //no chaining
    $.fn.hasAttr=function(attr){
        return this[0].hasAttribute(attr);
    };


    return $;


}));

/*
 * =============================================================
 * $.browser
 * =============================================================
 *
 * replaces the deprecated jQuery.browser that has now been removed from jQuery 1.9+
 *
 *
 * Dependencies:
 * jQuery 2.0 +
 *
 *
 */

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
	var browser = {};
	browser.mozilla = false;
	browser.webkit = false;
	browser.opera = false;
	browser.msie = false;

	var nAgt = navigator.userAgent;
	browser.name = navigator.appName;
	browser.fullVersion = '' + parseFloat(navigator.appVersion);
	browser.majorVersion = parseInt(navigator.appVersion, 10);
	var nameOffset, verOffset, ix;

	// Opera
	if ((verOffset = nAgt.indexOf("Opera")) != -1) {
		browser.opera = true;
		browser.name = "Opera";
		browser.fullVersion = nAgt.substring(verOffset + 6);
		if ((verOffset = nAgt.indexOf("Version")) != -1)
			browser.fullVersion = nAgt.substring(verOffset + 8);
	}
		// MSIE
	else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
		browser.msie = true;
		browser.name = "Microsoft Internet Explorer";
		browser.fullVersion = nAgt.substring(verOffset + 5);
	}
		// Chrome
	else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
		browser.webkit = true;
		browser.name = "Chrome";
		browser.fullVersion = nAgt.substring(verOffset + 7);
	}
		// Safari
	else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
		browser.webkit = true;
		browser.name = "Safari";
		browser.fullVersion = nAgt.substring(verOffset + 7);
		if ((verOffset = nAgt.indexOf("Version")) != -1)
			browser.fullVersion = nAgt.substring(verOffset + 8);
	}
		// Firefox
	else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
		browser.mozilla = true;
		browser.name = "Firefox";
		browser.fullVersion = nAgt.substring(verOffset + 8);
	}
		// Other
	else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
        (verOffset = nAgt.lastIndexOf('/'))) {
		browser.name = nAgt.substring(nameOffset, verOffset);
		browser.fullVersion = nAgt.substring(verOffset + 1);
		if (browser.name.toLowerCase() === browser.name.toUpperCase()) {
			browser.name = navigator.appName;
		}
	} else if (nAgt.indexOf('Mozilla') !== -1 && nAgt.indexOf('Firefox') === -1) {
		browser.msie = true;
		browser.name = "Internet Explorer";
		browser.fullVersion = '11';
	}
	// trim the fullVersion string at semicolon/space if present
	if ((ix = browser.fullVersion.indexOf(";")) != -1)
		browser.fullVersion = browser.fullVersion.substring(0, ix);
	if ((ix = browser.fullVersion.indexOf(" ")) != -1)
		browser.fullVersion = browser.fullVersion.substring(0, ix);

	browser.majorVersion = parseInt('' + browser.fullVersion, 10);
	if (isNaN(browser.majorVersion)) {
		browser.fullVersion = '' + parseFloat(navigator.appVersion);
		browser.majorVersion = parseInt(navigator.appVersion, 10);
	}
	browser.version = browser.majorVersion;

	$.browser = $.browser || {};
	$.extend($.browser, browser);
	return $;


}));

/*
 * =============================================================
 * $.device
 * =============================================================
 *
 * Dependencies:
 * jQuery 2.0+
 *
 */

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
		root.returnExports = factory();
	}
}(this, function () {
	var TABLET_MIN_WIDTH = 661;
	var device = {};
	device.touch = $.support.touch || 'ontouchend' in document;
	device.android = false;
	device.iphone = false;
	device.ipad = false;
	device.ipod = false;
	device.ios = false;
	device.webos = false;
	device.blackberry = false;
	device.smartphone = false;
	device.tablet = false;
	device.retina = false;


	if (/Android/.test(navigator.userAgent)) {
		device.android = device.touch;

	} else if (/iPhone/.test(navigator.userAgent)) {
		device.iphone = device.touch;

	} else if (/iPad/.test(navigator.userAgent)) {
		device.ipad = device.touch;

	} else if (/iPod/.test(navigator.userAgent)) {
		device.ipod = device.touch;

	} else if (/webOS/.test(navigator.userAgent)) {
		device.webos = device.touch;

	} else if (/BlackBerry/.test(navigator.userAgent)) {
		device.blackberry = device.touch;

	}
	if ((device.iphone) || (device.ipad) || (device.ipod)) {
		device.ios = true;
	}


	Object.defineProperties(device, {
		'viewport': {
			/**
             * getter
             *
             * @returns {{width: *, height: *}}
             */
			get: function () {
				var width = _getScreenWidth();
				var height = _getScreenHeight();
				return {
					width: width,
					height: height
				};
			},
			configurable: false

		},

		'orientation': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var width = _getScreenWidth();
				var height = _getScreenHeight();
				return (height > width) ? 'portrait' : 'landscape';
			},
			configurable: false

		},

		/**
         * getter
         * @returns {string}
         */
		'orientationEvent': {
			get: function () {
				var supportsOrientationChange = "onorientationchange" in window,
                    orientationEvent = supportsOrientationChange ? 'orientationchange' : 'resize';

				return orientationEvent;
			}
		}
	});


	if (window.devicePixelRatio > 1) {
		device.retina = true;
	}
	if ((_getScreenHeight() > TABLET_MIN_WIDTH) || (_getScreenWidth() > TABLET_MIN_WIDTH)) {
		device.tablet = true;
		device.smartphone = false;
	} else {
		device.tablet = false;
		device.smartphone = true;
	}
	if (!device.touch) {
		device.tablet = false;
		device.smartphone = false;
	}

	

	//private

	/**
     *
     * @returns {Number|*|jQuery}
     * @private
     */
	function _getScreenHeight() {
		return window.innerHeight || $(window).height();
	}

	/**
     *
     * @returns {Number|*|jQuery}
     * @private
     */
	function _getScreenWidth() {
		return window.innerWidth || $(window).width();
	}
	$.device = $.device || {};
	$.extend($.device, device);
	return $;


}));


/*
 * =============================================================
 * $.device.mq
 * =============================================================
 *
 * Dependencies:
 * jQuery 2.0+
 *
 */

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
		root.returnExports = factory();
	}
}(this, function () {
	var mq = {};
	var MQ_TOUCH_MAX_WIDTH = 1024;
	var MQ_TOUCH_MIN_WIDTH = 320;
	var MQ_SMARTPHONE_MAX_WIDTH = 640;
	var MQ_TABLET_MIN_WIDTH = 641;

	Object.defineProperties(mq, {
		'touch': {
			/**
             * getter
             *
             * @returns {boolean}
             */
			get: function () {
				return ($.device.viewport.width <= MQ_TOUCH_MAX_WIDTH);
			},
			configurable: false

		},

		'smartphone': {
			/**
             * getter
             *
             * @returns {boolean}
             */
			get: function () {
				return ($.touch.device.viewport.width <= MQ_SMARTPHONE_MAX_WIDTH);
			},
			configurable: false

		},

		'touchQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(max-width:' + MQ_TOUCH_MAX_WIDTH + 'px) and (min-width:' + MQ_TOUCH_MIN_WIDTH + 'px)';
				return mediaQuery;
			},
			configurable: false

		},

		'touchLandscapeQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(max-width:' + MQ_TOUCH_MAX_WIDTH + 'px) and (min-width:' + MQ_TOUCH_MIN_WIDTH + 'px) and (orientation:landscape)';
				return mediaQuery;
			},
			configurable: false

		},

		'touchPortraitQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(max-width:' + MQ_TOUCH_MAX_WIDTH + 'px) and (min-width:' + MQ_TOUCH_MIN_WIDTH + 'px) and (orientation:portrait)';
				return mediaQuery;
			},
			configurable: false

		},

		'tabletQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(max-width:' + (MQ_TOUCH_MAX_WIDTH - 1) + 'px) and (min-width:' + MQ_TABLET_MIN_WIDTH + 'px)';
				return mediaQuery;
			},
			configurable: false

		},

		'tabletLandscapeQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(max-width:' + MQ_TOUCH_MAX_WIDTH + 'px) and (min-width:' + MQ_TABLET_MIN_WIDTH + 'px) and (orientation:landscape)';
				return mediaQuery;
			},
			configurable: false

		},

		'tabletPortraitQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(max-width:' + MQ_TOUCH_MAX_WIDTH + 'px) and (min-width:' + MQ_TABLET_MIN_WIDTH + 'px) and (orientation:portrait)';
				return mediaQuery;
			},
			configurable: false

		},

		'smartPhoneQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(max-width:' + MQ_SMARTPHONE_MAX_WIDTH + 'px)';
				return mediaQuery;
			},
			configurable: false

		},

		'smartPhoneLandscapeQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(max-width:' + MQ_SMARTPHONE_MAX_WIDTH + 'px) and (orientation:landscape)';
				return mediaQuery;
			},
			configurable: false

		},

		'smartPhonePortraitQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(max-width:' + MQ_SMARTPHONE_MAX_WIDTH + 'px) and (orientation:portrait)';
				return mediaQuery;
			},
			configurable: false

		},

		'landscapeQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(orientation:landscape)';
				return mediaQuery;
			},
			configurable: false

		},

		'portraitQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var mediaQuery = '(orientation:portrait)';
				return mediaQuery;
			},
			configurable: false

		},

		'desktopQuery': {
			/**
             * getter
             *
             * @returns {string}
             */
			get: function () {
				var desktopMinWidth = MQ_TOUCH_MAX_WIDTH + 1;
				var mediaQuery = '(min-width:' + desktopMinWidth + 'px)';
				return mediaQuery;
			},
			configurable: false

		}


	});

	$.device = $.device || {};
	$.device.mq = mq;

	return $;

}));

/*
 * =============================================================
 * jQuery.support
 * =============================================================
 *
 * almost all tests adopted from Modernizr
 *
 *
 *
 * Dependencies:
 * jQuery 2.0+
 *
 *
 */
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
	var support = {},


        docElement = document.documentElement,

        mod = 'elliptical',

        modElem = document.createElement(mod),

        mStyle = modElem.style,

        toString = {}.toString,

        prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),

        omPrefixes = 'Webkit Moz O ms',

        cssomPrefixes = omPrefixes.split(' '),

        domPrefixes = omPrefixes.toLowerCase().split(' '),

        ns = { 'svg': 'http://www.w3.org/2000/svg' },

        classes = [],

        slice = classes.slice,

        featureName,
        injectElementWithStyles = function (rule, callback, nodes, testnames) {

        	var style, ret, node, docOverflow,
                div = document.createElement('div'),
                body = document.body,
                fakeBody = body || document.createElement('body');

        	if (parseInt(nodes, 10)) {
        		while (nodes--) {
        			node = document.createElement('div');
        			node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
        			div.appendChild(node);
        		}
        	}

        	style = ['&#173;', '<style id="s', mod, '">', rule, '</style>'].join('');
        	div.id = mod;
        	(body ? div : fakeBody).innerHTML += style;
        	fakeBody.appendChild(div);
        	if (!body) {
        		fakeBody.style.background = '';
        		fakeBody.style.overflow = 'hidden';
        		docOverflow = docElement.style.overflow;
        		docElement.style.overflow = 'hidden';
        		docElement.appendChild(fakeBody);
        	}

        	ret = callback(div, rule);
        	if (!body) {
        		fakeBody.parentNode.removeChild(fakeBody);
        		docElement.style.overflow = docOverflow;
        	} else {
        		div.parentNode.removeChild(div);
        	}

        	return !!ret;

        },

        testMediaQuery = function (mq) {

        	var matchMedia = window.matchMedia || window.msMatchMedia;
        	if (matchMedia) {
        		return matchMedia(mq).matches;
        	}

        	var bool;

        	injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function (node) {
        		bool = (window.getComputedStyle ?
                    getComputedStyle(node, null) :
                    node.currentStyle)['position'] == 'absolute';
        	});

        	return bool;

        },



        _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

	function setCss(str) {
		mStyle.cssText = str;
	}

	function setCssAll(str1, str2) {
		return setCss(prefixes.join(str1 + ';') + (str2 || ''));
	}

	function is(obj, type) {
		return typeof obj === type;
	}

	function contains(str, substr) {
		return !!~('' + str).indexOf(substr);
	}

	function testProps(props, prefixed) {
		for (var i in props) {
			var prop = props[i];
			if (!contains(prop, "-") && mStyle[prop] !== undefined) {
				return prefixed == 'pfx' ? prop : true;
			}
		}
		return false;
	}

	function testDOMProps(props, obj, elem) {
		for (var i in props) {
			var item = obj[props[i]];
			if (item !== undefined) {

				if (elem === false) {
					return props[i];
				}

				if (is(item, 'function')) {
					return item.bind(elem || obj);
				}

				return item;
			}
		}
		return false;
	}

	function prefixed(prop, obj, elem) {
		if (!obj) {
			return testPropsAll(prop, 'pfx');
		} else {
			return testPropsAll(prop, obj, elem);
		}
	}

	function testPropsAll(prop, prefixed, elem) {

		var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
            props = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

		if (is(prefixed, "string") || is(prefixed, "undefined")) {
			return testProps(props, prefixed);

		} else {
			props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
			return testDOMProps(props, prefixed, elem);
		}
	}

	support.orientation = testOrientation();
	function testOrientation() {
	    return ("orientation" in window && "onorientationchange" in window);
	}
	

	//touch
	support.touch = testTouch();
	function testTouch() {
		var bool;

		if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
			bool = true;
		} else {
			injectElementWithStyles(['@media (', prefixes.join('touch-enabled),('), mod, ')', '{#elliptical{top:9px;position:absolute}}'].join(''), function (node) {
				bool = node.offsetTop === 9;
			});
		}

		return bool;
	}

	//canvas
	support.canvas = testCanvas();
	function testCanvas() {
		var elem = document.createElement('canvas');
		return !!(elem.getContext && elem.getContext('2d'));

	}

	//geolocation
	support.geolocation = testGeolocation();
	function testGeolocation() {
		return 'geolocation' in navigator;
	}

	//history
	support.history = testHistory();
	function testHistory() {
		return !!(window.history && history.pushState);
	}

	//dragdrop
	support.dragdrop = testDragDrop();
	function testDragDrop() {
		var div = document.createElement('div');
		return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
	}

	//websockets
	support.websockets = testWebSockets();
	function testWebSockets() {
		return 'WebSocket' in window || 'MozWebSocket' in window;
	}

	//css3dtransforms
	support.css3dtransforms = testCSSTransform3d();
	function testCSSTransform3d() {
		var ret = !!testPropsAll('perspective');

		if (ret && 'webkitPerspective' in docElement.style) {

			injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#elliptical{left:9px;position:absolute;height:3px;}}', function (node, rule) {
				ret = node.offsetLeft === 9 && node.offsetHeight === 3;
			});
		}
		return ret;

	}

	//video
	support.video = testVideo();
	function testVideo() {
		var elem = document.createElement('video'),
            bool = false;

		try {
			if (bool = !!elem.canPlayType) {
				bool = new Boolean(bool);
				bool.ogg = elem.canPlayType('video/ogg; codecs="theora"').replace(/^no$/, '');

				bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/, '');

				bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/, '');
			}

		} catch (e) {
		}

		return bool;
	}

	//audio
	support.audio = testAudio();
	function testAudio() {
		var elem = document.createElement('audio'),
            bool = false;

		try {
			if (bool = !!elem.canPlayType) {
				bool = new Boolean(bool);
				bool.ogg = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
				bool.mp3 = elem.canPlayType('audio/mpeg;').replace(/^no$/, '');

				bool.wav = elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '');
				bool.m4a = (elem.canPlayType('audio/x-m4a;') ||
                    elem.canPlayType('audio/aac;')).replace(/^no$/, '');
			}
		} catch (e) {
		}

		return bool;
	}

	//localstorage
	support.localstorage = testLocalStorage();
	function testLocalStorage() {
		try {
			localStorage.setItem(mod, mod);
			localStorage.removeItem(mod);
			return true;
		} catch (e) {
			return false;
		}
	}

	//sessionstorage
	support.sessionstorage = testSessionStorage();
	function testSessionStorage() {
		try {
			sessionStorage.setItem(mod, mod);
			sessionStorage.removeItem(mod);
			return true;
		} catch (e) {
			return false;
		}
	}

	//web workers
	support.webworkers = testWebWorkers();
	function testWebWorkers() {
		return !!window.Worker;
	}

	//application cache
	support.applicationcache = testApplicationCache();
	function testApplicationCache() {
		return !!window.applicationCache;
	}

	//svg
	support.svg = testSVG();
	function testSVG() {
		return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
	}

	//inline svg
	support.inlinesvg = testInlineSVG();
	function testInlineSVG() {
		var div = document.createElement('div');
		div.innerHTML = '<svg/>';
		return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
	}

	//svg clip paths
	support.svgclippaths = testSVGClipPaths();
	function testSVGClipPaths() {
		return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
	}

	//webkit background clip
	support.backgroundclip = testBackgroundClip();
	function testBackgroundClip() {

		if (/Android/.test(navigator.userAgent)) {
			return false;
		}
		var ele = document.createElement("elliptical");
		var ret = ((typeof ele.style.webkitBackgroundClip !== 'undefined') && (ele.style.webkitBackgroundClip = 'text'));
		var textSupport = ele.style.webkitBackgroundClip == 'text';
		return textSupport;

	}

	//content editable
	support.contenteditbale = testContentEditable();
	function testContentEditable() {
		return 'contentEditable' in document.documentElement;
	}

	//overflow scrolling
	support.overflowscrolling = testOverflowScrolling();
	function testOverflowScrolling() {
		return testPropsAll('overflowScrolling');
	}

	//css resize
	support.cssresize = testResize();
	function testResize() {
		return testPropsAll('resize');
	}

	//css flexwrap
	support.flexwrap = testFlexWrap();
	function testFlexWrap() {
		return testPropsAll('flexWrap');
	}

	//postmessage
	support.postmessage = testPostMessage();
	function testPostMessage() {
		return !!window.postMessage;
	}

	//dataview
	support.dataview = testDataView();
	function testDataView() {
		return (typeof DataView !== 'undefined' && 'getFloat64' in DataView.prototype);
	}

	//dataset
	support.dataset = testDataSet();
	function testDataSet() {
		var n = document.createElement("div");
		n.setAttribute("data-a-b", "c");
		return !!(n.dataset && n.dataset.aB === "c");
	}

	//progressbar
	support.progressbar = testProgressBar();
	function testProgressBar() {
		return document.createElement('progress').max !== undefined;
	}

	//meter
	support.meter = testMeter();
	function testMeter() {
		return document.createElement('meter').max !== undefined;
	}

	//filesystem
	support.filesystem = testFilesystem();
	function testFilesystem() {
		return !!prefixed('requestFileSystem', window);
	}

	//filereader
	support.filereader = testFileReader();
	function testFileReader() {
		return !!(window.File && window.FileList && window.FileReader);
	}

	//fullscreen
	support.fullscreen = testFullScreen();
	function testFullScreen() {
		for (var i = 0; i < domPrefixes.length; i++) {
			if (document[domPrefixes[i].toLowerCase() + 'CancelFullScreen']) {
				return true;
			}

		}
		return !!document['cancelFullScreen'] || false;
	}

	//cors
	support.cors = testCors();
	function testCors() {
		return !!(window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest());
	}

	//battery
	support.battery = testBattery();
	function testBattery() {
		return !!prefixed('battery', navigator);
	}

	//low battery
	support.lowbattery = testLowBattery();
	function testLowBattery() {
		var minLevel = 0.20,
            battery = prefixed('battery', navigator);
		return !!(battery && !battery.charging && battery.level <= minLevel);
	}

	//flexbox
	support.flexbox = testFlexbox();
	function testFlexbox() {
		return testPropsAll('flexWrap');
	}

	//indexedDB
	support.indexeddb = testIndexedDB();
	function testIndexedDB() {
		return !!testPropsAll("indexedDB", window);
	}

	//hsla
	support.hsla = hsla();
	function hsla() {
		setCss('background-color:hsla(120,40%,100%,.5)');
		return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
	}

	//multiple backgrounds
	support.multiplebgs = multiplebgs();
	function multiplebgs() {
		setCss('background:url(https://),url(https://),red url(https://)');
		return (/(url\s*\(.*?){3}/).test(mStyle.background);
	}

	//css columns
	support.csscolumns = cssColumns();
	function cssColumns() {
		return testPropsAll('columnCount');
	}

	//css reflections
	support.cssreflections = cssReflections();
	function cssReflections() {
		return testPropsAll('boxReflect');
	}

    //devicemotion
	support.devicemotion = testDeviceMotion();
	function testDeviceMotion() {
	    return 'DeviceMotionEvent' in window;
	}

    //deviceorientation
	support.deviceorientation = testDeviceOrientation();
	function testDeviceOrientation() {
	    return 'DeviceOrientationEvent' in window;
	}

    //connectiontype (note buggy) bugs.webkit.org/show_bug.cgi?id=73528
	support.connectiontype = testConnectionType();
	function testConnectionType() {
	    var connection = navigator.connection || { type: 0 };
	    return connection.type;
	}

    //lowbandwidth (note buggy) bugs.webkit.org/show_bug.cgi?id=73528
	support.lowbandwidth = testLowBandwidth();
	function testLowBandwidth() {
	    var connection = navigator.connection || { type: 0 };

	    return connection.type == 3 || // connection.CELL_2G
            connection.type == 4 || // connection.CELL_3G
            /^[23]g$/.test(connection.type);
	}


	//form validation
	support.formvalidation = testFormValidation();
	function testFormValidation() {
		var form = document.createElement('form');
		if (!('checkValidity' in form)) {
			return false;
		}
		var body = document.body,

            html = document.documentElement,

            bodyFaked = false,

            invaildFired = false,

            input,

            formvalidationapi = true;

		// Prevent form from being submitted
		form.onsubmit = function (e) {
			//Opera does not validate form, if submit is prevented
			if (!window.opera) {
				e.preventDefault();
			}
			e.stopPropagation();
		};

		// Calling form.submit() doesn't trigger interactive validation,
		// use a submit button instead
		//older opera browsers need a name attribute
		form.innerHTML = '<input name="modTest" required><button></button>';

		// FF4 doesn't trigger "invalid" event if form is not in the DOM tree
		// Chrome throws error if invalid input is not visible when submitting
		form.style.position = 'absolute';
		form.style.top = '-99999em';

		// We might in <head> in which case we need to create body manually
		if (!body) {
			bodyFaked = true;
			body = document.createElement('body');
			//avoid crashing IE8, if background image is used
			body.style.background = "";
			html.appendChild(body);
		}

		body.appendChild(form);

		input = form.getElementsByTagName('input')[0];

		// Record whether "invalid" event is fired
		input.oninvalid = function (e) {
			invaildFired = true;
			e.preventDefault();
			e.stopPropagation();
		};

		//presto Opera does not fully support the validationMessage property
		var formvalidationmessage = !!input.validationMessage;

		// Submit form by clicking submit button
		form.getElementsByTagName('button')[0].click();

		// Don't forget to clean up
		body.removeChild(form);
		bodyFaked && html.removeChild(body);

		return invaildFired;
	}
	support.init = function () {
		var html = $('html');
		html.removeClass('no-js');
		html.addClass('js');
		var tests = ['touch', 'canvas', 'svg', 'history', 'formvalidation', 'localstorage', 'sessionstorage', 'meter', 'backgroundclip', 'inlinesvg',
            'svgclippaths', 'css3dtransforms', 'video', 'audio', 'progressbar', 'cssresize', 'postmessage', 'overflowscrolling', 'flexbox',
            'indexeddb', 'hsla', 'multiplebgs', 'csscolumns', 'cssreflections', 'flexwrap'];

		tests.forEach(function (t) {
			support[t] ? html.addClass(t) : html.addClass('no-' + t);
		});

		

	};

	support.stickyFooter = function () {
		if ($.browser.msie) {
			var stickyFooter = $('.ui-sticky-footer');
			if (stickyFooter[0]) {
				stickyFooter.addClass('ns');
			}
		}


	};


	support.init();
	support.stickyFooter();
	$.support = $.support || {};
	$.extend($.support, support);

	return $;

}));

/*
 * =============================================================
 * jQuery.transition
 * =============================================================
 *
 * culled in large part from https://github.com/rstacruz/jquery.transit/
 *
 */

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
        root.returnExports = factory();
    }
}(this, function () {

    $.transit = {

        // Map of $.css() keys to values for 'transitionProperty'.
        // See https://developer.mozilla.org/en/CSS/CSS_transitions#Properties_that_can_be_animated
        propertyMap: {
            marginLeft: 'margin',
            marginRight: 'margin',
            marginBottom: 'margin',
            marginTop: 'margin',
            paddingLeft: 'padding',
            paddingRight: 'padding',
            paddingBottom: 'padding',
            paddingTop: 'padding'
        },

        // Will simply transition "instantly" if false
        enabled: true,

        // Set this to false if you don't want to use the transition end property.
        useTransitionEnd: false
    };

    var div = document.createElement('div');
    var support = {};

    // Helper function to get the proper vendor property name.
    // (`transition` => `WebkitTransition`)
    function getVendorPropertyName(prop) {
        var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
        var prop_ = prop.charAt(0).toUpperCase() + prop.substr(1);

        if (prop in div.style) { return prop; }

        for (var i = 0; i < prefixes.length; ++i) {
            var vendorProp = prefixes[i] + prop_;
            if (vendorProp in div.style) { return vendorProp; }
        }
    }

    // Helper function to check if transform3D is supported.
    // Should return true for Webkits and Firefox 10+.
    function checkTransform3dSupport() {
        div.style[support.transform] = '';
        div.style[support.transform] = 'rotateY(90deg)';
        return div.style[support.transform] !== '';
    }

    var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

    // Check for the browser's transitions support.
    // You can access this in jQuery's `$.support.transition`.
    // As per [jQuery's cssHooks documentation](http://api.jquery.com/jQuery.cssHooks/),
    // we set $.support.transition to a string of the actual property name used.
    support.transition = getVendorPropertyName('transition');
    support.transitionDelay = getVendorPropertyName('transitionDelay');
    support.transform = getVendorPropertyName('transform');
    support.transformOrigin = getVendorPropertyName('transformOrigin');
    support.transform3d = checkTransform3dSupport();

    $.extend($.support, support);

    var eventNames = {
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'WebkitTransition': 'webkitTransitionEnd',
        'msTransition': 'MSTransitionEnd'
    };

    // Detect the 'transitionend' event needed.
    var transitionEnd = support.transitionEnd = eventNames[support.transition] || null;

    // Avoid memory leak in IE.
    div = null;

    // ## $.cssEase
    // List of easing aliases that you can use with `$.fn.transition`.
    $.cssEase = {
        '_default': 'ease',
        'in': 'ease-in',
        'out': 'ease-out',
        'in-out': 'ease-in-out',
        'snap': 'cubic-bezier(0,1,.5,1)'
    };

    // ## 'transform' CSS hook
    // Allows you to use the `transform` property in CSS.
    //
    //     $("#hello").css({ transform: "rotate(90deg)" });
    //
    //     $("#hello").css('transform');
    //     //=> { rotate: '90deg' }
    //
    $.cssHooks.transform = {
        // The getter returns a `Transform` object.
        get: function (elem) {
            return $(elem).data('transform');
        },

        // The setter accepts a `Transform` object or a string.
        set: function (elem, v) {
            var value = v;

            if (!(value instanceof Transform)) {
                value = new Transform(value);
            }

            // We've seen the 3D version of Scale() not work in Chrome when the
            // element being scaled extends outside of the viewport.  Thus, we're
            // forcing Chrome to not use the 3d transforms as well.  Not sure if
            // translate is affectede, but not risking it.  Detection code from
            // http://davidwalsh.name/detecting-google-chrome-javascript
            if (support.transform === 'WebkitTransform' && !isChrome) {
                elem.style[support.transform] = value.toString(true);
            } else {
                elem.style[support.transform] = value.toString();
            }

            $(elem).data('transform', value);
        }
    };

    // ## 'transformOrigin' CSS hook
    // Allows the use for `transformOrigin` to define where scaling and rotation
    // is pivoted.
    //
    //     $("#hello").css({ transformOrigin: '0 0' });
    //
    $.cssHooks.transformOrigin = {
        get: function (elem) {
            return elem.style[support.transformOrigin];
        },
        set: function (elem, value) {
            elem.style[support.transformOrigin] = value;
        }
    };

    // ## 'transition' CSS hook
    // Allows you to use the `transition` property in CSS.
    //
    //     $("#hello").css({ transition: 'all 0 ease 0' });
    //
    $.cssHooks.transition = {
        get: function (elem) {
            return elem.style[support.transition];
        },
        set: function (elem, value) {
            elem.style[support.transition] = value;
        }
    };

    // ## Other CSS hooks
    // Allows you to rotate, scale and translate.
    registerCssHook('scale');
    registerCssHook('translate');
    registerCssHook('rotate');
    registerCssHook('rotateX');
    registerCssHook('rotateY');
    registerCssHook('rotate3d');
    registerCssHook('perspective');
    registerCssHook('skewX');
    registerCssHook('skewY');
    registerCssHook('x', true);
    registerCssHook('y', true);

    // ## Transform class
    // This is the main class of a transformation property that powers
    // `$.fn.css({ transform: '...' })`.
    //
    // This is, in essence, a dictionary object with key/values as `-transform`
    // properties.
    //
    //     var t = new Transform("rotate(90) scale(4)");
    //
    //     t.rotate             //=> "90deg"
    //     t.scale              //=> "4,4"
    //
    // Setters are accounted for.
    //
    //     t.set('rotate', 4)
    //     t.rotate             //=> "4deg"
    //
    // Convert it to a CSS string using the `toString()` and `toString(true)` (for WebKit)
    // functions.
    //
    //     t.toString()         //=> "rotate(90deg) scale(4,4)"
    //     t.toString(true)     //=> "rotate(90deg) scale3d(4,4,0)" (WebKit version)
    //
    function Transform(str) {
        if (typeof str === 'string') { this.parse(str); }
        return this;
    }

    Transform.prototype = {
        // ### setFromString()
        // Sets a property from a string.
        //
        //     t.setFromString('scale', '2,4');
        //     // Same as set('scale', '2', '4');
        //
        setFromString: function (prop, val) {
            var args =
                (typeof val === 'string') ? val.split(',') :
                    (val.constructor === Array) ? val :
                        [val];

            args.unshift(prop);

            Transform.prototype.set.apply(this, args);
        },

        // ### set()
        // Sets a property.
        //
        //     t.set('scale', 2, 4);
        //
        set: function (prop) {
            var args = Array.prototype.slice.apply(arguments, [1]);
            if (this.setter[prop]) {
                this.setter[prop].apply(this, args);
            } else {
                this[prop] = args.join(',');
            }
        },

        get: function (prop) {
            if (this.getter[prop]) {
                return this.getter[prop].apply(this);
            } else {
                return this[prop] || 0;
            }
        },

        setter: {
            // ### rotate
            //
            //     .css({ rotate: 30 })
            //     .css({ rotate: "30" })
            //     .css({ rotate: "30deg" })
            //     .css({ rotate: "30deg" })
            //
            rotate: function (theta) {
                this.rotate = unit(theta, 'deg');
            },

            rotateX: function (theta) {
                this.rotateX = unit(theta, 'deg');
            },

            rotateY: function (theta) {
                this.rotateY = unit(theta, 'deg');
            },

            // ### scale
            //
            //     .css({ scale: 9 })      //=> "scale(9,9)"
            //     .css({ scale: '3,2' })  //=> "scale(3,2)"
            //
            scale: function (x, y) {
                if (y === undefined) { y = x; }
                this.scale = x + "," + y;
            },

            // ### skewX + skewY
            skewX: function (x) {
                this.skewX = unit(x, 'deg');
            },

            skewY: function (y) {
                this.skewY = unit(y, 'deg');
            },

            // ### perspectvie
            perspective: function (dist) {
                this.perspective = unit(dist, 'px');
            },

            // ### x / y
            // Translations. Notice how this keeps the other value.
            //
            //     .css({ x: 4 })       //=> "translate(4px, 0)"
            //     .css({ y: 10 })      //=> "translate(4px, 10px)"
            //
            x: function (x) {
                this.set('translate', x, null);
            },

            y: function (y) {
                this.set('translate', null, y);
            },

            // ### translate
            // Notice how this keeps the other value.
            //
            //     .css({ translate: '2, 5' })    //=> "translate(2px, 5px)"
            //
            translate: function (x, y) {
                if (this._translateX === undefined) { this._translateX = 0; }
                if (this._translateY === undefined) { this._translateY = 0; }

                if (x !== null) { this._translateX = unit(x, 'px'); }
                if (y !== null) { this._translateY = unit(y, 'px'); }

                this.translate = this._translateX + "," + this._translateY;
            }
        },

        getter: {
            x: function () {
                return this._translateX || 0;
            },

            y: function () {
                return this._translateY || 0;
            },

            scale: function () {
                var s = (this.scale || "1,1").split(',');
                if (s[0]) { s[0] = parseFloat(s[0]); }
                if (s[1]) { s[1] = parseFloat(s[1]); }

                // "2.5,2.5" => 2.5
                // "2.5,1" => [2.5,1]
                return (s[0] === s[1]) ? s[0] : s;
            },

            rotate3d: function () {
                var s = (this.rotate3d || "0,0,0,0deg").split(',');
                for (var i = 0; i <= 3; ++i) {
                    if (s[i]) { s[i] = parseFloat(s[i]); }
                }
                if (s[3]) { s[3] = unit(s[3], 'deg'); }

                return s;
            }
        },

        // ### parse()
        // Parses from a string. Called on constructor.
        parse: function (str) {
            var self = this;
            str.replace(/([a-zA-Z0-9]+)\((.*?)\)/g, function (x, prop, val) {
                self.setFromString(prop, val);
            });
        },

        // ### toString()
        // Converts to a `transition` CSS property string. If `use3d` is given,
        // it converts to a `-webkit-transition` CSS property string instead.
        toString: function (use3d) {
            var re = [];

            for (var i in this) {
                if (this.hasOwnProperty(i)) {
                    // Don't use 3D transformations if the browser can't support it.
                    if ((!support.transform3d) && (
                        (i === 'rotateX') ||
                        (i === 'rotateY') ||
                        (i === 'perspective') ||
                        (i === 'transformOrigin'))) { continue; }

                    if (i[0] !== '_') {
                        if (use3d && (i === 'scale')) {
                            re.push(i + "3d(" + this[i] + ",1)");
                        } else if (use3d && (i === 'translate')) {
                            re.push(i + "3d(" + this[i] + ",0)");
                        } else {
                            re.push(i + "(" + this[i] + ")");
                        }
                    }
                }
            }

            return re.join(" ");
        }
    };

    function callOrQueue(self, queue, fn) {
        if (queue === true) {
            self.queue(fn);
        } else if (queue) {
            self.queue(queue, fn);
        } else {
            fn();
        }
    }

    // ### getProperties(dict)
    // Returns properties (for `transition-property`) for dictionary `props`. The
    // value of `props` is what you would expect in `$.css(...)`.
    function getProperties(props) {
        var re = [];

        $.each(props, function (key) {
            key = $.camelCase(key); // Convert "text-align" => "textAlign"
            key = $.transit.propertyMap[key] || key;
            key = uncamel(key); // Convert back to dasherized

            if ($.inArray(key, re) === -1) { re.push(key); }
        });

        return re;
    }

    // ### getTransition()
    // Returns the transition string to be used for the `transition` CSS property.
    //
    // Example:
    //
    //     getTransition({ opacity: 1, rotate: 30 }, 500, 'ease');
    //     //=> 'opacity 500ms ease, -webkit-transform 500ms ease'
    //
    function getTransition(properties, duration, easing, delay) {
        // Get the CSS properties needed.
        var props = getProperties(properties);

        // Account for aliases (`in` => `ease-in`).
        if ($.cssEase[easing]) { easing = $.cssEase[easing]; }

        // Build the duration/easing/delay attributes for it.
        var attribs = '' + toMS(duration) + ' ' + easing;
        if (parseInt(delay, 10) > 0) { attribs += ' ' + toMS(delay); }

        // For more properties, add them this way:
        // "margin 200ms ease, padding 200ms ease, ..."
        var transitions = [];
        $.each(props, function (i, name) {
            transitions.push(name + ' ' + attribs);
        });

        return transitions.join(', ');
    }

    // ## $.fn.transition
    // Works like $.fn.animate(), but uses CSS transitions.
    //
    //     $("...").transition({ opacity: 0.1, scale: 0.3 });
    //
    //     // Specific duration
    //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500);
    //
    //     // With duration and easing
    //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500, 'in');
    //
    //     // With callback
    //     $("...").transition({ opacity: 0.1, scale: 0.3 }, function() { ... });
    //
    //     // With everything
    //     $("...").transition({ opacity: 0.1, scale: 0.3 }, 500, 'in', function() { ... });
    //
    //     // Alternate syntax
    //     $("...").transition({
    //       opacity: 0.1,
    //       duration: 200,
    //       delay: 40,
    //       easing: 'in',
    //       complete: function() { /* ... */ }
    //      });
    //
    $.fn.transition = $.fn.transit = function (properties, callback) {
        var self = this;
        var delay = 0;
        var queue = true;
        var easing;
        var duration;
        var count;
        var preset;

        /*// Account for `.transition(properties, callback)`.
         if (typeof duration === 'function') {
         callback = duration;
         duration = undefined;
         }

         // Account for `.transition(properties, duration, callback)`.
         if (typeof easing === 'function') {
         callback = easing;
         easing = undefined;
         }*/

        // Alternate syntax.
        if (typeof properties.easing !== 'undefined') {
            easing = properties.easing;
            delete properties.easing;
        }

        if (typeof properties.duration !== 'undefined') {
            duration = properties.duration;
            delete properties.duration;
        }

        if (typeof properties.complete !== 'undefined') {
            callback = properties.complete;
            delete properties.complete;
        }

        if (typeof properties.queue !== 'undefined') {
            queue = properties.queue;
            delete properties.queue;
        }

        if (typeof properties.delay !== 'undefined') {
            delay = properties.delay;
            delete properties.delay;
        }


        preset=properties.preset;
        count=properties.count;
        if(preset!==undefined){
            if ((duration === undefined)||(duration===0)) {
                duration = '';
            } else {
                duration = toSeconds(duration).toString();
            }
            if ((delay === undefined)||(delay===0)) {
                delay = '';
            } else {
                delay = toSeconds(delay).toString();
            }
            if ((count === undefined)||(count===0)) {
                count = '';
            } else {
                count = count.toString();
            }
            var options={};
            options.duration=duration;
            options.delay=delay;
            options.count=count;
            return CSS3.animate(self, options, callback, preset,properties.remove);

        }

        // Set defaults. (`400` duration, `ease` easing)
        if (typeof duration === 'undefined') { duration = $.fx.speeds._default; }
        if (typeof easing === 'undefined') { easing = $.cssEase._default; }

        duration = toMS(duration);

        // Build the `transition` property.
        var transitionValue = getTransition(properties, duration, easing, delay);

        // Compute delay until callback.
        // If this becomes 0, don't bother setting the transition property.
        var work = $.transit.enabled && support.transition;
        var i = work ? (parseInt(duration, 10) + parseInt(delay, 10)) : 0;

        // If there's nothing to do...
        if (i === 0) {
            var fn = function (next) {
                self.css(properties);
                if (callback) { callback.apply(self); }
                if (next) { next(); }
            };

            callOrQueue(self, queue, fn);
            return self;
        }

        // Save the old transitions of each element so we can restore it later.
        var oldTransitions = {};

        var run = function (nextCall) {
            var bound = false;

            // Prepare the callback.
            var cb = function () {
                if (bound) { self.unbind(transitionEnd, cb); }

                if (i > 0) {
                    self.each(function () {
                        this.style[support.transition] = (oldTransitions[this] || null);
                    });
                }

                if (typeof callback === 'function') { callback.apply(self); }
                if (typeof nextCall === 'function') { nextCall(); }
            };

            if ((i > 0) && (transitionEnd) && ($.transit.useTransitionEnd)) {
                // Use the 'transitionend' event if it's available.
                bound = true;
                self.bind(transitionEnd, cb);
            } else {
                // Fallback to timers if the 'transitionend' event isn't supported.
                window.setTimeout(cb, i);
            }

            // Apply transitions.
            self.each(function () {
                if (i > 0) {
                    this.style[support.transition] = transitionValue;
                }
                $(this).css(properties);
            });
        };

        // Defer running. This allows the browser to paint any pending CSS it hasn't
        // painted yet before doing the transitions.
        var deferredRun = function (next) {
            var i = 0;

            // Durations that are too slow will get transitions mixed up.
            // (Tested on Mac/FF 7.0.1)
            if ((support.transition === 'MozTransition') && (i < 25)) { i = 25; }

            window.setTimeout(function () { run(next); }, i);
        };

        // Use jQuery's fx queue.
        callOrQueue(self, queue, deferredRun);

        // Chainability.
        return this;
    };

    function registerCssHook(prop, isPixels) {
        // For certain properties, the 'px' should not be implied.
        if (!isPixels) { $.cssNumber[prop] = true; }

        $.transit.propertyMap[prop] = support.transform;

        $.cssHooks[prop] = {
            get: function (elem) {
                var t = $(elem).css('transform') || new Transform();
                return t.get(prop);
            },

            set: function (elem, value) {
                var t = $(elem).css('transform') || new Transform();
                t.setFromString(prop, value);

                $(elem).css({ transform: t });
            }
        };
    }

    // ### uncamel(str)
    // Converts a camelcase string to a dasherized string.
    // (`marginLeft` => `margin-left`)
    function uncamel(str) {
        return str.replace(/([A-Z])/g, function (letter) { return '-' + letter.toLowerCase(); });
    }

    // ### unit(number, unit)
    // Ensures that number `number` has a unit. If no unit is found, assume the
    // default is `unit`.
    //
    //     unit(2, 'px')          //=> "2px"
    //     unit("30deg", 'rad')   //=> "30deg"
    //
    function unit(i, units) {
        if ((typeof i === "string") && (!i.match(/^[\-0-9\.]+$/))) {
            return i;
        } else {
            return "" + i + units;
        }
    }

    // ### toMS(duration)
    // Converts given `duration` to a millisecond string.
    //
    //     toMS('fast')   //=> '400ms'
    //     toMS(10)       //=> '10ms'
    //
    function toMS(duration) {
        var i = duration;

        // Allow for string durations like 'fast'.
        if ($.fx.speeds[i]) { i = $.fx.speeds[i]; }

        return unit(i, 'ms');
    }

    // Export some functions for testable-ness.
    $.transit.getTransitionValue = getTransition;


    /*
     =========================================
     Preset keyframe animations extension
     =========================================
     */

    //CSS3 uses seconds as the unit measurement
    function toSeconds(ms){
        var sec=parseFloat(ms/1000);
        return sec;
    }

    var CSS3 = {};
    CSS3.pfx = ["webkit", "moz", "MS", "o"];
    if ($.browser.webkit) {
        CSS3.animationend = CSS3.pfx[0] + 'AnimationEnd';
    } else{
        CSS3.animationend = 'animationend'; /* mozilla doesn't use the vendor prefix */
    }
    CSS3.isAnimated = function (ele) {  /* method query to determine if the element is currently being animated; we don't want to attach multiple animationend handlers; undesirable behavior will result */

        //var data = ele.data("events")[CSS3.animationend];
        /*var data = $.data(ele,'events');
         console.log(data);
         if (data === undefined || data.length === 0) {
         return false;  // no animationend event handler attached, return false
         } else {
         return true;  // there is animationend event handler attached, return true
         }*/

        if(!ele[0]){
            return;
        }
        var classList = ele[0].className.split(/\s+/);
        for (var i = 0; i < classList.length; i++) {
            if (classList[i] === 'animated') {
                return true;
            }
        }
        return false;
    };

    function _unbindAnimation(ele,event,animation,animationType,callback){
        ele.removeCSSStyles()
            .removeClass(animation);
        //hide element if animationOut
        if((animationType.indexOf('Out')>-1)||(animationType.indexOf('out')>-1)){
            ele.hide();
        }
        ele.off(event);
        if (callback && callback !== undefined) {
            callback.call(ele);
        }

    }
    CSS3.animate = function (ele, options, callback, animationType, removeClass) {  /* transition animation handler */

        if (CSS3.isAnimated(ele)) {
            return ele; /* block animation request */
        }
        if (options === undefined) {
            options = {};
        }
        ele.show();
        ele.css({visibility:'visible'});
        var animation = 'animated ' + animationType;
        //bind animationEnd
        ele.on(CSS3.animationend, function (e) {
            if(removeClass !==undefined){
                ele.removeClass(removeClass);
                _unbindAnimation(ele,e,animation,animationType,callback);

            }else{
                _unbindAnimation(ele,e,animation,animationType,callback);
            }

        });

        ele.addCSSStyles(options).addClass(animation);
        return ele;
    };

    CSS3.animationEndEvent=function(){
        return CSS3.animationend;
    };

    CSS3.transitionEndEvent=function(){
        var transitionEnd;
        var pfx = ["webkit", "moz", "MS", "o"];
        if ($.browser.webkit) {
            transitionEnd = pfx[0] + 'TransitionEnd';
        } else if ($.browser.mozilla) {
            transitionEnd = 'transitionend';
            /* mozilla doesn't use the vendor prefix */
        } else if ($.browser.msie) {
            transitionEnd = pfx[2] + 'TransitionEnd';
        } else if ($.browser.opera) {
            transitionEnd = pfx[3] + 'TransitionEnd';
        } else {
            transitionEnd = 'transitionend';
        }
        return transitionEnd;
    };

    /* css style setter methods */
    $.fn.removeCSSStyles = function () {
        this.css({
            'animation-duration': '',
            'animation-delay': '',
            'animation-iteration-count': '',
            '-webkit-animation-duration': '',
            '-webkit-animation-delay': '',
            '-webkit-animation-iteration-count': '',
            '-moz-animation-duration': '',
            '-moz-animation-delay': '',
            '-moz-animation-iteration-count': '',
            'visibility':''
        });
        return this;
    };
    $.fn.addCSSStyles = function (options) {
        var duration = options.duration;
        var delay = options.delay;
        var count = options.count;
        if (duration === undefined) {
            duration = '';
        } else {
            duration = options.duration.toString() + 's';
        }
        if (delay === undefined) {
            delay = '';
        } else {
            delay = options.delay.toString() + 's';
        }
        if (count === undefined) {
            count = '';
        } else {
            count = options.count.toString();
        }

        this.css({
            'animation-duration': duration,
            'animation-delay': delay,
            'animation-iteration-count': count,
            '-webkit-animation-duration': duration,
            '-webkit-animation-delay': delay,
            '-webkit-animation-iteration-count': count,
            '-moz-animation-duration': duration,
            '-moz-animation-delay': delay,
            '-moz-animation-iteration-count': count
        });

        return this;
    };

    //expose CSS3 object
    $.transit.CSS3=CSS3;

    return $;
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
        root.returnExports = factory();
    }
}(this, function () {

    (function (doc, win) {
        'use strict';
        if (typeof doc.createEvent !== 'function') return false; // no tap events here
        // helpers
        var useJquery = typeof jQuery !== 'undefined',
        // some helpers borrowed from https://github.com/WebReflection/ie-touch
            msPointerEnabled = !!navigator.pointerEnabled || navigator.msPointerEnabled,
            isTouch = (!!('ontouchstart' in window) && navigator.userAgent.indexOf('PhantomJS') < 0) || msPointerEnabled,
            msEventType = function (type) {
                var lo = type.toLowerCase(),
                    ms = 'MS' + type;
                return navigator.msPointerEnabled ? ms : lo;
            },
            touchevents = {
                touchstart: msEventType('PointerDown') + ' touchstart',
                touchend: msEventType('PointerUp') + ' touchend',
                touchmove: msEventType('PointerMove') + ' touchmove'
            },
            setListener = function (elm, events, callback) {
                var eventsArray = events.split(' '),
                    i = eventsArray.length;

                while (i--) {
                    elm.addEventListener(eventsArray[i], callback, false);
                }
            },
            getPointerEvent = function (event) {
                return event.targetTouches ? event.targetTouches[0] : event;
            },
            sendEvent = function (elm, eventName, originalEvent, data) {
                var customEvent = doc.createEvent('Event');
                data = data || {};
                data.x = currX;
                data.y = currY;
                data.distance = data.distance;
                if (useJquery)
                    jQuery(elm).trigger(eventName, data);
                else {
                    customEvent.originalEvent = originalEvent;
                    for (var key in data) {
                        customEvent[key] = data[key];
                    }
                    customEvent.initEvent(eventName, true, true);
                    elm.dispatchEvent(customEvent);
                }
            },
            onTouchStart = function (e) {

                var pointer = getPointerEvent(e);
                // caching the current x
                cachedX = currX = pointer.pageX;
                // caching the current y
                cachedY = currY = pointer.pageY;
                // a touch event is detected
                touchStarted = true;
                tapNum++;
                // detecting if after 200ms the finger is still in the same position
                clearTimeout(tapTimer);
                tapTimer = setTimeout(function () {
                    if (
                        cachedX >= currX - precision &&
                        cachedX <= currX + precision &&
                        cachedY >= currY - precision &&
                        cachedY <= currY + precision &&
                        !touchStarted
                    ) {
                        // Here you get the Tap event
                        sendEvent(e.target, (tapNum === 2) ? 'dbltap' : 'tap', e);
                    }
                    tapNum = 0;
                }, taptreshold);

            },
            onTouchEnd = function (e) {
                var eventsArr = [],
                    deltaY = cachedY - currY,
                    deltaX = cachedX - currX;
                touchStarted = false;

                if (deltaX <= -swipeTreshold)
                    eventsArr.push('swiperight');

                if (deltaX >= swipeTreshold)
                    eventsArr.push('swipeleft');

                if (deltaY <= -swipeTreshold)
                    eventsArr.push('swipedown');

                if (deltaY >= swipeTreshold)
                    eventsArr.push('swipeup');
                if (eventsArr.length) {
                    for (var i = 0; i < eventsArr.length; i++) {
                        var eventName = eventsArr[i];
                        sendEvent(e.target, eventName, e, {
                            distance: {
                                x: Math.abs(deltaX),
                                y: Math.abs(deltaY)
                            }
                        });
                    }
                }
            },
            onTouchMove = function (e) {
                var pointer = getPointerEvent(e);
                currX = pointer.pageX;
                currY = pointer.pageY;
            },
            touchStarted = false, // detect if a touch event is sarted
            swipeTreshold = win.SWIPE_TRESHOLD || 80,
            taptreshold = win.TAP_TRESHOLD || 200,
            precision = win.TAP_PRECISION / 2 || 60 / 2, // touch events boundaries ( 60px by default )
            justTouchEvents = win.JUST_ON_TOUCH_DEVICES || isTouch,
            tapNum = 0,
            currX, currY, cachedX, cachedY, tapTimer;

        //setting the events listeners
        setListener(doc, touchevents.touchstart + (justTouchEvents ? '' : ' mousedown'), onTouchStart);
        setListener(doc, touchevents.touchend + (justTouchEvents ? '' : ' mouseup'), onTouchEnd);
        setListener(doc, touchevents.touchmove + (justTouchEvents ? '' : ' mousemove'), onTouchMove);
    }(document, window));


}));

/*
 * =============================================================
 * jQuery special events
 * =============================================================
 *
 */

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
        root.returnExports = factory();
    }
}(this, function () {

    /* throttled resize special event */
    /* ported from jQuery.mobile */
    (function () {
        $.event.special.throttledresize = {
            setup: function () {
                $(this).bind("resize", handler);
            },
            teardown: function () {
                $(this).unbind("resize", handler);
            }
        };

        var throttle = 250,
            handler = function () {
                curr = (new Date()).getTime();
                diff = curr - lastCall;

                if (diff >= throttle) {

                    lastCall = curr;
                    $(this).trigger("throttledresize");

                } else {

                    if (heldCall) {
                        clearTimeout(heldCall);
                    }

                    // Promise a held call will still execute
                    heldCall = setTimeout(handler, throttle - diff);
                }
            },
            lastCall = 0,
            heldCall,
            curr,
            diff;
    })();

    /* orientationchange special event--------------------------------------------------------------------------------*/
    /* ported from jQuery.mobile */
    (function () {
        var win = $(window),
            event_name = "orientationchange",
            special_event,
            get_orientation,
            last_orientation,
            initial_orientation_is_landscape,
            initial_orientation_is_default,
            portrait_map = { "0": true, "180": true };

        // It seems that some device/browser vendors use window.orientation values 0 and 180 to
        // denote the "default" orientation. For iOS devices, and most other smart-phones tested,
        // the default orientation is always "portrait", but in some Android and RIM based tablets,
        // the default orientation is "landscape". The following code attempts to use the window
        // dimensions to figure out what the current orientation is, and then makes adjustments
        // to the to the portrait_map if necessary, so that we can properly decode the
        // window.orientation value whenever get_orientation() is called.
        //


        if ($.device.orientation) {

            // Check the window width and height to figure out what the current orientation
            // of the device is at this moment. Note that we've initialized the portrait map
            // values to 0 and 180, *AND* we purposely check for landscape so that if we guess
            // wrong, , we default to the assumption that portrait is the default orientation.
            // We use a threshold check below because on some platforms like iOS, the iPhone
            // form-factor can report a larger width than height if the user turns on the
            // developer console. The actual threshold value is somewhat arbitrary, we just
            // need to make sure it is large enough to exclude the developer console case.

            var ww = window.innerWidth || $(window).width(),
                wh = window.innerHeight || $(window).height(),
                landscape_threshold = 50;

            initial_orientation_is_landscape = ww > wh && (ww - wh) > landscape_threshold;


            // Now check to see if the current window.orientation is 0 or 180.
            initial_orientation_is_default = portrait_map[window.orientation];

            // If the initial orientation is landscape, but window.orientation reports 0 or 180, *OR*
            // if the initial orientation is portrait, but window.orientation reports 90 or -90, we
            // need to flip our portrait_map values because landscape is the default orientation for
            // this device/browser.
            if ((initial_orientation_is_landscape && initial_orientation_is_default) || (!initial_orientation_is_landscape && !initial_orientation_is_default)) {
                portrait_map = { "-90": true, "90": true };
            }
        }

        $.event.special.orientationchange = $.extend({}, $.event.special.orientationchange, {
            setup: function () {
                // If the event is supported natively, return false so that jQuery
                // will bind to the event using DOM methods.
                if ($.device.orientation && !$.event.special.orientationchange.disabled && !$.device.android) {
                    return false;
                }

                // Get the current orientation to avoid initial double-triggering.
                last_orientation = get_orientation();

                // Because the orientationchange event doesn't exist, simulate the
                // event by testing window dimensions on resize.
                win.bind("throttledresize", handler);
            },
            teardown: function () {
                // If the event is not supported natively, return false so that
                // jQuery will unbind the event using DOM methods.
                if ($.device.orientation && !$.event.special.orientationchange.disabled && !$.device.android) {
                    return false;
                }

                // Because the orientationchange event doesn't exist, unbind the
                // resize event handler.
                win.unbind("throttledresize", handler);
            },
            add: function (handleObj) {
                // Save a reference to the bound event handler.
                var old_handler = handleObj.handler;


                handleObj.handler = function (event) {
                    // Modify event object, adding the .orientation property.
                    event.orientation = get_orientation();

                    // Call the originally-bound event handler and return its result.
                    return old_handler.apply(this, arguments);
                };
            }
        });

        // If the event is not supported natively, this handler will be bound to
        // the window resize event to simulate the orientationchange event.
        function handler() {
            // Get the current orientation.
            var orientation = get_orientation();

            if (orientation !== last_orientation) {
                // The orientation has changed, so trigger the orientationchange event.
                last_orientation = orientation;
                win.trigger(event_name);
            }
        }

        // Get the current page orientation. This method is exposed publicly, should it
        // be needed, as jQuery.event.special.orientationchange.orientation()
        $.event.special.orientationchange.orientation = get_orientation = function () {
            var isPortrait = true, elem = document.documentElement;

            // prefer window orientation to the calculation based on screensize as
            // the actual screen resize takes place before or after the orientation change event
            // has been fired depending on implementation (eg android 2.3 is before, iphone after).
            // More testing is required to determine if a more reliable method of determining the new screensize
            // is possible when orientationchange is fired. (eg, use media queries + element + opacity)
            if ($.support.orientation) {
                // if the window orientation registers as 0 or 180 degrees report
                // portrait, otherwise landscape
                isPortrait = portrait_map[window.orientation];
            } else {
                isPortrait = elem && elem.clientWidth / elem.clientHeight < 1.1;
            }

            return isPortrait ? "portrait" : "landscape";
        };

        $.fn[event_name] = function (fn) {
            return fn ? this.bind(event_name, fn) : this.trigger(event_name);
        };

        // jQuery < 1.8
        if ($.attrFn) {
            $.attrFn[event_name] = true;
        }

    }());



    /* zoom ----------------------------------------------------------------------------------------------------------*/
    /* ported from jQuery.mobile */
    (function () {
        var meta = $("meta[name=viewport]"),
            initialContent = meta.attr("content"),
            disabledZoom = initialContent + ",maximum-scale=1, user-scalable=no",
            enabledZoom = initialContent + ",maximum-scale=10, user-scalable=yes",
            disabledInitially = /(user-scalable[\s]*=[\s]*no)|(maximum-scale[\s]*=[\s]*1)[$,\s]/.test(initialContent);

        $.device.zoom = $.extend({}, {
            enabled: !disabledInitially,
            locked: false,
            disable: function (lock) {
                if (!disabledInitially && !$.device.zoom.locked) {
                    meta.attr("content", disabledZoom);
                    $.device.zoom.enabled = false;
                    $.device.zoom.locked = lock || false;
                }
            },
            enable: function (unlock) {
                if (!disabledInitially && (!$.device.zoom.locked || unlock === true)) {
                    meta.attr("content", enabledZoom);
                    $.device.zoom.enabled = true;
                    $.device.zoom.locked = false;
                }
            },
            restore: function () {
                if (!disabledInitially) {
                    meta.attr("content", initialContent);
                    $.device.zoom.enabled = true;
                }
            }
        });

    }());

    /* end zoom ------------------------------------------------------------------------------------------------------*/

    /* orientationfix ------------------------------------------------------------------------------------------------*/

    (function () {
        /* ported from jQuery.mobile */
        // This fix addresses an iOS bug, so return early if the UA claims it's something else.
        if (!(/iPhone|iPad|iPod/.test(navigator.platform) && navigator.userAgent.indexOf("AppleWebKit") > -1)) {
            return;
        }

        var zoom = $.device.zoom,
            evt, x, y, z, aig;

        function checkTilt(e) {
            evt = e.originalEvent;
            aig = evt.accelerationIncludingGravity;

            x = Math.abs(aig.x);
            y = Math.abs(aig.y);
            z = Math.abs(aig.z);

            // If portrait orientation and in one of the danger zones
            if (!window.orientation && (x > 7 || ((z > 6 && y < 8 || z < 8 && y > 6) && x > 5))) {
                if (zoom.enabled) {
                    zoom.disable();
                }
            } else if (!zoom.enabled) {
                zoom.enable();
            }
        }

        $(window)
            .bind("orientationchange.iosorientationfix", zoom.enable)
            .bind("devicemotion.iosorientationfix", checkTilt);

    }());






    (function () {
        var scrollEvent = 'touchmove scroll';
        $.event.special.scrollstart = {

            enabled: true,
            setup: function () {

                var thisObject = this,
                    $this = $(thisObject),
                    scrolling,
                    timer;

                function trigger(event, state) {
                    scrolling = state;
                    triggerCustomEvent(thisObject, scrolling ? "scrollstart" : "scrollstop", event);
                }

                // iPhone triggers scroll after a small delay; use touchmove instead
                $this.bind(scrollEvent, function (event) {

                    if (!$.event.special.scrollstart.enabled) {
                        return;
                    }

                    if (!scrolling) {
                        trigger(event, true);
                    }

                    clearTimeout(timer);
                    timer = setTimeout(function () {
                        trigger(event, false);
                    }, 50);
                });
            },
            teardown: function () {
                $(this).unbind(scrollEvent);
            }
        };

        function triggerCustomEvent(obj, eventType, event, bubble) {
            var originalType = event.type;
            event.type = eventType;
            if (bubble) {
                $.event.trigger(event, undefined, obj);
            } else {
                $.event.dispatch.call(obj, event);
            }
            event.type = originalType;
        }

    }());

    /* touchclick special event --------------------------------------------------------------------------------------*/
    //create a special event to act as standard 'click' for desktop and 'touch' for touch devices
    (function () {

        var isTouch = false;

        $.event.special.touchclick = {

            setup: function () {
                isTouch = $.device.touch;
            },

            add: function (handleObj) {
                if (!isTouch) {
                    bindClick($(this), handleObj);
                } else {
                    bindTouch($(this), handleObj);
                }
            },

            remove: function (handleObj) {
                if (!isTouch) {
                    unbindClick($(this), handleObj);
                } else {
                    unbindTouch($(this), handleObj);
                }
            }

        };

        function bindClick(element, handleObj) {
            var old_handler = handleObj.handler;
            var selector = handleObj.selector;
            element.on('click', selector, function (event) {
                event.preventDefault();
                event.namespace = 'elliptical.click';
                return old_handler.apply(this, arguments);
            });
        }

        function bindTouch(element, handleObj) {
            var old_handler = handleObj.handler;
            var selector = handleObj.selector;
            element.on('touchstart', selector, function (event) {
                event.preventDefault();
                event.namespace = 'elliptical.touch';
                return old_handler.apply(this, arguments);
            });
        }

        function unbindClick(element, handleObj) {
            var selector = handleObj.selector;
            element.off('click', selector);
        }

        function unbindTouch(element, handleObj) {
            var selector = handleObj.selector;
            element.off('touchstart', selector);
        }

    }());

    /* touchhover special event --------------------------------------------------------------------------------------*/
    //create a special event to handle mouseenter/mouseleave for desktop and  touch devices
    (function () {

        var isTouch = false;

        $.event.special.touchhover = {

            setup: function () {
                isTouch = $.device.touch;
            },

            add: function (handleObj) {
                if (!isTouch) {
                    bindHover($(this), handleObj);
                } else {
                    bindTouch($(this), handleObj);
                }
            },

            remove: function (handleObj) {
                if (!isTouch) {
                    unbindHover($(this), handleObj);
                } else {
                    unbindTouch($(this), handleObj);
                }
            }

        };

        function bindHover(element, handleObj) {
            var old_handler = handleObj.handler;
            var selector = handleObj.selector;
            element.on('mouseenter', selector, function (event) {
                event.preventDefault();
                event.type='hoverover';
                event.namespace = 'elliptical.hoverover';
                return old_handler.apply(this, arguments);
            });
            element.on('mouseleave', selector, function (event) {
                event.preventDefault();
                event.type='hoverout';
                event.namespace = 'elliptical.hoverout';
                return old_handler.apply(this, arguments);
            });
        }

        function bindTouch(element, handleObj) {
            var old_handler = handleObj.handler;
            var selector = handleObj.selector;
            element.on('touchend', selector, function (event) {
                event.preventDefault();
                if(element.hasClass('over')){
                    event.type='hoverout';
                    event.namespace = 'elliptical.hoverout';
                    element.removeClass('over');
                }else{
                    event.type='hoverover';
                    event.namespace = 'elliptical.hoverover';
                    element.addClass('over');
                }

                return old_handler.apply(this, arguments);
            });
        }

        function unbindHover(element, handleObj) {
            var selector = handleObj.selector;
            element.off('mouseenter', selector);
            element.off('mouseleave', selector);
        }

        function unbindTouch(element, handleObj) {
            var selector = handleObj.selector;
            element.off('touchend', selector);
        }

    }());

    /* fixed navs and inputs focus -----------------------------------------------------------------------------------*/
    //on ios devices, keyboard on input focus will shift fixed navs...workaround: hide navs on focus
    (function () {
        if ($.device.ios) {
            var inputs = $('input, textarea');
            var navs = $('ui-navbar, ui-topbar');
            if(navs[0]){
                inputs.on('focusin', function (event) {
                    onFocus(navs);
                });
                inputs.on('focusout', function (event) {
                    onBlur(navs);
                });
            }
        }

        function onFocus(navs){
            navs.addClass('hide');
        }

        function onBlur(navs){
            navs.removeClass('hide');
        }

    }());

}));




/*
 * =============================================================
 * transforms
 * =============================================================
 *
 * Dependencies:
 *
 */

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
        root.returnExports = factory();
    }
}(this, function () {

    var transforms={

    };

    /**
     * sets hardware accelerated class and returns toggle flag
     * @param element {Object}
     * @param hardwareAcceleratedClass {String}
     * @returns {Boolean}
     */
    transforms.setHardwareAcceleration = function (element,hardwareAcceleratedClass) {
        var toggleAcceleration;
        if (!element.hasClass(hardwareAcceleratedClass)) {
            toggleAcceleration = true;
            element.addClass(hardwareAcceleratedClass);

        } else {
            toggleAcceleration = false;
        }
        return toggleAcceleration;
    };

    /**
     * removes hardware acceleration class if toggleAcceleration bit set
     * @param element {Object}
     * @param toggleAcceleration {Boolean}
     * @param hardwareAcceleratedClass {String}
     */
    transforms.resetHardwareAcceleration = function (element,toggleAcceleration,hardwareAcceleratedClass) {
        if (toggleAcceleration) {
            element.removeClass(hardwareAcceleratedClass);
        }
    };

    /**
     *
     * @param element {Object}
     * @param overflowContainerClass {String}
     * @returns {Boolean}
     */
    transforms.setContainerOverflow = function (element,overflowContainerClass) {
        var toggleOverflow;
        if (!element.hasClass(overflowContainerClass)) {
            toggleOverflow = true;
            element.addClass(overflowContainerClass);

        } else {
            toggleOverflow = false;
        }

        return toggleOverflow;
    };

    /**
     *
     * @param element {Object}
     * @param toggleOverflow {Boolean}
     * @param overflowContainerClass {String}
     */
    transforms.resetContainerOverflow = function (element,toggleOverflow,overflowContainerClass) {
        if (toggleOverflow) {
            element.removeClass(overflowContainerClass);
        }
    };

    /**
     *
     * @param container {Object}
     * @param leftBoxShadowClass {String}
     * @param fixedToggleContainerClass {String}
     */
    transforms.resetContainer = function (container,leftBoxShadowClass,fixedToggleContainerClass) {
        if(!container){
            return;
        }
        container.css({
            transition: '',
            '-webkit-transition': '',
            '-webkit-transform': '',
            '-moz-transition': '',
            '-moz-transform': '',
            'transform':'',
            'height': ''
        })
            .removeClass(leftBoxShadowClass)
            .removeClass(fixedToggleContainerClass);
    };

    transforms.resetTransition = function (element) {
        element.css({
            transition: '',
            '-webkit-transition': '',
            '-moz-transition': ''
        });

    };

    /**
     *
     * @param element {Object}
     */
    transforms.resetTransform = function (element) {
        element.css({
            transition: '',
            '-webkit-transition': '',
            '-webkit-transform': '',
            '-moz-transition': '',
            '-moz-transform': '',
            'transform':''
        });

    };

    /**
     *
     * @param element {Object}
     * @param coordinates {Object}
     */
    transforms.transform = function (element, coordinates) {
        var obj = {
            '-webkit-transform': 'translate3d(' + coordinates.x + ',' + coordinates.y + ',' + coordinates.z + ')',
            '-moz-transform': 'translate3d(' + coordinates.x + ',' + coordinates.y + ',' + coordinates.z + ')',
            transform: 'translate3d(' + coordinates.x + ',' + coordinates.y + ',' + coordinates.z + ')'
        };

        element.css(obj);

    };

    /**
     *
     * @param element {Object}
     * @param opts  {Object}
     * @param callback  {Function}
     *
     */
    transforms.transition3d = function (element, opts, callback) {
        //get prefixed transitionEnd event
        var CSS3= $.transit.CSS3;
        var transitionEnd = CSS3.transitionEndEvent();

        var coordinates = opts.coordinates;

        /* coordinates properties to pixel */
        coordinates.x=coordinates.x.toPixel();
        coordinates.y=coordinates.y.toPixel();
        coordinates.z=coordinates.z.toPixel();

        var easing = opts.easing || 'ease-in-out';
        opts.duration = opts.duration.toMillisecond() || '300ms';
        opts.delay = opts.delay.toMillisecond() || 0;
        opts.transitionEnd = opts.transitionEnd || false;
        var obj = {
            transition: 'transform ' + opts.duration + ' ' + opts.delay + ' ' + easing,
            '-webkit-transition': '-webkit-transform ' + opts.duration + ' ' + opts.delay + ' ' + easing,
            '-moz-transition': '-moz-transform ' + opts.duration + ' ' + opts.delay + ' ' + easing,
            '-webkit-transform': 'translate3d(' + coordinates.x + ',' + coordinates.y + ',' + coordinates.z + ')',
            '-moz-transform': 'translate3d(' + coordinates.x + ',' + coordinates.y + ',' + coordinates.z + ')',
            transform: 'translate3d(' + coordinates.x + ',' + coordinates.y + ',' + coordinates.z + ')'
        };

        element
            .on(transitionEnd, function () {
                if (opts.transitionEnd) {
                    $(this).off(transitionEnd);
                }
                if (callback) {
                    callback();
                }
            })
            .css(obj);
    };

    $.transforms = $.transforms || {};
    $.extend($.transforms, transforms);
    return $;

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
        root.elliptical = root.elliptical || {};
        root.elliptical.extensions = root.elliptical.extensions || {};
        root.elliptical.extensions.utils = factory();
        root.returnExports = root.elliptical.extensions.utils;
    }
}(this, function () {

    return {

        _utils: $.utils,

        _DOMParser: function (htmlString) {
            return new DOMParser().parseFromString(htmlString, 'text/html');
        },

        _preloadImages: function (element, callback) {
            var imgArray = [];
            var err = {};
            var data = {};
            var images = element.find('img').not('[data-src]');
            var length = images.length;
            var counter = 0;
            if (length === 0) {
                if (callback) {
                    err.message = 'No images found in element';
                    callback(err, null);
                }
                return false;
            }
            $.each(images, function (i, img) {
                var image = new Image();
                $(image).bind('load', function (event) {
                    counter++;
                    imgArray.push(image);
                    if (counter === length) {
                        if (!callback) {
                        } else {
                            data.images = imgArray;
                            data.length = counter;
                            callback(null, data);
                        }
                    }
                });
                image.src = img.src;
            });
            return true;
        },

        _scrollTop: function (ypos, evt) {
            if (typeof ypos !== "number") {
                ypos = 0;
            } else if (typeof evt === 'undefined') {
                evt = 'scrollTop';
            }

            setTimeout(function () {
                window.scrollTo(0, ypos);
                $(document).trigger(evt, {x: 0, y: ypos});
            }, 20);
        },

        _setModal: function (element, opts, callback) {
            //support 0-3 params
            var length = arguments.length;
            if (length === 0) {
                element = $('body');
                opts = {};
                callback = null;
            } else if (length === 1) {
                if (typeof element === 'function') {
                    callback = element;
                    element = $('body');
                    opts = {};
                } else if (element.context) {
                    opts = {};
                    callback = null;
                } else {
                    opts = element;
                    element = $('body');
                }
            } else if (length === 2) {
                if (typeof opts === 'function') {
                    callback = opts;
                    if (element.context === undefined) {
                        opts = element;
                        element = $('body');
                    } else {
                        opts = {};
                    }
                } else {
                    callback = null;
                }
            }

            var div = $('<div class="ui-modal"></div>');
            if (opts.cssClass) {
                div.addClass(opts.cssClass);
            }

            if (opts.zIndex) {
                div.css({
                    'z-index': opts.zIndex
                });
            }
            if (this._data) {
                this._data.set('modal', div);
            } else {
                this._modal = div;
            }

            var opacity = (opts.opacity) ? opts.opacity : .3;
            div.css({
                opacity: 0
            });
            element.append(div);

            this._transition(div, {
                opacity: opacity,
                duration: 250
            }, function () {
                if (callback) {
                    callback();
                }
            });
        },

        _removeModal: function (callback) {
            var self = this;
            var modal = null;
            if (this._data) {
                modal = this._data.get('modal');
            } else {
                modal = this._modal;
            }

            if (!modal || modal === undefined) {
                return;
            }
            this._transition(modal, {
                opacity: 0,
                duration: 250
            }, function () {
                modal.remove();
                (self._data) ? self._data.set('modal', null) : self._modal = null;
                if (callback) {
                    callback();
                }
            });
        },


        _resetSemanticState:function(){
            this.element.removeClass('error')
                .removeClass('warning')
                .removeClass('success')
                .removeClass('info')
        },

        _setChildrenAttributes:function(){
            var element=this.element;
            if(element[0].hasAttribute && element[0].hasAttribute('disabled')){
                element.query('input,textarea,select',function(result){
                    if(result[0]){
                        result.attr('disabled',true);
                    }
                });
            }
            if(element[0].hasAttribute && element[0].hasAttribute('readonly')){
                element.query('input,textarea,select',function(result){
                    if(result[0]){
                        result.attr('readonly',true);
                    }
                });
            }
        },

        _enableChildrenAttributes:function(){
            var element=this.element;
            element.query('input,textarea,select',function(result){
                if(result[0]){
                    result.attr('disabled',false);
                }
            });
            element.query('input,textarea,select',function(result){
                if(result[0]){
                    result.attr('readonly',false);
                }
            });
        },

        _find:function(selector){
            return this.element.find(selector);
        },

        _jsonParseMessage: function (obj) {
            try {
                var msgObj = JSON.parse(obj);
                if (msgObj.message) {
                    return msgObj.message;
                } else {
                    return obj;
                }
            } catch (ex) {
                return obj;
            }
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
        root.elliptical = root.elliptical || {};
        root.elliptical.extensions = root.elliptical.extensions || {};
        root.elliptical.extensions.device = factory();
        root.returnExports = elliptical.extensions.device;
    }
}(this, function () {

    return {

        _device: $.device,
        _mq: $.mq,

        _press: function () {
            return ('ontouchend' in document) ? 'touchstart' : 'click';
        },

        _mode: function () {
            return (this._device.viewport.width > 768) ? "desktop" : "touch";
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
        root.elliptical=root.elliptical || {};
        root.elliptical.extensions=root.elliptical.extensions || {};
        root.elliptical.extensions.drawer = factory();
        root.returnExports=elliptical.extensions.drawer;
    }
}(this, function () {

    return {
        /**
         * create a drawer container
         * @param element {Object}
         * @param dataClass {String}
         * @private
         */
        _createDrawer: function (element, dataClass) {
            //prevent multiple drawers
            if(this._data.get('locked')){
                return;
            }
            this._data.set('locked',true);
            //get reference to the container
            var container=$('ui-container');
            this._data.set('container',container);

            //get ref to the toggle container
            var transformContainer = container.parent();
            this._data.set('transformContainer',transformContainer);

            //create the drawer elements
            var drawer=$('<touch-ui-drawer></touch-ui-drawer>');
            if (dataClass) {
                drawer.addClass(dataClass);
            }
            var height = this._device.viewport.height;

            drawer.css({
                'min-height': height + 'px'
            });
            if(!this._device.touch){
                drawer.css({
                    'position': 'relative'
                });
            }
            var drawerHeader = $('<header></header>');

            //append header to drawer
            drawer.append(drawerHeader);

            var drawerSection = $('<section></section>');
            drawer.append(drawerSection);

            //insert drawer into the DOM
            container.before(drawer);

            //save references
            this._data.set('drawer',drawer);
            this._data.set('drawerHeader',drawerHeader);
            this._data.set('drawerSection',drawerSection);
        },

        /**
         * open the drawer
         * @param callback {function}
         * @param fnClose {function}
         * @private
         */
        _openDrawer: function (callback, fnClose) {

            //show drawer
            this._showDrawer();


            //get viewport height
            var height = this._device.viewport.height;
            if(this.options) this.options.height=height;
            else{
                this.height = height;
            }

            var self = this;

            //get ref to containers
            var container = this._data.get('container');
            var transformContainer = this._data.get('transformContainer');

            //hardware accelerate the transition
            this._setHardwareAcceleration(transformContainer);

            //container overflow
            //this._setContainerOverflow(transformContainer);

            //set container to viewport height and add component classes
            container
                .addClass('ui-fixed-toggle-container')
                .css({
                    height: height + 'px'
                })
                .addClass('ui-drawer-box-shadow');


            //append overlay to container
            var overlay = $('<ui-overlay></ui-overlay>');
            overlay.addClass('show');
            container.append(overlay);

            //save ref to overlay
            this._data.set('overlay',overlay);

            var overlayBackground=(this.options) ? this.options.overlayBackground : this.overlayBackground;
            var overlayOpacity=(this.options) ? this.options.overlayOpacity : this.overlayOpacity;
            var overlayOpenDuration=(this.options) ? this.options.overlayOpenDuration : this.overlayOpenDuration;
            var transformDuration=(this.options) ? this.options.transformDuration : this.transformDuration;
            var transformDelay=(this.options) ? this.options.transformDelay : this.transformDelay;
            var translateX=(this.options) ? this.options.translateX : this.translateX;

            overlay.transition({
                background: overlayBackground,
                opacity: overlayOpacity,
                duration: overlayOpenDuration

            });

            //transition container
            var opts = {};
            opts.duration = transformDuration;
            opts.delay = transformDelay;
            opts.easing = 'ease-in-out';
            var coordinates = {};
            coordinates.x = translateX;
            coordinates.y = 0;
            coordinates.z = 0;
            opts.coordinates = coordinates;
            opts.transitionEnd = true;

            /* click special event name */
            var click=this._data.click;
            var closeEvent=this._closeDrawer.bind(this);
            this.element.trigger('drawer.open',{open:true,closeEvent:closeEvent});
            this._3dTransition(container, opts, function () {
                self._resetHardwareAcceleration(transformContainer);
                self._resetTransition($(this));

                if (callback) {
                    callback();
                }
            });

            overlay.on(click, function () {
                if (fnClose) {
                    fnClose();
                }
            });


        },

        /**
         * close the drawer
         * @param callback
         * @private
         */
        _closeDrawer: function (callback) {
            var height=(this.options) ? this.options.height : this.height;
            //get container ref
            var container = this._data.get('container');
            var scrollTop=window.scrollY;
            /* if drawer has been vertically scrolled, we need to add scrollY to
             the fixed toggle container height(=viewport height when opened) on close
             to avoid revealing underneath content at scrollY.
             */
            if(scrollTop > 0){
                height+=scrollTop;
                container.css({
                    height:height + 'px'
                });

                /* additionally, to avoid navbar/topbar and drawer header dsiappearing from viewport on drawer close, we
                 need to assign top=scrollTop on those elements during the duration of the close animation
                 */
                this.element.css({
                    top:scrollTop + 'px'
                });

                var drawerHeader=this._data.get('drawerHeader');
                drawerHeader.css({
                    top:scrollTop + 'px'
                })
            }

            var transformContainer = this._data.get('transformContainer');
            var overlayBackground=(this.options) ? this.options.overlayBackground : this.overlayBackground;
            var overlayCloseDuration=(this.options) ? this.options.overlayCloseDuration : this.overlayCloseDuration;
            var transformDuration=(this.options) ? this.options.transformDuration : this.transformDuration;
            var transformDelay=(this.options) ? this.options.transformDelay : this.transformDelay;

            //get overlay ref
            var overlay = this._data.get('overlay');

            var self = this;
            //hardware accelerate the transition
            this._setHardwareAcceleration(transformContainer);

            var opts = {};
            opts.duration = transformDuration;
            opts.delay = transformDelay;
            opts.easing = 'ease-in-out';
            var coordinates = {};
            coordinates.x = 0;
            coordinates.y = 0;
            coordinates.z = 0;
            opts.coordinates = coordinates;
            opts.transitionEnd = true;
            this.element.trigger('drawer.close',{open:false});
            this._3dTransition(container, opts, function () {
                self._resetHardwareAcceleration(transformContainer);
                self._resetContainer(container);
                self._hideDrawer();

                if (callback) {
                    callback();
                }
            });

            /* click special event name */
            var click=this._data.click;

            overlay.off(click);

            overlay.transition({
                background: overlayBackground,
                opacity: 0,
                duration: overlayCloseDuration
            }, function () {
                overlay.remove();

            });

        },

        /**
         * show the drawer
         * @private
         */
        _showDrawer: function () {
            var height = this._device.viewport.height;
            var drawer=this._data.get('drawer');
            drawer.css({
                'min-height': height + 'px',
                'display':'block'
            });


        },

        /**
         * hide the drawer
         * @private
         */
        _hideDrawer: function () {
            var drawerHeader=this._data.get('drawerHeader');
            drawerHeader.css({
                top:''
            });
            var drawer=this._data.get('drawer');
            drawer.hide();
        },

        /**
         * remove the drawer
         * @private
         */
        _removeDrawer: function () {
            var drawer=this._data.get('drawer');
            if(drawer){
                drawer.remove();
                this._data.set('drawer',null);
            }
            this._data.set('locked',false);
            var container = this._data.get('container');
            this._resetContainer(container);
            var overlay = this._data.get('overlay');
            if (overlay) {
                overlay.remove();
            }
            var transformContainer = this._data.get('transformContainer');
            this._resetHardwareAcceleration(transformContainer);

        },


        /*==========================================
         PUBLIC METHODS
         *===========================================*/

        /**
         *  @public
         */
        showDrawer: function () {
            this._showDrawer();
        },

        /**
         *
         * @public
         */
        hideDrawer: function () {
            this._hideDrawer();
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
        root.elliptical=root.elliptical || {};
        root.elliptical.extensions=root.elliptical.extensions || {};
        root.elliptical.extensions.navigation = factory();
        root.returnExports = root.elliptical.extensions.navigation;
    }
}(this, function () {

    return {
        /**
         * shortcut method to create a touch navigation
         * @param element {Object}
         * @param dataClass {String}
         * @private
         */
        _createTouchNavigation: function (element, dataClass) {
            this._data.set('input',null);
            this._data.set('touchInput',null);
            this._createDrawer(element, dataClass);
            this._createTouchMenu(element);
        },

        /**
         * remove touch navigation
         * @param element
         * @private
         */
        _removeTouchNavigation: function (element) {
            //unbind touch search
            var touchInput=this._data.get('touchInput');
            if (touchInput) {
                this._unbindSearch(touchInput);
            }
            //remove drawer
            this._removeDrawer();
            //reset element
            this.element.css({
                position: ''
            });
            this._data.set('navLocked',false);
        },

        /**
         *  create a touch drawer menu from element desktop navigation widget
         * @param element {Object}
         * @private
         */
        _createTouchMenu: function (element) {
            //prevent multiple menus
            if(this._data.get('navLocked')){
                return;
            }
            this._data.set('navLocked',true);


            //get the drawer
            var drawer = this._data.get('drawer');

            //get the drawer
            var drawerSection = this._data.get('drawerSection');
            if(!drawerSection){
                return;
            }

            //get the drawer header
            var drawerHeader = this._data.get('drawerHeader');

            //create the drawer menu element
            var drawerMenu = $('<touch-ui-menu></touch-ui-menu>');

            var includeHome=(this.options) ? this.options.includeHome : this.includeHome;
            var homeUrl=(this.options) ? this.options.homeUrl : this.homeUrl;
            var homeIcon=(this.options) ? this.options.homeIcon : this.homeIcon;
            var touchMenu=(this.options) ? this.options.touchMenu : this.touchMenu;

            //add home menu item at the top
            if (includeHome) {
                drawerMenu.append(this._methods.createHomeListItem(homeUrl, homeIcon));

            }

            if(touchMenu !==undefined && touchMenu===false){
                //append menu to drawer
                drawerSection.append(drawerMenu);
                //save ref to menu
                this._data.set('drawerMenu',drawerMenu);
                return;
            }

            var menu=this._getMenu(element);

            //clone it
            var clone = menu.clone();

            //extract items from clone
            var items=this._extractMenuItems(clone);

            ///---handle dropdown buttons------
            /* unwrap button dropdowns */
            items.find('ui-button-dropdown').contents().unwrap();

            //if menu-item tag has dropdowns, replaceWith menu-item-dropdown
            items=this._methods.replaceWithMenuItemTags(items);
            ///--end handling of dropdown buttons---------

            //touchify the ui-dropdowns
            this._methods.touchifyUIDropdowns(items);


            //iconify menu items
            this._methods.iconifyTouchMenuItems(items);

            //append to menu
            drawerMenu.append(items);

            //add any linkable parent node to the child touch dropdown(it is then linkable within the child dropdown)
            drawerMenu = this._methods.addParentNodesToChildDropDowns(drawerMenu, 'ui-dropdown');


            /* ---attach search to drawerHeader----------------*/
            this._appendSearch(drawerMenu,drawerHeader);

            //add any menu items from plugin opts
            var model=(this.options) ? this.options.model : this.model;
            var optsItems = this._methods.createMenuItemsFromArray(model);
            if (optsItems) {
                drawerMenu.append(optsItems);
            }

            //append menu to drawer
            drawerSection.append(drawerMenu);

            //save ref to menu
            this._data.set('drawerMenu',drawerMenu);

        },

        /**
         *
         * @param element
         * @returns {*}
         * @private
         */
        _getMenu:function(element){
            //find DOM element menus
            return element.find('ui-menu').not('[touch-menu="false"]').add(element.find('[role="menu"]'));

        },

        _extractMenuItems:function(clone){
            var excludeMenuItemSelector='[touch-menu-item="false"]';
            var items = clone.children().not(excludeMenuItemSelector);
            return this._methods.filterMenuItems(items);
        },

        _appendSearch:function(drawerMenu,drawerHeader){
            /* first check in cloned menu items */
            var self=this;
            setTimeout(function(){
                var search=self.element.find('[role=search]');
                if(search[0]){
                    var clone=search.clone();
                    drawerHeader.append(clone);
                }
            },1000);

        },

        /**
         * append menu items from a model
         * @private
         */
        _appendMenuModel: function () {
            var model=(this.options) ? this.options.model : this.model;
            if (this._mq.touch) {
                var drawerMenu = this._data.get('drawerMenu');
                //add menu items from plugin opts
                var optsLi = this._methods.createMenuItemsFromArray(model);
                if (optsLi) {
                    drawerMenu.append(optsLi);
                }
            }
        },

        /**
         *
         * @param model {Array}
         * @private
         */
        _addMenuModel:function(model){
            var drawerMenu = $('touch-ui-menu');
            var items = this._methods.createMenuItemsFromArray(model);
            drawerMenu.append(items);
        },

        /**
         * pass an input to the search handler
         * @returns {*}
         * @private
         */
        _initSearchHandler:function(){
            var searchSelector='ui-search';
            var search_ =this.element.find(searchSelector);
            if(search_[0]){
                /* desktop search box */
                var input=search_.find('input');
                this._data.set('input',input);
                /* setup handler for desktop */
                this._onSearch(input,'desktop');
                return search_;
            }else{
                return null;
            }
        },

        /**
         * pass a touch input to the search handler
         * @param search
         * @param drawerHeader
         * @private
         */
        _initTouchSearchHandler:function(search,drawerHeader){
            /* touch search box */
            var searchClone=search.clone();
            var touchInput = searchClone.find('input');
            if (touchInput[0]) {
                this._data.set('touchInput',touchInput);
                /* append touch search box */
                drawerHeader.append(searchClone);
                /* touch search handler */
                this._onSearch(touchInput,'touch');
            }
        },

        /**
         * search handler mediator
         * @param input {object}
         * @param device {string}
         * @private
         */
        _onSearch: function (input,device) {
            if(device==='desktop'){
                if(this._data.get('searchRegistered')){
                    return false;
                } else{
                    this._data.set('searchRegistered',true);
                    this._onDesktopSearch(input)
                }

            }else{
                if(this._data.get('touchSearchRegistered')){
                    return false;
                } else {
                    this._data.set('touchSearchRegistered',true);
                }
            }
        },

        _onDesktopSearch:function(input){
            var eventTrigger=this._onEventTrigger.bind(this);
            input.on('focus', function () {
                input.on('click', function (event) {
                    if ($(this).hasClass('focused')) {
                        handleEvent(input);
                    } else {
                        input.addClass('focused');
                    }
                });
                input.keypress(function (event) {
                    if (event.which === 13) {
                        handleEvent(input);
                        return true;
                    }
                });
            });
            input.on('blur', function () {
                input.removeClass('focused');
                input.off('click');
            });


            function handleEvent(input){
                var val = input.val();
                var eventData = {
                    value: val
                };
                eventTrigger('search', eventData);
            }
        },

        _onTouchSearch:function(input){
            var eventTrigger=this._onEventTrigger.bind(this);

            input.on('focus', function () {
                input.on('tap', function (event) {
                    if ($(this).hasClass('focused')) {
                        handleEvent(input);
                    } else {
                        input.addClass('focused');
                    }
                });
            });
            input.on('blur', function () {
                input.removeClass('focused');
                input.off('tap');
            });


            function handleEvent(input){
                var val = input.val();
                var eventData = {
                    value: val
                };
                eventTrigger('search', eventData);
            }

        },


        /**
         * get the correct touch-ui-dropdown selector
         * @returns {string}
         * @private
         */
        __dropdownSelector:function(){
            return 'touch-ui-dropdown';
        },

        /**
         * get the correct item dropdown selector
         * @returns {string}
         * @private
         */
        __menuItemSelector:function(){
            return 'menu-item-dropdown';
        },

        /**
         * toggles touch sub-menu
         * @param item {Object}
         * @private
         */
        _touchToggleDropdown:function(item){
            var selector=this.__dropdownSelector();
            var dropdown=item.find(selector);
            if (dropdown.hasClass('show')) {
                item.removeClass('close');
                dropdown.removeClass('show');
            } else {
                item.addClass('close');
                dropdown.addClass('show');
            }
        },

        /**
         * link element triggers location or a dev handled event
         * @param a {object} link element
         * @param handleTouchEvents {Boolean}
         * @private
         */
        _touchMenuItem:function(a,handleTouchEvents){
            var self=this;
            var duration=(this.options) ? this.options.transformDuration : this.transformDuration;
            duration+=100;
            var id = a.attr('data-id');
            var href = a.attr('href');
            var action = a.attr('data-action');
            var route = a.attr('data-route');
            if (route && route === 'false') {
                handleTouchEvents = true;
            }
            /* close the drawer */
            this._hide();
            if (href !== undefined && href !== '#' && action === undefined && handleTouchEvents) {
                /* trigger location after the drawer has closed */
                setTimeout(function(){
                    if(typeof href !=='undefined'){
                        if(self._location) self._location(href);
                        else{
                            location.href=href;
                        }
                    }
                },duration);
            } else { //else, just fire an event
                var data = {
                    id: id,
                    action: action,
                    mode: 'touch',
                    href:href
                };
                this._onEventTrigger('selected', data);
            }
        },

        /**
         * currentTarget link element triggers submenu toggle or link element location/handled event
         * @param a {Object}
         * @param handleTouchEvents {Boolean}
         * @private
         */
        _touchMenuLink:function(a,handleTouchEvents){
            var href= a.attr('href');
            if(href===undefined || href==='#'){
                var item= a.parent('menu-item-dropdown');
                if(item[0]){
                    this._touchToggleDropdown(item);
                }
            }else{
                this._touchMenuItem(a,handleTouchEvents);
            }
        },

        /**
         * reset touch menu--hide dropdown and remove close arrow css
         * @private
         */
        _resetMenu:function(){
            var menu=this._data.get('drawerMenu');
            menu.find('.show').removeClass('show');
            menu.find('.close').removeClass('close');
        },


        _methods: {
            /**
             *
             * @returns {boolean}
             */
            customElements:function(){
                return true;
            },

            /**
             * returns menu item selector
             * @returns {string}
             */
            listItem:function(){
                return 'menu-item';
            },

            /**
             * returns dropdown menu item selector
             * @returns {string}
             */
            dropdownListItem:function(){
                return 'menu-item-dropdown';
            },

            /**
             * returns icon attribute selector
             * @returns {string}
             */
            iconAttribute:function(){
                return 'touch-icon';
            },

            /**
             *
             */
            dropdownElement:function(){
                return '<ui-dropdown></ui-dropdown>';
            },

            /**
             *
             * @param text {String}
             * @returns {*|HTMLElement}
             */
            createSpanItem: function (text) {
                return $('<span>' + text + '</span>');
            },

            /**
             *
             * @param href {String}
             * @param text {String}
             * @returns {*|HTMLElement}
             */
            createCloneListItem: function (href, text) {
                return $('<' + this.listItem() + '<a href="' + href + '">' + text + '</a></' + this.listItem() + '>');
            },

            /**
             * in a menu item dropdown, add the parent node as the first linkable item in the
             * dropdown. This is done to avoid tbe conflict of the parent triggering a dropdown
             * and being url linkable
             * @param menu {Object}
             * @param dropdownClass {String}
             * @returns {Object}
             */
            addParentNodesToChildDropDowns: function (menu, dropdownClass) {
                var li = menu.find(this.dropdownListItem());
                var self = this;
                li.each(function (i, ele) {
                    var a = $(ele).children('a');
                    var href = a.attr('href');
                    if (typeof href != 'undefined' && href != '#') {
                        var text = a.html();
                        var item = self.createCloneListItem(href, text);
                        var ul = $(ele).find('.' + dropdownClass);
                        ul.prepend(item);
                        var spanItem = self.createSpanItem(text);
                        a.replaceWith(spanItem);
                    }
                });

                return menu;
            },

            /**
             *
             * @param arr {Array}
             * //@param dropdownClass {String}
             * @returns {Array}
             */
            createMenuItemsFromArray: function (arr) {
                if (arr.length === 0) {
                    return null;
                }
                var itemArray = [];
                var a, item;
                for (var i = 0; i < arr.length; i++) {

                    if (arr[i].dropdown && arr[i].dropdown.length > 0) {
                        if (typeof arr[i].icon != 'undefined') {
                            item = $('<menu-item-dropdown><span class="touch-icon ' + arr[i].icon + '"></span><a>' + arr[i].label + '</a></menu-item-dropdown>');
                        } else {
                            item = $('<menu-item-dropdown><a>' + arr[i].label + '</a></menu-item-dropdown>');
                        }
                        var dropdown = $('<touch-ui-dropdown></touch-ui-dropdown>');
                        for (var j = 0; j < arr[i].dropdown.length; j++) {
                            var _item = $('<menu-item><a href="' + arr[i].dropdown[j].url + '">' + arr[i].dropdown[j].label + '</a></menu-item>');
                            dropdown.append(_item);
                        }

                        item.append(dropdown);
                        itemArray.push(item);

                    } else {
                        if (typeof arr[i].icon != 'undefined') {
                            item = $('<menu-item><span class="touch ' + arr[i].icon + '"><a href="' + arr[i].url + '">' + arr[i].label + '</a></span></menu-item>');
                        } else {
                            item = $('<menu-item><a href="' + arr[i].url + '">' + arr[i].label + '</a></menu-item>');
                        }
                        itemArray.push(item);
                    }
                }

                return itemArray;
            },

            /**
             *
             * @param homeUrl {String}
             * @param homeIcon {String}
             * @returns {Object}
             */
            createHomeListItem: function (homeUrl, homeIcon) {
                var item;
                var menuItem=this.listItem();
                var home='home';
                if (homeIcon === null) {
                    item = $('<' + menuItem + ' ' + home + '><a href="' + homeUrl + '">Home</a></' + menuItem + '>');
                } else {
                    item = $('<' + menuItem + ' ' + home + '><span class="touch-icon ' + homeIcon + '"></span><a href="' + homeUrl + '">Home</a></' + menuItem + '>');
                }

                return item;
            },

            filterMenuItems:function(items){
                var exclude=items.find('[data-touch="false"]');
                $.each(exclude,function(i,ele){
                    $(ele).remove();
                });
                return items;
            },

            /**
             *
             * @param items {Object}
             */
            touchifyUIDropdowns: function (items) {
                var self=this;
                $.each(items, function (index, element) {
                    var dropdown = $(element).find('ui-dropdown');
                    var megaDropdown=$(element).find('ui-mega-dropdown');
                    if (dropdown && dropdown.length > 0) {
                        dropdown.replaceWith( "<touch-ui-dropdown>" + dropdown.html() + "</touch-ui-dropdown>" );
                        if(megaDropdown && megaDropdown.length >0){
                            self.createTouchMenuItemsFromMegaDropdown(megaDropdown,dropdown);
                            megaDropdown.remove();
                        }
                    }else if(megaDropdown && megaDropdown.length >0){
                        dropdown=$('<touch-ui-dropdown></touch-ui-dropdown>');
                        self.createTouchMenuItemsFromMegaDropdown(megaDropdown,dropdown);
                        megaDropdown.replaceWith(dropdown);
                    }
                });
            },

            replaceWithMenuItemTags: function (items) {
                var clonedItems = [];
                for (var i = 0; i < items.length; i++) {
                    var $element = $(items[i]);
                    var dropdown = $element.find('ui-dropdown');
                    var megaDropdown = $element.find('ui-mega-dropdown');
                    if (dropdown[0] || megaDropdown[0]) {
                        var html = $element.html();
                        var clone = $("<menu-item-dropdown>" + html + "</menu-item-dropdown>");
                        clonedItems.push(clone[0]);
                    } else {
                        clonedItems.push($element[0]);
                    }
                }

                return clonedItems;
            },

            /**
             *
             * @param items {Array}
             */
            iconifyTouchMenuItems:function(items){
                var iconAttr=this.iconAttribute();
                $.each(items, function (index, item) {
                    var $item=$(item);
                    var icon=$item.attr(iconAttr);
                    if(icon !== undefined){
                        var span=$('<span class="touch ' + icon + '"></span>');
                        $item.prepend(span);
                    }
                });
            },

            /**
             *
             * @param mega {Element}
             * @param dropdown {Element}
             */
            createTouchMenuItemsFromMegaDropdown:function(mega,dropdown){
                var a=mega.find('a').not('[touch-menu-item="false"]');
                $.each(a,function(i,link){
                    var menuItem=$('<menu-item></menu-item>');
                    menuItem.append(link);
                    dropdown.append(menuItem);
                });
            }
        },

        /**
         *
         * @param input {object}
         * @private
         */
        _unbindSearch: function (input) {
            input.off('focus');
            input.off('blur');

        },


        /**
         *
         * @private
         */
        _onDestroy:function(){
            this._unbindSearch();
        },


        /*==========================================
         PUBLIC METHODS
         *===========================================*/

        /**
         *  @public
         */
        show: function () {
            this._show();
        },

        /**
         *
         * @public
         */
        hide: function () {
            this._hide();
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
        root.elliptical=root.elliptical || {};
        root.elliptical.extensions=root.elliptical.extensions || {};
        root.elliptical.extensions.transition = factory();
        root.returnExports = root.elliptical.extensions.transition;
    }
}(this, function () {

    return {

        _transition: function (element, options, callback) {
            $.transition=$.transition || $.transit;
            if (!(element instanceof jQuery)) element=$(element);
            options = options || {};
            if (options === {}) {
                options.duration = 300;
                options.preset = 'fadeIn';
            }
            if(options.preset==='none'){
                element.hide();
                return;
            }
            element.transition(options, function () {
                if (callback) {
                    callback.call(element[ 0 ]);
                }
            });
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
        root.elliptical=root.elliptical || {};
        root.elliptical.extensions=root.elliptical.extensions || {};
        root.elliptical.extensions.transform = factory();
        root.returnExports = root.elliptical.extensions.transform;
    }
}(this, function () {
    var provider = $.transforms;
    var HARDWARE_ACCELERATED_CLASS='ui-hardware-accelerated';
    var OVERFLOW_CONTAINER_CLASS='ui-overflow-container';
    var FIXED_TOGGLE_CONTAINER_CLASS='ui-fixed-toggle-container';
    var BOX_SHADOW_CLASS='ui-drawer-box-shadow';

    return {

        _setHardwareAcceleration: function (element) {
            this._data.set('toggleAcceleration', provider.setHardwareAcceleration(element, HARDWARE_ACCELERATED_CLASS));
        },

        _resetHardwareAcceleration: function (element) {
            provider.resetHardwareAcceleration(element, this._data.get('toggleAcceleration'), HARDWARE_ACCELERATED_CLASS);
        },

        _setContainerOverflow: function (element) {
            this._data.set('toggleOverflow', provider.setContainerOverflow(element, OVERFLOW_CONTAINER_CLASS));
        },

        _resetContainerOverflow: function (element) {
            provider.resetContainerOverflow(element, OVERFLOW_CONTAINER_CLASS);
        },

        _resetContainer: function (container) {
            provider.resetContainer(container, BOX_SHADOW_CLASS, FIXED_TOGGLE_CONTAINER_CLASS);
        },

        _resetTransition: function (element) {
            provider.resetTransition(element);
        },

        _resetTransform: function (element) {
            provider.resetTransform(element);
        },

        _transform: function (element, coordinates) {
            provider.transform(element, coordinates);
        },

        _3dTransition: function (element, opts, callback) {
            provider.transition3d(element, opts, callback);
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
        root.elliptical=root.elliptical || {};
        root.elliptical.extensions=root.elliptical.extensions || {};
        root.elliptical.extensions.template = factory(root.elliptical.utils,root.dust);
        root.returnExports = root.elliptical.extensions.template;
    }
}(this, function (utils,dust) {
    var random=utils.random;

    return {

        __precompile:function(template,id){
            template = template.replace(/&quot;/g,'"');
            var compiled=dust.compile(template,id);
            dust.loadSource(compiled);
        },

        _precompileTemplate:function(node,templateId){
            var html=node.innerHTML;
            this.__precompile(html,templateId);
        },

        _verifyTemplateExists:function(templateId){
            if(dust.cache[templateId]===undefined){
                console.log('warning: template ' + templateId + ' does not exist');
            }
        },

        _render:function(node,templateId,context,callback){
            this._verifyTemplateExists(templateId);
            dust.render(templateId, context, function (err, out) {
                if(out){
                    node.innerHTML=out;
                }
                if (callback) {
                    callback(err, out);
                }
            });
        },

        _renderTemplate:function(templateId,context,callback){
            this._verifyTemplateExists(templateId);
            dust.render(templateId, context, callback);
        },

        _renderTemplateString:function(str,context,callback){
            var id='template-' + random.str(6);
            this.__precompile(str,id);
            this._renderTemplate(id,context,callback);
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
        root.elliptical = root.elliptical || {};
        root.elliptical.extensions = root.elliptical.extensions || {};
        root.elliptical.extensions.event = factory();
        root.returnExports = root.elliptical.extensions.event;
    }
}(this, function () {

    return {

        _onEventTrigger: function (evt, data) {
            this._triggerEvent(evt, data);
        },

        _triggerEvent: function (evt, data) {
            var event = $.Event(evt);
            this._trigger(evt, event, data);
        },

        _trigger: function (type, event, data) {
            if(this.options){
                this._jqTrigger(type,event,data);
            }else{
                this.__triggerEvent(type,data);
            }
        },

        __triggerEvent:function(evt,data){
            var nameSpacedTagName = this._utils.string.tagNameToNamespace(tagName);
            evt=nameSpacedTagName + '.' + evt;
            this.element.trigger(evt,data);
        },

        _jqTrigger:function(type,event,data){
            try {
                var prop, orig,
                    callback = this.options[type];

                data = data || {};
                var prefix = this.widgetEventPrefix;
                var tagName = this.bindings[0].tagName.toLowerCase();
                var tagArray = tagName.split('-');
                var tagLength = tagArray.length;
                var nameSpacedTagName = this._utils.string.tagNameToNamespace(tagName);
                var arr = prefix.toArrayFromCamelCase();
                var nameSpacedPrefix = this._utils.array.toNamespaceFromArray(arr);
                if (nameSpacedPrefix === nameSpacedTagName) {
                    prefix = nameSpacedPrefix;
                } else if (tagLength > 1) {
                    prefix = nameSpacedTagName + '.' + prefix;
                } else {
                    prefix = this.namespace + '.' + prefix;
                }

                event = $.Event(event);
                event.type = ( type === prefix ?
                    type :
                prefix + '.' + type ).toLowerCase();
                // the original event may come from any element
                // so we need to reset the target on the new event
                event.target = this.element[0];

                // copy original event properties over to the new event
                orig = event.originalEvent;
                if (orig) {
                    for (prop in orig) {
                        if (!( prop in event )) {
                            event[prop] = orig[prop];
                        }
                    }
                }

                this.element.trigger(event, data);
                return !( $.isFunction(callback) &&
                callback.apply(this.element[0], [event].concat(data)) === false ||
                event.isDefaultPrevented() );
            } catch (ex) {

            }
        }

    };
}));

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(require('elliptical-utils'),require('jquery-extensions'),require('./device'), require('./template'),
            require('./transition'), require('./transform'),require('./utils'),require('./event'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils','jquery-extensions','./prototype.device',
            './prototype.template','./prototype.transition','./prototype.transform','./prototype.utils','./prototype.event'], factory);
    } else {
        // Browser globals (root is window)
        var e=root.elliptical.extensions;
        root.elliptical.extensions.base = factory(root.elliptical.utils,e.device,
            e.template,e.transition,e.transform,e.utils,e.event);
        root.returnExports = root.elliptical.extensions.base;
    }
}(this, function (utils,root,device,template,transition,transform,util,event) {

    var base={};
    Object.assign(base,util,device,template,transition,transform,event);
    return base;

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

        keys:function(obj){
            var keys=[];
            for(var prop in obj){
                if (obj.hasOwnProperty(prop)) {
                    keys.push(prop);
                }
            }
            return keys;
        },

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

        pathReplace:function(p){
            var n= p.replace(/\//g,'.');
            if(string.firstChar(n)==='.'){
                n=string.trimFirstChar(n);
            }
            return n;
        },

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
        _initCache:function(){
            var $cache=this.$cache();
            this._data.set('$cache',$cache);
        },

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

        _dispose:function(){
            var $cache=this._data.get('$cache');
            $cache=null;
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
            subscriptions.forEach(function(channel,fn){
                Event.off(channel,fn);
            });
        },

        _dispose:function(){
            this._unbindSubscriptions();
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

        _initScopeElement:function(){
            var scopeBind=(this.options) ? this.options.scopeBind : this.scopeBind;
            if(scopeBind===undefined) scopeBind=true;
            this._data.set('scopeTimeoutId',null);
            this._data.set('scopeObserver',null);
            this._data.set('scopeId',this.options.idProp);
            this.__initScope();

            if(scopeBind){
                this.__initScopeObservable();
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
         * set the observable
         * @private
         */
        _setObservable:function(){
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
                scopeObserver.close();
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


        /**
         * destroy clean-up
         * @private
         */
        _dispose:function(){
            this.__destroyObservable();
            if(this._super){
                this._super();
            }
        },

        _onScopeChange: function (){},

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
            if(delay===undefined){
                delay=300;
            }
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

        $setScope: function(){
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

        _setAutoRebind: function(){
            var autoRebind=(this.options) ? this.options.autoRebind : this.autoRebind;
            if (autoRebind === undefined) autoRebind=true;
            this._data.set('autoRebind',autoRebind);
        },

        _initPathObservers:function(){
            this._data.set('pathObservers',[]);
        },

        _disconnectPathObservers:function(){
            var pathObservers=this._data.get('pathObservers');
            pathObservers.forEach(function(observer){
                observer.disconnect();
            });
            pathObservers=null;
        },

        _watch:function(){
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

        __isReady:function(){
            if(object.isEmpty(this.$scope)){
                return false;
            }else{
                return this._isReady();
            }
        },

        _isReady:function(){
            return true;
        },


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

        _getTemplateNode:function(){
            var element=this.element;
            var template=element.selfFind('[template]');
            if(template[0]){
                return template[0];
            }else{
                return null;
            }
        },

        _setTemplateId:function(node){
            var id='tmpl-' + random.str(6);
            node.setAttribute('template',id);
            this._data.set('templateId',id);
            return id;
        },

        _setVisibility:function(){
            var templateNode=this._data.get('templateNode');
            if(templateNode){
                templateNode.classList.add('visible');
            }
        },

        _connectDOMObserver:function(){
            var templateNode=this._data.get('templateNode');
            $(templateNode).mutationSummary('connect', this.__onMutation.bind(this), [{ all: true }]);
        },

        _disconnectDOMObserver:function(){
            var templateNode=this._data.get('templateNode');
            $(templateNode).mutationSummary('disconnect');
        },

        __onMutation:function(summary){
            if(summary.added){
                this._onMutationAdded(summary.added)
            }
            if(summary.removed){
                this._onMutationRemoved(summary.removed);
            }
        },

        _onMutationAdded:function(added){},

        _onMutationRemoved:function(removed){},

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
                var text=this.__createTextNode(node,value);
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

        _passScopeFilter:function(result){
            if(result.changed.length > 0){
                return this._filterScopeChange(result.changed);
            }else if(result.added >0){
                return this._filterScopeChange(result.added);
            }else if(result.removed.length > 0){
                return this._filterScopeChange(result.removed);
            }
        },

        _filterScopeChange:function(arr){
            var bool=false;
            arr.forEach(function(record){
                if(string.firstChar(record.name)!=='$') bool=true;
            });
            return bool;
        },

        _rebind:function(){
            this._dispose();
            this._initPathObservers();
            this.__render();
        },

        _dispose:function(){
            this._disconnectDOMObserver();
            this._disconnectPathObservers();
            if(this._super){
                this._super();
            }
        },

        $rebind:function(){
            this._rebind();
        }

    };
}));
( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} ( function( $ ) {

$.ui = $.ui || {};

return $.ui.version = "@VERSION";

} ) );

/*!
 * jQuery UI Widget @VERSION
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Widget
//>>group: Core
//>>description: Provides a factory for creating stateful widgets with a common API.
//>>docs: http://api.jqueryui.com/jQuery.widget/
//>>demos: http://jqueryui.com/widget/

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery", "./version" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}( function( $ ) {

var widgetUuid = 0;
var widgetSlice = Array.prototype.slice;

$.cleanData = ( function( orig ) {
	return function( elems ) {
		var events, elem, i;
		for ( i = 0; ( elem = elems[ i ] ) != null; i++ ) {
			try {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}

			// Http://bugs.jquery.com/ticket/8235
			} catch ( e ) {}
		}
		orig( elems );
	};
} )( $.cleanData );

$.widget = function( name, base, prototype ) {
	var existingConstructor, constructor, basePrototype;

	// ProxiedPrototype allows the provided prototype to remain unmodified
	// so that it can be used as a mixin for multiple widgets (#8876)
	var proxiedPrototype = {};

	var namespace = name.split( "." )[ 0 ];
	name = name.split( "." )[ 1 ];
	var fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	if ( $.isArray( prototype ) ) {
		prototype = $.extend.apply( null, [ {} ].concat( prototype ) );
	}

	// Create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {

		// Allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// Allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};

	// Extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,

		// Copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),

		// Track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	} );

	basePrototype = new base();

	// We need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = ( function() {
			function _super() {
				return base.prototype[ prop ].apply( this, arguments );
			}

			function _superApply( args ) {
				return base.prototype[ prop ].apply( this, args );
			}

			return function() {
				var __super = this._super;
				var __superApply = this._superApply;
				var returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		} )();
	} );
	constructor.prototype = $.widget.extend( basePrototype, {

		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? ( basePrototype.widgetEventPrefix || name ) : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	} );

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// Redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor,
				child._proto );
		} );

		// Remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );

	return constructor;
};

$.widget.extend = function( target ) {
	var input = widgetSlice.call( arguments, 1 );
	var inputIndex = 0;
	var inputLength = input.length;
	var key;
	var value;

	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {

				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :

						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );

				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string";
		var args = widgetSlice.call( arguments, 1 );
		var returnValue = this;

		if ( isMethodCall ) {
			this.each( function() {
				var methodValue;
				var instance = $.data( this, fullName );

				if ( options === "instance" ) {
					returnValue = instance;
					return false;
				}

				if ( !instance ) {
					return $.error( "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'" );
				}

				if ( !$.isFunction( instance[ options ] ) || options.charAt( 0 ) === "_" ) {
					return $.error( "no such method '" + options + "' for " + name + " widget instance" );
				}

				methodValue = instance[ options ].apply( instance, args );

				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue && methodValue.jquery ?
						returnValue.pushStack( methodValue.get() ) :
						methodValue;
					return false;
				}
			} );
		} else {

			// Allow multiple hashes to be passed on init
			if ( args.length ) {
				options = $.widget.extend.apply( null, [ options ].concat( args ) );
			}

			this.each( function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} );
					if ( instance._init ) {
						instance._init();
					}
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			} );
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",

	options: {
		classes: {},
		disabled: false,

		// Callbacks
		create: null
	},

	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = widgetUuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();
		this.classesElementLookup = {};

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			} );
			this.document = $( element.style ?

				// Element within the document
				element.ownerDocument :

				// Element is window or document
				element.document || element );
			this.window = $( this.document[ 0 ].defaultView || this.document[ 0 ].parentWindow );
		}

		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this._create();

		if ( this.options.disabled ) {
			this._setOptionDisabled( this.options.disabled );
		}

		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},

	_getCreateOptions: function() {
		return {};
	},

	_getCreateEventData: $.noop,

	_create: $.noop,

	_init: $.noop,

	destroy: function() {
		var that = this;

		this._destroy();
		$.each( this.classesElementLookup, function( key, value ) {
			that._removeClass( value, key );
		} );

		// We can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.off( this.eventNamespace )
			.removeData( this.widgetFullName );
		this.widget()
			.off( this.eventNamespace )
			.removeAttr( "aria-disabled" );

		// Clean up events and states
		this.bindings.off( this.eventNamespace );
	},

	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key;
		var parts;
		var curOption;
		var i;

		if ( arguments.length === 0 ) {

			// Don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {

			// Handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( arguments.length === 1 ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( arguments.length === 1 ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},

	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},

	_setOption: function( key, value ) {
		if ( key === "classes" ) {
			this._setOptionClasses( value );
		}

		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this._setOptionDisabled( value );
		}

		return this;
	},

	_setOptionClasses: function( value ) {
		var classKey, elements, currentElements;

		for ( classKey in value ) {
			currentElements = this.classesElementLookup[ classKey ];
			if ( value[ classKey ] === this.options.classes[ classKey ] ||
					!currentElements ||
					!currentElements.length ) {
				continue;
			}

			// We are doing this to create a new jQuery object because the _removeClass() call
			// on the next line is going to destroy the reference to the current elements being
			// tracked. We need to save a copy of this collection so that we can add the new classes
			// below.
			elements = $( currentElements.get() );
			this._removeClass( currentElements, classKey );

			// We don't use _addClass() here, because that uses this.options.classes
			// for generating the string of classes. We want to use the value passed in from
			// _setOption(), this is the new value of the classes option which was passed to
			// _setOption(). We pass this value directly to _classes().
			elements.addClass( this._classes( {
				element: elements,
				keys: classKey,
				classes: value,
				add: true
			} ) );
		}
	},

	_setOptionDisabled: function( value ) {
		this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null, !!value );

		// If the widget is becoming disabled, then nothing is interactive
		if ( value ) {
			this._removeClass( this.hoverable, null, "ui-state-hover" );
			this._removeClass( this.focusable, null, "ui-state-focus" );
		}
	},

	enable: function() {
		return this._setOptions( { disabled: false } );
	},

	disable: function() {
		return this._setOptions( { disabled: true } );
	},

	_classes: function( options ) {
		var full = [];
		var that = this;

		options = $.extend( {
			element: this.element,
			classes: this.options.classes || {}
		}, options );

		function processClassString( classes, checkOption ) {
			var current, i;
			for ( i = 0; i < classes.length; i++ ) {
				current = that.classesElementLookup[ classes[ i ] ] || $();
				if ( options.add ) {
					current = $( $.unique( current.get().concat( options.element.get() ) ) );
				} else {
					current = $( current.not( options.element ).get() );
				}
				that.classesElementLookup[ classes[ i ] ] = current;
				full.push( classes[ i ] );
				if ( checkOption && options.classes[ classes[ i ] ] ) {
					full.push( options.classes[ classes[ i ] ] );
				}
			}
		}

		if ( options.keys ) {
			processClassString( options.keys.match( /\S+/g ) || [], true );
		}
		if ( options.extra ) {
			processClassString( options.extra.match( /\S+/g ) || [] );
		}

		return full.join( " " );
	},

	_removeClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, false );
	},

	_addClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, true );
	},

	_toggleClass: function( element, keys, extra, add ) {
		add = ( typeof add === "boolean" ) ? add : extra;
		var shift = ( typeof element === "string" || element === null ),
			options = {
				extra: shift ? keys : extra,
				keys: shift ? element : keys,
				element: shift ? this.element : element,
				add: add
			};
		options.element.toggleClass( this._classes( options ), add );
		return this;
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement;
		var instance = this;

		// No suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// No element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {

				// Allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
						$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// Copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^([\w:-]*)\s*(.*)$/ );
			var eventName = match[ 1 ] + instance.eventNamespace;
			var selector = match[ 2 ];

			if ( selector ) {
				delegateElement.on( eventName, selector, handlerProxy );
			} else {
				element.on( eventName, handlerProxy );
			}
		} );
	},

	_off: function( element, eventName ) {
		eventName = ( eventName || "" ).split( " " ).join( this.eventNamespace + " " ) +
			this.eventNamespace;
		element.off( eventName ).off( eventName );

		// Clear the stack to avoid memory leaks (#10056)
		this.bindings = $( this.bindings.not( element ).get() );
		this.focusable = $( this.focusable.not( element ).get() );
		this.hoverable = $( this.hoverable.not( element ).get() );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-hover" );
			},
			mouseleave: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-hover" );
			}
		} );
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-focus" );
			},
			focusout: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-focus" );
			}
		} );
	},

	_trigger: function( type, event, data ) {
		var prop, orig;
		var callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();

		// The original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// Copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[ 0 ], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}

		var hasOptions;
		var effectName = !options ?
			method :
			options === true || typeof options === "number" ?
				defaultEffect :
				options.effect || defaultEffect;

		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}

		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;

		if ( options.delay ) {
			element.delay( options.delay );
		}

		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue( function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			} );
		}
	};
} );

return $.widget;

} ) );

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

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs
        module.exports = factory(request('elliptical-utils','observable-component'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-utils','observable-component'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root.elliptical.utils,root.elliptical.observable);
    }
}(this, function (utils,observable) {

    var cache=observable.cache;
    cache._initCacheElement=function(){
        //this._super();
        var $cache=this.$cache();
        this._data.set('$cache',$cache);
    };

    var pubSub=observable.pubsub;
    pubSub._initPubSubElement=function(){
        //this._super();
        this._data.set('subscriptions',[]);
        this._subscriptions();
    };

    var scope=observable.scope;
    var scopeOptions={
            idProp:'id',
            scopeBind: true
    };

    scope=Object.assign({},scope,scopeOptions);

    var template=observable.template;


    //define component prototype
    var prototype={
        options:{
            context:null, //$$.elliptical.context
            scope:null  //prop of context to bind
        },

        /**
         * $.component setup on $.element's init event
         * @private
         */
        _initElement:function(){
            this._initCacheElement();
            this._initPubSubElement();
            this._initScopeElement();
            this._initTemplateElement();
            this._beforeInitComponent();
            this._initComponentElement();
        },

        _beforeInitComponent: $.noop,

        _initComponentElement:function(){
            var context=this.options.context;
            if(!context){
                context=this._viewBag();
                if(context){
                    this.options.context=context;
                }
            }

            this._data.set('hasObserve',$.elliptical.hasObjectObserve);
            this.$viewBag=context;
            this.__setScope();
            this._initComponent();
            this.__subscriber();
            this.__publisher();
        },

        /**
         * if a scope property has been declared, auto set the instance $scope; if a scope
         * property has not been declared, it is up the dev to set the $scope in the _initComponent event
         * @private
         */
        __setScope: function(){
            var context=this.options.context,//context attached to $$.elliptical.context
                scopeProp=this.options.scope; //context property to bind to the instance $scope

            if(this.$scope && scopeProp && context){
                this.$scope[scopeProp]=context[scopeProp];
            }

        },

        /**
         * $.component init event
         */
        _initComponent: $.noop,


        /**
         * sets up pre-defined subscribe events on a defined channel
         * @private
         */
        __subscriber:function(){
            var self=this;
            var channel=this.options.channel;
            var event=this.options.event;
            this._data.set('_synced',false);
            if(channel){
                if(event==='sync'){
                    this._subscribe(channel +'.sync',function(data){
                        if(!self._data.get('_synced')){
                            self._data.set('_synced',true);
                            self._dispose();
                            self.$scope=data.$scope;
                            self._rebind();
                            self.__onSyncSubscribe(data.proto);
                        }
                    });
                }
            }
        },

        /**
         * if a channel has been declared, publish the $scope to channel.sync
         * this allows different $.components and custom elements to share the same $scope
         * @private
         */
        __publisher:function(){
            var channel=this.options.channel;
            var event =this.options.event;
            var self=this;
            if(channel && !event){
                if(this._data.get('scopeObserver')){
                    this._publish(channel + '.sync',{proto:this,$scope:this.$scope});
                }else{
                    var timeoutId=setInterval(function(){
                        if(self._data.get('scopeObserver')){
                            clearInterval(timeoutId);
                            self._publish(channel + '.sync',{proto:self,$scope:self.$scope});
                        }
                    },500);
                }
            }
        },


        /**
         * returns the elliptical viewBag
         * @returns {*}
         * @private
         */
        _viewBag:function(){
            var $$=window.$$;
            if($$){
                if($$.elliptical)return $$.elliptical.context;
                else{
                    return null;
                }
            }else{
                return null;
            }
        },


        /**
         * component handler for channel.sync subscription
         * @param data {Object}
         * @component
         */
        __onSyncSubscribe: function(data){
            this._onSyncSubscribe(data);
        },

        /**
         * handler for channel.sync, subscription
         * @param data {Object}
         * @private
         */
        _onSyncSubscribe: $.noop,



        /**
         * returns the scope property of the ViewBag context(options.context)
         * @returns {Object}
         * @private
         */
        _scopedContextModel:function(){
            var context=this.options.context,
                scopeProp=this.options.scope;

            return (scopeProp && context) ? context[scopeProp] : undefined;
        },


        _dispose: function(){this._super();},

        scope:function(){
            return this.$scope;
        },

        runInit:function(){
            this._initComponent();
        }
    };


    //mixin prototypes
    prototype=Object.assign(cache,pubSub,scope,template,prototype);

    //define base component
    $.element('elliptical.component',prototype);


    /**
     * define the component factory
     * @param ElementProto {Object} <optional>, only should be supplied if the element not derived from HTMLElement
     * @param name {String}
     * @param tagName {String} <optional>
     * @param base {Object} <optional>
     * @param prototype {Object}
     */
    $.component= $.elementFactory($.elliptical.component);

    /* copy props of element to component */
    for(var key in $.element){
        $.component[key]= $.element[key];
    }

    /**
     * getter/setter for scope id prop
     * @type {Object}
     */
    $.component.config={
        scope:Object.defineProperties({},{
            'id':{
                get:function(){
                    return $.Widget.prototype.options.idProp;
                },
                set:function(val){
                    $.Widget.prototype.options.idProp=val;
                }
            }
        })
    };


    return $;



}));


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
        root.elliptical.binding=factory(root.elliptical.utils);
        root.returnExports =root.elliptical.binding;
    }
}(this, function (utils) {

    var BINDING_ACTIVE=false;
    var BINDINGS=[];
    var BINDING_CONTEXTS=[];

    //use mutation summary to setup and tear down bindings. In a SPA, event handlers on a element passed into a binding(which is a closure)
    //is classic memory leak. So, we keep a log of the bindings and when the element is removed from the DOM, null the closure
    function bindingMutationListener(){

        $(document).on('OnDocumentMutation',function(event,summary){
            if(summary.added){
                testForBindings(summary.added);
            }
            if(summary.removed){
                destroyBindings(summary.removed);
            }
        });

    }
    //handle initial onload
    $(function(){
        var added=document.querySelectorAll('[ea-bind]');
        if(added.length){
            testForBindings(added);
        }
    });

    function Binding(val,fn) {
        var self=this;
        if(!BINDING_ACTIVE){
            BINDING_CONTEXTS.push({val:val,fn:fn,context:this});
            bindingMutationListener();
            BINDING_ACTIVE=true;
        }else{
            BINDING_CONTEXTS.push({val:val,fn:fn,context:this});
        }
        this.jsonParseMessage = function (obj) {
            try {
                var msgObj = JSON.parse(obj);
                if (msgObj.message) {
                    return msgObj.message;
                } else {
                    return obj;
                }
            } catch (ex) {
                return obj;
            }
        };

        this.render = function (element, template, context, callback) {
            if (typeof element === 'string') {
                template = element;
                context = template;
                element = null;
            }
            window.dust.render(template, context, function (err, out) {
                if (!err && element) {
                    element.html(out);
                }

                if (callback) {
                    callback(err, out);
                }
            });
        };

        this.renderTemplate = function (template, context, callback) {
            window.dust.render(template, context, function (err, out) {
                if (!err) {
                    out=$.parseHTML(out, document, true);
                }

                if (callback) {
                    callback(err, out);
                }
            });
        };

        this.click='touchclick';

        this._events = [];

        this.preload = function (node, callback) {
            var imgArray = [];
            var err = {};
            var data = {};
            var element = $(node);
            var images = element.find('img');
            var length = images.length;
            var counter = 0;
            if (length === 0) {
                if (callback) {
                    callback(null);
                }
                return false;
            }
            $.each(images, function (i, img) {
                var image = new Image();
                $(image).bind('load', function (event) {
                    counter++;
                    imgArray.push(image);
                    if (counter === length) {
                        if (callback) {
                            data.images = imgArray;
                            data.length = counter;
                            callback(data);
                        }
                    }
                });
                image.src = img.src;
            });
            return true;
        };

        this.load = function (src,callback) {
            var self = this;
            var newImg = new Image();
            newImg.onload = function () {
                callback(this);
            };
            newImg.src =src;
            return;
        };

        this.component = function (element, component, fn) {
            if (element[component]) {
                return fn(element[component].bind(element));
            } else {
                var count = 0;
                var MAX_COUNT = 20;
                var intervalId = setInterval(function () {
                    if (element[component]) {
                        clearInterval(intervalId);
                        fn(element[component].bind(element));
                    } else {
                        if (count < MAX_COUNT) {
                            count++;
                        } else {
                            clearInterval(intervalId);
                            fn(element[component].bind(element));
                        }
                    }
                }, 300);
            }
        };

        this.onDestroy=function(){};

        this.event=function(element, event, selector,callback) {
            var obj = {};
            obj.element = element;
            obj.event = event;

            //support 3-4 params
            var length=arguments.length;
            if(length===3){
                callback=(typeof selector==='function') ? selector : null;
                selector=null;
            }
            obj.selector=selector;
            obj.callback=callback;
            var arr = this._events;
            if ($.inArray(obj, arr) === -1) {
                this._events.push(obj);
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

        };

        this.unbindEvents=function () {

            var events=this._events;
            var length=events.length;
            for(var i=0;i<length;i++){
                var obj=events[i];
                (obj.selector) ? obj.element.off(obj.event,obj.selector) : obj.element.off(obj.event);
            }
            events.length=0;
        }
    }

    function testForBindings(added){
        var contexts=BINDING_CONTEXTS;
        contexts.forEach(function(obj){
            var results=$(added).selfFind('[ea-bind="' + obj.val + '"]');
            if(results[0]){
                $.each(results,function(index,result){
                    BINDINGS.push({node:result,context:obj.context,val:obj.val,fn:obj.fn});
                    initBinding(obj.context,result,obj.val,obj.fn,obj.id=utils.randomString(8));
                });
            }
        });
    }


    function initBinding(context,node,val,fn){
        setTimeout(function(){
            fn.call(context,node);
        },500);
    }


    function destroyBindings(removed){
        var result=$(removed).selfFind('[ea-bind]');
        if(result.length && result.length > 0){
            $.each(result,function(index,obj){
                destroyBinding(obj);
            });
        }
    }

    function destroyBinding(node){
        var contexts=BINDINGS;
        var index=0;
        contexts.forEach(function(obj){
            if(obj.node===node){
                //clean-up to avoid memory leaks
                obj.context.unbindEvents();
                obj.context.onDestroy();
                obj.context=null;
                if(node && node.parentNode){
                    node.parentNode.removeChild(node);
                }
                obj.fn=null;//null the closure, otherwise any event handlers set on the element==memory leak
                obj.node=null;
                deleteObjFromBindings(index);
                obj=null;
            }
            index++;
        });
    }

    function deleteObjFromBindings(index){
        BINDINGS.splice(index,1);
    }

    var binding=function(val,fn){
        return new Binding(val,fn);
    };


    return binding;

}));



(function(){

    var Scope={
        linkImports:[],
        importElements:[],
        upgradeElementQueueFlag:false,
        mutationsArray:[]
    };


    function isLightDOMElement(element) {
        try{
            if(element.hasAttribute('content-init')){
                return false;
            }
            return (element.getAttribute('definition')===null);
        }catch(ex){
            return false;
        }

    }

    function testAttr(attr){
        var patt=/href|tcmuri|rowspan|colspan|class|nowrap|cellpadding|cellspacing|ea/;
        return patt.test(attr);
    }

    function booleanCheck(val) {
        if (val === 'false') {
            val = false;
        }
        if (val === 'true') {
            val = true;
        }
        return val;
    }


    var IMPORT_SELECTOR='link[rel="import"][property="elliptical"]';
    var ON_DOCUMENT_MUTATION='OnDocumentMutation';
    var ON_DOCUMENT_ADDED_MUTATION='OnDocumentAddedMutation';
    var WEB_COMPONENTS_READY='WebComponentsReady';
    var IMPORTS_LOADED='HTMLImportsLoaded';
    var PARSE_ATTR='parse-attr';
    var QUEUED_IMPORTS_INTERVAL=100;
    var QUEUE_TIMEOUT=500;
    var DISCOVER_TIMEOUT=800;
    var UPGRADE_TIMEOUT=10;
    var QUEUE_MAX=15;
    var READY_COUNT=0;
    var LINK_IMPORT_MAX_CHECK=40;



    var Events={
        documentMutation:function(summary){
            $(document).trigger(ON_DOCUMENT_MUTATION,summary);
        },

        documentAddedMutation:function(added){
            $(document).trigger(ON_DOCUMENT_ADDED_MUTATION,{summary:added});
        },

        webComponentsReady:function(){
            setTimeout(function(){
                var event=document.createEvent("CustomEvent");
                event.initCustomEvent(WEB_COMPONENTS_READY, true, true, {});
                document.dispatchEvent(event);
            },QUEUE_TIMEOUT);
        }
    };

    var Observer={
        connect:function(){
            $(document).mutationSummary("connect", this.on.bind(this), [{ all: true }]);
        },

        on:function(mutationSummary){
            Events.documentMutation(mutationSummary);
            var summary=mutationSummary[0];
            var self=this;
            if(summary.added){
                setTimeout(function(){
                    self.onAdded(summary.added);
                },QUEUE_TIMEOUT);

            }
        },

        onAdded:function(added){
            Events.documentAddedMutation(added);
            Parser.linkImportMutations(added);
            Parser.customElementMutations(added);
        }

    };

    var DOM={
        parser:function(markup){
            var doc = document.implementation.createHTMLDocument("");
            if (markup.toLowerCase().indexOf('<!doctype') > -1) {
                doc.documentElement.innerHTML = markup;
            }
            else {
                doc.body.innerHTML = markup;
            }
            return doc;
        },

        walk:function(node,func,callback){
            func(node);
            node = node.firstChild;
            while (node) {
                this.walk(node, func);
                node = node.nextSibling;
            }
            callback();
        }
    };

    var Parser={
        bindLinkImports:function(){
            var links_=$(IMPORT_SELECTOR);
            var links=this.recursivelyGetLinks(links_);
            this.parseLinkImports(links);
        },

        linkImportMutations:function(added){
            var links_=$(added).selfFind(IMPORT_SELECTOR);
            if(links_[0]){
                Scope.upgradeElementQueueFlag=true;
                var links=this.recursivelyGetLinks(links_);
                if(links.length===0){
                    this.queueLinkImportMutations(links_);
                }else{
                    (this.verifyLinkImports(links)) ? this.throwReady(links) : this.queueLinkImports(links);
                }
            }
        },

        /**
         * throws WebComponents Ready event, resets Queue Flag to false, calls parseLinkImports
         * @param {array} links - array of link imports
         */
        throwReady:function(links){
            Events.webComponentsReady();
            Scope.upgradeElementQueueFlag=false;
            this.parseLinkImports(links);
        },

        /**
         * verifies link imports contain a template document fragment
         * @param {array} links
         * @returns {object}
         */
        verifyLinkImports:function(links){
            var link=links[0];
            var templates=this.getTemplateFromImport(link);
            return templates[0];
        },

        queueLinkImports:function(links){
            var self=this;
            this.onLinkImportsComplete(links,function(links){
                self.throwReady(links);
            });
        },

        onLinkImportsComplete:function(links,callback){
            var self=this;
            var count=0;
            var timeoutId=setInterval(function(){
                var imported=self.verifyLinkImports(links);
                if(imported || count > LINK_IMPORT_MAX_CHECK){
                    clearInterval(timeoutId);
                    callback(links);
                }else{
                    count++;
                }
            },QUEUED_IMPORTS_INTERVAL);

        },

        getTemplateFromImport:function(link){
            var doc=link.import;
            return $(doc).find('template').not('[template]');
        },

        queueLinkImportMutations:function(links){
            var self=this;
            var timeoutId=setInterval(function(){
                links=self.recursivelyGetLinks(links);
                if(links[0]){
                    clearInterval(timeoutId);
                    self.verifyLinkImports(links);
                }
            },QUEUED_IMPORTS_INTERVAL);
        },

        recursivelyGetLinks:function(links){
            var _linkImports=[];
            var self=this;
            $.each(links,function(index,link){
                var arrLinks=self.recurseLink(link,[]);
                _linkImports=_linkImports.concat(arrLinks);
            });

            return _linkImports;
        },

        recurseLink:function(link,arr){
            if (!link.import) {
                return arr;
            } else {
                Scope.linkImports.push(link);
                arr.push(link);
                var all = link.import.all;
                if (all !== undefined) {
                    var length = all.length;
                    for (var i = 0; i < length; i++) {
                        var link_ = all[i];
                        var import_ = link_.import;
                        if (import_ !== undefined) {
                            this.recurseLink(link_,arr);
                        }
                    }
                    return arr;
                } else {
                    return arr;
                }
            }
        },

        parseLinkImports:function(links){
            var self=this;
            $.each(links,function(index,link){
                self.parseImportDocument(link,index);
            });
        },

        parseImportDocument:function(link,idx){
            var templates=this.getTemplateFromImport(link);
            var template = templates[0];

            if(template){
                var parentNode=template.parentNode;
                var tag=parentNode.tagName;
                var definitionAlreadyExists=this.checkForDuplicate(tag);
                if(!definitionAlreadyExists){
                    //var templateStr=PolyFill.templateInnerHTML(template);
                    var templateStr=template.innerHTML;
                    var parse=(this.parseAttribute(parentNode)) ? true : false;
                    var o_={tag:tag,index:idx,parse:parse,str:templateStr,template:template};
                    Scope.importElements.push(o_);
                }
            }
        },

        doUpgrade: function(element){
            var upgraded=element.dataset.upgraded;
            return (upgraded===undefined || upgraded==='false');
        },

        upgradeElement: function(element, parseAttr, template, templateStr,callback){
            /* if the element definition contains a 'parse-attr' attribute, we will need to
             to regex replace ##attribute## occurrences in the definition with values in the instance
             before we clone the template.content and append to the element instance(hence, attributeBind)
             */

            var clone;
            var $element=$(element);
            if(templateStr===''){
                this.setAttributes(element,$element);
                this.publishUpgradeEvent(element,callback);
                return;
            }
            if (parseAttr && element.attributes) {
                //clone template node content from definition
                clone = this.elementAttributeBind(element, templateStr);
                //merge the content with the innerHTML of the instance(replaces ui-template node in the definition with the instance innerHTML)
                clone = this.distributeContent(clone, element);
                $element.empty();
                try{
                    element.appendChild(clone);
                    this.setAttributes(element,$element);
                    this.publishUpgradeEvent(element,callback);
                }catch(ex){
                    console.log(ex);
                }

            } else {
                var content = template.content;
                if(!content){
                    this.fireCallback(element,callback);
                    return;
                }
                //IE issue: if template.content has no childNodes, create a new document-fragment from the templateStr
                if (content.childNodes && content.childNodes.length === 0) {
                    template = this.createTemplateNode(templateStr);
                }
                //clone template node content from definition
                clone = template.content.cloneNode(true);
                //merge the content with the innerHTML of the instance
                clone = this.distributeContent(clone, element);
                $element.empty();
                //append the cloned content to the element instance
                element.appendChild(clone);
                this.setAttributes(element,$element);
                this.publishUpgradeEvent(element,callback);
            }
        },

        publishUpgradeEvent:function(element,callback){
            $(document).trigger('OnElementImport', { node: element });
            this.fireCallback(element,callback);
        },

        fireCallback:function(element,callback){
            if(callback){
                callback(element);
            }
        },

        setAttributes:function(element,$element){
            $element.find('[content-init]').removeAttr('content-init');
            $element.find('content').remove();
            element.dataset.upgraded = true;
        },

        parseAttribute:function(importNode){
            var att=importNode.getAttribute(PARSE_ATTR);
            return (att || att ==='');
        },

        elementAttributeBind: function(element,templateStr){
            var self=this;
            $.each(element.attributes, function(i, att){
                /* note: "{{ }}" interferes with other popular template engines, including dustjs
                 hence, we use "[[ ]]"
                 */
                var re = new RegExp("\\[\\[" + att.name + "\\]\\]","g");
                templateStr=templateStr.replace(re,att.value);

            });
            //replace undefined [[attr]] occurrences in the templateStr with an empty string
            templateStr=templateStr.replace(/\[\[(.*?)]]/g, '');
            templateStr=templateStr.replace(/\[\[/g, '');
            var template = self.createTemplateNode(templateStr);
            return template.content.cloneNode(true);
        },

        parseElementImport:function(tag,element,callback,queueRequest){
            var length=Scope.importElements.length;
            var elementImport=null;

            for(var i=0;i<length;i++){
                var tag_=Scope.importElements[i].tag;
                if(tag_.toLowerCase()===tag.toLowerCase()){
                    elementImport=Scope.importElements[i];
                    break;
                }
            }

            if(elementImport){
                var proto=Object.getPrototypeOf(element);
                if(proto._tagName !==undefined){
                    proto._imported=true;
                }
                var parseAttr=elementImport.parse;
                var templateStr=elementImport.str;
                var template=elementImport.template;
                if(this.doUpgrade(element)){
                    this.upgradeElement(element,parseAttr,template,templateStr,callback);
                }else{
                    if(callback){
                        callback(null);
                    }
                }

            }else{
                if(queueRequest){
                    this.queueParsingRequest(tag,element,callback);
                }
            }
        },

        queueParsingRequest:function(tag,element,callback){
            var count_=0;
            var self=this;

            var timeoutId=setInterval(function(){
                var proto=Object.getPrototypeOf(element);
                var hasBeenStampedForImport=false;
                if(proto && proto._tagName !==undefined){
                    if(proto._imported && proto._imported !==undefined){
                        hasBeenStampedForImport=true;
                    }
                }
                if(hasBeenStampedForImport || count_ > QUEUE_MAX){
                    if(callback){
                        callback(null);
                    }
                    clearTimeout(timeoutId);
                }else {
                    count_++;
                    self.parseElementImport(tag,element,callback,false);
                }

            },QUEUE_TIMEOUT);
        },

        distributeContent: function(clone,instance){
            var innerHtml = instance.innerHTML;
            innerHtml = (innerHtml.trim) ? innerHtml.trim() : innerHtml.replace(/^\s+/, '');
            if (innerHtml === '') {
                return clone;
            }
            var content = clone.querySelectorAll('content');
            if (content) if (content.length > 1) {
                for (var i = 0; i < content.length; i++) {
                    var select = content[i].getAttribute('select');
                    if (select) {
                        var node=instance.querySelector(select);
                        if(node){
                            $(content[i]).replaceWith(node);
                        }
                    }
                }
                return clone;
            } else {
                $(content[0]).replaceWith(innerHtml);
                return clone;
            } else {
                var contentForm = clone.querySelector('form');
                if (contentForm) {
                    $(contentForm).replaceWith(innerHtml);
                    return clone;
                } else {
                    return clone;
                }
            }
        },



        createTemplateNode:function(templateStr){
            templateStr = '<template>' + templateStr + '</template>';
            var doc = new DOMParser().parseFromString(templateStr, 'text/html');
            //mainly for safari here(???, native DOMParser for safari returning null)
            if (!doc) {
                doc = DOM.parser(templateStr);
            }
            //PolyFill.template(doc);
            return doc.querySelector('template');
        },

        checkForDuplicate:function(tag){
            var length=Scope.importElements.length;
            var alreadyExists=false;
            for(var i=0; i<length;i++){
                var element_=Scope.importElements[i];
                if(tag===element_.tag){
                    alreadyExists=true;
                    break;
                }
            }
            return alreadyExists;
        },

        customElementMutations:function(added){
            if(!Scope.upgradeElementQueueFlag){
                Element.discover(added);
            }else{
                var timeoutId=setInterval(function(){
                    if(!Scope.upgradeElementQueueFlag){
                        clearInterval(timeoutId);
                        Element.discover(added);
                    }
                },QUEUED_IMPORTS_INTERVAL);
            }
        }
    };

    var Element={

        discover: function(added){
            var self=this;
            setTimeout(function(){
                self.discoverCustomElementDefinitions(added);
            },DISCOVER_TIMEOUT);

        },

        discoverCustomElementDefinitions:function(added,doc){
            var definitions= $.elliptical.definitions;
            definitions.forEach(function(tagName,name){
                var elements = (doc) ? $(added).find(tagName) : $(added).selfFind(tagName);
                if(elements && elements.length >0){
                    this.instantiateCustomElements(elements,name);
                }
            });
        },

        instantiateCustomElements:function(elements,name){
            var self=this;
            $.each(elements,function(index,element){
                self.instantiate(element, name);
            });
        },

        instantiate:function(element, name){
            var $element = $(element);
            var camelCase = $element.attr('camel-case');
            if (camelCase === undefined) {
                camelCase = true;
            }
            //check is light DOM element and not already instantiated
            var isDOM=isLightDOMElement(element);
            if(isDOM){
                var isInstantiated = this.isInstantiated(element, name);
                if (!isInstantiated) {
                    var opts = this.getOpts(element, camelCase);
                    $element[name](opts);
                }
            }
        },

        isInstantiated:function(node,name){
            var dataset=node.dataset;
            if(dataset.upgraded===undefined){
                dataset.upgraded=false;
            }
            return (name=== $.data(node,'custom-' + name));
        },


        getOpts:function(element,camelCase){
            if(camelCase===undefined){
                camelCase=true;
            }
            var opts={};
            $.each(element.attributes,function(i,obj){
                var opt=obj.name;
                var val = obj.value;
                if(!testAttr(opt)){
                    var patt=/data-/;
                    if(patt.test(opt)){
                        opt=opt.replace('data-','');
                    }
                    if(camelCase && camelCase !=='false'){
                        (opt !== 'template') ? opts[opt.toCamelCase()] = booleanCheck(val) : (opts[opt] = booleanCheck(val));

                    }else{
                        opts[opt.toCamelCase()]= booleanCheck(val);
                    }
                }
            });

            return opts;
        }
    };


    /* listeners ---------------------------------------------------- */
    window.addEventListener(IMPORTS_LOADED, function(event) {
        Parser.bindLinkImports();
    });

    window.addEventListener(WEB_COMPONENTS_READY, function(event) {
        if(READY_COUNT===0){
            Element.discoverCustomElementDefinitions(document,true);
            READY_COUNT=1;
        }
    });

    //start listening
    Observer.connect();

    //public api
    var HTML5Imports={};
    HTML5Imports.upgradeElement=function(tag,node,callback){
        Parser.parseElementImport(tag,node,callback,true);
    };

    HTML5Imports.instantiate=function(element,name){
        Element.instantiate(element,name);
    };

    window._HTML5Imports=HTML5Imports;


})();

