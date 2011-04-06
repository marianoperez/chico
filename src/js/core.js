var start = new Date().getTime();
/** 
  * @namespace
  */
var ui = window.ui = {

    version: "0.5.7",

    components: "",

    internals: "",

    instances: {},
    
    features: {},
 	
    init: function() { 
        // unmark the no-js flag on html tag
        $("html").removeClass("no-js");
        // check for browser support
		ui.features = ui.support();
        // check for pre-configured components
        ui.components = (window.components) ? ui.components+","+window.components : ui.components ;
        // check for pre-configured internals
        ui.internals = (window.internals) ? ui.internals+","+window.internals : ui.internals ;
        // iterate and create components               
        $(ui.components.split(",")).each(function(i,e){ ui.factory({component:e}); });
    },
/**
 *	@static Utils. Common usage functions.
 */		
    utils: {
		body: $('body'),
		html: $('html'),
		window: $(window),
		document: $(document),
		zIndex: 1000,
		index: 0, // global instantiation index
		isSelector: function(string){
			if(typeof string !== "string") return false;
			
			for (var regex in $.expr.match){
				if ($.expr.match[ regex ].test(string) && $(string).length > 0) {
					return true;
				};
			};
			return false;
		}
	},
/**
 *	@const Event's Map.
 */	
    events: {
        CHANGE_LAYOUT: "changeLayout"
    }    
};




/**
 *	Pre-Load function
 */	

ui.preload = function(arr) {

	if (typeof arr === "string") {
		arr = (arr.indexOf(",") > 0) ? arr.split(",") : [arr] ;
	}

	for (var i=0;i<arr.length;i++) {
				
		var o = document.createElement("object");
			o.data = arr[i]; // URL
			
		var h = document.getElementsByTagName("head")[0];
			h.appendChild(o);
			h.removeChild(o); 
	}       
};




/**
*	Factory
*/	
ui.factory = function(o) {

    /**
    *   o {
            component: "chat",
            callback: function(){},
            [script]: "http://..",
            [style]: "http://..",
            [callback]: function(){}    
    *    }
    *
    *	@return A collection of object instances
    */
    
    if (!o) { 
        alert("Factory fatal error: Need and object {component:\"\"} to configure a component."); 
        return;
    };

    if (!o.component) { 
        alert("Factory fatal error: No component defined."); 
        return;
    };

    var x = o.component;

    var create = function(x) { 

        // Send configuration to a component trough options object
        $.fn[x] = function( options ) {

            var results = [];			    
            var that = this;       

 			// Could be more than one argument
 			var _arguments = arguments;
 			
            that.each( function(i, e) {
            	
				var conf = options || {};

                var context = {};
                    context.type = x;
                    context.element = e;
                    context.$element = $(e);
                    context.uid = ui.utils.index += 1; // Global instantiation index
               
				switch(typeof conf) {
					// If argument is a number, join with the conf
					case "number":
						var num = conf;
						conf = {};
						conf.value = num;
						
						// Could come a messages as a second argument
		                if (_arguments[1]) {
		                    conf.msg = _arguments[1];
		                };
					break;
					
					// This could be a message
					case "string":						
						var msg = conf;
						conf = {};
						conf.msg = msg;
					break;
					
					// This is a condition for custom validation
					case "function":
						var func = conf;
						conf = {};
						conf.lambda = func;
						
						// Could come a messages as a second argument
		                if (_arguments[1]) {		                	
		                    conf.msg = _arguments[1];
		                };
					break;
				};
               
                // Create a component from his constructor
                var created = ui[x].call( context, conf );

				/* 
					MAPPING INSTANCES
				
    				Internal interface for avoid mapping objects
    				{
    					exists:true,
    					object: {}
    				}
				*/
				
				created = ( created.hasOwnProperty("public") ) ? created.public : created;
				
			    if (created.type) {
			        var type = created.type;		    
                    // If component don't exists in the instances map create an empty array
                    if (!ui.instances[type]) { ui.instances[type] = []; }
                         ui.instances[type].push( created );
			    }
                
                // Avoid mapping objects that already exists
				if (created.exists) {				
					// Return the inner object
					created = created.object;
				}			

			    results.push( created );
			    
            });
            
            // return the created components or component   
            return ( results.length > 1 ) ? results : results[0];
        };

        // if a callback is defined 
        if ( o.callback ) { o.callback(); }
                        
    } // end create function
    
    if ( ui[o.component] ) {
        // script already here, just create
        create(o.component);
        
    } else {
        // get resurces and call create
        ui.get({
            "method":"component",
            "component":o.component,
            "script": ( o.script )? o.script : "src/js/"+o.component+".js",
            "styles": ( o.style ) ? o.style : "src/css/"+x+".css",
            "callback":create
        });
        
        //alert("UI: " + x + " configuration error. The component do not exists");
    }
}

