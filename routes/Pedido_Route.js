const express = require('express');
const router = express.Router();
const Pedido = require('../models/info_pedido');
const { verifyJWT } = require('../middlewares/auth');

// Ruta para obtener pedidos pendientes
router.get('/pending', verifyJWT, async (req, res) => {
    try {
        const pedidos = await Pedido.findAll({
            where: { Estatus: 'Buscando Repartidor' },
            attributes: ['ID', 'Descripcion', 'Desde_Lat', 'Desde_Lon', 'Hasta_Lat', 'Hasta_Lon', 'Desde', 'Hasta']
        });

        res.status(200).json(pedidos);
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
});

// Ruta para crear un nuevo pedido
router.post('/create', verifyJWT, async (req, res) => {
    try {
        const {
            Descripcion,
            Comercio_ID,
            Desde,
            Desde_Lat,
            Desde_Lon,
            Hasta,
            Hasta_Lat,
            Hasta_Lon,
            Foto_Pedido
        } = req.body;

        const nuevoPedido = await Pedido.create({
            Descripcion,
            Comercio_ID,
            Desde,
            Desde_Lat,
            Desde_Lon,
            Hasta,
            Hasta_Lat,
            Hasta_Lon,
            Foto_Pedido
        });

        res.status(201).json({ message: 'Pedido creado exitosamente', pedido: nuevoPedido });
    } catch (error) {
        console.error('Error al crear pedido:', error);
        res.status(500).json({ error: 'Error al crear el pedido' });
    }
});

module.exports = router;
