import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({
    port: 9220,
    handleProtocols: (protocols, req) => {
        if (protocols.has('ocpp2.0.1')) return 'ocpp2.0.1';
        if (protocols.has('ocpp1.6')) return 'ocpp1.6';
        return false;
    }
});

console.log('Mock CSMS running on ws://localhost:9220');

wss.on('connection', (ws, req) => {
    const chargerId = req.url?.substring(1); // /CP001
    console.log(`Charger connected: ${chargerId}`);

    ws.on('message', (message) => {
        const text = message.toString();
        console.log(`[${chargerId}] Received:`, text);

        try {
            const data = JSON.parse(text);
            if (Array.isArray(data) && data[0] === 2) {
                const [_, msgId, action, payload] = data;

                // Simple auto-responder
                let responsePayload = {};

                switch (action) {
                    case 'BootNotification':
                        responsePayload = {
                            status: 'Accepted',
                            currentTime: new Date().toISOString(),
                            interval: 60
                        };
                        break;
                    case 'Heartbeat':
                        responsePayload = {
                            currentTime: new Date().toISOString()
                        };
                        break;
                    case 'Authorize':
                        responsePayload = {
                            idTagInfo: { status: 'Accepted' }
                        };
                        break;
                    case 'StartTransaction':
                        responsePayload = {
                            transactionId: Math.floor(Math.random() * 10000),
                            idTagInfo: { status: 'Accepted' }
                        };
                        break;
                    case 'StopTransaction':
                        responsePayload = {
                            idTagInfo: { status: 'Accepted' }
                        };
                        break;
                    case 'StatusNotification':
                        responsePayload = {};
                        break;
                    case 'MeterValues':
                        responsePayload = {};
                        break;
                    default:
                        console.warn(`Unknown action: ${action}`);
                }

                const response = [3, msgId, responsePayload];
                ws.send(JSON.stringify(response));
                console.log(`[${chargerId}] Responded to ${action}`);
            }
        } catch (err) {
            console.error('Error processing message', err);
        }
    });

    ws.on('close', () => {
        console.log(`Charger disconnected: ${chargerId}`);
    });
});
