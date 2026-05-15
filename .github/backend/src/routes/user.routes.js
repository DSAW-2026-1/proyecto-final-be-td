const express = require("express");

const User = require("../models/User");
const Product = require("../models/Product");

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.patch("/:id/career", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        career: req.body.career,
      },
      {
        new: true,
      }
    );

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get("/:id/products", async (req, res) => {
  try {
    const products = await Product.find({
      owner: req.params.id,
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;