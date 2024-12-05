"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
// Import WebSocket and UUID
const ws_1 = require("ws");
const uuid_1 = require("uuid");
const USER_ID = process.env.USER_ID || (0, uuid_1.v4)();
const PROXY_IP = process.env.PROXY_IP || '';
function isValidUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}
if (!isValidUUID(USER_ID)) {
    throw new Error('Invalid UUID provided in environment variable USER_ID.');
}
function handler(req, res) {
    const { headers, url, method } = req;
    if (headers['upgrade'] === 'websocket') {
        handleWebSocketUpgrade(req, res);
    }
    else {
        handleHttpRequest(req, res);
    }
}
function handleHttpRequest(req, res) {
    const urlPath = req.url || '/';
    if (urlPath === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Welcome to the Vercel WebSocket API!' }));
    }
    else if (urlPath === `/${USER_ID}`) {
        const vlessConfig = getVLESSConfig(USER_ID, req.headers.host || 'localhost');
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(vlessConfig);
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
}
function handleWebSocketUpgrade(req, res) {
    const wss = new ws_1.WebSocketServer({ noServer: true });
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
        ws.on('message', (message) => {
            console.log('Received:', message.toString());
            ws.send('Echo: ' + message.toString());
        });
        ws.on('close', () => {
            console.log('WebSocket connection closed');
        });
        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
        });
        ws.send('WebSocket connection established.');
    });
    wss.emit('connection', req);
}
/**
 * Returns a sample VLESS configuration for the given user ID and host.
 * @param userId {string}
 * @param host {string}
 */
function getVLESSConfig(userId, host) {
    return `
vless://${userId}@${host}:443?encryption=none&security=tls&headerType=none&type=ws#VLESS-Example
    `;
}
// Ensure that the server can handle WebSocket upgrade requests.
exports.config = {
    api: {
        bodyParser: false,
    },
};
