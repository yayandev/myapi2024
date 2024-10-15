import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import prisma from "../prisma/prisma.js";
import storage from "../utils/firebase.js";

export const getAllPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany();
    res.status(200).json({ success: true, data: posts, message: "All Posts" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await prisma.post.findUnique({
      where: {
        slug: slug,
      },
      include: {
        author: true,
      },
    });
    res.status(200).json({ success: true, data: post, message: "Post Found" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { title, content, tags } = req.body;
    const file = req.file;

    if (!title || !content || !tags || !file) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const slug = title.replace(/\s+/g, "-").toLowerCase();

    const slugIsUnique = await prisma.post.findUnique({
      where: {
        slug: slug,
      },
    });

    if (slugIsUnique) {
      return res
        .status(400)
        .json({ success: false, message: "Slug is not unique" });
    }

    const imageRef = `posts/${Date.now()}.${file.mimetype.split("/")[1]}`;

    const storageRef = ref(storage, imageRef);

    const metadata = {
      contentType: file.mimetype,
      contentDisposition: `inline; filename="${Date.now()}.${
        file.mimetype.split("/")[1]
      }"`,
    };

    const snapshot = await uploadBytes(storageRef, file.buffer, metadata);

    const url = await getDownloadURL(snapshot.ref);

    let tagsJson = JSON.parse(tags);

    const post = await prisma.post.create({
      data: {
        title: title,
        content: content,
        slug: slug,
        tags: tagsJson,
        authorId: userId,
        imageRef: imageRef,
        image: url,
      },
    });

    res.status(200).json({
      success: true,
      data: post,
      message: "Post created successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await prisma.post.findUnique({
      where: {
        id: id,
      },
    });

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    if (post.authorId !== userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const imageRef = post.imageRef;

    const storageRef = ref(storage, imageRef);

    await deleteObject(storageRef);

    const deletedPost = await prisma.post.delete({
      where: {
        id: id,
      },
    });

    res.status(200).json({
      success: true,
      data: deletedPost,
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const { title, content, tags } = req.body;
    const file = req.file;

    if (!title || !content || !tags) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const post = await prisma.post.findUnique({
      where: {
        id: id,
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.authorId !== userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let slug =
      post.title === title
        ? post.slug
        : title.replace(/\s+/g, "-").toLowerCase();

    if (post.slug !== slug) {
      const slugIsUnique = await prisma.post.findUnique({
        where: {
          slug: slug,
        },
      });

      if (slugIsUnique) {
        return res
          .status(400)
          .json({ success: false, message: "Slug is not unique" });
      }
    }

    let tagsJson = JSON.parse(tags);

    let imageRef = post.imageRef;
    let url = post.image;

    if (file) {
      const storageRef = ref(storage, imageRef);

      await deleteObject(storageRef);

      imageRef = `posts/${Date.now()}.${file.mimetype.split("/")[1]}`;

      const metadata = {
        contentType: file.mimetype,
        contentDisposition: `inline; filename="${Date.now()}.${
          file.mimetype.split("/")[1]
        }"`,
      };

      const snapshot = await uploadBytes(storageRef, file.buffer, metadata);

      url = await getDownloadURL(snapshot.ref);
    }

    const updatedPost = await prisma.post.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        content: content,
        slug: slug,
        tags: tagsJson,
        imageRef: imageRef,
        image: url,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedPost,
      message: "Post updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
