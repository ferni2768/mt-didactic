import CryptoJS from 'crypto-js';

require('dotenv').config();
const { KEY } = require('../config');

const SECRET_KEY = KEY;

export const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

export const decryptData = (ciphertext) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

export const saveToSessionStorage = (key, data) => {
    const encryptedData = encryptData(data);
    sessionStorage.setItem(key, encryptedData);
};

export const getFromSessionStorage = (key) => {
    const encryptedData = sessionStorage.getItem(key);
    if (!encryptedData) return null;
    return decryptData(encryptedData);
};
