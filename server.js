const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
// Render asigna el puerto automáticamente
const PORT = process.env.PORT || 10000;

// Configuración básica de Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-TOKEN-PROVISIONAL' 
});

app.use(cors());
app.use(express.json());

// Conexión a Base de Datos (Se crea sola en Render)
const db = new sqlite3.Database('./reservas.db', (err) => {
    if (err) console.error('Error al abrir DB:', err);
    else {
        console.log('✅ Base de datos SQLite lista');
        crearTablas();
    }
});

function crearTablas() {
    db.serialize(() => {
        // Tabla de Reservas
        db.run(`CREATE TABLE IF NOT EXISTS reservas (
            id TEXT PRIMARY KEY,
            nombre TEXT,
            email TEXT,
            telefono TEXT,
            fecha_entrada TEXT,
            fecha_salida TEXT,
            tipo_habitacion TEXT,
            precio_total REAL,
            estado TEXT DEFAULT 'pendiente'
        )`);

        // Tabla de Usuarios para el Panel Admin
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            password TEXT,
            rol TEXT DEFAULT 'admin'
        )`);

        // Crear usuario administrador por defecto (Usuario: admin / Clave: admin123)
        const claveHash = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT OR IGNORE INTO usuarios (id, username, password) VALUES (?, ?, ?)`, 
            [uuidv4(), 'admin', claveHash]);
    });
}

// Ruta simple para verificar que el hostal está en línea
app.get('/', (req, res) => {
    res.send('🏨 El servidor del Hostal está funcionando correctamente en Render');
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});