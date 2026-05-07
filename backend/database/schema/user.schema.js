const mongoose = require("mongoose");

// This allows for more flexibility in querying the database, as queries can include fields that are not explicitly defined in the schema.
mongoose.set("strictQuery", false);

const dbSchema = new mongoose.Schema({
  // Full name of user
  name: String,

  // Username of user
  username: String,

  // Email ID of user
  email: {
    type: String,
    required: true,
    unique: true
  },

  // Password of user ID
  password: String,

  // Role of the user whether he/she is admin or a normal user
  role: String,

  // Legacy single-address field. Kept for read fallback only — new code should
  // write to `addresses` (the array below). On read, if `addresses` is empty
  // but `address` exists, the API returns it as `[address]`.
  address: Object,

  // List of saved shipping addresses. Each entry: { house, locality, city, state, pin, label?, isDefault? }.
  addresses: { type: [Object], default: [] },

  // Whether user is verified or not
  isVerified: Boolean

},{ timestamps: true });

const Users = new mongoose.model("Users", dbSchema);

module.exports = Users;
