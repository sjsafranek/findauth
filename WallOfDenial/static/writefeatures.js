
var baseURL = document.URL.split('/map')[0].split('http://')[1];

/* INITIATE MAP OBJECT */

    function initMap(div,config) {

    // CREATE MAP OBJ
        var map = L.map('map',{maxZoom: 22 });
            // , measureControl: true});

    // Prepare baselayers
        osm = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png',{ 
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> | F.I.N.D.'
        }).addTo(map);
        var baseMaps = {};
        baseMaps["OSM"] = osm;
        baseMaps["Topographic"] = L.tileLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.png",{maxNativeZoom:22});
        baseMaps["Streets"] = L.tileLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.png",{maxNativeZoom:22});
        baseMaps["Imagery"] = L.tileLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png",{maxNativeZoom:22});
        for (var baselayer in config.baselayers) {
            baseMaps[baselayer] = L.tileLayer(config.baselayers[baselayer]);
        }

    // BUILDINGS
        var osmb = new OSMBuildings(map)
           .date(new Date(2015, 5, 15, 17, 30))
           .load()
           .click(function(id) {
                console.log('feature id clicked:', id);
           }
        );

        var overlayMaps = { Buildings: osmb };

    // STORE CONFIG
        map.config = config;
        map.config['csrfmiddlewaretoken'] = $('[name=csrfmiddlewaretoken]')[0].value;

    // CREATE FEATURE LAYERS
        map.featureLayers = {};

        map.getLayer = function() {
             $.ajax({
                crossDomain: true,
                dataType: 'jsonp',
                type: "GET",
                async: false,
                data: {
                    "apikey": map.config.servers.geospatial.apikey,
                    'uuid':$('#layers').val()
                },
                url: map.config.servers.geospatial.address + "/api/v1/layer",
                dataType: 'JSON',
                success: function (data) {
                    try {
                        map.updateFeatureLayers(data);
                    }
                    catch(err){  console.log('Error:', err);  }
                },
                error: function(xhr,errmsg,err) {
                    console.log(xhr.status,xhr.responseText,errmsg,err);
                }
            });
        }

        map.updateFeatureLayers = function(data) {
            for (var _i in this.featureLayers){    // Remove old featurelayers
                if (this.hasLayer(this.featureLayers[_i])) {
                    this.removeLayer(this.featureLayers[_i]);
                }
            }
            //this.featureLayers = {};    // Clear old featurelayers
            try {
                this.featureLayers[data.uuid] = this.createFeatureLayer(data.geodata);    // Create new featurelayers
                this.featureLayers[data.uuid].addTo(this);    // Apply new featurelayers to map
            }
            catch(err) { console.log(err); }
        }

        map.createFeatureLayer = function(data) {
            var featureLayer = L.geoJson(data, {
                style: {
                    "weight": 1, 
                    "color": "#666", 
                    "fillOpacity": 1
                    //, "#169EC6" "#0A485B"
                },
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 4,
                        fillOpacity: 0.85,
                        color: '#fffff',
                        stroke: false,

                    });
                },
                // weight: 1, color: "#666", fillOpacity: 1, "#169EC6" "#0A485B"
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(
                        "<button onclick=map.editfeature(" + JSON.stringify(feature) + ")>Edit</button>"
                    );
                    layer.on({
                        mouseover: function(feature){
                            var properties = feature.target.feature.properties;
                            var results = "";
                            for (var item in properties) {
                                results += item + ": " + properties[item] + "<br>";
                            }
                            $("#attributes")[0].innerHTML = results;
                        },
                        mouseout: function(){
                            $("#attributes")[0].innerHTML = "Hover over features";
                        }
                    });
                }
            });
            return featureLayer;
        }

        map.getFeature = function(location){
            var results;
            $.ajax({
                crossDomain: true,
                dataType: 'jsonp',
                type: "GET",
                async: false,
                data: {
                    "apikey": map.config.servers.geospatial.apikey,
                    "k": location,
                    "uuid": location.split(":")[0]
                },
                url: map.config.servers.geospatial.address + "/api/v1/layer/feature",
                dataType: 'JSON',
                success: function (data) {
                    try {
                        results = data;
                    }
                    catch(err){  console.log('Error:', err);  }
                },
                error: function(xhr,errmsg,err) {
                    console.log(xhr.status,xhr.responseText,errmsg,err);
                }
            });
            return results;
        }

        map.editfeature = function(data) {
            var layer = L.geoJson(data);
            layer.k = false;
            layer.addTo(map);
            layer.on('click', function(e){
                var layer = e.layer;
                layer.editing.enable();
                if(!layer.k){
                    layer.k = layer.feature.properties.k;
                    layer.on('click', function(e){
                        var save = confirm("save changes?");
                        if(save) {
                            $.ajax({
                                crossDomain: true,
                                dataType: 'jsonp',
                                async: false,
                                // type: "POST",
                                method: "PUT",
                                headers: {"X-HTTP-Method-Override": "PUT"},
                                data: {
                                    'apikey': map.config.servers.geospatial.apikey,
                                    'uuid': $('#layers').val(),
                                    'k': this.k,
                                    'geom': JSON.stringify([[this._latlng.lng,this._latlng.lat]])                   
                                },
                                url: map.config.servers.geospatial.address + '/api/v1/layer/feature',
                                success: function (data) {
                                    try {
                                        results = data;
                                        alert(results.message);
                                    }
                                    catch(err){  console.log('Error:', err);  }
                                },
                                error: function(xhr,errmsg,err) {
                                    console.log(xhr.status,xhr.responseText,errmsg,err);
                                    console.log(xhr);
                                }
                            });
                            map.removeLayer(layer);
                            map.getLayer();
                        }
                    });
                }
            });
        }


    // LAYER CONTROL
        map.layerControl = function() {
            for (var _i in  this.config.featureLayers) {
                var obj = document.createElement('option');
                obj.value = this.config.featureLayers[_i];
                obj.text = _i;
                $('#layers').append(obj);
            }
        }

    // ATTRIBUTE LEGEND
        var legend = L.control({position: 'bottomright'});
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = "<h4>Attributes</h4><div id='attributes'>Hover over features</div>";
            return div;
        };
        legend.addTo(map);

    // GEOJSON LAYERS
        var geojsonLayers = L.control({position: 'topright'});
        geojsonLayers.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = '';
            div.innerHTML += '<input type="checkbox" id="track"> Tracking<br>'
            div.innerHTML += '<i class="fa fa-search-plus" id="zoom" style="padding-left:5px; margin-right:0px;"></i><select name="basemaps" id="layers"></select>';
            return div;
        };
        geojsonLayers.addTo(map);

        L.control.layers(baseMaps, overlayMaps, {position: 'topright'}).addTo(map);

    // LAUNCH MAP OBJ
        map.launch = function() {
            try {
                this.setView([0,0], 1);
                this.layerControl();
                $(document).ready(function(){ 
                    $('select').on('change', function(){ 
                        map.getLayer();
                    });
                });
                $(document).ready(function(){ 
                    $('#zoom').on('click', function(){ 
                        map.fitBounds(
                            map.featureLayers[$('#layers').val()].getBounds()
                        );
                    });
                });
                map.getLayer();
                //map.webSocket = openWS();
                //sendMessage(map.webSocket, $('#layers').val());
            }
            catch(err) { console.log(err); }
        }
    // START MAP OBJ
        map.launch();
    // RETURN ENHANCED MAP OBJ
        return map;

    }








