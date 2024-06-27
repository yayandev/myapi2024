import nodemailer from "nodemailer";

export const sendEmail = async (req, res) => {
  try {
    const { email, name, body } = req.body;

    if (!email || !name || !body) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        version: "TLSv1.2",
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: "yayanfathurohman20@gmail.com",
      subject: "yayandev.com - Seseorang Mengirimkan Email Lewat Form!",
      html: body,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).send("Error sending email");
      } else {
        const mailOptions2 = {
          from: process.env.EMAIL_ADDRESS,
          to: email,
          subject: `yayandev.com - Hai ${name}`,
          html: `
            <h1>Hai ${name}</h1>
            <p>Ini adalah email otomatis, saya akan membaca dan membalas email anda.</p>
            <p>Terima kasih sudah menghubungi saya lewat form!</p>
            <hr>
            <p>Salam,</p>
            <p>Tim yayandev.com</p>
          `,
        };

        transporter.sendMail(mailOptions2, (err, info) => {
          if (err) {
            console.log("Error sending email " + err);
          }
        });

        res.status(200).json({ success: true, message: "Email sent", info });
      }
    });
  } catch (error) {
    console.log("Error : " + error.message);
    return res.status(505).json({
      success: false,
      message: "Server Error",
    });
  }
};
