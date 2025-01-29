const allowedOrigins = require('./AllowedOrigins');

const corsOptions = {
    origin: (origin, callback) => {
        console.log(origin)
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
}

module.exports = corsOptions;