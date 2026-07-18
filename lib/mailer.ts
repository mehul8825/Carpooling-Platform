import nodemailer from 'nodemailer';

// Since we don't have production SMTP credentials yet, we will log to console in dev mode, 
// and optionally setup ethereal email.
export async function sendTemporaryPasswordEmail(toEmail: string, name: string, tempPassword: string) {
  try {
    // In a real application, you would use environment variables for SMTP settings
    console.log(`\n========== MOCK EMAIL SENT ==========`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Welcome to Carpooling Platform - Your Temporary Password`);
    console.log(`Message: `);
    console.log(`Hi ${name},\n`);
    console.log(`Welcome to the Carpooling Platform! Your account has been created by the administrator.\n`);
    console.log(`Your temporary password is: ${tempPassword}\n`);
    console.log(`Please login with this password. You will be prompted to change it on your first login.\n`);
    console.log(`=====================================\n`);
    
    // Optional: actually configure nodemailer for Ethereal or real SMTP if process.env.SMTP_HOST exists.
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Admin" <admin@carpool.local>',
        to: toEmail,
        subject: "Welcome to Carpooling Platform - Your Temporary Password",
        text: `Hi ${name},\n\nWelcome to the Carpooling Platform! Your temporary password is: ${tempPassword}\n\nPlease login and change it.`,
        html: `<p>Hi ${name},</p><p>Welcome to the Carpooling Platform! Your temporary password is: <strong>${tempPassword}</strong></p><p>Please login and change it.</p>`,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendPasswordResetOTPEmail(toEmail: string, otp: string) {
  try {
    console.log(`\n========== MOCK EMAIL SENT ==========`);
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Password Reset Request - Carpooling Platform`);
    console.log(`Message: `);
    console.log(`You have requested to reset your password.\n`);
    console.log(`Your 6-digit OTP is: ${otp}\n`);
    console.log(`This OTP is valid for 10 minutes.\n`);
    console.log(`=====================================\n`);
    
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Admin" <admin@carpool.local>',
        to: toEmail,
        subject: "Password Reset Request - Carpooling Platform",
        text: `You have requested to reset your password. Your 6-digit OTP is: ${otp}. It is valid for 10 minutes.`,
        html: `<p>You have requested to reset your password.</p><p>Your 6-digit OTP is: <strong>${otp}</strong></p><p>It is valid for 10 minutes.</p>`,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
