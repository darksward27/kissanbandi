const nodemailer = require('nodemailer');

const emailTemplates = {
  verification: (name, url) => ({
    subject: 'Please verify your email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a; text-align: center;">Welcome to KissanBandi!</h1>
        <p>Hello ${name},</p>
        <p>Thank you for registering with KissanBandi. Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">${url}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">If you didn't create an account with KissanBandi, please ignore this email.</p>
      </div>
    `
  }),
  passwordReset: (name, url) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a; text-align: center;">Password Reset Request</h1>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">${url}</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    `
  })
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: "joelapeter82@gmail.com",
      pass: "dyxmpvwiyelfcuur",
    },
  });
};

const sendEmail = async (options) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transporter = createTransporter();
      
      // Verify transporter configuration
      await transporter.verify();

      const mailOptions = {
        from: `KissanBandi <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        html: options.html
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error(`Email sending attempt ${attempt} failed:`, error);
      lastError = error;

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // If all retries failed, throw the last error
  throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError.message}`);
};

module.exports = {
  sendEmail,
  emailTemplates
}; 