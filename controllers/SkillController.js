import prisma from "../prisma/prisma.js";
import storage from "../utils/firebase.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

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
        projects: true,
        projectsIds: true,
      },
    });

    if (!skill) {
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });
    }

    res
      .status(200)
      .json({ success: true, data: skill, message: "Skill Found" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSkillByAuthorId = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;

    if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid limit or page parameter" });
    }

    const offset = (page - 1) * limit;
    console.log(`Limit: ${limit}, Page: ${page}, Offset: ${offset}`);

    const count = await prisma.skill.count({
      where: {
        authorId: userId,
      },
    });
    console.log(`Total Skills Count: ${count}`);

    const totalPages = Math.ceil(count / limit);

    const skills = await prisma.skill.findMany({
      where: {
        authorId: userId,
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
      take: limit,
      skip: offset,
    });

    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    res.status(200).json({
      success: true,
      data: skills,
      message: "My Skills",
      nextPage,
      prevPage,
      totalPages,
    });
  } catch (error) {
    console.error("Error: ", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteSkill = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { id } = req.params;

    const skill = await prisma.skill.findUnique({
      where: {
        id: id,
        AND: {
          authorId: userId,
        },
      },
    });

    if (!skill) {
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });
    }

    const deletedSkill = await prisma.skill.delete({
      where: {
        id: id,
      },
    });

    const imageRef = skill.imageRef;

    const storageRef = ref(storage, imageRef);

    await deleteObject(storageRef);

    res
      .status(200)
      .json({ success: true, data: deletedSkill, message: "Skill Deleted" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateSkill = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const { name } = req.body;

    const skill = await prisma.skill.findUnique({
      where: {
        id: id,
        AND: {
          authorId: userId,
        },
      },
    });

    if (!skill) {
      return res
        .status(404)
        .json({ success: false, message: "Skill not found" });
    }

    const file = req.file;

    if (file) {
      const oldImageRef = skill.imageRef;
      const imageRef = `skills/${userId}/${file.originalname + Date.now()}`;

      const storageRef = ref(storage, imageRef);

      const metadata = {
        contentType: file.mimetype,
        contentDisposition: `inline; filename="${file.originalname}"`,
      };

      uploadBytes(storageRef, file.buffer, metadata).then((snapshot) => {
        getDownloadURL(snapshot.ref)
          .then((url) => {
            prisma.skill
              .update({
                where: {
                  id: id,
                },
                data: {
                  name: name,
                  image: url,
                  imageRef: imageRef,
                },
              })
              .then(async (updatedSkill) => {
                const storageRef = ref(storage, oldImageRef);
                await deleteObject(storageRef);

                res.status(200).json({
                  success: true,
                  data: updatedSkill,
                  message: "Skill Updated",
                });
              })
              .catch((error) => {
                console.log("Error : ".error.message);
                return res
                  .status(500)
                  .json({ success: false, message: "Server Error" });
              });
          })
          .catch((error) => {
            console.log("Error : ".error.message);
            return res
              .status(500)
              .json({ success: false, message: "Server Error" });
          });
      });
    } else {
      const update = await prisma.skill.update({
        where: {
          id: id,
        },
        data: {
          name: name,
        },
      });

      res
        .status(200)
        .json({ success: true, data: update, message: "Skill Updated" });
    }
  } catch (error) {
    console.log("Error : ".error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
