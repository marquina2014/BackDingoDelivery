const Pedido = require('../models/info_pedido');  // Modelo de Pedido
const Comercio = require('../models/Comercio_model');  // Modelo de Comercio (relacionado con el pedido)
const Repartidor = require('../models/repartidor_model');  // Modelo de Repartidor (opcional, si el pedido se asigna a un repartidor)

// Función para calcular la distancia entre dos puntos geográficos (Haversine)
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

// Función para obtener los pedidos cercanos
async function getPedidosCercanos(lat, lon) {
  try {
    // Obtener todos los pedidos que están "Buscando Repartidor"
    const pedidos = await Pedido.findAll({
      where: {
        Estatus: 'Buscando Repartidor',
      },
    });

    const pedidosCercanos = pedidos.filter((pedido) => {
      const distance = getDistance(lat, lon, pedido.Desde_Lat, pedido.Desde_Lon);
      console.log(`Distancia al pedido ${pedido.ID}: ${distance} km`);
      return distance <= 5; // Solo los pedidos dentro de los 5 km
    });

    return pedidosCercanos;
  } catch (error) {
    console.error("Error al obtener pedidos cercanos:", error);
    throw new Error("Error al obtener los pedidos cercanos.");
  }
}

// Función para crear un nuevo pedido
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
  createPedido,
  getPedidosCercanos
};
