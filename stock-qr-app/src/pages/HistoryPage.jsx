import React, { useState, useEffect } from 'react';
import { stockService } from '../database/db';

const HistoryPage = () => {
    const [operations, setOperations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await stockService.getRecentOperations(100); // Trae últimas 100
            setOperations(data);
        } catch (error) {
            console.error("Error loading history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <div className="animate-in pb-20">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Historial de Movimientos</h2>
                <button className="btn btn-primary" onClick={loadHistory} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                    Actualizar
                </button>
            </div>

            {loading ? (
                <p>Cargando últimos movimientos...</p>
            ) : operations.length === 0 ? (
                <div className="card text-center" style={{ padding: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No hay operaciones registradas aún.</p>
                </div>
            ) : (
                <div className="history-list">
                    {operations.map((op) => (
                        <div key={op.id} className="card" style={{
                            borderLeft: `5px solid ${op.type === 'INGRESO' ? 'var(--success)' : 'var(--danger)'}`,
                            padding: '0.75rem 1rem',
                            marginBottom: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{
                                    fontWeight: 'bold',
                                    color: op.type === 'INGRESO' ? 'var(--success)' : 'var(--danger)',
                                    fontSize: '0.85rem'
                                }}>
                                    {op.type}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {formatDate(op.timestamp)}
                                </span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem' }}>Prod: <strong>{op.producto}</strong></div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Caja: {op.nroCaja} | Lote: {op.caja}</div>
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {op.type === 'INGRESO' ? '+' : '-'}{op.cantidad}
                                </div>
                            </div>

                            {!op.isSynced && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '5px', textAlign: 'right' }}>
                                    Pendiente Sincronizar
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
