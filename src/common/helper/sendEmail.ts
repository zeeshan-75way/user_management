import nodemailer from "nodemailer";

export const sendEmail = async ({
  email,
  emailType,
  url,
}: {
  email: string;
  emailType: string;
  url?: string;
}) => {
  try {
    await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
    let subject = "";
    let html = "";
    if (emailType == "VERIFY") {
      subject = "Verify your Account";
      if (url) {
        html = `<p>
            Hi, this is verification email 
            Please click here to verify your account
            ${url}
            </p>`;
      }
    }
    if (emailType == "FORGETPASSWORD") {
      subject = "Change Password of your Account";
      if (url) {
        html = `<p>
            Hi, this is an email to Change Password 
            Please click here to change your password
            ${url}
            </p>`;
      }
    }
    if (emailType == "KYC") {
      subject = "Complete Kyc of your Account";
      if (url) {
        html = `<p>
            Hi, this is an email to complete kyc of your account
            ${url}
            </p>`;
      }
    }

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};
