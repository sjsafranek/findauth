
/* WEB SOCKET */
/*
	var baseURL = document.URL.split('/map')[0].split('http://')[1];

	function openWS() {
		//console.log("ws://"+baseURL+"/websocket");
		var webSocket = new WebSocket("ws://"+baseURL+"/websocket");
		webSocket.onopen = function() {
			ws.send("Hello, world");
		};
		webSocket.onmessage = function(e) {
			var data = JSON.parse(e.data);
			console.log(data);
			map.updateFeatureLayers(data);
		};
		webSocket.onclose = function(e) {
			console.log('connection closed');
		};
		return webSocket;
	}

	function sendMessage(socket,web_token,currentBaselayer) {
		waitForSocketConnect(socket, function(){
			try { 
				var data = { "apikey": "moonshine", "uuid": currentBaselayer };
				console.log(data);
				if(data.web_token) {
					socket.send(JSON.stringify(data));
				}
			}
			catch(err) {
				console.log(err);
			}
		});
	}

	function waitForSocketConnect(socket, callback){
		//socket.close()	// after attempting connection close
		setTimeout(
			function() {
				if (socket.readyState ===1) {
					console.log('connection is made');
					if (callback != null) {
						callback();
					}
					return;
				}
				else {
					console.log('waiting for connection...');
					waitForSocketConnect(socket, callback);
				}
			}, 10); // wait 10 milliseconds for connection...
	}

	window.onload = function() {
		if("WebSocket" in window) {
			console.log("[SYSTEM]", "WebSocket is supported by your browser!");
		}
		else {
			console.log("[SYSTEM]", "WebSocket is NOT supported by your browser!");
			console.log("[SYSTEM]", "Please upgrade to a modern browser.");
			alert("[SYSTEM] WebSocket is NOT supported by your browser!");
			alert("[SYSTEM] Please upgrade to a modern browser...");
		}
	}

*/


var baseURL = document.URL.split('/client')[0].split('/admin')[0].split('/map')[0].split('http://')[1];



/* INITIATE MAP OBJECT */

	function initMap(div,config) {

	// CREATE MAP OBJ
		/*  feature request: http://osmbuildings.org/examples/Leaflet.php?lat=36.00574&lon=-78.93683&zoom=18  */
		var map = L.map('map',{maxZoom: 22});
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png',{ 
			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> | F.I.N.D.'
		}).addTo(map);

	// SAVE CONFIG OBJ TO MAP
		map.config = config;

		map.featureLayers = {};
		map.heatLayers = {};

		map.getLayer = function() {
			$.get(
				"http://" + baseURL + "/api/v1/layer", 
				{'apikey':'7q1qcqmsxnvw','uuid':$('#layers').val()},
				function(data,status){
					if (status == 'success') {
						//console.log(data);
						map.updateFeatureLayers(data);
					}
					else {
						console.log(status);
					}
				},
				"json"
			);
		}

		map.getHeatLayer = function() {
			$.get(
				"http://" + baseURL + "/api/v1/layer/heat", 
				{'apikey':'7q1qcqmsxnvw','uuid':$('#layers').val()},
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
	// TRIGGERED BY SOCKET CONNECTION
		map.updateFeatureLayers = function(data) {
			for (var _i in this.featureLayers){	// Remove old featurelayers
				if (this.hasLayer(this.featureLayers[_i])) {
					this.removeLayer(this.featureLayers[_i]);
				}
			}
			this.featureLayers = {};	// Clear old featurelayers
			try {
				this.featureLayers[data.uuid] = this.createFeatureLayer(data.geodata);	// Create new featurelayers
				this.featureLayers[data.uuid].addTo(this);	// Apply new featurelayers to map
			}
			catch(err) { console.log(err); }
		}

	// TRIGGERED BY SOCKET CONNECTION
		map.updateHeatLayers = function(data) {
			for (var _i in this.heatLayers){	// Remove old featurelayers
				if (this.hasLayer(this.heatLayers[_i])) {
					this.removeLayer(this.heatLayers[_i]);
				}
			}
			this.heatLayers = {};	// Clear old featurelayers
			try {
				this.heatLayers[data.uuid] = this.createHeatLayer(data.geodata);	// Create new featurelayers
				this.heatLayers[data.uuid].addTo(this);	// Apply new featurelayers to map
			}
			catch(err) { console.log(err); }
		}
	// CREATE FEATURE LAYERS
		map.createFeatureLayer = function(data) {
			var featureLayer = L.geoJson(data, {
				pointToLayer: function(feature, latlng) {
					return L.circleMarker(latlng, {
						radius: 4,
						fillOpacity: 0.85,
						color: '#fffff',
						stroke: false
					});
				},
				onEachFeature: function (feature, layer) {
					layer.bindPopup(String(feature.properties.timestamp));
				}
			});
			return featureLayer;
		}
	
	// HEATMAP
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

	// LAYER CONTROL
		map.layerControl = function() {
			for (var _i = 0; _i < this.config.featureLayers.length; _i++) {
				var obj = document.createElement('option');
				obj.value = this.config.featureLayers[_i];
				obj.text = this.config.featureLayers[_i];
				$('#layers').append(obj);
			}
		}

	// LAUNCH MAP OBJ
		map.launch = function() {
			try {
			// INITIATE MAP OBJ
				this.setView(
					[0,0], 1
				); // ZOOM
				//this.createFeatureLayer(config.geodata).addTo(this);
			// SET UP LAYER CONTROL IN LEGNED OBJ
				this.layerControl();
			// CHANGE BASEMAP
				$(document).ready(function(){ 
					$('select').on('change', function(){ 
						map.getLayer();
					});
				});
				// Apply Current Map
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

