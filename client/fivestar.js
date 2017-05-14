(function() {
    
    var bind, emit, save, render, getStarElements;
    
    // roadmap: federated avg rating from forks up and down the chain?
    
    bind = function(container, item) {
        return container.dblclick(function() {
            return wiki.textEditor(container, item);
        });
    };
    
    emit = function(container, item) {
        
        // add required css
        if (!$('link[href="/plugins/fivestar/fivestar.css"]').length) {
            $('<link rel="stylesheet" href="/plugins/fivestar/fivestar.css" type="text/css">').appendTo('head');
        }
        
        // handle old browsers
        if(!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")){
            container.html('<p class="error">fivestar error: svg unsupported</p>');
            return;
        }
        
        // define the layers used for presentation
        var layers = [
          {class:'background', fill: '#dddddd'},
          {class:'stored', fill: '#fdff00'},
          {class:'hover', fill: '#ffe000'},
          {class:'active', fill: '#000000'}
        ];
        
        // generate the layers with 5 stars a piece
        var content = [];
        content.push('<div class="widget">');
        for(var i=0, layers_length=layers.length; i<layers_length; i++){
            var fs_layer = layers[i];
            content.push('<div class="layer ', fs_layer.class, '">');
            for(var j=0; j<5; j++){
                var fs_tag = fs_layer.class == 'active' ? 'a' : 'span';
                content.push('<', fs_tag, ' class="star ', fs_layer.class, '" data-rating="', (j+1), '">');
                content.push('  <svg width="32px" height="32px" viewBox="0 0 300 275" xmlns="http://www.w3.org/2000/svg" version="1.1">');
                content.push('    <polygon fill="', fs_layer.fill, '" stroke="#888" stroke-width="10"');
                content.push('        points="150,25  179,111 269,111 197,165 223,251  150,200 77,251  103,165 31,111 121,111" />');
                content.push('  </svg>');
                content.push('</', fs_tag,'>');
            }
            content.push('</div>'); //.layer
        }
        content.push('</div>'); //.widget
        
        // add html to sfw container
        container.html(content.join(''));
        
        // conceal hover (orange) and stored (yellow) stars
        $('.star.hover, .star.stored, .star.active', container).css('opacity', '0');
        
        // setup event handling for stars
        $('.star.active', container).each(function(index, value){
            
            // set href to get cursor, data-rating rating value defined in emit loop
            var _this = $(this);
            var rating = _this.attr('data-rating');
            
            _this.attr('href', '#');
            _this.attr('title', ['Rate as ', rating, ' star', (rating == 1 ? '' : 's')].join(''));
            
            _this.mouseenter(function(){
                
                // kill hover and reset based on current rating
                var el = getStarElements(this);
                var rating = el.star.attr('data-rating');
                $('.star.hover', el.container).css('opacity', '0');
                $('.star.hover:lt('+rating+')', el.container).css('opacity', '1');
                
            });
            
            _this.mouseleave(function(){
                
                // kill hover and re-render stars
                var el = getStarElements(this);
                $('.star.hover', el.container).css('opacity', '0');
                render();
                
            });
            
            _this.click(function(){
                
                // save clicked rating and re-render
                var el = getStarElements(this);
                var data = el.star.attr('data-rating');
                var item = wiki.getItem(el.container);
                
                item.stars = data;
                save(el.container, item);
                render();
            
            });
        });

        container.addClass('radar-source')
        container.get(0).radarData = function(){
            data = {}
            data[item.text] = parseInt(item.stars)
            return data
        }
        
        render();
        return container;
        
    };
    
    render = function(){
        $('.fivestar').each(function(index, value){
            var _this = $(this);
            var item = wiki.getItem(_this);
            var stars = item.stars || parseInt(item.text) || 0;
            // set yellow stars to stored vales and kill active hover 
            $('.star.stored',_this).css('opacity', '0');
            $('.star.stored:lt('+stars+')', _this).css('opacity', '1');
            $('.star.hover', _this).css('opacity', '0');
        });
    };
    
    getStarElements = function(star){
        // collect commonly accessed $elements
        var starElement = $(star);
        var containerElement = starElement.parents('.fivestar:first');
        return {star: starElement, container: containerElement};
    };
    
    
    save = function(div, item){
        return wiki.pageHandler.put(div.parents('.page:first'), {
            type: 'edit',
            id: item.id,
            item: item
        });
    };
    
    if (typeof window !== 'undefined' && window !== null) {
        window.plugins.fivestar = {
            emit: emit,
            bind: bind,
            save: save,
            render: render
        };
    }

}).call(this);