(function() {
    
    var bind, emit, getStarElements, getConfiguration, save, render, reversion, version;
    
    // TODO see if this can come from API
    version = "0.3.0";
    
    bind = function(container, item) {
        return container.dblclick(function() {
            return wiki.textEditor(container, item);
        });
    };
    
    emit = function(container, item) {
        
        // add required css
        if (!$('link[href="/plugins/fivestar/fivestar.css"]').length) {
            $('<link rel="stylesheet" href="/plugins/fivestar/fivestar.css" type="text/css">').appendTo("head");
        }
        
        // handle old browsers
        if(!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")){
            container.html('<p class="error">fivestar error: svg unsupported</p>');
            return;
        }
        
        // define the layers used for presentation
        var layers = [
          {class:"background", fill: "#dddddd"},
          {class:"stored", fill: "#fdff00"},
          {class:"hover", fill: "#ffe000"},
          {class:"active", fill: "#000000"}
        ];
        
        // generate the layers with 5 stars a piece
        var configuration = getConfiguration(item.text);
        var content = [];
        content.push('<div class="widget">');
        for(var i=0, layersLength = layers.length; i < layersLength; i++){
            var fsLayer = layers[i];
            content.push('<div class="layer ', fsLayer.class, '">');
            for(var j = 0; j < configuration.maximum; j++){
                var fsTag = fsLayer.class == 'active' ? 'a' : 'span';
                content.push('<', fsTag, ' class="star ', fsLayer.class, '" data-rating="', (j+1), '">');
                content.push('  <svg width="32px" height="32px" viewBox="0 0 300 275" xmlns="http://www.w3.org/2000/svg" version="1.1">');
                content.push('    <polygon fill="', fsLayer.fill, '" stroke="#888" stroke-width="10"');
                content.push('        points="150,25  179,111 269,111 197,165 223,251  150,200 77,251  103,165 31,111 121,111" />');
                content.push('  </svg>');
                content.push('</', fsTag,'>');
            }
            content.push('</div>'); //.layer
        }
        content.push('</div>'); //.widget
        
        // add html to sfw container
        container.html(content.join(""));
        
        // conceal hover (orange) and stored (yellow) stars
        $(".star.hover, .star.stored, .star.active", container).css("opacity", "0");
        
        // setup event handling for stars
        $(".star.active", container).each(function(index, value){
            
            // set href to get cursor, data-rating rating value defined in emit loop
            var _this = $(this);
            var rating = _this.data("rating");
            
            // two schools of though here, fill gaps vs. presence of hover config means hands off, going for latter approach
            var toolTip = configuration.hover.length > 0 ? configuration.hover[rating-1] : ["Rate as ", rating, " star", (rating === 1 ? "" : "s")].join("");
            //console.log(toolTip);
            _this.attr("href", "#");
            _this.attr("title", toolTip);
            
            
            _this.mouseenter(function(){
                
                // kill hover and reset based on current rating
                var el = getStarElements(this);
                var rating = el.star.attr("data-rating");
                $(".star.hover", el.container).css("opacity", "0");
                $(".star.hover:lt("+rating+")", el.container).css("opacity", "1");
                container.trigger("thumb", item.text)
                
            });
            
            _this.mouseleave(function(){
                
                // kill hover and re-render stars
                var el = getStarElements(this);
                $(".star.hover", el.container).css("opacity", "0");
                render();
                
            });
            
            _this.click(function(){
                
                // save clicked rating and re-render
                var el = getStarElements(this);
                var data = el.star.data("rating");
                var item = wiki.getItem(el.container);
                item.version = version;
                item.stars = data;
                item.key = item.text.split("\n")[0]
                save(el.container, item);
                render();
            
            });
        });

        container.addClass("radar-source")
        container.get(0).radarData = function(){
            data = {}
            data[item.text] = parseInt(item.stars)
            return data
        }
        
        render();
        return container;
        
    };
    
    getStarElements = function(star){
        // collect commonly accessed $elements
        var starElement = $(star);
        var containerElement = starElement.parents(".fivestar:first");
        return {star: starElement, container: containerElement};
    };
    
    getConfiguration = function(text){
        var configuration = {
            hover: [],
            key: null,
            maximum: 5, 
        };
        var reOuter = /^([\w\-]+)?\n?(\d+)?(\nHOVER[\s\S]*)?/;      // (#key)(#starMaximum)(#hovers)
        var reInner = /\nHOVER (\d+)\s+([\w\ ]+)/g;                 // HOVER (#starIndex)(#label)
        var resultOuter = reOuter.exec(text);
        if(resultOuter !== null){
            configuration.key = $.trim(resultOuter[1]);
            if(resultOuter[2] !== undefined){
                // cap stars to 10, defend against configuration hostility
                configuration.maximum = Math.max(Number($.trim(resultOuter[2]), 10));
            }
            var resultInner = null;
            while((resultInner = reInner.exec(resultOuter[3])) !== null){
                var starIndex = Number(resultInner[1]) - 1;
                if(starIndex >= 0 && starIndex < configuration.maximum){
                    configuration.hover[starIndex] = $.trim(resultInner[2]);
                }
            }
        }
        return configuration;
    };
    
    reversion = function(div, item){
        
        // one reversion cycle per fivestar is full coverage
        if(div.data("reversioned") !== undefined){
            return;
        }
        
        switch(true){
            case item.version !== undefined:
                // already versioned and current, no revision necessary
                break;
            case /^[1-5]$/.exec(item.text) !== null && item.stars === undefined: 
                // presumed 0.1.x, rev to current version
                console.log("fivestar 0.1.x storage revision, text has moved to stars, explict versioning begins.")
                item.stars = Number(item.text);
                item.text = "fivestar-key-not-provided";
                item.version = version;
                // save required for old instance to work under new dev utilizing stars field
                save(div, item);
                break;
            default:
                // presumed new object, also possible, 0.2.x, structurally similar to 0.3.x (minus
                // data versioning), both can defer version save until initiated by user.
                break;
        }
        
        div.data("reversioned","true");
        
    };
    
    render = function(){
        $(".fivestar").each(function(index, value){
            var _this = $(this);
            var item = wiki.getItem(_this);
            reversion(_this, item);
            var stars = item.stars || parseInt(item.text) || 0;
            // set yellow stars to stored vales and kill active hover 
            $(".star.stored",_this).css("opacity", "0");
            $(".star.stored:lt("+stars+")", _this).css("opacity", "1");
            $(".star.hover", _this).css("opacity", "0");
        });
    };
    
    save = function(div, item){
        return wiki.pageHandler.put(div.parents(".page:first"), {
            type: "edit",
            id: item.id,
            item: item
        });
    };
    
    if (typeof window !== "undefined" && window !== null) {
        window.plugins.fivestar = {
            emit: emit,
            bind: bind,
            save: save,
            render: render
        };
    }

}).call(this);