import React, { useState, useEffect } from 'react';
import { stockService } from '../database/db';
import { MdCloudUpload, MdCheckCircle, MdError } from 'react-icons/md';

const SyncPage = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState(null); // { type: 'success' | 'error', message: string }

    // URL del Servidor en la Nube
    // En Render, crea un Web Service para el backend y pon la URL aquí o en el archivo .env como VITE_BACKEND_URL
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

    useEffect(() => {
        loadPending();
    }, []);

    const loadPending = async () => {
        try {
            const data = await stockService.getPendingSync();
            setPending(data);
        } catch (error) {
            console.error("Error loading pending sync:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        if (pending.length === 0) return;

        setSyncing(true);
        setSyncStatus(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pending),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Marcar localmente como sincronizados
                const ids = pending.map(op => op.id);
                await stockService.markAsSynced(ids);

                setSyncStatus({ type: 'success', message: `${result.count} registros sincronizados con éxito.` });
                await loadPending();
            } else {
                throw new Error('El servidor reportó un error.');
            }
        } catch (error) {
            console.error("Error sincronizando:", error);
            setSyncStatus({ type: 'error', message: 'No se pudo conectar con el servidor. Verifica que estés en la misma red y vuelve a intentar.' });
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="animate-in pb-20">
            <div style={{ marginBottom: '1.5rem' }}>
                <h2>Sincronización en la Nube</h2>
                <p style={{ color: 'var(--text-muted)' }}>Envía los datos locales al servidor en la nube de forma segura.</p>
            </div>

            <div className="card text-center" style={{ padding: '2rem' }}>
                <MdCloudUpload style={{ fontSize: '4rem', color: pending.length > 0 ? 'var(--primary)' : 'var(--border)', marginBottom: '1rem' }} />

                <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{pending.length}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    registros pendientes de enviar
                </p>

                <button
                    className={`btn btn-block ${pending.length > 0 ? 'btn-primary' : ''}`}
                    style={pending.length === 0 ? { backgroundColor: '#e9ecef', color: '#6c757d', cursor: 'not-allowed' } : {}}
                    onClick={handleSync}
                    disabled={pending.length === 0 || syncing}
                >
                    {syncing ? 'Enviando Datos...' : 'Sincronizar Ahora'}
                </button>
            </div>

            {syncStatus && (
                <div className="card animate-in" style={{
                    backgroundColor: syncStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: syncStatus.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${syncStatus.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    {syncStatus.type === 'success' ? <MdCheckCircle size={24} /> : <MdError size={24} />}
                    <span style={{ fontWeight: 500 }}>{syncStatus.message}</span>
                </div>
            )}

            <div className="card" style={{ marginTop: '2rem' }}>
                <h4>Administración</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Puedes descargar la base completa centralizada desde cualquier computadora accediendo a este enlace:
                </p>
                <a
                    href={`${BACKEND_URL}/api/export`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-block"
                    style={{ backgroundColor: '#28a745', color: 'white', textDecoration: 'none', textAlign: 'center' }}
                >
                    Descargar Excel (CSV) desde el Servidor
                </a>
            </div>
        </div>
    );
};

export default SyncPage;
