const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { saveCommerce, getCommercesByUser } = require('../services/commerceService');

// Configuración dinámica de Multer para almacenar imágenes de comercios
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { Usuario_ID } = req.body;

        if (!Usuario_ID) {
            return cb(new Error('Usuario_ID es requerido.'), null);
        }

        const baseDir = path.join(__dirname, '..', 'Foto_Comercios', Usuario_ID);

        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }

        cb(null, baseDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ storage });

//  **Ruta para crear un nuevo comercio**
router.post('/create', upload.single('Foto_Comercio'), async (req, res) => {
    try {
        const { Nombre, Direccion, Usuario_ID } = req.body;

        if (!Nombre || !Direccion || !Usuario_ID) {
            return res.status(400).json({ error: 'Todos los campos (Nombre, Direccion, Usuario_ID) son obligatorios.' });
        }

        const newCommerce = await saveCommerce({
            Nombre,
            Direccion,
            Usuario_ID,
        });

        if (req.file) {
            const comercioDir = path.join(__dirname, '..', 'Foto_Comercios', Usuario_ID,newCommerce.ID);

            if (!fs.existsSync(comercioDir)) {
                fs.mkdirSync(comercioDir, { recursive: true });
            }

            const oldPath = req.file.path;
            const newPath = path.join(comercioDir, `${newCommerce.ID}.jpg`);
            fs.renameSync(oldPath, newPath);

            newCommerce.Foto_Comercio = `/Foto_Comercios/${Usuario_ID}/${newCommerce.ID}/${newCommerce.ID}.jpg`;
            await newCommerce.save();
        }

        res.status(201).json({ message: 'Comercio creado exitosamente.', commerce: newCommerce });
    } catch (error) {
        console.error('Error al crear el comercio:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

//  **Nueva Ruta para obtener comercios afiliados a un usuario**
router.get('/get/:Usuario_ID', async (req, res) => {
    try {
        console.log('Parámetros recibidos:', req.params); // Verifica qué llega aquí

        const Usuario_ID = req.params.Usuario_ID; // Extraer el parámetro

        if (!Usuario_ID) {
            return res.status(400).json({ error: 'Usuario_ID es requerido.' });
        }

        const commerces = await getCommercesByUser(Usuario_ID);

        if (!commerces || commerces.length === 0) {
            return res.status(404).json({ message: 'No hay comercios afiliados para este usuario.' });
        }

        res.status(200).json(commerces);
    } catch (error) {
        console.error('Error al obtener los comercios:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;