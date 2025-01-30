const express = require('express');
const router = express.Router();
const { createPedido } = require('../services/pedidoService');  // Asegúrate de que la lógica de crear pedido está en `pedidoService.js`

// Ruta para crear un pedido
router.post('/create', async (req, res) => {
    try {
        const pedidoData = req.body;

        // Validar que los datos esenciales estén presentes
        if (!pedidoData.description || !pedidoData.comercioId || !pedidoData.desde || !pedidoData.hasta) {
            return res.status(400).json({ error: 'Faltan datos esenciales para crear el pedido.' });
        }

        const nuevoPedido = await createPedido(pedidoData);

        res.status(201).json({
            message: 'Pedido creado exitosamente.',
            pedido: nuevoPedido
        });
    } catch (error) {
        console.error('Error al crear el pedido:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
});

module.exports = router;
