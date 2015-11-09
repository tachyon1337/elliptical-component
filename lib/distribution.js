

(function(){

    var Scope={
        linkImports:[],
        importElements:[],
        upgradeElementQueueFlag:false,
        mutationsArray:[]
    };

    var Observer=elliptical.mutation.summary;

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
        webComponentsReady:function(){
            setTimeout(function(){
                var event=document.createEvent("CustomEvent");
                event.initCustomEvent(WEB_COMPONENTS_READY, true, true, {});
                document.dispatchEvent(event);
            },QUEUE_TIMEOUT);
        }
    };

    var Listener={
        start:function(){
            $(document).on(ON_DOCUMENT_ADDED_MUTATION,this.on.bind(this));
        },

        on:function(added){
            setTimeout(function(){
                Parser.linkImportMutations(added);
                Parser.customElementMutations(added);
            },QUEUE_TIMEOUT);
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

    //start mutation observer summary
    Observer.connect();
    //expose the handlers for the Observer
    Listener.start();

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

