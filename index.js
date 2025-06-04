import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

console.log("🔍 DATABASE_URL:", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Configura Nodemailer con Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  }
});

app.post('/api/buenas_practicas', async (req, res) => {
  const {
    nombre_completo,
    familia,
    vereda,
    otra_vereda,
    organizaciones,
    otra_organizacion,
    correo_electronico,
    numero_celular,
    nombre_practica,
    problema,
    descripcion,
    redes,
  } = req.body;

   // Validaciones de longitud
   const maxLength = {
    nombre_completo: 100,
    familia: 50,
    vereda: 100,
    otra_vereda: 50,
    organizaciones: 50,
    otra_organizacion: 100,
    correo_electronico: 100,
    numero_celular: 10,
    nombre_practica: 50,
    problema: 120,
    descripcion: 350,
    redes: 100,
  };

  for (const [campo, valor] of Object.entries(req.body)) {
    if (valor && valor.length > maxLength[campo]) {
      return res.status(400).json({ error: `El campo "${campo}" excede el máximo de ${maxLength[campo]} caracteres.` });
    }
  }

  // Validación adicional: celular debe tener exactamente 10 dígitos
  if (!/^\d{10}$/.test(numero_celular)) {
    return res.status(400).json({ error: 'El número de celular debe tener exactamente 10 dígitos.' });
  }


  try {
    // Guarda en la DB
    await pool.query(
      `INSERT INTO buenas_practicas (
        nombre_completo, familia, vereda, otra_vereda, organizaciones, otra_organizacion,
        correo_electronico, numero_celular, nombre_practica,
        problema, descripcion, redes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        nombre_completo,
        familia,
        vereda,
        otra_vereda,
        organizaciones,
        otra_organizacion,
        correo_electronico,
        numero_celular,
        nombre_practica,
        problema,
        descripcion,
        redes
      ]
    );


    // Envía correo de confirmación
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: correo_electronico,
      subject: '¡Hurra! Hemos recibido tu buena práctica de salvaguardia 🎉',
      text: `Hola ${nombre_completo},
  ¡Gracias por enviar tu buena práctica de salvaguardia para implementar durante la Feria de las Flores!
  Tu aporte es muy valioso para mantener viva nuestra cultura silletera. 
  Recuerda enviar tus evidencias (fotos o videos) a este mismo correo. Es importante que en ellas sea visible la fecha en que realizaste cada actividad.

  También puedes etiquetarnos en Instagram para compartir tu compromiso con más personas:
  👉 https://www.instagram.com/cultura.med/

  ¡Gracias por ser parte activa de la salvaguardia de la cultura silletera!`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send('Formulario enviado y correo de confirmación enviado.');
  } catch (err) {
    console.error('Error guardando formulario o enviando correo:', err);
    res.status(500).send('Error al guardar el formulario o enviar el correo.');
  }
});

// Ruta GET para obtener todas las buenas_practicas
app.get('/api/buenas_practicas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buenas_practicas ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error consultando compromisos:', err);
    res.status(500).send('Error al obtener compromisos.');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