/**
 *  Get
 */
 
ui.get = function(o) {
    /**
    *   o {
            method: "content"|"component",
            component: "chat",
            [script]: "http://..",
            [style]: "http://..",
            [callback]: function(){}
    *    }
    */
    
    switch(o.method) {
		
		case "content":

	        var that = o.that;
	        var conf = that.conf;
			var context = ( that.controller ) ? that.controller.public : that.public;
			//Set ajax config
			//setTimeout(function(){
			
			$.ajax({
				url: conf.ajaxUrl,
				type: conf.ajaxType || 'GET',
				data: conf.ajaxParams,
				cache: true,
				async: true,
				success: function(data, textStatus, xhr){					
					that.$content.html( data ); 
					if ( conf.onContentLoad ) conf.onContentLoad.call(context);
					if ( conf.position ) ui.positioner(conf.position);
				},
				error: function(xhr, textStatus, errorThrown){
					data = (conf.hasOwnProperty("onContentError")) ? conf.onContentError.call(context, xhr, textStatus, errorThrown) : "<p>Error on ajax call </p>";
					that.$content.html( data );
					if ( conf.position ) ui.positioner(conf.position);
				}
			});
			//}, 25);
			
		break;
	        
		case "component":
	        
	        // ui.get: "Should I get a style?"
	        if ( o.style ) {
	    		var style = document.createElement('link');
	        		style.href = o.style;
	    	    	style.rel = 'stylesheet';
	            	style.type = 'text/css';
	        }
	        // ui.get: "Should I get a script?"        
	        if ( o.script ) {
	    	   	var script = document.createElement("script");
	    			script.src = o.script;
	        }
	        
	        var head = document.getElementsByTagName("head")[0] || document.documentElement;
	
			// Handle Script loading
			var done = false;
	
			// Attach handlers for all browsers
			script.onload = script.onreadystatechange = function() {
	    
	    	if ( !done && (!this.readyState || 
						this.readyState === "loaded" || this.readyState === "complete") ) {
						
					done = true;
	            
		   			// if callback is defined call it
		   	        if ( o.callback ) { o.callback( o.component ); }
										
			   		// Handle memory leak in IE
		   			script.onload = script.onreadystatechange = null;
	   			
			   		if ( head && script.parentNode ) { head.removeChild( script ); }
				}
			};
	            
			// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
			// This arises when a base node is used.
			if ( o.script ) { head.insertBefore( script, head.firstChild ); }
			if ( o.style ) { head.appendChild( style ); }
	    
		break;        
	}

}

/**
 *  Support
 */
 
ui.support = function() {
	
	// Based on: http://gist.github.com/373874
	// Verify that CSS3 transition is supported (or any of its browser-specific implementations)
	var transition = (function(){
		var thisBody = document.body || document.documentElement;
		var thisStyle = thisBody.style;

		return thisStyle.WebkitTransition !== undefined || thisStyle.MozTransition !== undefined || thisStyle.OTransition !== undefined || thisStyle.transition !== undefined;
	})();
	
	return {
		transition: transition
		// gradient: gradient
	};
	
};


/**
 *  Cache
 */

ui.cache = {
	map: {},
	add: function(url, data) {
		ui.cache.map[url] = data;
	},
	get: function(url) {
		return ui.cache.map[url];
	},
	rem: function(url) {
		ui.cache.map[url] = null;
		delete ui.cache.map[url];
	},
	flush: function() {
		delete ui.cache.map;
		ui.cache.map = {};
	}
};


/**
 *	Clone function
 */	

ui.clon = function(o) {
	
	obj = {};
	
    for (x in o) {
    	obj[x] = o[x]; 
    };
    
    return obj;
};


$(function() { // DOM Ready
	var now = new Date().getTime();
    ui.loadTime = now - start;
});
