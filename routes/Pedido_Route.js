const express = require('express');
const router = express.Router();
const Pedido = require('../models/info_pedido');
const InfoComercio = require('../models/Comercio_model');  // Asegúrate de importar el modelo de Comercio
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createPedido } = require('../services/pedidoService'); 

// Configuración de Multer para manejar la carga de imágenes de los pedidos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const pedidoId = req.body.pedidoId; // El ID del pedido del cuerpo de la solicitud
        const comercioId = req.body.comercioId; // El ID del comercio del cuerpo de la solicitud

        if (!pedidoId || !comercioId) {
            return cb(new Error('Pedido_ID y Comercio_ID son requeridos.'), null);
        }

        // Creamos la ruta para guardar las fotos
        const baseDir = path.join(__dirname, '..', 'Pedidos_ID', pedidoId, comercioId);

        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });  // Crear la carpeta si no existe
        }

        cb(null, baseDir); // Ruta donde se almacenará la foto
    },
    filename: (req, file, cb) => {
        const comercioId = req.body.comercioId;  // Usamos el ID del comercio como nombre del archivo
        cb(null, `${comercioId}.jpg`); // El nombre del archivo será el ID del comercio seguido de ".jpg"
    },
});

const upload = multer({ storage });

// Función para calcular la distancia entre dos puntos (Haversine)
const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en km
};

// Ruta para crear un pedido (con imagen)
router.post('/create', upload.single('fotoPedido'), async (req, res) => {
    try {
        const pedidoData = req.body;

        // Validar que los datos esenciales estén presentes
        if (!pedidoData.description || !pedidoData.comercioId || !pedidoData.desde || !pedidoData.hasta) {
            return res.status(400).json({ error: 'Faltan datos esenciales para crear el pedido.' });
        }

        // Si hay foto, agregar la ruta donde se guarda
        if (req.file) {
            pedidoData.fotoPedido = `/Pedidos_ID/${pedidoData.pedidoId}/${pedidoData.comercioId}/${req.file.filename}`;
        }

        // Llamar a la función createPedido para guardar el pedido
        const nuevoPedido = await createPedido(pedidoData);

        res.status(201).json({
            message: 'Pedido creado exitosamente.',
            pedido: nuevoPedido,
        });
    } catch (error) {
        console.error('Error al crear el pedido:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
});

// Ruta POST para obtener pedidos cercanos a 5 km
router.post('/nearby', async (req, res) => {
    const { lat, lon } = req.body;

    if (!lat || !lon) {
        return res.status(400).json({ error: 'Faltan las coordenadas del conductor.' });
    }

    try {
        // Obtener todos los pedidos con estatus 'Buscando Repartidor' y los datos del comercio
        const pedidos = await Pedido.findAll({
            where: {
                Estatus: 'Buscando Repartidor',
            },
            include: [
                {
                    model: InfoComercio,
                    attributes: ['Nombre'],
                },
            ],
        });

        // Filtrar los pedidos que están dentro de un radio de 5 km
        const pedidosCercanos = pedidos.filter((pedido) => {
            const distance = getDistance(
                lat,
                lon,
                pedido.Desde_Lat,
                pedido.Desde_Lon
            );
            return distance <= 5;
        });

        res.status(200).json(pedidosCercanos);
    } catch (error) {
        console.error('Error al obtener los pedidos cercanos:', error);
        res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
});

module.exports = router;


