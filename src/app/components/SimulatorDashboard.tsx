'use client';

import React, { useEffect, useState, useRef } from 'react';

type Charger = {
    chargerId: string;
    status: string;
    version?: string;
};

type Log = {
    type: string;
    chargerId?: string;
    message?: any;
    direction?: 'in' | 'out';
    timestamp?: string;
};

export default function SimulatorDashboard() {
    const [chargers, setChargers] = useState<Charger[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [selectedCharger, setSelectedCharger] = useState<string>('');
    const [csmsUrl, setCsmsUrl] = useState('ws://localhost:9220'); // Default example
    const [newChargerId, setNewChargerId] = useState('CP001');
    const [version, setVersion] = useState('ocpp1.6');

    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        fetchChargers();

        // Connect to Simulator Backend WS for logs
        const ws = new WebSocket('ws://localhost:3001');
        ws.onopen = () => console.log('Connected to Simulator Backend WS');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WS Event:', data);
            if (data.type === 'log') {
                setLogs(prev => [...prev.slice(-49), { ...data, timestamp: new Date().toLocaleTimeString() }]);
            } else if (data.type === 'charger_created') {
                fetchChargers();
            } else if (data.type === 'charger_updated') {
                setChargers(prev => prev.map(c =>
                    c.chargerId === data.chargerId ? { ...c, status: data.status } : c
                ));
            }
        };
        wsRef.current = ws;

        return () => {
            ws.close();
        };
    }, []);

    const fetchChargers = async () => {
        try {
            const res = await fetch('http://localhost:3001/chargers');
            const data = await res.json();
            setChargers(data);
        } catch (err) {
            console.error('Failed to fetch chargers', err);
        }
    };

    const createCharger = async () => {
        try {
            await fetch('http://localhost:3001/chargers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chargerId: newChargerId, csmsUrl, version }),
            });
            // List will update via WS event or manual fetch
            fetchChargers();
        } catch (err) {
            alert('Failed to create charger');
        }
    };

    const sendAction = async (action: string, payload?: any) => {
        if (!selectedCharger) return;
        try {
            await fetch(`http://localhost:3001/chargers/${selectedCharger}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload }),
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                OCPP Simulator
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Control Panel */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Create Charger</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Charger ID</label>
                            <input
                                value={newChargerId}
                                onChange={e => setNewChargerId(e.target.value)}
                                className="w-full bg-gray-700 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">CSMS URL</label>
                            <input
                                value={csmsUrl}
                                onChange={e => setCsmsUrl(e.target.value)}
                                className="w-full bg-gray-700 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Protocol Version</label>
                            <select
                                value={version}
                                onChange={e => setVersion(e.target.value)}
                                className="w-full bg-gray-700 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                            >
                                <option value="ocpp1.6">OCPP 1.6 JSON</option>
                                <option value="ocpp2.0.1">OCPP 2.0.1 (Experimental)</option>
                            </select>
                        </div>
                        <button
                            onClick={createCharger}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition"
                        >
                            Create Charger
                        </button>
                    </div>

                    <div className="pt-6 border-t border-gray-700">
                        <h2 className="text-xl font-semibold mb-4">Active Chargers</h2>
                        <div className="space-y-2">
                            {chargers.map(c => (
                                <div
                                    key={c.chargerId}
                                    onClick={() => setSelectedCharger(c.chargerId)}
                                    className={`p-3 rounded cursor-pointer transition flex justify-between items-center ${selectedCharger === c.chargerId ? 'bg-blue-900 border border-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    <span>
                                        {c.chargerId}
                                        {c.version && <span className="ml-2 text-xs text-gray-400">({c.version})</span>}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${c.status === 'Connected' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                        {c.status}
                                    </span>
                                </div>
                            ))}
                            {chargers.length === 0 && <p className="text-gray-500 text-sm">No chargers active.</p>}
                        </div>
                    </div>
                </div>

                {/* Actions Panel */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Actions: {selectedCharger || 'None Selected'}</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            disabled={!selectedCharger}
                            onClick={() => sendAction('BootNotification', { vendor: 'SimVendor', model: 'SimModel' })}
                            className="bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-medium"
                        >
                            Boot Notification
                        </button>
                        <button
                            disabled={!selectedCharger}
                            onClick={() => sendAction('Heartbeat')}
                            className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-medium"
                        >
                            Heartbeat
                        </button>
                        <button
                            disabled={!selectedCharger}
                            onClick={() => sendAction('Disconnect')}
                            className="bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-medium col-span-2"
                        >
                            Disconnect
                        </button>
                        <button
                            disabled={!selectedCharger}
                            onClick={() => sendAction('Connect')}
                            className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded font-medium col-span-2"
                        >
                            Connect
                        </button>
                    </div>
                </div>

                {/* Logs Panel */}
                <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col h-[600px]">
                    <h2 className="text-xl font-semibold mb-4">Live Logs</h2>
                    <div className="flex-1 overflow-y-auto bg-gray-900 rounded p-4 font-mono text-xs space-y-2">
                        {logs.map((log, i) => (
                            <div key={i} className="break-all border-b border-gray-800 pb-2">
                                <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                                <span className="text-yellow-400">[{log.chargerId}]</span>{' '}
                                {log.direction && <span className={log.direction === 'in' ? 'text-green-400' : 'text-blue-400'}>{log.direction === 'in' ? '<-' : '->'}</span>}
                                <div className="text-gray-300 mt-1">
                                    {JSON.stringify(log.message, null, 2)}
                                </div>
                            </div>
                        ))}
                        <div ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth' }); }} />
                    </div>
                </div>

            </div>
        </div>
    );
}
