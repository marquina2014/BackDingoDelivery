const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).json({ error: 'Token no proporcionado' });
    }

    // Extraer el token después de "Bearer" si está presente
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    // Verificar el token JWT
    jwt.verify(token, process.env.APIKEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }

        req.user = decoded; // Añadir los datos del token decodificado al objeto `req`
        next(); // Continuar con la solicitud
    });
};

module.exports = verifyJWT;

