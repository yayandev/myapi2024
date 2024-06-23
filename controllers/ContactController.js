import prisma from "../prisma/prisma.js";

export const createContact = async (req, res) => {
  try {
    const contact = await prisma.contact.create({
      data: {
        ...req.body,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Contact created", data: contact });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getContact = async (req, res) => {
  try {
    const contact = await prisma.contact.findMany();

    if (!contact) {
      return res
        .status(404)
        .json({ success: false, message: "Contact not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Contact found", data: contact });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateContact = async (req, res) => {
  try {
    const id = req.params.id;
    const { email, linkedin, github, twitter, instagram, facebook } = req.body;

    if (!email || !linkedin || !github || !twitter || !instagram || !facebook) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const contact = await prisma.contact.update({
      where: {
        id: id,
      },
      data: {
        email,
        linkedin,
        github,
        twitter,
        instagram,
        facebook,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Contact updated", data: contact });
  } catch (error) {
    console.log("Error: " + error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
