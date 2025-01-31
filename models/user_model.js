const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../Config/pg_config');

const User = sequelize.define('User', {
    ID: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    Username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    Pwd: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    Enable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    ProfileImage: {
        type: DataTypes.TEXT
    },
    Rol: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    Cedula: {
        type: DataTypes.STRING,
    },
}, {
    timestamps: true,
});

sequelize.sync({ alter: true })
    .then(() => console.log('Modelo User sincronizado con la base de datos.'))
    .catch((err) => console.error('Error al sincronizar el modelo:', err));

module.exports = User;

