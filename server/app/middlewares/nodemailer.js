const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  try {
    // Create a transporter using the email and password from .env
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use Gmail as the service
      auth: {
        user: process.env.NODEMAILER_USER_EMAIL, // Your email address from .env
        pass: process.env.NODEMAILER_EMAIL_PASS, // Your email password from .env
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to, // Recipient address
      subject, // Email subject
      text, // Email content (plain text)
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    // console.log("Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = { sendEmail };