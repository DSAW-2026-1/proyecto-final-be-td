const express = require("express");

const Product = require("../models/Product");
const User = require("../models/User");

const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, async (req, res) => {

  try {

    const product = await Product.create({
      ...req.body,
      owner: req.user.id
    });

    const count = await Product.countDocuments({
      owner: req.user.id
    });

    if (count > 0) {

      await User.findByIdAndUpdate(
        req.user.id,
        {
          isVendedor: true
        }
      );
    }

    res.status(201).json(product);

  } catch (error) {

    res.status(500).json(error);
  }
});

router.get("/", async (req, res) => {

  try {

    const page = Number(req.query.page) || 1;

    const limit = 10;

    const filters = {
      activo: true
    };

    if (req.query.cat) {
      filters.category = req.query.cat;
    }

    if (req.query.state) {
      filters.state = req.query.state;
    }

    if (req.query.search) {
      filters.title = {
        $regex: req.query.search,
        $options: "i"
      };
    }

    const data = await Product.find(filters)
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Product.countDocuments(filters);

    res.status(200).json({
      total,
      page,
      data
    });

  } catch (error) {

    res.status(500).json(error);
  }
});

router.get("/:id", async (req, res) => {

  try {

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        msg: "Producto no disponible"
      });
    }

    res.status(200).json(product);

  } catch (error) {

    res.status(500).json(error);
  }
});

router.put("/:id", auth, async (req, res) => {

  try {

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true
      }
    );

    res.status(200).json(product);

  } catch (error) {

    res.status(500).json(error);
  }
});

router.delete("/:id", auth, async (req, res) => {

  try {

    await Product.findByIdAndUpdate(
      req.params.id,
      {
        activo: false
      }
    );

    res.status(200).json({
      msg: "Producto eliminado"
    });

  } catch (error) {

    res.status(500).json(error);
  }
});

module.exports = router;