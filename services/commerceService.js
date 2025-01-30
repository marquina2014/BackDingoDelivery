const InfoComercio = require('../models/Comercio_model');

// 📌 Función para guardar un nuevo comercio
exports.saveCommerce = async (data) => {
    try {
        const newCommerce = await InfoComercio.create(data);
        return newCommerce;
    } catch (error) {
        console.error('Error al guardar el comercio:', error);
        throw error;
    }
};

// 📌 Función para obtener todos los comercios afiliados a un usuario
exports.getCommercesByUser = async (Usuario_ID) => {
    try {
        const commerces = await InfoComercio.findAll({
            where: { Usuario_ID }
        });

        return commerces;
    } catch (error) {
        console.error('Error al obtener los comercios del usuario:', error);
        throw error;
    }
};
