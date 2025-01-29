const InfoComercio = require('../models/Comercio_model');

exports.saveCommerce = async (data) => {
    try {
        const newCommerce = await InfoComercio.create(data);
        return newCommerce;
    } catch (error) {
        console.error('Error al guardar el comercio:', error);
        throw error;
    }
};