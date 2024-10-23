import prisma from "../prisma/prisma.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import storage from "../utils/firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { tokenBlacklist } from "../utils/Token.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

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

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({ success: true, data: users, message: "All Users" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    res.status(200).json({ success: true, data: user, message: "User Found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const body = req.body;
    const { name, email, password, confirmPassword, role } = body;

    if (!name || !email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const duplicatedEmail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (duplicatedEmail) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        role: role,
      },
    });

    res
      .status(201)
      .json({ success: true, data: user, message: "User Created" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const register = async (req, res) => {
  try {
    const body = req.body;
    const { name, email, password, confirmPassword } = body;

    if (!name || !email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const duplicatedEmail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (duplicatedEmail) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const body = req.body;
    const { email, password } = body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      const isMatch = await bcryptjs.compare(password, user.password);

      if (isMatch) {
        const accessToken = jwt.sign(
          { userId: user.id },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1d" }
        );

        // const refreshToken = jwt.sign(
        //   { userId: user.id },
        //   process.env.REFRESH_TOKEN_SECRET,
        //   { expiresIn: "1d" }
        // );

        // res.cookie("refreshToken", refreshToken, {
        //   httpOnly: true,
        //   maxAge: 24 * 60 * 60 * 1000,
        // });

        delete user.password;

        return res.status(200).json({
          success: true,
          message: "Login successful",
          data: {
            token: accessToken,
            user: user,
          },
        });
      }
    }

    return res
      .status(404)
      .json({ success: false, message: "Email or password is incorrect" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const profile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: false,
        createdAt: true,
        updatedAt: true,
        role: true,
        avatar: true,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Profile found", data: user });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
        }

        const accessToken = jwt.sign(
          { userId: decoded.userId },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );
        return res.status(200).json({
          success: true,
          message: "Token refreshed",
          data: { accessToken: accessToken },
        });
      }
    );
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    tokenBlacklist.push(token);

    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const changeAvatar = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user.userId;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "File not found" });
    }

    const storageRef = ref(storage, `avatars/${userId}`);

    // Upload file to Firebase Storage with content type
    const metadata = {
      contentType: file.mimetype,
      contentDisposition: `inline; filename="${file.originalname}"`,
    };

    uploadBytes(storageRef, file.buffer, metadata)
      .then((snapshot) => {
        // Get download URL
        getDownloadURL(snapshot.ref)
          .then((url) => {
            // Update user's avatar URL in the database
            prisma.user
              .update({
                where: {
                  id: userId,
                },
                data: {
                  avatar: url,
                },
              })
              .then((user) => {
                return res.status(200).json({
                  success: true,
                  message: "Avatar changed successfully",
                  data: user,
                });
              })
              .catch((dbError) => {
                console.error("Database update error:", dbError);
                return res
                  .status(500)
                  .json({ success: false, message: "Database Error" });
              });
          })
          .catch((urlError) => {
            console.error("Error getting download URL:", urlError);
            return res
              .status(500)
              .json({ success: false, message: "Error getting download URL" });
          });
      })
      .catch((uploadError) => {
        console.error("Upload error:", uploadError);
        return res
          .status(500)
          .json({ success: false, message: "Upload Error" });
      });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    const isMatch = await bcryptjs.compare(password, user.password);

    if (isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "New password cannot be the same" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    prisma.user
      .update({
        where: {
          id: userId,
        },
        data: {
          password: hashedPassword,
        },
      })
      .then((user) => {
        delete user.password;
        return res.status(200).json({
          success: true,
          message: "Password changed successfully",
          data: user,
        });
      })
      .catch((dbError) => {
        console.error("Database update error:", dbError);
        return res
          .status(500)
          .json({ success: false, message: "Database Error" });
      });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { name, email } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const duplicatedEmail = await prisma.user.findFirst({
      where: {
        email: email,
        NOT: {
          id: userId,
        },
      },
    });

    if (duplicatedEmail) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    }

    prisma.user
      .update({
        where: {
          id: userId,
        },
        data: {
          name: name,
          email: email,
        },
      })
      .then((user) => {
        delete user.password;
        return res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          data: user,
        });
      })
      .catch((dbError) => {
        console.error("Database update error:", dbError);
        return res
          .status(500)
          .json({ success: false, message: "Server Error" });
      });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const profilePublic = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, data: user, message: "User found" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, data: user, message: "Verified token" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const myStatistiks = async (req, res) => {
  try {
    const userId = req.user.userId;

    const postsCount = await prisma.post.count({
      where: {
        authorId: userId,
      },
    });

    const projectsCount = await prisma.project.count({
      where: {
        authorId: userId,
      },
    });

    const skillsCount = await prisma.skill.count({
      where: {
        authorId: userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: { postsCount, projectsCount, skillsCount },
      message: "My statistiks",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let kode = crypto.randomBytes(32).toString("hex") + user.id + Date.now();

    let newOtp = await prisma.otp.create({
      data: {
        userId: user.id,
        otp: kode,
        email: email,
      },
    });

    if (!newOtp) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to send" });
    }

    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: email,
      subject: "Forgot Password - yayandev.com",
      html: `
      <h1>Forgot Password</h1>
      <p>Click the link below to reset your password</p>
      <a href="${process.env.FE_URL}/reset-password/${kode}">Reset Password</a>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
      }
      // else {
      //   const mailOptions2 = {
      //     from: process.env.EMAIL_ADDRESS,
      //     to: email,
      //     subject: `Forgot Password - yayandev.com`,
      //     html: `
      //     <h1>Forgot Password</h1>
      //     <p>Click the link below to reset your password</p>
      //     <a href="${process.env.FE_URL}/reset-password/${kode}">Reset Password</a>
      //     `,
      //   };

      //   transporter.sendMail(mailOptions2, (err, info) => {
      //     if (err) {
      //       console.log("Error sending email " + err);
      //     }
      //   });

      res.status(200).json({
        success: true,
        message:
          "Please check your email, reset password link has been sent to your email",
        info,
      });
      // }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const { password, confirmPassword } = req.body;

    let otpReady = await prisma.otp.findUnique({
      where: {
        otp: token,
      },
      include: {
        user: true,
      },
    });

    if (!otpReady) {
      return res
        .status(404)
        .json({ success: false, message: "Token not found" });
    }

    if (!otpReady.status) {
      return res
        .status(404)
        .json({ success: false, message: "Token already used" });
    }

    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    await prisma.otp.update({
      where: {
        id: otpReady.id,
      },
      data: {
        status: false,
      },
    });

    await prisma.user.update({
      where: {
        id: otpReady.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.status(200).json({ success: true, message: "Password changed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