/*
        map.heatLayers = {};

        map.createHeatLayer = function(data) {
            var pts = [];
            for (_i=0; _i < data.length; _i++) {
                var pt = [parseFloat(data[_i][0]),parseFloat(data[_i][1])];
                pts.push(pt);
            }
            var featureLayer = L.heatLayer(pts);
            //featureLayer.setOptions({radius: 15, blur: 20, maxZoom: 25});
            //featureLayer.setOptions({maxZoom: 12});
            return featureLayer;
        }

        map.getHeatLayer = function() {
            $.get(
                "http://" + baseURL + "/api/v1/layer/heat", 
                {'uuid':$('#layers').val()},
                function(data,status){
                    if (status == 'success') {
                        var layer = map.updateHeatLayers(data);
                    }
                    else {
                        console.log(status);
                    }
                },
                "json"
            );
        }
        map.updateHeatLayers = function(data) {
            for (var _i in this.heatLayers){    // Remove old featurelayers
                if (this.hasLayer(this.heatLayers[_i])) {
                    this.removeLayer(this.heatLayers[_i]);
                }
            }
            this.heatLayers = {};    // Clear old featurelayers
            try {
                this.heatLayers[data.uuid] = this.createHeatLayer(data.geodata);    // Create new featurelayers
                this.heatLayers[data.uuid].addTo(this);    // Apply new featurelayers to map
            }
            catch(err) { console.log(err); }
        }



                    "baselayers": {
                        "Topographic": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.png",
                        "Streets": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.png",
                        "Oceans": "http://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}.png",
                        "NationalGeographic": "http://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}.png",
                        "Gray": "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}.png",
                        "DarkGray": "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}.png",
                        "Imagery": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png",
                        "ShadedRelief": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}.png",
                        "Terrain": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}.png",
                        "World at Night": "https://tiles2.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Earth_at_Night_WM/MapServer/tile/{z}/{y}/{x}"
                    },
                    "overlays": {
                        "None": null,
                        "World Transportation":"https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
                        "LandScan World 2010 Population":"https://utility.arcgis.com/usrsvcs/rest/services/5864fa4352d34c859bd5fa4c0344f500/MapServer/tile/{z}/{y}/{x}"
                    //    ,
                    //    "tilestache": config.tilestache
                    },
                    "labels": {
                        "None": null,
                        "OceansLabels": "http://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}.png",
                        "GrayLabels": "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}.png",
                        "DarkGrayLabels": "http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}.png",
                        "ImageryLabels": "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}.png",
                        "ShadedReliefLabels": "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}.png",
                        "TerrainLabels": "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}.png"
                    }

*/
