import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScannerPage from './pages/ScannerPage';
import InventoryPage from './pages/InventoryPage';
import HistoryPage from './pages/HistoryPage';
import SyncPage from './pages/SyncPage';

// Placeholder components


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ScannerPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="sync" element={<SyncPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
