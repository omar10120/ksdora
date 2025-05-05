import nodemailer, { Transporter } from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export const sendVerificationEmail = async (email: string, token: string) => {
  // Generate a 6-digit verification code from the token
  const verificationCode = token.substring(0, 6).toUpperCase()

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Verification Code',
    html: `
      <h1>Email Verification</h1>
      <p>Your verification code is:</p>
      <h2 style="color: #4CAF50; font-size: 32px; letter-spacing: 3px; padding: 10px; background: #f5f5f5; display: inline-block;">${verificationCode}</h2>
      <p>Enter this code to verify your email address.</p>
      <p>This code will expire in 24 hours.</p>
    `
  }

  await transporter.sendMail(mailOptions)
  return verificationCode
}