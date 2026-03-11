import React, { useState, useEffect } from 'react';
import { stockService } from '../database/db';

const InventoryPage = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        try {
            const data = await stockService.getInventorySnapshot();
            setInventory(data);
        } catch (error) {
            console.error("Error loading inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in pb-20">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Resumen de Stock</h2>
                <button className="btn btn-primary" onClick={loadInventory} style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
                    Actualizar
                </button>
            </div>

            {loading ? (
                <p>Cargando inventario consolidado...</p>
            ) : inventory.length === 0 ? (
                <div className="card text-center" style={{ padding: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No hay productos en stock.</p>
                </div>
            ) : (
                <div className="inventory-list">
                    {inventory.map((item) => (
                        <div key={item.producto} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div>
                                <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>PRODUCTO</h4>
                                <strong style={{ fontSize: '1.2rem' }}>{item.producto}</strong>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <h4 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>STOCK TOTAL</h4>
                                <span className={`badge ${item.total > 0 ? 'text-success' : item.total < 0 ? 'text-danger' : ''}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {item.total}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
