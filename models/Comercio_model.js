const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../Config/pg_config');
const User = require('./user_model');

const InfoComercio = sequelize.define('InfoComercio', {
    ID: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    Usuario_ID: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'ID',
        },
    },
    Nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Foto_Comercio: {
        type: DataTypes.TEXT
    }, 
    Direccion: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Disponible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    timestamps: true,
});

// Sincronización del modelo
sequelize.sync({ alter: true })
    .then(() => console.log('Modelo InfoComercio sincronizado con la base de datos.'))
    .catch((err) => console.error('Error al sincronizar el modelo InfoComercio:', err));

module.exports = InfoComercio;
