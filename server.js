const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// CONFIGURACIÓN NUEVA DE MERCADO PAGO
const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-7683539587848277-032818-f1291f6337d7c4a7d3cb109814661361-3297988475' 
});

app.get('/', (req, res) => {
    res.send('Servidor del Hostal Operativo con versión nueva');
});

app.post('/create_preference', async (req, res) => {
    try {
        const preference = new Preference(client);
        const { title, amount } = req.body;

        const result = await preference.create({
            body: {
                items: [
                    {
                        title: title || "Reserva Hostal",
                        unit_price: Number(amount),
                        quantity: 1,
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: "https://fronted-kimi.vercel.app/",
                    failure: "https://fronted-kimi.vercel.app/",
                    pending: "https://fronted-kimi.vercel.app/"
                },
                auto_return: "approved",
            }
        });

        res.json({ init_point: result.init_point });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en Mercado Pago' });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});
