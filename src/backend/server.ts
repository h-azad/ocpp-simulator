import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { simulatorManager } from './SimulatorManager';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// --- WebSocket for UI (Real-time logs) ---
wss.on('connection', (ws) => {
    console.log('UI Connected to Simulator Backend');

    const listener = (event: any) => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(event));
        }
    };
    simulatorManager.subscribe(listener);

    ws.on('close', () => {
        simulatorManager.unsubscribe(listener);
    });
});

// --- REST API for Control ---

app.get('/chargers', (req, res) => {
    res.json(simulatorManager.getAllChargers());
});

app.post('/chargers', async (req, res) => {
    const { chargerId, csmsUrl, version } = req.body;
    try {
        const charger = simulatorManager.createCharger(chargerId, csmsUrl, version);
        // Auto-connect if requested? For now just create.
        await charger.connect(csmsUrl);
        res.json({ status: 'Created', chargerId });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/chargers/:id/action', async (req, res) => {
    const { id } = req.params;
    const { action, payload } = req.body;

    const charger = simulatorManager.getCharger(id);
    if (!charger) {
        res.status(404).json({ error: 'Charger not found' });
        return;
    }

    try {
        let result;
        switch (action) {
            case 'BootNotification':
                result = await charger.boot(payload?.vendor, payload?.model);
                break;
            case 'Connect':
                await charger.connect(payload?.csmsUrl); // Takes optional payload or uses stored
                result = { status: 'Connected' };
                break;
            case 'Heartbeat':
                result = await charger.heartbeat();
                break;
            case 'Disconnect':
                await charger.disconnect();
                result = { status: 'Disconnected' };
                break;
            // Add more actions as needed
            default:
                res.status(400).json({ error: 'Unknown action' });
                return;
        }
        res.json({ status: 'OK', result });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Simulator Backend running on http://localhost:${PORT}`);
});
