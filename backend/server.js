const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { parse } = require('json2csv');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configurar SQLite Database
const dbPath = path.resolve(__dirname, 'stock.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error opening database", err.message);
    } else {
        console.log("Connected to the SQLite database.");
        db.run(`CREATE TABLE IF NOT EXISTS operations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rawQr TEXT,
            type TEXT,
            caja TEXT,
            producto TEXT,
            rastreabilidad TEXT,
            nroCaja INTEGER,
            cantidad INTEGER,
            timestamp TEXT,
            syncedAt TEXT
        )`);
    }
});

// Endpoint: Recibir lotes de sincronización desde la app
app.post('/api/sync', (req, res) => {
    const operations = req.body;

    if (!Array.isArray(operations) || operations.length === 0) {
        return res.status(400).json({ error: 'No data provided' });
    }

    const stmt = db.prepare(`INSERT INTO operations (rawQr, type, caja, producto, rastreabilidad, nroCaja, cantidad, timestamp, syncedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const now = new Date().toISOString();
    let insertedCount = 0;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        operations.forEach(op => {
            stmt.run([
                op.rawQr, op.type, op.caja, op.producto, op.rastreabilidad, op.nroCaja, op.cantidad, op.timestamp, now
            ]);
            insertedCount++;
        });
        db.run("COMMIT", (err) => {
            if (err) {
                console.error("Error committing transaction", err);
                res.status(500).json({ error: 'Failed to sync data' });
            } else {
                res.json({ success: true, count: insertedCount });
            }
        });
    });
    stmt.finalize();
});

// Endpoint: Exportar datos a CSV
app.get('/api/export', (req, res) => {
    db.all("SELECT rawQr, type, caja, producto, rastreabilidad, nroCaja, cantidad, timestamp FROM operations ORDER BY timestamp DESC", [], (err, rows) => {
        if (err) {
            console.error("Error fetching data", err);
            return res.status(500).json({ error: 'Failed to fetch data' });
        }

        if (rows.length === 0) {
            return res.status(404).send('No data to export');
        }

        try {
            const csv = parse(rows);
            res.header('Content-Type', 'text/csv');
            res.attachment(`stock_export_${new Date().getTime()}.csv`);
            return res.send(csv);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to parse CSV' });
        }
    });
});

// Servir archivos estáticos del frontend construido (Para producción/Render)
const distPath = path.join(__dirname, '../stock-qr-app/dist');
app.use(express.static(distPath));

// Cualquier otra ruta que no sea /api, que sirva el index.html de React (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
