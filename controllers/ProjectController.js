import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import prisma from "../prisma/prisma.js";
import storage from "../utils/firebase.js";

export const createProject = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, skills } = req.body;
    const file = req.file;

    if (!title || !description || !skills || !file) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const imageRef = `projects/${userId}/${file.originalname + Date.now()}`;

    const storageRef = ref(storage, imageRef);

    // Upload file to Firebase Storage with content type
    const metadata = {
      contentType: file.mimetype,
      contentDisposition: `inline; filename="${file.originalname}"`,
    };

    const snapshot = await uploadBytes(storageRef, file.buffer, metadata);

    const url = await getDownloadURL(snapshot.ref);

    const project = await prisma.project.create({
      data: {
        title,
        description,
        skillsIds: JSON.parse(skills),
        image: url,
        imageRef: imageRef,
        authorId: userId,
      },
    });

    // append id project to skills

    JSON.parse(skills).forEach(async (skillId) => {
      await prisma.skill.update({
        where: {
          id: skillId,
        },
        data: {
          projects: {
            connect: {
              id: project.id,
            },
          },
        },
      });
    });

    if (project) {
      return res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: project,
      });
    }
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    const projects = await prisma.project.findMany({
      where: {
        authorId: userId,
      },
    });

    return res
      .status(200)
      .json({ success: true, data: projects, message: "Projects" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllProjectsPublic = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        skillsIds: true,
        skills: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return res
      .status(200)
      .json({ success: true, data: projects, message: "Projects" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: {
        id: id,
      },
    });

    return res
      .status(200)
      .json({ success: true, data: project, message: "Project" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getProjectByIdPublic = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        skillsIds: true,
        skills: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return res
      .status(200)
      .json({ success: true, data: project, message: "Project" });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const project = await prisma.project.findUnique({
      where: {
        id: id,
        authorId: userId,
      },
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Delete the project
    const deletedProject = await prisma.project.delete({
      where: {
        id: id,
      },
    });

    if (!deletedProject) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Handle image deletion if there is an image reference
    const imageRef = project.imageRef;

    if (imageRef) {
      const storageRef = ref(storage, imageRef);
      await deleteObject(storageRef);
    }

    // Update skills to remove the project ID from projectsIds
    const skills = await prisma.skill.findMany({
      where: {
        projectsIds: {
          has: id,
        },
      },
    });

    await Promise.all(
      skills.map(async (skill) => {
        await prisma.skill.update({
          where: {
            id: skill.id,
          },
          data: {
            projects: {
              disconnect: {
                id: id,
              },
            },
            projectsIds: {
              set: skill.projectsIds.filter((projectId) => projectId !== id),
            },
          },
        });
      })
    );

    return res
      .status(200)
      .json({
        success: true,
        data: deletedProject,
        message: "Project deleted successfully",
      });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { title, description, skills } = req.body;
    const file = req.file;

    if (!title || !description || !skills) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const skillsArray = Array.isArray(skills) ? skills : JSON.parse(skills);

    const project = await prisma.project.findUnique({
      where: {
        id: id,
        authorId: userId,
      },
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    let imageRef = project.imageRef;
    let url = project.image;
    if (file) {
      if (imageRef) {
        const storageRef = ref(storage, imageRef);
        await deleteObject(storageRef);
      }

      imageRef = `projects/${userId}/${file.originalname + Date.now()}`;
      const metadata = {
        contentType: file.mimetype,
        contentDisposition: `inline; filename="${file.originalname}"`,
      };
      const snapshot = await uploadBytes(
        ref(storage, imageRef),
        file.buffer,
        metadata
      );
      url = await getDownloadURL(snapshot.ref);
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        description: description,
        imageRef: imageRef,
        image: url,
      },
    });

    if (skillsArray && skillsArray.length > 0) {
      const existingSkills = await prisma.skill.findMany({
        where: {
          projects: {
            some: {
              id: id,
            },
          },
        },
      });

      await Promise.all(
        existingSkills.map(async (skill) => {
          if (!skillsArray.includes(skill.id)) {
            await prisma.skill.update({
              where: {
                id: skill.id,
              },
              data: {
                projects: {
                  disconnect: {
                    id: id,
                  },
                },
              },
            });
          }
        })
      );

      await Promise.all(
        skillsArray.map(async (skillId) => {
          if (!existingSkills.some((skill) => skill.id === skillId)) {
            await prisma.skill.update({
              where: {
                id: skillId,
              },
              data: {
                projects: {
                  connect: {
                    id: id,
                  },
                },
              },
            });
          }
        })
      );
    }

    return res.status(200).json({
      success: true,
      data: updatedProject,
      message: "Project updated successfully",
    });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
