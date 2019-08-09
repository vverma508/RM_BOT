
var queryString = require("querystring");

exports.EncodeObj = function (obj) {

    //Sorting
    keysSorted = Object.keys(obj).sort(function (a, b) {
        if (a < b) { return -1; }
        if (a > b) { return 1; }
        return 0;
    })
    var querytexts = [];
    keysSorted.forEach(key => {
        querytexts.push(queryString.escape(key) + "=" + queryString.escape(obj[key]))
    });

    return querytexts.join('&');
}

exports.EncodeString = function (str) {
    return queryString.escape(str);
}
