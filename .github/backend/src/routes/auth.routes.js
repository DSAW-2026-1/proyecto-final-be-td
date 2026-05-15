const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {

  try {

    const { nombre, email, pass } = req.body;

    if (!email.endsWith("@unisabana.edu.co")) {
      return res.status(400).json({
        msg: "Solo correos institucionales"
      });
    }

    const existUser = await User.findOne({ email });

    if (existUser) {
      return res.status(409).json({
        msg: "Email ya existe"
      });
    }

    const hash = await bcrypt.hash(pass, 10);

    const user = await User.create({
      nombre,
      email,
      password: hash
    });

    res.status(201).json(user);

  } catch (error) {

    res.status(500).json(error);
  }
});

router.post("/login", async (req, res) => {

  try {

    const { email, pass } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        msg: "Usuario no existe"
      });
    }

    const validPass = await bcrypt.compare(
      pass,
      user.password
    );

    if (!validPass) {
      return res.status(400).json({
        msg: "Contraseña incorrecta"
      });
    }

    const token = jwt.sign(
      {
        id: user._id
      },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      token,
      user
    });

  } catch (error) {

    res.status(500).json(error);
  }
});

module.exports = router;