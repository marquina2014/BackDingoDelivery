const express = require('express');
const router = express.Router();
const Pedido = require('../models/info_pedido');
const InfoComercio = require('../models/Comercio_model');  // Asegúrate de importar el modelo de Comercio
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { createPedido } = require('../services/pedidoService'); 
const { BelongsTo } = require('sequelize');


// Configuración de almacenamiento en carpeta temporal
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'temp/'); // Carpeta temporal para guardar imágenes
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName); // Nombre único para evitar conflictos
    }
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


// Ruta para crear un pedido con imagen
router.post('/create', upload.single('fotoPedido'), async (req, res) => {
    try {
        const pedidoData = req.body;

        // Validar que los datos esenciales estén presentes
        if (!pedidoData.description || !pedidoData.comercioId || !pedidoData.desde || !pedidoData.hasta) {
            return res.status(400).json({ error: 'Faltan datos esenciales para crear el pedido.' });
        }

        // Crear el pedido en la base de datos
        const nuevoPedido = await createPedido(pedidoData);
        const pedidoId = nuevoPedido.ID;
        

        // Verificar si se subió una imagen
        if (req.file) {
            const pedidoFolder = path.join('Pedido_ID',pedidoId);

            // Crear la carpeta del pedido si no existe
            if (!fs.existsSync(pedidoFolder)) {
                fs.mkdirSync(pedidoFolder, { recursive: true });
            }

            // Asignar el nombre de la imagen con el ID del comercio
            const newImagePath = path.join(pedidoFolder,`${pedidoId}${path.extname(req.file.originalname)}`);
            fs.renameSync(req.file.path, newImagePath); // Mover el archivo de temp a su carpeta final

            // Guardar la ruta de la imagen en la base de datos
            nuevoPedido.Foto_Pedido = newImagePath;
            await nuevoPedido.save();
        }

        res.status(201).json({
            message: 'Pedido creado exitosamente.',
            pedido: nuevoPedido,
        });
    } catch (error) {
        console.error('Error al crear el pedido:', error);

        // Si hay un error, eliminar la imagen temporal
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
});

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
                    association: new BelongsTo(Pedido, InfoComercio, 
                                                        {
                                                            foreignKey: "Comercio_ID",
                                                        }
                                                ),
                    attributes: ["Nombre"],
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

        // Modificar la ruta de la imagen para que sea relativa
        const pedidosConRutas = pedidosCercanos.map(pedido => ({
            ...pedido.toJSON(),
            Foto_Pedido: pedido.Foto_Pedido
                ? `Pedido_ID/${pedido.ID}/${path.basename(pedido.Foto_Pedido)}`
                : null, // Ruta alternativa para la imagen
        }));

        res.status(200).json(pedidosConRutas);
        console.log("📌 Pedidos enviados con rutas corregidas:", pedidosConRutas);
    } catch (error) {
        console.error('❌ Error al obtener los pedidos cercanos:', error);
        res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
});
// Ruta para aceptar un pedido y cambiar su estado a "En Proceso"
router.put('/accept/', async (req, res) => {
    const { repartidorId, id } = req.body; // Recibe el ID del repartidor y del pedido
        console.log(`ID del pedido: ${id}`);
        console.log(`ID del repartidor: ${repartidorId}`);

    try {
        // Buscar el pedido en la base de datos
        
        const pedido = await Pedido.findByPk(id);
        if (!pedido) {
            return res.status(404).json({ error: "Pedido no encontrado." });
        }

        // Verificar que el pedido está en estado "Buscando Repartidor"
        if (pedido.Estatus !== "Buscando Repartidor") {
            return res.status(400).json({ error: "Este pedido ya ha sido tomado por otro repartidor." });
        }

        // Actualizar el estado del pedido a "En Proceso" y asignar el repartidor
        await pedido.update({
            Estatus: "En Proceso",
            Repartidor_ID: repartidorId
        });

        res.status(200).json({ message: "Pedido aceptado con éxito.", pedido });
    } catch (error) {
        console.error("Error al aceptar el pedido:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
});
// 📌 Obtener pedidos de todos los comercios de un usuario
router.post("/mis-pedidos", async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "El ID del usuario es obligatorio." });
        }

        // 🔹 1. Buscar todos los comercios asociados al usuario
        const comercios = await InfoComercio.findAll({
            where: { Usuario_ID: userId }, // Encuentra todos los comercios donde el usuario es dueño
            attributes: ["ID"], // Solo nos interesa el ID del comercio
        });

        if (comercios.length === 0) {
            return res.status(200).json({ message: "El usuario no tiene comercios registrados." });
        }

        // 🔹 2. Obtener los `Comercio_ID` en un array
        const comercioIds = comercios.map((comercio) => comercio.ID);

        // 🔹 3. Buscar todos los pedidos asociados a estos comercios
        const pedidos = await Pedido.findAll({
            where: { Comercio_ID: comercioIds }, // Busca pedidos de esos comercios
            order: [["createdAt", "DESC"]], // Ordena por fecha de creación (los más recientes primero)
        });

        if (pedidos.length === 0) {
            return res.status(200).json({ message: "No hay pedidos registrados para los comercios del usuario." });
        }

        res.status(200).json(pedidos);
    } catch (error) {
        console.error("❌ Error al obtener los pedidos del comercio:", error);
        res.status(500).json({ error: "Error al obtener los pedidos" });
    }
});


module.exports = router;


