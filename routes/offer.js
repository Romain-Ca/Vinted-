const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");
const uploadFiles = require("../middlewares/uploadFiles");

const User = require("../models/User");
const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  isAuthenticated,
  uploadFiles,
  async (req, res) => {
    try {
      // console.log(req.fields);
      // console.log(req.files.picture.path);

      const {
        title,
        description,
        price,
        condition,
        city,
        brand,
        size,
        color,
      } = req.fields;

      // Créer une nouvelle annonce (sans image)
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_image: req.result,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ÉTAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        owner: req.user,
      });

      // console.log(newOffer);

      // Envoi de l'image à cloudinary
      // const result = await cloudinary.uploader.upload(req.files.picture.path, {
      //   folder: `/vinted/offers/${newOffer._id}`,
      // });
      //console.log(result);
      // Ajoute result à product_image
      // newOffer.product_image = result;

      // Sauvegarder l'annonce
      await newOffer.save();
      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/offers", isAuthenticated, async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort, page } = req.query;
    const limit = 5;
    let sortQuery = {};
    let skip;

    let filters = {};

    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin && priceMax) {
      filters.product_price = { $gte: priceMin, $lte: priceMax };
    } else if (priceMin) {
      filters.product_price = { $gte: priceMin };
    } else if (priceMax) {
      filters.product_price = { $lte: priceMax };
    }
    if (sort) {
      if (sort === "price-asc") {
        sortQuery.product_price = 1;
      } else if (sort === "price-dsc") {
        sortQuery.product_price = -1;
      }
    }
    if (page && page > 0) {
      skip = (page - 1) * limit;
    }

    // console.log(filters);
    // console.log(sortQuery);
    // console.log(skip);

    const offers = await Offer.find(filters)
      .sort(sortQuery)
      .limit(limit)
      .skip(skip);

    const count = await Offer.countDocuments(filters);

    res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
  try {
    if (req.fields.id) {
      const id = req.fields.id;
      // on recherche l' offer par l'id
      const offerToDelete = await Offer.findById(id);
      if (offerToDelete) {
        await Offer.findByIdAndDelete(id);
        res.status(200).json({ message: "Your offer has been deleted" });
      } else {
        res
          .status(400)
          .json({ message: "Your offer has been already deleted" });
      }
    } else {
      res.status(400).json({ message: "Reference id is not good" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/offer/update", isAuthenticated, async (req, res) => {
  try {
    if (!req.fields.id) {
      res.status(400).json({ message: "Reference id is not good" });
    }
    const id = req.fields.id;
    const offerToUpdate = await Offer.findById(id);
    if (!offerToUpdate) {
      res.status(400).json({ message: "No offer with this id" });
    }
    if (req.fields.product_name) {
      offerToUpdate.product_name = req.fields.product_name;
    }
    if (req.fields.product_description) {
      offerToUpdate.product_description = req.fields.product_description;
    }
    if (req.fields.product_price) {
      offerToUpdate.product_price = req.fields.product_price;
    }
    if (req.fields.product_details) {
      offerToUpdate.product_details = req.fields.product_details;
    }

    await offerToUpdate.save();
    res.status(200).json({ message: "Offer has been updated" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", isAuthenticated, async (req, res) => {
  try {
    const id = req.params.id;
    const bdId = await Offer.findById(id);

    if (bdId) {
      const request = await Offer.findById(id).populate({
        path: "owner",
        select: "account _id",
      });
      console.log(request);
      res.status(200).json(request);
    } else {
      res.status(400).json({ message: "The id doesnt exist" });
    }
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

module.exports = router;
