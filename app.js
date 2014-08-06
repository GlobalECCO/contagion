var PORT = process.env.PORT || 8080;

var express = require('express');
var app = express();
var Handler = require('./server/Handler');
var log = require('./server/log').log;
var hideAdminPage = process.env.HIDE_ADMIN_PAGE;

app.use(express.compress());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: '1234567890QWERTY'}));
app.use(app.router);
app.use(express.static(__dirname + "/client"));
app.use(express.static(__dirname + "/shared"));
app.use(express.static(__dirname + "/lib"));
app.use(express.static(__dirname + "/build"));


app.get('/', function(require, response) {
  if (!hideAdminPage) {
    response.sendfile('index.html');
  }
});

app.get('/status', function (request, response) {
  response.send("Okay!");
});

app.get('/new', Handler.newGame);

app.get('/gamelist', Handler.gameList);

app.get('/sessionData', Handler.sessionData);

app.get('/play', Handler.play);

app.get('/playerData', Handler.canPlay);

app.post('/pushPlayerSetup', Handler.pushPlayerSetup);

app.post('/push', Handler.handlePush);

app.get('/pull', Handler.handlePull);

app.get('/delete', Handler.handleDelete);

app.post('/pushChat', Handler.pushChat);

app.post('/pullChat', Handler.pullChat);

app.listen(PORT);
log.info('Listening on port:' + PORT);
