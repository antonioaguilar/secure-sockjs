const pkg = require('./package')
const _ = require('lodash');
const http = require('http');
const nuid = require('nuid').next();
const sockjs = require('sockjs');

const port = process.env.PORT || 8080;
const host = '0.0.0.0';

let server = http.createServer();
let socket = sockjs.createServer();

const server_info = {
  server_id: nuid,
  version: pkg.version,
  host: '0.0.0.0',
  port: process.env.PORT || 8080,
  tls_required: false
}

const server_config = {
  auth_required: true,
  disconnect_timeout: 2000
}

let eventLoop = async (connection) => {

  connection.auth = false;

  let session_info = {
    client_id: connection.id,
    client_ip: connection.remoteAddress,
    client_port: connection.remotePort,
    url: connection.url,
    protocol: connection.protocol
  };

  connection.write(JSON.stringify(server_info, null, 0));

  let onDataEvent = (data) => {
    try {
      data = JSON.parse(data);

      if (server_config.auth_required) {

        if (data['jwt']) {
          session_info.authenticated = true;
          connection.auth = true;
          connection.write(JSON.stringify(session_info, null, 0));
        }
        else if (data['token']) {
          session_info.authenticated = true;
          connection.auth = true;
          connection.write(JSON.stringify(session_info, null, 0));
        }
        else {
          connection.auth = false;
        }
      }
      // { "token": "BUYYF8RGFGB93WZC795V15" }
      console.log(`Websocket data [${connection.id}] ` + JSON.stringify(event, null, 0));
    } catch (e) {
      console.error(`Websocket data error [${connection.id}] ${e}`);
    }
  };

  let onCloseEvent = () => {
    console.log(`Websocket connection closed [${connection.id}]`);
  };

  connection.on('data', onDataEvent);
  connection.on('close', onCloseEvent);

  // if the socket didn't authenticate, disconnect it
  let tm = setTimeout(() => {
    clearTimeout(tm);
    if (!connection.auth) {
      console.log(`Authentication failed, disconnected [${connection.id}]`);
      connection.close();
    }
  }, server_config.disconnect_timeout);

  console.log(`Websocket connection established [${connection.id}]`);

};

server.listen(port, host, () => {
  console.log(`Websocket server started on ${host}:${port}`);
});

socket.installHandlers(server, { prefix: '/events', transports: ['websocket'] });

socket.on('connection', eventLoop);

