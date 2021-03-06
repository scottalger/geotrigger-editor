GeotriggerEditor.module('Map', function(Map, App, Backbone, Marionette, $, _) {

  this.startWithParent = false;

  // Map Module
  // ----------

  _.extend(Map, {

    _setup: function(options) {
      // L.Icon.Default.imagePath = App.config.imagePath;

      // force L.esri to use JSONP if proxy is set
      if (App.config.session.proxy) {
        L.esri.get = L.esri.RequestHandlers.JSONP;
      }

      App.map = this.map = L.map(options.el).setView(App.config.map.center, App.config.map.zoom);

      this.map.zoomControl.setPosition('topright');

      // allow multiple basemaps
      if (App.util.isArray(App.config.map.basemaps)) {
        for (var i = 0; i < App.config.map.basemaps.length; i++) {
          L.esri.basemapLayer(App.config.map.basemaps[i], App.config.map.options).addTo(App.map);
        }
      }

      // default to one basemap
      else {
        L.esri.basemapLayer(App.config.map.basemap, App.config.map.options).addTo(App.map);
      }

      this.Layers.start();
      this._eventBindings();
    },

    _eventBindings: function() {
      App.commands.setHandler('map:fit', _.bind(function(){
        if (this.Layers.main.getLayers().length === 0) {
          return;
        }

        var bounds = this.Layers.main.getBounds();
        var drawerWidth = this.getDrawerWidth();

        this.map.fitBounds(bounds, {
          animate: false,
          paddingTopLeft: [drawerWidth, 0]
        });
      }, this));
    },

    getDrawerWidth: function() {
      var $content = App.mainRegion.$el.find('#gt-content');
      var $drawer = $content.find('#gt-drawer-region');

      if ($content.hasClass('gt-active')){
        return $drawer.width();
      } else {
        return 0;
      }
    },

    panToLayer: function(layer) {
      var latlng;

      if (layer.getLatLng) {
        latlng = layer.getLatLng();
      } else if (layer.getCenter) {
        latlng = layer.getCenter();
      }

      var drawerWidth = this.getDrawerWidth();

      if (drawerWidth) {
        var projected = this.map.project(latlng);
        projected.x = projected.x - (drawerWidth / 2);
        latlng = this.map.unproject(projected);
      }

      if (latlng) {
        this.map.panTo(latlng, {
          animate: true
        });
      }
    },

    zoomToLayer: function(layer) {
      var bounds = layer.getBounds();
      var drawerWidth = this.getDrawerWidth();

      this.map.fitBounds(bounds, {
        animate: false,
        paddingTopLeft: [drawerWidth, 0]
      });
    },

    removeShape: function(shape) {
      this.map.removeLayer(shape);
    },

    focusShape: function(shape) {
      shape.setStyle(App.config.highlightOptions.shapeOptions);
    },

    unfocusShape: function(shape) {
      shape.setStyle(App.config.sharedOptions.shapeOptions);
    },

    polygon: function(geo, shapeOptions, add) {
      shapeOptions = shapeOptions || App.config.sharedOptions.shapeOptions;
      var polygon = new L.GeoJSON(geo, {
        style: function(feature) {
          return shapeOptions;
        }
      });

      if (add !== false) {
        this.Layers.main.addLayer(polygon);
      }

      return polygon;
    },

    circle: function(geo, shapeOptions, add) {
      shapeOptions = shapeOptions || App.config.sharedOptions.shapeOptions;
      var circle = L.circle(
        [geo.latitude, geo.longitude],
        geo.distance,
        shapeOptions
      );

      if (add !== false) {
        this.Layers.main.addLayer(circle);
      }

      return circle;
    }
  });

  // Map Initializer
  // ---------------

  Map.addInitializer(function(options) {
    this._setup(options);
    this.Draw.start();
  });

});