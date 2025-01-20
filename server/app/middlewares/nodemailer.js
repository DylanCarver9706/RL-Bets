const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text = "", html = "", attachments = []) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_USER_EMAIL,
        pass: process.env.NODEMAILER_EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.NODEMAILER_USER_EMAIL,
      to,
      subject,
      text,
      html,
      attachments, // Attachments array
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };
