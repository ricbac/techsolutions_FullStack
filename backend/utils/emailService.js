const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

const parsearRemitente = (smtpFrom = '') => {
  const match = smtpFrom.match(/^\s*(.*?)\s*<([^>]+)>\s*$/)

  if (match) {
    return {
      name: match[1].trim() || 'TechSolutions',
      email: match[2].trim(),
    }
  }

  return {
    name: 'TechSolutions',
    email: smtpFrom.trim(),
  }
}

const normalizarArgumentos = (destinatario, enlace) => {
  if (typeof destinatario === 'object' && destinatario !== null) {
    return {
      destinatario: destinatario.correo,
      enlace: destinatario.enlace,
    }
  }

  return { destinatario, enlace }
}

async function enviarCorreoRecuperacion(destinatarioArg, enlaceArg) {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY no configurada')
  }

  if (!process.env.SMTP_FROM) {
    throw new Error('SMTP_FROM no configurado')
  }

  const { destinatario, enlace } = normalizarArgumentos(destinatarioArg, enlaceArg)
  const sender = parsearRemitente(process.env.SMTP_FROM)

  const payload = {
    sender,
    to: [{ email: destinatario }],
    subject: 'Recuperación de contraseña - TechSolutions',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; background: #f3f4f6; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: #1E3A8A; color: #ffffff; padding: 20px 24px;">
            <h1 style="margin: 0; font-size: 22px;">TechSolutions</h1>
            <p style="margin: 6px 0 0; font-size: 14px;">Recuperación de contraseña</p>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 14px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p style="margin: 0 0 20px;">Usa el siguiente botón para crear una nueva contraseña. El enlace vence en 30 minutos.</p>
            <p style="margin: 0 0 22px;">
              <a href="${enlace}" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:bold;">
                Restablecer contraseña
              </a>
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 13px;">
              Si no solicitaste este cambio, puedes ignorar este correo.
            </p>
          </div>
        </div>
      </div>
    `,
    textContent: `Restablece tu contraseña desde este enlace: ${enlace}`,
  }

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('Error Brevo al enviar correo:', {
      status: response.status,
      body,
    })
    throw new Error(`Brevo respondio con status ${response.status}`)
  }

  return { enviado: true }
}

module.exports = {
  enviarCorreoRecuperacion,
}
