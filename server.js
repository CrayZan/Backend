const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const nodemailer = require('nodemailer');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. CONFIGURACIÓN DE MERCADO PAGO (Producción)
const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-7683539587848277-032818-f1291f6337d7c4a7d3cb109814661361-3297988475' 
});

// 2. CONFIGURACIÓN DE CORREO (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'albarracincristian470@gmail.com',
        pass: 'xgndnhlnwtkxajex' 
    }
});

app.get('/', (req, res) => {
    res.send('Servidor del Hostal con Notificaciones Activas');
});

// 3. RUTA PARA CREAR EL PAGO (Desde el Formulario)
app.post('/create_preference', async (req, res) => {
    try {
        const preference = new Preference(client);
        const { title, amount, name, email, phone } = req.body;

        const result = await preference.create({
            body: {
                items: [{
                    title: title || "Reserva Hostal",
                    unit_price: Number(amount),
                    quantity: 1,
                    currency_id: 'ARS'
                }],
                payer: { email: email, name: name },
                back_urls: {
                    success: "https://fronted-kimi.vercel.app/",
                    failure: "https://fronted-kimi.vercel.app/",
                    pending: "https://fronted-kimi.vercel.app/"
                },
                auto_return: "approved",
                notification_url: "https://hostal-milagro.onrender.com/webhook" // Aviso automático
            }
        });

        res.json({ init_point: result.init_point });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear pago' });
    }
});

// 4. RUTA DE NOTIFICACIÓN (Webhook) - Envía el comprobante
app.post('/webhook', async (req, res) => {
    const { query } = req;
    if (query.type === 'payment') {
        const paymentId = query['data.id'];
        try {
            const payment = await new Payment(client).get({ id: paymentId });
            if (payment.status === 'approved') {
                const customerEmail = payment.payer.email;
                const monto = payment.transaction_amount;

                // Enviar comprobante al cliente
                await transporter.sendMail({
                    from: '"Hostal del Milagro" <albarracincristian470@gmail.com>',
                    to: customerEmail,
                    subject: 'Comprobante de Reserva - Hostal del Milagro',
                    html: `
                        <div style="font-family: sans-serif; border: 2px solid #ea580c; padding: 20px; border-radius: 10px;">
                            <h2 style="color: #ea580c;">¡Reserva Confirmada!</h2>
                            <p>Hola, hemos recibido correctamente tu seña.</p>
                            <p><b>Detalles del Pago:</b></p>
                            <ul>
                                <li><b>ID de Transacción:</b> ${paymentId}</li>
                                <li><b>Monto pagado:</b> $${monto} ARS</li>
                            </ul>
                            <p>Presenta este correo al momento de tu ingreso.</p>
                        </div>
                    `
                });
            }
        } catch (error) { console.error('Error enviando comprobante:', error); }
    }
    res.sendStatus(200);
});

app.listen(port, () => { console.log(`Servidor en puerto ${port}`); });
