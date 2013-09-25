var express = require('express');
var port = process.env.PORT || 3000;
var app = express();

app.get('/', function(request, response) {
    response.sendfile(__dirname + '/index.html');
})
app.get('/index2.html', function(request, response) {
    response.sendfile(__dirname + '/index2.html');
}).configure(function() {
    app.use('/static', express.static(__dirname + '/static'));
}).listen(port);