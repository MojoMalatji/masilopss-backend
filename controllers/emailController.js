const transporter = require("../config/mailer");


const sendEmail = async (req, res) => {

  try {

    const {
      subject,
      message
    } = req.body;


    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: "Info@mashilopss.co.za",

      subject: subject,

      text: message,

    });


    res.status(200).json({
      success: true,
      message: "Email sent successfully"
    });


  } catch(error) {

    console.error("Email Error:", error);


    res.status(500).json({
      success: false,
      error: error.message
    });

  }

};


module.exports = {
  sendEmail
};