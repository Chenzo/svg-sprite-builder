var express = require('express');
var app = express();
var path = require('path');
var thePort = 7080;


app.use('/js', express.static(__dirname + '/dist/js'));
app.use('/pngs', express.static(__dirname + '/dist/pngs'));
app.use('/svg', express.static(__dirname + '/dist/svg'));
app.use('/css', express.static(__dirname + '/dist/css'));


app.use('/docs', express.static(__dirname + '/docs/'));
app.get('/docs', function(req, res) {
  res.sendFile(path.join(__dirname + '/docs/spritesheet-docs.html'));
});

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/dist/svg-sprites.html'));
});


app.use(function(req, res, next) {
  res.status(404).send('Somethings missing...');
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.listen(thePort, function() {
	console.log("Server up at: localhost:" + thePort);
});





