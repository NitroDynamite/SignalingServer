const http = require('http'); // Import the HTTP module for creating the server
const websocket = require('websocket'); // Import the WebSocket module for handling WebSocket connections

const clients = {}; // Object to keep track of connected clients

// Create an HTTP server
const httpServer = http.createServer((req, res) => {
  console.log(`${req.method.toUpperCase()} ${req.url}`); // Log the request method and URL

  // Function to respond to requests
  const respond = (code, data, contentType = 'text/plain') => {
    res.writeHead(code, { // Set the response headers
      'Content-Type': contentType, // Set the content type
      'Access-Control-Allow-Origin': '*', // Allow requests from any origin
    });
    res.end(data); // Send the response data
  };

  respond(404, 'Not Found'); // Respond with a 404 status for any unmatched routes
});

// Create a WebSocket server using the HTTP server
const wsServer = new websocket.server({ httpServer });
wsServer.on('request', (req) => {
  console.log(`WS ${req.resource}`); // Log the incoming WebSocket request

  const { path } = req.resourceURL; // Get the resource path from the request
  const splitted = path.split('/'); // Split the path into parts
  splitted.shift(); // Remove the first empty element
  const id = splitted[0]; // Get the client ID from the path

  const conn = req.accept(null, req.origin); // Accept the WebSocket request and establish a connection
  conn.on('message', (data) => { // Set up a listener for incoming messages
    if (data.type === 'utf8') { // Check if the message type is 'utf8'
      console.log(`Client ${id} << ${data.utf8Data}`); // Log the incoming message

      const message = JSON.parse(data.utf8Data); // Parse the incoming message from JSON
      const destId = message.id; // Get the destination client ID
      const dest = clients[destId]; // Find the connection for the destination client

      if (dest) {
        message.id = id; // Set the message ID to the sender's ID
        const data = JSON.stringify(message); // Convert the message back to JSON
        console.log(`Client ${destId} >> ${data}`); // Log the message being sent
        dest.send(data); // Send the message to the destination client
      } else {
        console.error(`Client ${destId} not found`); // Log an error if the destination client is not found
      }
    }
  });

  conn.on('close', () => { // Set up a listener for when the connection is closed
    delete clients[id]; // Remove the client from the clients object
    console.error(`Client ${id} disconnected`); // Log the disconnection
  });

  clients[id] = conn; // Store the connection in the clients object
});

// Define the port and hostname
const port = process.env.PORT || 10000; // Automatically gets the port from Render or defaults to 8000
const hostname = '0.0.0.0'; // Allows access from any IP address

// Start the HTTP server and log a message once it's ready
httpServer.listen(port, hostname, () => {
  console.log(`Server listening on ${hostname}:${port}`); // Log the server's listening address
});
