const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/pg_config');
const InfoComercio = require('./Comercio_model');
const InfoRepartidor = require('./repartidor_model');

const Pedido = sequelize.define('Pedido', {
    ID: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    Descripcion: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Comercio_ID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: InfoComercio,
            key: 'ID',
        },
    },
    Repartidor_ID: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: InfoRepartidor,
            key: 'ID',
        },
    },
    Estatus: {
        type: DataTypes.ENUM('Buscando Repartidor', 'En Proceso', 'Cancelado','Completado'),
        defaultValue: 'Buscando Repartidor',
    },
    Desde: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Desde_Lat: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    Desde_Lon: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    Hasta: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Hasta_Lat: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    Hasta_Lon: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    Foto_Pedido: {
        type: DataTypes.TEXT,
    },
    Precio: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    Num_Pedido: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    timestamps: true,
});

// Sincronización del modelo
sequelize.sync({ alter: true })
    .then(() => console.log('Modelo Pedido sincronizado con la base de datos.'))
    .catch((err) => console.error('Error al sincronizar el modelo Pedido:', err));

module.exports = Pedido;
