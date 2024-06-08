import prisma from "../prisma/prisma.js";
import storage from "../utils/firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// only admin
export const getAllSkills = async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: true,
      },
    });
    res
      .status(200)
      .json({ success: true, data: skills, message: "All Skills" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSkillById = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await prisma.skill.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: true,
      },
    });
    res
      .status(200)
      .json({ success: true, data: skill, message: "Skill Found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSkill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;
    const file = req.file;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "File not found" });
    }

    const imageRef = `skills/${userId}/${file.originalname + Date.now()}`;

    const storageRef = ref(storage, imageRef);

    // Upload file to Firebase Storage with content type
    const metadata = {
      contentType: file.mimetype,
      contentDisposition: `inline; filename="${file.originalname}"`,
    };

    uploadBytes(storageRef, file.buffer, metadata).then((snapshot) => {
      // Get download URL
      getDownloadURL(snapshot.ref)
        .then((url) => {
          // Create new skill in the database
          prisma.skill
            .create({
              data: {
                name: name,
                image: url,
                authorId: userId,
                imageRef,
              },
            })
            .then((skill) => {
              res
                .status(200)
                .json({ success: true, data: skill, message: "Skill Created" });
            })
            .catch((error) => {
              res.status(500).json({ success: false, message: error.message });
            });
        })
        .catch((error) => {
          res.status(500).json({ success: false, message: error.message });
        });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSkillsPublic = async (req, res) => {
  try {
    const skills = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    res
      .status(200)
      .json({ success: true, data: skills, message: "All Skills" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSkillByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const skill = await prisma.skill.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        name: true,
        image: true,
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
    res
      .status(200)
      .json({ success: true, data: skill, message: "Skill Found" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};