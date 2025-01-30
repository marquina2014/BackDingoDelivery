const Pedido = require('../models/info_pedido');  // Modelo de Pedido
const Comercio = require('../models/Comercio_model');  // Modelo de Comercio (relacionado con el pedido)
const Repartidor = require('../models/repartidor_model');  // Modelo de Repartidor (opcional, si el pedido se asigna a un repartidor)

async function createPedido(pedidoData) {
    try {
        const {
            description,
            comercioId,
            repartidorId,
            desde,
            desdeLat,
            desdeLon,
            hasta,
            hastaLat,
            hastaLon,
            fotoPedido,
            precio
        } = pedidoData;

        // Verificar si el comercio existe
        const comercio = await Comercio.findByPk(comercioId);
        if (!comercio) {
            throw new Error('El comercio seleccionado no existe');
        }

        // Actualizar el estado del comercio a no disponible
        await Comercio.update(
            { Disponible: false },  // Cambiar la disponibilidad del comercio
            { where: { ID: comercioId } }  // Especificar el comercio a actualizar
        );

        // Crear el pedido en la base de datos
        const nuevoPedido = await Pedido.create({
            Descripcion: description,
            Comercio_ID: comercioId,
            Repartidor_ID: repartidorId || null,  // Si no hay repartidor, dejar null
            Estatus: 'Buscando Repartidor',  // Estado inicial del pedido
            Desde: desde,
            Desde_Lat: desdeLat,
            Desde_Lon: desdeLon,
            Hasta: hasta,
            Hasta_Lat: hastaLat,
            Hasta_Lon: hastaLon,
            Foto_Pedido: fotoPedido || null,  // Si no se proporciona foto, dejar null
            Precio: precio
        });

        return nuevoPedido;  // Devolver el pedido creado
    } catch (error) {
        console.error('Error al crear el pedido:', error);
        throw new Error('No se pudo crear el pedido. Inténtelo nuevamente.');
    }
}

module.exports = {
    createPedido
};

