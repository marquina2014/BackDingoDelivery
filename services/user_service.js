const { Sequelize } = require('sequelize'); // Importar Sequelize
const sequelize = require('../config/pg_config'); // Tu configuración de Sequelize
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user_model');

// Crear usuario
async function createUser(userData) {
  try {
      const { username, pwd, email, profileImage, idNumber, role } = userData;

      if (!username || !pwd || !email || !idNumber || !role) {
          throw new Error('Todos los campos obligatorios deben estar presentes');
      }

      if (role !== 'comercio' && role !== 'conductor') {
          throw new Error('El rol debe ser "comercio" o "conductor"');
      }

      const existingUser = await User.findOne({
          where: {
              [Sequelize.Op.or]: [{ Username: username }, { Email: email }],
          },
      });

      if (existingUser) {
          throw new Error('El nombre de usuario o correo ya está registrado');
      }

      const hashedPassword = await bcrypt.hash(pwd, 10);

      const newUser = await User.create({
          Username: username,
          Pwd: hashedPassword,
          Email: email,
          ProfileImage: profileImage,
          Cedula: idNumber,
          Rol: role, // Usar el rol proporcionado
      });

      return newUser;
  } catch (error) {
      console.error('Error en createUser:', error);
      throw error;
  }
}

// Iniciar sesión
const loginUser = async ({ username, pwd }) => {
  try {
    console.log(`🔍 Buscando usuario: ${username}`);
    const user = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { Username: username },
          { Email: username }, // Buscar por correo o usuario
        ],
      },
    });

    if (!user) throw new Error('Usuario no encontrado');

    const isPasswordCorrect = await bcrypt.compare(pwd, user.Pwd);
    if (!isPasswordCorrect) throw new Error('Contraseña incorrecta');

    // Generar token JWT
    const token = jwt.sign(
      { ID: user.ID, Username: user.Username, Rol: user.Rol }, // Incluir el rol en el token
      process.env.APIKEY,
      { expiresIn: '1h' }
    );

    return { ok: true, token, role: user.Rol }; // Devolver el rol junto con el token
  } catch (error) {
    console.error('Error en loginUser:', error);
    throw error;
  }
};

// Obtener datos del usuario por ID
async function getUserById(userId) {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['ID', 'Username', 'Rol', 'ProfileImage'], // Solo los campos necesarios
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  } catch (error) {
    console.error('Error en getUserById:', error);
    throw error;
  }
}

module.exports = { createUser, loginUser, getUserById };

