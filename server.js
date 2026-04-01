const express = require('express');
const cors = require('cors'); // <--- Esto da los permisos
const app = express();
const port = process.env.PORT || 3000;

// Aquí le decimos al servidor que acepte llamadas de cualquier lugar (como Vercel)
app.use(cors());

// Esta es la ruta que ya tienes funcionando
app.get('/', (req, res) => {
  res.send('El servidor del Hostal está funcionando correctamente en Render');
});

// Ruta de ejemplo para que tu botón reciba datos reales
app.get('/datos', (req, res) => {
  res.json({
    mensaje: "¡Hola! Estos son datos desde el Hostal Milagro",
    estado: "Operativo",
    fecha: new Date().toLocaleDateString()
  });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
