import { ref } from "firebase/database";
import prisma from "../prisma/prisma.js";
import storage from "../utils/firebase.js";
import { getDownloadURL, uploadBytes } from "firebase/storage";

export const createSerti = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { name } = req.body;
    const file = req.file;

    if (!name || !file) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const imageRef = `serti/${userId}/${file.originalname + Date.now()}`;

    const storageRef = ref(storage, imageRef);

    // Upload file to Firebase Storage with content type
    const metadata = {
      contentType: file.mimetype,
      contentDisposition: `inline; filename="${file.originalname}"`,
    };

    const snapshot = await uploadBytes(storageRef, file.buffer, metadata);

    // Get download URL
    const url = await getDownloadURL(snapshot.ref);

    const serti = await prisma.serti.create({
      data: {
        name,
        image: url,
        imageRef: imageRef,
        authorId: userId,
      },
    });

    if (!serti) {
      return res
        .status(400)
        .json({ success: false, message: "Serti not created" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Serti created", data: serti });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllSerti = async (req, res) => {
  try {
    const sertis = await prisma.serti.findMany({});

    if (!sertis) {
      return res
        .status(404)
        .json({ success: false, message: "Sertis not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Sertis found", data: sertis });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteSerti = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { id } = req.params;

    const serti = await prisma.serti.findUnique({
      where: {
        id: id,
        AND: {
          authorId: userId,
        },
      },
    });

    if (!serti) {
      return res
        .status(404)
        .json({ success: false, message: "Serti not found" });
    }

    const imageRef = serti.imageRef;

    const storageRef = ref(storage, imageRef);

    await prisma.serti.delete({
      where: {
        id: id,
      },
    });

    await storageRef.delete();

    return res
      .status(200)
      .json({ success: true, message: "Serti deleted", data: serti });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
