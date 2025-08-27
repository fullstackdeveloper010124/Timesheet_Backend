// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema({
  
//   firstName: { type: String, required: true },
//   lastName: { type: String, required: true },
//   phone: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true, select: false }
// });

// module.exports = mongoose.model("User", UserSchema);


const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },   // 👈 replaced firstName + lastName
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["Admin", "Manager"], default: "Manager" },

  // Optional teamMembers (if you keep it)
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

// module.exports = mongoose.model("User", UserSchema);
module.exports = mongoose.model("User", UserSchema, "teammembers");
