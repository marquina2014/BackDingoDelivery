const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { saveCommerce } = require('../services/commerceService');

// Configuración dinámica de Multer para crear carpetas por ID_Usuario e ID_Comercio
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { Usuario_ID } = req.body;

        if (!Usuario_ID) {
            return cb(new Error('Usuario_ID es requerido.'), null);
        }

        // Ruta base para almacenar fotos
        const baseDir = path.join(__dirname, '..', 'Foto_Comercios', Usuario_ID);

        // Crear la carpeta del usuario si no existe
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }

        cb(null, baseDir); // Carpeta temporal hasta crear el comercio
    },
    filename: (req, file, cb) => {
        // Nombre temporal para guardar el archivo antes de renombrarlo
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ storage });

router.post('/create', upload.single('Foto_Comercio'), async (req, res) => {
    try {
        const { Nombre, Direccion, Usuario_ID } = req.body;

        // Validación de campos requeridos
        if (!Nombre || !Direccion || !Usuario_ID) {
            return res.status(400).json({ error: 'Todos los campos (Nombre, Direccion, Usuario_ID) son obligatorios.' });
        }

        // Guardar el comercio en la base de datos
        const newCommerce = await saveCommerce({
            Nombre,
            Direccion,
            Usuario_ID,
        });

        // Mover la foto a la carpeta del comercio y renombrarla
        if (req.file) {
            const comercioDir = path.join(__dirname, '..', 'Foto_Comercios', Usuario_ID, newCommerce.ID);

            // Crear la carpeta del comercio si no existe
            if (!fs.existsSync(comercioDir)) {
                fs.mkdirSync(comercioDir, { recursive: true });
            }

            // Renombrar el archivo al ID del comercio
            const oldPath = req.file.path;
            const newPath = path.join(comercioDir, `${newCommerce.ID}.jpg`);
            fs.renameSync(oldPath, newPath);

            // Actualizar el registro del comercio con la ruta de la foto
            newCommerce.Foto_Comercio = `/Foto_Comercios/${Usuario_ID}/${newCommerce.ID}.jpg`;
            await newCommerce.save();
        }

        res.status(201).json({ message: 'Comercio creado exitosamente.', commerce: newCommerce });
    } catch (error) {
        console.error('Error al crear el comercio:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;
