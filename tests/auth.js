import ws from "k6/ws";
import { check } from "k6";

export default function() {
  var url = "ws://0.0.0.0:8080/events/websocket";
  var params = { token: ``  };

  var res = ws.connect(url, params, function(socket) {
    socket.on('open', function() {
      // console.log('connected');
      socket.send(JSON.stringify({ token: `AHG-2200${__VU}`},null,0));
    });

    socket.on('message', function(data) {
      // console.log("Message received: ", data);
      socket.close();
      // socket.setTimeout(function() {
      //   // console.log('2 seconds passed, closing the socket');
      //   socket.close();
      // }, 2000);
    });

    socket.on('close', function() {
      // console.log('disconnected');
    });
  });

  check(res, { "status is 101": (r) => r && r.status === 101 });
}


