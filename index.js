const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');  // Importar path para manejar rutas de archivos

require('dotenv').config();  // Configuración de entorno
require('./models/user_model');
require('./models/Comercio_model');
require('./models/repartidor_model');
require('./models/info_pedido');  // Asegúrate de importar el modelo de Pedido

const app = express();

// Configurar CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Middleware para servir las carpetas de fotos
app.use('/Foto_ID', express.static(path.join(__dirname, 'Foto_ID')));
app.use('/Foto_Comercios', express.static(path.join(__dirname, 'Foto_Comercios')));

// Rutas
app.use('/user', require('./routes/User_route.js'));
app.use('/commerce', require('./routes/commerceRoutes.js'));
app.use('/pedido', require('./routes/Pedido_Route.js'));  // Ruta de pedidos

// Ruta base
app.get('/', (req, res) => res.json({ message: 'Servidor funcionando correctamente' }));

// Manejar rutas no encontradas
app.all('*', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Iniciar servidor
const PORT = process.env.SERVER_PORT || 8082;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));

