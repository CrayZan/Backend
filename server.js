const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const nodemailer = require('nodemailer');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 1. CONFIGURACIÓN DE MERCADO PAGO
const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-7683539587848277-032818-f1291f6337d7c4a7d3cb109814661361-3297988475' 
});

// 2. CONFIGURACIÓN DE CORREO (Ajustada para evitar Timeouts en Render)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Se activa el puerto seguro para evitar bloqueos de red
    auth: {
        user: 'albarracincristian470@gmail.com',
        pass: 'xgndnhlnwtkxajex' 
    }
});

app.get('/', (req, res) => {
    res.send('Servidor del Hostal con Notificaciones Activas');
});

// 3. RUTA PARA CREAR EL PAGO
app.post('/create_preference', async (req, res) => {
    try {
        const preference = new Preference(client);
        const { title, amount, name, email } = req.body;

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
                notification_url: "https://hostal-milagro.onrender.com/webhook"
            }
        });

        res.json({ init_point: result.init_point });
    } catch (error) {
        console.error('Error al crear preferencia:', error);
        res.status(500).json({ error: 'Error al crear pago' });
    }
});

// 4. RUTA DE NOTIFICACIÓN (Webhook)
app.post('/webhook', async (req, res) => {
    const { query } = req;
    
    // Mercado Pago envía notificaciones por ID de pago
    if (query.type === 'payment' || query['data.id']) {
        const paymentId = query.id || query['data.id'];
        
        try {
            const payment = await new Payment(client).get({ id: paymentId });
            
            if (payment.status === 'approved') {
                const customerEmail = payment.payer.email;
                const monto = payment.transaction_amount;

                // Enviar comprobante al cliente
                await transporter.sendMail({
                    from: '"Hostal del Milagro" <albarracincristian470@gmail.com>',
                    to: customerEmail,
                    subject: '¡Reserva Confirmada! - Hostal del Milagro',
                    html: `
                        <div style="font-family: sans-serif; border: 2px solid #ea580c; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto;">
                            <h2 style="color: #ea580c; text-align: center;">¡Pago Recibido con Éxito!</h2>
                            <p>Hola, hemos recibido correctamente la seña para tu estadía.</p>
                            <hr style="border: 0; border-top: 1px solid #eee;">
                            <p><b>Detalles de la transacción:</b></p>
                            <ul style="list-style: none; padding: 0;">
                                <li>✅ <b>ID de Pago:</b> ${paymentId}</li>
                                <li>✅ <b>Monto señado:</b> $${monto} ARS</li>
                            </ul>
                            <p style="background: #fff7ed; padding: 10px; border-radius: 5px; color: #9a3412;">
                                <b>Importante:</b> Presenta este comprobante (digital o impreso) al momento de realizar tu Check-in.
                            </p>
                            <p style="text-align: center; color: #666; font-size: 12px;">Hostal del Milagro - Salta, Argentina</p>
                        </div>
                    `
                });
                console.log(`Email enviado con éxito a: ${customerEmail}`);
            }
        } catch (error) { 
            console.error('Error procesando el pago o enviando el mail:', error); 
        }
    }
    res.sendStatus(200);
});

app.listen(port, () => { console.log(`Servidor operando en puerto ${port}`); });
