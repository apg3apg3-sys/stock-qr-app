// utils/qrParser.js

/**
 * Parsea el código QR de 31 dígitos según la estructura:
 * - Caja (12 dígitos): 0 al 11
 * - Producto (5 dígitos): 12 al 16
 * - Rastreabilidad (6 dígitos): 17 al 22
 * - Nro Caja (4 dígitos): 23 al 26
 * - Cantidad (4 dígitos): 27 al 30
 * 
 * @param {string} qrCode 
 * @returns {Object|null} Objeto parseado o null si es inválido
 */
export const parseQrCode = (qrCode) => {
    if (!qrCode || qrCode.length !== 31) {
        return null;
    }

    try {
        const caja = qrCode.substring(0, 12);
        const producto = qrCode.substring(12, 17);
        const rastreabilidad = qrCode.substring(17, 23);
        const nroCajaStr = qrCode.substring(23, 27);
        const cantidadStr = qrCode.substring(27, 31);

        const nroCaja = parseInt(nroCajaStr, 10);
        const cantidad = parseInt(cantidadStr, 10);

        return {
            raw: qrCode,
            caja,
            producto,
            rastreabilidad,
            nroCaja,
            cantidad,
            nroCajaOriginal: nroCajaStr, // Guarda el formato con ceros por si es necesario reconstruir
            cantidadOriginal: cantidadStr
        };
    } catch (error) {
        console.error("Error parseando QR:", error);
        return null;
    }
};

/**
 * Reconstruye un código QR base mutando el número de caja.
 * Utilizado para la generación de ingresos por lote.
 */
export const generateQrByBoxNumber = (baseParsedQr, targetBoxNumber) => {
    const boxPadded = targetBoxNumber.toString().padStart(4, '0');
    return `${baseParsedQr.caja}${baseParsedQr.producto}${baseParsedQr.rastreabilidad}${boxPadded}${baseParsedQr.cantidadOriginal}`;
};
