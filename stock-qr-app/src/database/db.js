// database/db.js
import Dexie from 'dexie';

// Define the database
export const db = new Dexie('StockQRDatabase');

db.version(1).stores({
    operations: '++id, rawQr, type, caja, producto, rastreabilidad, nroCaja, timestamp, isSynced',
    inventory: 'producto, total' // Vista consolidada rápida
});

// Helper functions para el manejo de inventario centralizado
export const stockService = {

    async addOperation(qrData, type) {
        return db.transaction('rw', db.operations, db.inventory, async () => {
            // 1. Guardar la operación en el registro (historial)
            await db.operations.add({
                rawQr: qrData.raw,
                type: type, // 'INGRESO' | 'EGRESO'
                caja: qrData.caja,
                producto: qrData.producto,
                rastreabilidad: qrData.rastreabilidad,
                nroCaja: qrData.nroCaja,
                cantidad: qrData.cantidad,
                timestamp: new Date().toISOString(),
                isSynced: 0
            });

            // 2. Actualizar el inventario consolidado
            const inventoryItem = await db.inventory.get(qrData.producto);
            let currentTotal = inventoryItem ? inventoryItem.total : 0;

            const multiplier = type === 'INGRESO' ? 1 : -1;
            const newTotal = currentTotal + (qrData.cantidad * multiplier);

            await db.inventory.put({
                producto: qrData.producto,
                total: newTotal
            });
        });
    },

    async addBatchOperations(startQrData, endQrData, type) {
        const startNro = Math.min(startQrData.nroCaja, endQrData.nroCaja);
        const endNro = Math.max(startQrData.nroCaja, endQrData.nroCaja);

        // Validar que caja, producto y rastreabilidad sean iguales
        if (startQrData.caja !== endQrData.caja || startQrData.producto !== endQrData.producto) {
            throw new Error("Los códigos de inicio y fin no pertenecen al mismo lote/producto.");
        }

        const operationsToAdd = [];
        let totalVolumen = 0;
        const multiplier = type === 'INGRESO' ? 1 : -1;
        const timestamp = new Date().toISOString();

        for (let i = startNro; i <= endNro; i++) {
            const generatedRaw = `${startQrData.caja}${startQrData.producto}${startQrData.rastreabilidad}${i.toString().padStart(4, '0')}${startQrData.cantidadOriginal}`;
            operationsToAdd.push({
                rawQr: generatedRaw,
                type: type,
                caja: startQrData.caja,
                producto: startQrData.producto,
                rastreabilidad: startQrData.rastreabilidad,
                nroCaja: i,
                cantidad: startQrData.cantidad,
                timestamp: timestamp,
                isSynced: 0
            });
            totalVolumen += startQrData.cantidad * multiplier;
        }

        return db.transaction('rw', db.operations, db.inventory, async () => {
            await db.operations.bulkAdd(operationsToAdd);

            const inventoryItem = await db.inventory.get(startQrData.producto);
            const currentTotal = inventoryItem ? inventoryItem.total : 0;
            await db.inventory.put({
                producto: startQrData.producto,
                total: currentTotal + totalVolumen
            });

            return operationsToAdd.length;
        });
    },

    async getRecentOperations(limit = 50) {
        return db.operations.orderBy('timestamp').reverse().limit(limit).toArray();
    },

    async getInventorySnapshot() {
        return db.inventory.toArray();
    },

    async getPendingSync() {
        return db.operations.where('isSynced').equals(0).toArray();
    },

    async markAsSynced(ids) {
        return db.operations.bulkUpdate(ids.map(id => ({ key: id, changes: { isSynced: 1 } })));
    }
};
