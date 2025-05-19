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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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
    vereda,
    organizaciones,
    otra_organizacion,
    correo_electronico,
    numero_celular,
    nombre_practica,
    problema,
    descripcion
  } = req.body;

  try {
    // Guarda en la DB
    await pool.query(
      `INSERT INTO buenas_practicas (
        nombre_completo, familia, vereda, otra_vereda, organizaciones, otra_organizacion,
        correo_electronico, numero_celular, nombre_practica,
        problema, descripcion
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, $10, $11)`,
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
        descripcion
      ]
    );


    // Envía correo de confirmación
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: correo_electronico,
      subject: 'Confirmación de recepción de tu formulario',
      text: `Hola ${nombre_completo},\n\nGracias por enviar tu buena práctica.\nPronto estaremos revisando tu aporte.\n\n¡Saludos!`
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
