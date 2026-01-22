import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

const wss = new WebSocketServer({
    server,
    handleProtocols: (protocols, req) => {
        if (protocols.has('ocpp2.0.1')) return 'ocpp2.0.1';
        if (protocols.has('ocpp1.6')) return 'ocpp1.6';
        return false;
    }
});

// Store connected chargers
const chargers = new Map<string, WebSocket>();
// Store pending command responses
const commandResponses = new Map<string, { resolve: (val: any) => void, reject: (err: any) => void }>();

wss.on('connection', (ws, req) => {
    const chargerId = req.url?.substring(1) || 'unknown';
    console.log(`[CSMS] Charger connected: ${chargerId}`);
    chargers.set(chargerId, ws);

    ws.on('message', (message) => {
        const text = message.toString();
        // console.log(`[${chargerId}] Received:`, text);

        try {
            const data = JSON.parse(text);
            if (!Array.isArray(data)) return;
            const [typeId, msgId, actionOrPayload, payloadOrDetails] = data;

            if (typeId === 2) {
                // Incoming Request from Charger
                const action = actionOrPayload;
                const payload = payloadOrDetails;

                // Auto-respond to basic things
                let responsePayload = {};
                switch (action) {
                    case 'BootNotification':
                        // Check version based on payload structure or protocol
                        if (payload.chargingStation) { // 2.0.1
                            responsePayload = { status: 'Accepted', currentTime: new Date().toISOString(), interval: 60 };
                        } else { // 1.6
                            responsePayload = { status: 'Accepted', currentTime: new Date().toISOString(), interval: 60 };
                        }
                        break;
                    case 'Heartbeat':
                        responsePayload = { currentTime: new Date().toISOString() };
                        break;
                    case 'Authorize':
                        if (payload.idToken) responsePayload = { idTokenInfo: { status: 'Accepted' } };
                        else responsePayload = { idTagInfo: { status: 'Accepted' } };
                        break;
                    case 'StartTransaction':
                        responsePayload = { transactionId: Math.floor(Math.random() * 10000), idTagInfo: { status: 'Accepted' } };
                        break;
                    case 'StopTransaction':
                        responsePayload = { idTagInfo: { status: 'Accepted' } };
                        break;
                    case 'TransactionEvent':
                        responsePayload = { idTokenInfo: { status: 'Accepted' } };
                        break;
                    case 'StatusNotification':
                    case 'MeterValues':
                        responsePayload = {};
                        break;
                }
                const response = [3, msgId, responsePayload];
                ws.send(JSON.stringify(response));

            } else if (typeId === 3) {
                // Response from Charger
                if (commandResponses.has(msgId)) {
                    commandResponses.get(msgId)?.resolve(actionOrPayload);
                    commandResponses.delete(msgId);
                }
            } else if (typeId === 4) {
                // Error from Charger
                if (commandResponses.has(msgId)) {
                    commandResponses.get(msgId)?.reject(new Error(actionOrPayload)); // Error code
                    commandResponses.delete(msgId);
                }
            }

        } catch (err) {
            console.error('Error processing message', err);
        }
    });

    ws.on('close', () => {
        console.log(`[CSMS] Charger disconnected: ${chargerId}`);
        chargers.delete(chargerId);
    });
});

// --- HTTP API to Control CSMS ---

// Get connected chargers
app.get('/api/chargers', (req, res) => {
    res.json(Array.from(chargers.keys()));
});

// Send Command to Charger
app.post('/api/commands/:chargerId', async (req, res) => {
    const { chargerId } = req.params;
    const { action, payload } = req.body;

    const ws = chargers.get(chargerId);
    if (!ws) {
        res.status(404).json({ error: 'Charger not connected' });
        return;
    }

    const messageId = uuidv4();
    const message = [2, messageId, action, payload];

    try {
        const response = await new Promise((resolve, reject) => {
            commandResponses.set(messageId, { resolve, reject });
            ws.send(JSON.stringify(message));

            // Timeout
            setTimeout(() => {
                if (commandResponses.has(messageId)) {
                    commandResponses.delete(messageId);
                    reject(new Error('Timeout waiting for charger response'));
                }
            }, 10000);
        });
        res.json({ status: 'Success', response });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 9220;
server.listen(PORT, () => {
    console.log(`Mock CSMS running on port ${PORT} (HTTP + WS)`);
});
