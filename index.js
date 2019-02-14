const pkg = require('./package')
const _ = require('lodash');
const http = require('http');
const nuid = require('nuid').next();
const sockjs = require('sockjs');

const port = process.env.PORT || 8080;
const host = '0.0.0.0';

let server = http.createServer();
let socket = sockjs.createServer();
let metrics = {
  connected: 0, disconnected: 0, authenticated: 0, rejected: 0
};

console.log = () => {};

const server_info = {
  server_id: nuid,
  version: pkg.version,
  host: '0.0.0.0',
  port: process.env.PORT || 8080,
  tls_required: false
}

const server_config = {
  auth_required: true,
  disconnect_timeout: 1000
}

let eventLoop = async (connection) => {

  metrics.connected++;
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
          metrics.authenticated++;
          console.log(`Authenticated ${connection.id}`);
          connection.write(JSON.stringify(session_info, null, 0));
        }
        else if (data['token']) {
          session_info.authenticated = true;
          connection.auth = true;
          metrics.authenticated++;
          console.log(`Authenticated ${connection.id}`);
          connection.write(JSON.stringify(session_info, null, 0));
        }
        else {
          metrics.rejected++;
          connection.auth = false;
          console.log(`Authentication validation error ${connection.id}`);
        }
      }
    } catch (e) {
      console.error(`Data format error ${connection.id} ${e}`);
    }
  };

  let onCloseEvent = () => {
    metrics.disconnected++;
    console.log(`Disconnected ${connection.id}`);
  };

  connection.on('data', onDataEvent);
  connection.on('close', onCloseEvent);

  // if the socket didn't authenticate, disconnect it
  let tm = setTimeout(() => {
    clearTimeout(tm);
    if (!connection.auth) {
      console.log(`Authentication failed, disconnected ${connection.id}`);
      connection.close();
    }
  }, server_config.disconnect_timeout);

  console.log(`Connected ${connection.id}`);

};

server.listen(port, host, () => {
  console.info(`Websocket server started on ${host}:${port}`);
});

socket.installHandlers(server, { prefix: '/events', transports: ['websocket'], log: ()=>{} });

socket.on('connection', eventLoop);

setInterval( ()=> {
  console.info('Websocket server metrics:', JSON.stringify(metrics, null, 0));
}, 1000);