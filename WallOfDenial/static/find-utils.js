
var baseURL = document.URL.split('/map')[0].split('http://')[1];

var Utils = {
    postRequest: function(route,data) {
        console.log("http://" + baseURL + route);
        var results;
        $.ajax({
            type: "POST",
            async: false,
            data: data,
            url: "http://" + baseURL + route,
            dataType: 'JSON',
            success: function (data) {
                try {
                    results = data;
                    alert(results.message);
                }
                catch(err){  console.log('Error:', err);  }
            },
            error: function(xhr,errmsg,err) {
                console.log(xhr.status,xhr.responseText,errmsg,err);
            }
        });
        return results;
    },
    getRequest: function(route,data) {
        console.log("http://" + baseURL + route);
        var results;
        $.ajax({
            type: "POST",
            async: false,
            data: data,
            url: "http://" + baseURL + route,
            dataType: 'JSON',
            success: function (data) {
                try {
                    results = data;
                    alert(results.message);
                }
                catch(err){  console.log('Error:', err);  }
            },
            error: function(xhr,errmsg,err) {
                console.log(xhr.status,xhr.responseText,errmsg,err);
            }
        });
        return results;
    }
}