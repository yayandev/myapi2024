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
    let limit = parseInt(req.query.limit) || 5;
    let page = parseInt(req.query.page) || 1;
    let postsCount = await prisma.post.count();

    if (isNaN(limit) || isNaN(page) || limit <= 0 || page <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid limit or page parameter" });
    }

    let offset = (page - 1) * limit;
    let totalPages = Math.ceil(postsCount / limit);

    let posts = await prisma.post.findMany({
      skip: offset,
      take: limit,
    });

    let nextPage = page + 1;
    if (nextPage > totalPages) {
      nextPage = null;
    }

    let prevPage = page - 1;
    if (prevPage < 1) {
      prevPage = null;
    }

    res.status(200).json({
      success: true,
      data: {
        posts,
        total: postsCount,
        limit: limit,
        page: page,
        totalPages: totalPages,
        nextPage: nextPage,
        prevPage: prevPage,
      },
      message: "All Posts",
    });
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

    const imageRef = `${userId}-${Date.now()}.${file.mimetype.split("/")[1]}`;

    const storageRef = ref(storage, imageRef);

    const metadata = {
      contentType: file.mimetype.split("/")[1],
      contentDisposition: `inline; filename="${userId}-${Date.now()}.${
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

    let imageRef = post.imageRef; // Ambil imageRef lama
    let url = post.image; // Ambil URL gambar lama

    if (file) {
      // Hapus gambar lama jika ada
      if (post.imageRef) {
        const oldImageRef = ref(storage, post.imageRef);
        await deleteObject(oldImageRef).catch((error) => {
          console.error("Error deleting old image:", error.message);
        });
      }

      // Buat referensi baru untuk gambar yang diunggah
      imageRef = `${userId}-${Date.now()}.${file.mimetype.split("/")[1]}`;
      const storageRef = ref(storage, imageRef);

      const metadata = {
        contentType: file.mimetype,
        contentDisposition: `inline; filename="${imageRef}"`,
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
        imageRef,
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
