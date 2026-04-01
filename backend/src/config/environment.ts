import dotenv from 'dotenv';

dotenv.config();

export const env = {
    port: process.env.PORT || '5000',
    mongoUri: process.env.MONGODB_URI || '',
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || '',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    nodeEnv: process.env.NODE_ENV || 'development',
};

export const validateEnv = () => {
    const required = [
        'MONGODB_URI',
        'JWT_SECRET',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
    ];

    for (const name of required) {
        if (!process.env[name]) {
            throw new Error(`Missing required environment variable: ${name}`);
        }
    }
};