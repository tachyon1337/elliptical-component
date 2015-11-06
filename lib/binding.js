
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
