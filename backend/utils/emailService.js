const nodemailer = require('nodemailer')

const smtpConfigurado = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM,
  )
}

const crearTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const enviarCorreoRecuperacion = async ({ correo, nombre, enlace }) => {
  if (!smtpConfigurado()) {
    console.error(
      'SMTP no configurado. Define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM y FRONTEND_URL para enviar correos.',
    )
    return { enviado: false, motivo: 'SMTP no configurado' }
  }

  const transporter = crearTransporter()

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: correo,
    subject: 'Recuperacion de contrasena - TechSolutions',
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h2 style="color: #1E3A8A;">Recuperacion de contrasena</h2>
        <p>Hola ${nombre || ''},</p>
        <p>Recibimos una solicitud para restablecer tu contrasena en TechSolutions.</p>
        <p>
          <a href="${enlace}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold;">
            Restablecer contrasena
          </a>
        </p>
        <p>Este enlace vence en 30 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      </div>
    `,
  })

  return { enviado: true }
}

module.exports = {
  enviarCorreoRecuperacion,
}
