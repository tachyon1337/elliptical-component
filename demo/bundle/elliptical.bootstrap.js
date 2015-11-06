window.Elliptical = function (fn) {
    document.addEventListener('WebComponentsReady', function () {
        if(fn.__executed===undefined){
            fn.call(this);
            fn.__executed=true;
        }
    });
};

Elliptical.context={
    get:function(){
        window.$$=window.$$ || {};
        $$.elliptical=$$.elliptical || {};
        $$.elliptical.context=$$.elliptical.context || {};
        return $$.elliptical.context;
    },
    set:function(prop,val){
        var context=this.get();
        context[prop]=val;
    },
    clear:function(){
        var context=this.get();
        context={};
    }
};