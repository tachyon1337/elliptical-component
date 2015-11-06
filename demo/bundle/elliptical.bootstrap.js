window.Elliptical = function (fn) {
    document.addEventListener('WebComponentsReady', function () {
        if(fn.__executed===undefined){
            fn.call(this);
            fn.__executed=true;
        }
    });
};

Elliptical.context={
    set:function(prop,val){
        window.$$=window.$$ || {};
        $$.elliptical=$$.elliptical || {};
        $$.elliptical.context=$$.elliptical.context || {};
        $$.elliptical.context[prop]=val;
    }
};