const IP = `https://${process.env.REACT_APP_IP}`;
const BASE_PORT = process.env.REACT_APP_BASE_PORT;
const WEB_PORT = process.env.REACT_APP_WEB_PORT;
const EXTERNAL_API_PORT = process.env.REACT_APP_EXTERNAL_API_PORT;

const SERVER_URL = `${IP}`;
const WEB_URL = `${IP}:${WEB_PORT}`;
const API_URL = `http://127.0.0.1:${EXTERNAL_API_PORT}`;

// Database config
const DB_HOST = '172.19.197.237';
const DB_USER = process.env.DB_USER || 'pupis';
const DB_PASSWORD = process.env.DB_PASSWORD || 'pupis';
const DB_NAME = process.env.DB_NAME || 'tfg_db';

module.exports = {
    SERVER_URL,
    BASE_PORT,
    WEB_URL,
    API_URL,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
};