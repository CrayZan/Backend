const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');
const app = express();

// Configuración de puertos para Render
const port = process.env.PORT || 3000;

// Permisos para que Vercel pueda comunicarse con este servidor
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE MERCADO PAGO
// El Token lo reemplazaremos manualmente en el siguiente paso
mercadopago.configure({
    access_token: 'APP_USR-7683539587848277-032818-f1291f6337d7c4a7d3cb109814661361-3297988475' 
});

// RUTA PRINCIPAL: Para verificar que el servidor está despierto
app.get('/', (req, res) => {
    res.send('El servidor del Hostal está funcionando correctamente en Render');
});

// RUTA DE RESERVAS: Crea la preferencia de pago del 30%
app.post('/create_preference', async (req, res) => {
    try {
        const { title, amount, name, email, phone } = req.body;

        let preference = {
            items: [
                {
                    title: title || "Reserva Hostal del Milagro",
                    unit_price: Number(amount),
                    quantity: 1,
                    currency_id: 'ARS'
                }
            ],
            payer: {
                name: name,
                email: email,
                phone: {
                    number: phone
                }
            },
            back_urls: {
                "success": "https://fronted-kimi.vercel.app/",
                "failure": "https://fronted-kimi.vercel.app/",
                "pending": "https://fronted-kimi.vercel.app/"
            },
            auto_return: "approved",
            // Evita que se creen múltiples cobros por la misma intención
            external_reference: `reserva-${Date.now()}`
        };

        const response = await mercadopago.preferences.create(preference);
        
        // Enviamos el link de pago al Frontend
        res.json({ 
            id: response.body.id,
            init_point
