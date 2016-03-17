var current_location_marker = false;
var timer;
var trackingLocations = {};

function startTracking() {
    timer = window.setInterval(function() {
        $.getJSON(
            map.config.servers.machinelearning.address + '/whereami', {
            group: "{{group|safe}}",
            user: "{{username|safe}}"
        }, 
        function(data) {
            for (var user in data) {
                for (var l=0; l < data[user].length; l++) {
                    if (!trackingLocations.hasOwnProperty(data[user][l].location)){
                        trackingLocations[data[user][l].location] = map.getFeature(data[user][l].location).geodata;
                    }
                }
                var current_location = trackingLocations[data[user][0].location];
                if (!current_location_marker) {
                   current_location_marker = L.marker([
                        current_location.geometry.coordinates[1], 
                        current_location.geometry.coordinates[0]
                    ]).addTo(map).bindPopup("You are here");
                }
                else {
                    var newLatLng = new L.LatLng(
                        current_location.geometry.coordinates[1], 
                        current_location.geometry.coordinates[0]
                    );
                    current_location_marker.setLatLng(newLatLng); 
                }
                map.setView(current_location_marker.getLatLng(), 18);
                $("select")[0].value = data[user][0].location.split(":")[0];
                map.getLayer();
            }
        });
    }, 1000);
}

function stopTracking(){
    window.clearInterval(timer);
}

$(function(){
    $("#track").on('change', function() {
        if ($("#track")[0].checked) {
            startTracking();
        }
        else {
            stopTracking();
        }
    });
})