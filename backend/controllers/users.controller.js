const OrderService = require("../services/order.service");
const UserService = require("../services/user.service");
const jwt = require('jsonwebtoken');

/**
 * Controller class for Users related operations.
 */
class UserController {
  /**
   * Retrieves the list of users from the database.
   * @param {Object} req
   * @param {Object} res
   * @returns {Response} status code with a message if users list is found or not
   * */

  static async getUsers (req,res){
    const page = Number(req.body.page) || 1;

    // Number fo documents per page
    const limit = Number(req.body.limit) || 5;

    // Formula for pagination, skip is the number of documents to skip from the collection
    const skip = (page - 1) * limit;

    try {
      const users = await UserService.getUsers(skip,limit,req.body.searchQuery);

      const usersCount = await UserService.countUsers(req.body.searchQuery);
      if (!users) {
        return res.status(401).json({ message: "No users found" });
      } else {
        return res.status(200).json({ users: users, usersCount: usersCount });
      }
    } catch (error) {
      console.log(error);
      return res.status(401).json({error: error})
    }
  }

  /**
   * Admin-only: create a user with a chosen role. Password is hashed by registerUser.
   * Account is created pre-verified (no email OTP required for admin-created users).
   */
  static async createUser(req, res) {
    try {
      const { name, username, email, password, role } = req.body;

      if (!name || !username || !email || !password || !role) {
        return res.status(400).json({ message: "All fields (name, username, email, password, role) are required" });
      }

      const allowed = UserService.getAllowedRoles();
      if (!allowed.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Must be one of: ${allowed.join(", ")}` });
      }

      const byEmail = await UserService.findUserByEmail(email);
      if (byEmail) return res.status(409).json({ message: "A user with this email already exists" });

      const byUsername = await UserService.findUserByUsername(username);
      if (byUsername) return res.status(409).json({ message: "Username is taken" });

      const created = await UserService.registerUser({
        name, username, email, password, role,
        isVerified: true,
      });
      if (!created) return res.status(500).json({ message: "Failed to create user" });

      // Strip password before returning
      const { password: _omit, ...safe } = created.toObject();
      return res.status(201).json({ user: safe });
    } catch (error) {
      console.error("createUser - error", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  }

  /**
   * Registers a new user in the database.
   * @param {Object} req
   * @param {Object} res
   * @returns {Response} status code with a message or new user
   */
  static async register(req, res) {
    try {
      // Check if the user already exists or not
      const user = await UserService.findUserByUsername(req.body.username);

      // If user exists the return a message
      if (user) {
        return res.status(500).json({ message: "User already exists" });
      }

      // Else add the new user to the users collection
      else {
        const newUser = await UserService.registerUser(req.body);
        if (!newUser) {
          return res.status(500).json({ message: "No user added, some error" });
        }

        return res.status(201).json({ newUser });
      }
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  }

  /**
   * Logs in a user using their credentials.
   * @param {Object} req
   * @param {Object} res
   * @returns {Response} status code with a message if logged in successfully or not
   */
  static async login(req, res) {
    try {
      // First find the user in the users collection
      const user = await UserService.findUserByEmail(req.body.email);

      // If user does not exists then return 500 internal server error
      if (!user) {
        return res.status(500).json({ message: "Invalid User" });
      }

      // Else verify the user and his/her password
      else {
        const verified = UserService.verifyUser(
          req.body.password,
          user.password
        );
        if (verified) {
          const token = jwt.sign(
            {
              name: user.name,
              email: user.email,
              username: user.username,
              _id: user._id,
              role: user.role
            }, 
            process.env.SECRET_KEY,
            {
              expiresIn: '1h'
            }
          );
          return res.status(201).json({ user, token });
        } else {
          return res.status(501).json({ message: "Password mismatch" });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Gets the number of donations made by a user.
   * @param {Object} req
   * @param {Object} res
   * @returns {Response} status code with a message
   */
  static async countDonations(req, res) {
    try {
      const donationsCount = await UserService.countDonations(req.params.id);
      return res.status(201).json({ donations: donationsCount });
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  }

  /**
   * Returns the donations done by the user
   * @param {Request} req 
   * @param {Response} res 
   * @returns {Object} donations done by the user
   */
  static async getDonations(req,res){
    try {
      const donations = await UserService.getDonations(req.params.id);
      return res.status(201).json({ donations: donations });
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  }

  /**
   * Returns the user details
   * @param {Request} req
   * @param {Response} res
   */
  static async getUser(req, res) {
    try {
      const user = await UserService.getUser(req.params.id);
      const donationsCount = await UserService.countDonations(req.params.id);
      const ordersCount = await OrderService.ordersCount(req.params.id);
      return res.status(201).json({ message: user,donationsCount, ordersCount });
    } catch (error) {
      console.log(error);
      return res.status(501).json({ message: "No user found" });
    }
  }

  /**
   * Registers google user at backend
   * @param {Request} req
   * @param {Response} res
   * @returns
   */
  static async registerGoogleUser(req, res) {
    const signToken = (u) => jwt.sign(
      { name: u.name, email: u.email, username: u.username, _id: u._id, role: u.role },
      process.env.SECRET_KEY,
      { expiresIn: '2h' }
    );

    try {
      let user = await UserService.findUserByEmail(req.body.email);

      if (!user) {
        // First-time Google sign-in: create the account.
        // The password field is required by the schema but is unused for Google users —
        // generate a random one server-side rather than trusting client-provided values.
        const created = await UserService.registerUser({
          ...req.body,
          password: require('crypto').randomBytes(24).toString('hex'),
          isVerified: true,
        });
        if (!created) {
          return res.status(500).json({ message: "Failed to register Google user" });
        }
        user = created;
      } else if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }

      return res.status(200).json({ user, token: signToken(user) });
    } catch (error) {
      console.error('registerGoogleUser - error', error);
      return res.status(500).json({ message: 'Google sign-in failed' });
    }
  }

  /**
   * Edits the address of the user
   * @param {Object} req 
   * @param {Object res 
   * @returns Response from the service
   */
  static async addAddress(req, res){
    try {
      // Caller's own user id from the verified JWT — never trust body.id.
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const result = await UserService.addAddress(req.body.address, userId);
      return res.status(201).json({ address: result.address });
    } catch (error) {
      console.error("addAddress - error", error);
      return res.status(500).json({ message: "Failed to save address" });
    }
  }

  /**
   * Get the user's first / legacy address (kept for backwards compat).
   */
  static async getAddress(req, res){
    try {
      const address = await UserService.getAddress(req.query.id || req.user?._id);
      return res.status(200).json({ address });
    } catch (error) {
      console.error("getAddress - error", error);
      return res.status(500).json({ message: "Failed to load address" });
    }
  }

  /**
   * Get all of the user's saved addresses (newest first).
   */
  static async getAddresses(req, res){
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const addresses = await UserService.getAddresses(userId);
      return res.status(200).json({ addresses });
    } catch (error) {
      console.error("getAddresses - error", error);
      return res.status(500).json({ message: "Failed to load addresses" });
    }
  }

  /**
   * Sends the otp to the user
   * @param {Object} req 
   * @param {Object} res 
   * @returns {Object} new otp formed
   */
  static async sendOtp(req,res){
    try {
      const id = req.body.id;
      const user = await UserService.findUserById(id);
      const result = await UserService.sendOtp(user);

      return res.status(201).json({ result });


    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error });
    }
  }

  /**
   * 
   * @param {Object} req 
   * @param {Object} res 
   * @returns {Boolean} whether the otp is verified or not
   */
  static async verifyOtp(req,res){
    try {
      const id = req.body.id;
      const otp = req.body.otp;
      const result = await UserService.verifyOtp(id,otp);

      if(result === 'Correct OTP'){
        await UserService.userVerified(id);
      }

      return res.status(201).json({ result });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error });
    }
  }

  /**
   * Dashboard stats for users (total user count).
   */
  static async getStats(_req, res) {
    try {
      const stats = await UserService.getStats();
      return res.status(200).json(stats);
    } catch (error) {
      console.error("getStats - error", error);
      return res.status(500).json({ message: "Failed to load stats" });
    }
  }
}

module.exports = UserController;
