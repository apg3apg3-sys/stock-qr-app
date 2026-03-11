import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { MdOutlineQrCodeScanner, MdOutlineInventory2, MdHistory, MdSync } from 'react-icons/md';

const Layout = () => {
    const location = useLocation();

    return (
        <>
            <header className="app-header">
                <h1>StockQR</h1>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>v1.0</div>
            </header>

            <main className="container">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <Link
                    to="/"
                    className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
                >
                    <MdOutlineQrCodeScanner />
                    <span>Escanear</span>
                </Link>
                <Link
                    to="/inventory"
                    className={`nav-item ${location.pathname === '/inventory' ? 'active' : ''}`}
                >
                    <MdOutlineInventory2 />
                    <span>Inventario</span>
                </Link>
                <Link
                    to="/history"
                    className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}
                >
                    <MdHistory />
                    <span>Historial</span>
                </Link>
                <Link
                    to="/sync"
                    className={`nav-item ${location.pathname === '/sync' ? 'active' : ''}`}
                >
                    <MdSync />
                    <span>Sincronizar</span>
                </Link>
            </nav>
        </>
    );
};

export default Layout;
