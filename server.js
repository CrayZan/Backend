const express = require('express');
const cors = require('cors');
const mercadopago = require('mercadopago');
const app = express();

const port = process.env.PORT || 3000;

// Permisos para Vercel
app.use(cors());
app.use(express.json());

// CONFIGURACIÓN DE MERCADO PAGO
mercadopago.configure({
    access_token: 'APP_USR-7683539587848277-032818-f1291f6337d7c4a7d3cb109814661361-3297988475'
});

app.get('/', (req, res) => {
    res.send('Servidor del Hostal Operativo');
});

app.post('/create_preference', async (req, res) => {
    try {
        const { title, amount, name, email, phone } = req.body;
        let preference = {
            items: [{
                title: title || "Reserva Hostal",
                unit_price: Number(amount),
                quantity: 1,
                currency_id: 'ARS'
            }],
            payer: { name, email, phone: { number: phone } },
            back_urls: {
                "success": "https://fronted-kimi.vercel.app/",
                "failure": "https://fronted-kimi.vercel.app/",
                "pending": "https://fronted-kimi.vercel.app/"
            },
            auto_return: "approved",
        };

        const response = await mercadopago.preferences.create(preference);
        res.json({ init_point: response.body.init_point });
    } catch (error) {
        res.status(500).json({ error: 'Error en Mercado Pago' });
    }
});

app.listen(port, () => {
    console.log(`Servidor en puerto ${port}`);
});
