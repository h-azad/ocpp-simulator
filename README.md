# OCPP EV Charging Simulator

A powerful, multi-version OCPP (Open Charge Point Protocol) simulator built with Next.js and Node.js. This tool allows users to simulate Electric Vehicle Supply Equipment (EVSE) behavior, test communication with a CSMS (Charging Station Management System), and debug OCPP messages in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/OCPP-1.6%20%7C%202.0.1-green)

## Features

-   **Multi-Protocol Support**: Full support for **OCPP 1.6 JSON** and experimental support for **OCPP 2.0.1**.
-   **Real-time Dashboard**: Interactive UI to manage chargers, trigger actions, and view current status.
-   **Live Logs**: Inspect outgoing (Request) and incoming (Response/Error) OCPP messages in real-time with payload details.
-   **Connection Management**: Connect and disconnect chargers dynamically from the UI.
-   **Mock CSMS**: Includes a built-in Mock CSMS for local testing and development.
-   **Event-Driven Architecture**: Built on WebSockets for instant feedback and state synchronization.

## Tech Stack

-   **Frontend**: Next.js 14, React, Tailwind CSS
-   **Backend**: Node.js, Express, `ws` (WebSocket), Zod (Validation)
-   **Language**: TypeScript

## Prerequisites

-   Node.js (v18 or higher)
-   npm or yarn

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd ocpp-simulator
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Running the Simulator

To run the full simulator environment, you need to start three separate processes. It is recommended to run these in separate terminal windows.

### 1. Mock CSMS (Optional)
If you don't have an external CSMS to connect to, start the local mock server:
```bash
npm run mock-csms
```
*   Runs on: `ws://localhost:9220`

### 2. Simulator Backend
This is the core engine that manages the charger instances and protocol adapters:
```bash
npm run simulator
```
*   API Port: `3001`
*   WebSocket Port: `3001`

### 3. Frontend Dashboard
Start the Next.js UI:
```bash
npm run dev
```
*   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

1.  **Open the Dashboard**: Go to `http://localhost:3000`.
2.  **Create a Charger**:
    *   Enter a **Charger ID** (e.g., `CP001`).
    *   Enter the **CSMS URL** (defaults to local mock `ws://localhost:9220`).
    *   Select the **Protocol Version** (OCPP 1.6 JSON or OCPP 2.0.1).
    *   Click **Create Charger**.
3.  **Interact**:
    *   Select the charger from the **Active Chargers** list.
    *   Use the **Actions** panel to send:
        *   `BootNotification`
        *   `Heartbeat`
        *   `Connect` / `Disconnect`
4.  **View Logs**:
    *   The **Live Logs** panel displays all traffic.
    *   `->` indicates outgoing messages (from Charger).
    *   `<-` indicates incoming messages (from CSMS).

## Project Structure

```
├── src
│   ├── app               # Next.js Frontend App Router
│   ├── backend           # Simulator Server & Mock CSMS
│   │   ├── server.ts     # Main backend entry point
│   │   └── SimulatorManager.ts # Logic to manage charger instances
│   ├── core              # Core logic agnostic of protocol version
│   │   ├── Charger.ts    # Main Charger class
│   │   └── IProtocolAdapter.ts # Interface for adapters
│   └── protocols         # Protocol-specific implementations
│       ├── ocpp16        # OCPP 1.6 JSON Adapter & Schemas
│       └── ocpp201       # OCPP 2.0.1 Adapter
```
