const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    title: String,

    description: String,

    price: Number,

    category: String,

    state: String,

    images: [String],

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", ProductSchema);