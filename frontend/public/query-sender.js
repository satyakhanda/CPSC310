/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        let request = new XMLHttpRequest();
        request.open("POST", "/query", true);
        request.setRequestHeader("Content-type", "application/json");
        request.onload = function () {
            let result = JSON.parse(request.responseText);
            console.log(result);
            fulfill(result);
        };
        request.onerror = function () {
            reject('The request failed');
        };
        request.send(JSON.stringify(query));
    });
};
