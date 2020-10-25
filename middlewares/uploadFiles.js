const cloudinary = require("cloudinary").v2;

const User = require("../models/User");
const Offer = require("../models/Offer");

const uploadFiles = async (req, res, next) => {
  if (req.files.picture) {
    console.log(req);
    if (req.fields.title) {
      const pictureName = req.fields.title;
      const files = req.files.picture.path;
      // si le fichier existe alors envoi de l'image à cloudinary
      const result = await cloudinary.uploader.upload(files, {
        folder: `/vinted/offers/${pictureName}`,
      });
      req.result = result;
      return next();
    }
    if (req.fields.username) {
      const pictureName = req.fields.username;
      const files = req.files.picture.path;
      // si le fichier existe alors envoi de l'image à cloudinary
      const result = await cloudinary.uploader.upload(files, {
        folder: `/vinted/user/${pictureName}`,
      });
      req.result = result;
      return next();
    }
  } else {
    // si le fichier n'existe pas next
    return next();
  }
};

module.exports = uploadFiles;
