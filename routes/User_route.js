const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createUser, loginUser, getUserById } = require('../services/user_service'); // Importa funciones del servicio
const verifyJWT = require('../middle/verifyJWT'); // Middleware para validar JWT

const router = express.Router();

// Configuración de Multer para guardar temporalmente
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'temp/'); // Carpeta temporal para guardar imágenes
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName); // Nombre único para evitar conflictos en la carpeta temporal
    }
});

const upload = multer({ storage });

// Registro de usuario
router.post('/register', upload.single('image'), async (req, res) => {
    try {
        const { username, pwd, email, idNumber, role } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'La imagen de perfil es obligatoria.' });
        }

        const user = await createUser({
            username,
            pwd,
            email,
            idNumber,
            role,
            profileImage: '',
        });

        const userId = user.ID;
        const userFolder = path.join('Foto_ID', userId);

        // Crear la carpeta del usuario si no existe
        if (!fs.existsSync(userFolder)) {
            fs.mkdirSync(userFolder, { recursive: true });
        }

        // Asignar el ID del usuario como nombre de la imagen
        const newImagePath = path.join(userFolder, `${userId}${path.extname(req.file.originalname)}`);
        fs.renameSync(req.file.path, newImagePath);

        // Guardar la ruta de la imagen en la base de datos
        user.ProfileImage = newImagePath;
        await user.save();

        res.status(201).json(user);
    } catch (error) {
        console.error('Error en el registro:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path); // Eliminar archivo temporal si ocurre un error
        }
        res.status(400).json({ error: error.message });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const result = await loginUser(req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error en login:', error);
        res.status(401).json({ error: error.message });
    }
});

// Ruta para obtener la información del usuario autenticado
router.get('/info', verifyJWT, async (req, res) => {
    try {
        const userId = req.user.ID; // Obtenemos el ID del token JWT
        const user = await getUserById(userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json({
            ID:user.ID,
            Username: user.Username,
            Rol: user.Rol,
            ProfileImage: user.ProfileImage
                ? `Foto_ID/${user.ID}/${path.basename(user.ProfileImage)}` // Ruta relativa al cliente
                : null,
        });
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;

