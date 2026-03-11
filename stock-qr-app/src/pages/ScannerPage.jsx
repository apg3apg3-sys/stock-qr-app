import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { parseQrCode } from '../utils/qrParser';
import { stockService } from '../database/db';

const ScannerPage = () => {
    const [mode, setMode] = useState('INGRESO'); // INGRESO | EGRESO
    const [scanType, setScanType] = useState('INDIVIDUAL'); // INDIVIDUAL | LOTE
    const [scanStatus, setScanStatus] = useState('READY'); // READY | SUCCESS | ERROR
    const [lastScanned, setLastScanned] = useState(null);

    // Para lote
    const [batchStart, setBatchStart] = useState(null);

    const scannerRef = useRef(null);

    useEffect(() => {
        let html5QrCode;

        const startScanner = async () => {
            try {
                html5QrCode = new Html5Qrcode("reader");
                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                    },
                    onScanSuccess,
                    (errorMessage) => {
                        // Ignorar errores de "no encontrado" constantes
                    }
                );
            } catch (err) {
                console.error("Error iniciando cámara", err);
            }
        };

        startScanner();

        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch(console.error);
            }
        };
    }, [mode, scanType, batchStart]); // Reiniciar si cambian dependencias críticas

    const showFeedback = (status, code) => {
        setScanStatus(status);
        setLastScanned(code);

        // Vibración si el teléfono lo soporta
        if (navigator.vibrate) {
            navigator.vibrate(status === 'SUCCESS' ? 100 : [100, 50, 100]);
        }

        setTimeout(() => setScanStatus('READY'), 2000);
    };

    const handleIndividualScan = async (parsed) => {
        try {
            await stockService.addOperation(parsed, mode);
            showFeedback('SUCCESS', parsed.raw);
        } catch (err) {
            console.error(err);
            showFeedback('ERROR', parsed.raw);
        }
    };

    const handleBatchScan = async (parsed) => {
        // Si no hay comienzo, este código es el inicio
        if (!batchStart) {
            setBatchStart(parsed);
            showFeedback('SUCCESS', `INICIO: ${parsed.raw}`);
            return;
        }

        // Si ya hay inicio, este es el final
        try {
            const count = await stockService.addBatchOperations(batchStart, parsed, mode);
            showFeedback('SUCCESS', `LOTE REGISTRADO: ${count} cajas`);
            setBatchStart(null); // Reset
        } catch (err) {
            console.error(err);
            showFeedback('ERROR', err.message);
            setBatchStart(null); // Reset en error para no quedar bloqueado
        }
    };

    const onScanSuccess = (decodedText, decodedResult) => {
        // Evitar múltiples escaneos si ya estamos mostrando success (debounce preventivo)
        if (scanStatus !== 'READY') return;

        const parsed = parseQrCode(decodedText);

        if (!parsed) {
            showFeedback('ERROR', "QR Inválido (No tiene 31 dígitos)");
            return;
        }

        if (scanType === 'INDIVIDUAL') {
            handleIndividualScan(parsed);
        } else {
            handleBatchScan(parsed);
        }
    };

    const toggleMode = (newMode) => {
        setMode(newMode);
        setBatchStart(null);
    };

    return (
        <div className="scanner-container animate-in">
            <div className="card mode-selectors">
                <div className="btn-group" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <button
                        className={`btn ${mode === 'INGRESO' ? 'btn-success' : ''}`}
                        style={mode !== 'INGRESO' ? { backgroundColor: '#e9ecef', color: '#495057' } : {}}
                        onClick={() => toggleMode('INGRESO')}
                    >
                        Cargar INGRESO
                    </button>
                    <button
                        className={`btn ${mode === 'EGRESO' ? 'btn-danger' : ''}`}
                        style={mode !== 'EGRESO' ? { backgroundColor: '#e9ecef', color: '#495057' } : {}}
                        onClick={() => toggleMode('EGRESO')}
                    >
                        Cargar EGRESO
                    </button>
                </div>

                <div className="type-selectors" style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className={`btn btn-block ${scanType === 'INDIVIDUAL' ? 'btn-primary' : ''}`}
                        style={scanType !== 'INDIVIDUAL' ? { backgroundColor: '#e9ecef', color: '#495057' } : {}}
                        onClick={() => { setScanType('INDIVIDUAL'); setBatchStart(null); }}
                    >
                        1 a 1 (Rápido)
                    </button>
                    <button
                        className={`btn btn-block ${scanType === 'LOTE' ? 'btn-primary' : ''}`}
                        style={scanType !== 'LOTE' ? { backgroundColor: '#e9ecef', color: '#495057' } : {}}
                        onClick={() => setScanType('LOTE')}
                    >
                        Por Lote (Rango)
                    </button>
                </div>
            </div>

            <div className="card camera-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div id="reader" style={{ width: '100%', border: 'none' }}></div>

                {/* Feedback Overlay Overlay */}
                {scanStatus !== 'READY' && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: scanStatus === 'SUCCESS' ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', zIndex: 10, padding: '20px', textAlign: 'center'
                    }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>
                            {scanStatus === 'SUCCESS' ? '¡ÉXITO!' : '¡ERROR!'}
                        </h2>
                        <p style={{ wordBreak: 'break-all' }}>{lastScanned}</p>
                    </div>
                )}
            </div>

            {scanType === 'LOTE' && batchStart && (
                <div className="card" style={{ backgroundColor: '#fff3cd', borderLeft: '5px solid #ffc107' }}>
                    <h4>Escaneando Lote...</h4>
                    <p>Inicio registrado: Caja #{batchStart.nroCajaOriginal}</p>
                    <strong>Por favor, escanea ahora la última caja del rango.</strong>
                </div>
            )}
        </div>
    );
};

export default ScannerPage;
