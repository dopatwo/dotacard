var http = require('http'),
  url = require('url'),
  fs = require('fs'),
  serveStatic = require('serve-static'),
  host = process.env.HOST,
  port = process.env.PORT || 5000,
  waiting = {id: 'none'},
  currentData = {},
  chat = [],
  debug = false;

var db = {
  get: function(name, cb){cb(currentData[name]||'');},
  set: function(name, val, cb){currentData[name] = val; cb(true);}
};
var send = function(response, data){
  response.statusCode = 200;
  response.end( String(data) );
};
var setHeaders = function (response) {
  response.setHeader('Access-Control-Allow-Origin', 'http://rafaelcastrocouto.github.io');
};
var clientServer = serveStatic('client', {
  'index': ['index.html', 'index.htm'], 
  'setHeaders': setHeaders
});
var rootServer = serveStatic(__dirname, {
  'setHeaders': setHeaders
});

http.createServer(function(request, response) {
  setHeaders(response);
  var urlObj = url.parse(request.url, true);
  var pathname = urlObj.pathname;
  if (request.headers['x-forwarded-proto'] === 'https'){
    response.writeHead(302, {'Location': 'http://dotacard.herokuapp.com/'});
    response.end();
    return;
  }
  //console.log('request: '+pathname);
  if (pathname[0] === '/') { pathname = pathname.slice(1); }
  if (pathname === 'db') {
    response.setHeader('Content-Type', 'application/json');
    var query = urlObj.query;
    if (query.set){ //console.log('set: '+ query.set);
      switch (query.set) {
        case 'waiting':
          if (waiting.id === 'none'){
            //console.log('Player' + waiting);
            send(response, JSON.stringify(waiting));
            waiting = query.data;
          } else {
            //console.log('Online game started');
            send(response, waiting);
            waiting = {id: 'none'};
          }
          return;
        case 'back': //console.log('Choose back click')
          waiting = {id: 'none'};
          send(response, JSON.stringify(waiting));
          return;
        case 'chat':
          var msg = {
            data: query.data.substring(0, 42), 
            user: query.user.substring(0, 24)
          };
          chat.unshift(msg);
          chat = chat.slice(0, 6);
          send(response, JSON.stringify({messages: chat}));
          return;
        default: //console.log('set', query.data)
          db.set(query.set, query.data, function(data){
            send(response, data);
          });
          return;
      }
    } else if (query.get) { //console.log('get: '+ query.get);
      switch (query.get) {
        case 'server':
          send(response, JSON.stringify({status: 'online'}));
          return;
        case 'chat':
          send(response, JSON.stringify({messages: chat}));
          return;
        case 'lang':
          send(response, JSON.stringify({lang: request.headers['accept-language'] || ''})); 
          return;
        default:
          db.get(query.get, function(data) {
            send(response, data); //console.log('get', data) 
          });
          return;
      }
    } else {
      send(response, 'Db works!');
      return;
    }
  } else { //STATIC
    clientServer(request, response, function onNext(err) {
      rootServer(request, response, function onNext(err) {
        response.statusCode = 404;
        response.setHeader('Content-Type', 'text/html; charset=UTF-8');
        fs.createReadStream('client/404.html').pipe(response);
      });
    });
  }
}).listen(port, host);

var d = new Date();
console.log(
  d.toLocaleDateString() + ' ' + d.toLocaleTimeString() + ' ' +
  'DOTACARD server running at: http://'+(host || 'localhost')+(port === '80' ? '/' : ':'+port+'/')
);
