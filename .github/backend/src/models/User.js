const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    career: {
      type: String,
      default: "",
    },

    reputation: {
      type: Number,
      default: 5,
    },

    photo: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "comprador",
    },

    isVendedor: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);