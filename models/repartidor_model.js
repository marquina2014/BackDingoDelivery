const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/pg_config');
const User = require('./user_model');

const InfoRepartidor = sequelize.define('InfoRepartidor', {
    ID: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    Nombre_Completo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Usuario_ID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'ID',
        },
    },
    CI: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Foto: {
        type: DataTypes.TEXT,
    },
}, {
    timestamps: true,
});

// Sincronización del modelo
sequelize.sync({ alter: true })
    .then(() => console.log('Modelo InfoRepartidor sincronizado con la base de datos.'))
    .catch((err) => console.error('Error al sincronizar el modelo InfoRepartidor:', err));

module.exports = InfoRepartidor;
