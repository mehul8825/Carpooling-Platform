import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_PORT === "465" || !process.env.SMTP_PORT, // default secure for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"Carpooling Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your OTP for Carpooling Platform",
    text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Carpooling Platform</h2>
        <p>Hello,</p>
        <p>Please use the following One-Time Password to complete your verification:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 10px 20px; background-color: #f3f4f6; border-radius: 4px; border: 1px solid #e5e7eb; color: #1f2937;">
            ${otp}
          </span>
        </div>
        <p>This OTP will expire in 5 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2026 Carpooling Platform. All rights reserved.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
