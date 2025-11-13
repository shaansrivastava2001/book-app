const UserModel = require("../database/schema/user.schema");
const BookModel = require("../database/schema/book.schema");
const OtpModel = require("../database/schema/otp.schema");
const bcrypt = require("bcrypt");
const CommonEmailService = require("./email/common.service");

/**
 * Class for users service
 */
class UsersService {
  /**
   *
   * @returns {Array} list of all users in the users collection
   */

  static async getUsers(skip, limit, searchQuery) {
    try {
      const users = await UserModel.find({
        $or: [
          { username: { $regex: searchQuery, $options: "i" } },
          { name: { $regex: searchQuery, $options: "i" } },
        ],
      })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

      console.log(`UsersService.getUsers - success count=${users.length}`);
      return users;
    } catch (error) {
      console.error(`UsersService.getUsers - error`, error);
      throw error;
    }
  }

  /**
   * Number of users according to the filter
   * @param {String} searchQuery 
   * @returns {Integer} count of users
   */
  static async countUsers(searchQuery) {
    try {
      let count;
      if (searchQuery == "") {
        count = await UserModel.countDocuments();
      } else {
        count = await UserModel.countDocuments({
          $or: [{ name: { $regex: searchQuery, $options: "i" } }],
        });
      }
      console.log(`UsersService.countUsers - success count=${count}`);
      return count;
    } catch (error) {
      console.error(`UsersService.countUsers - error`, error);
      throw error;
    }
  }

  /**
   * Function to return a user from collection
   * @param {String} username
   * @returns {Object} user
   */
  static async findUserByUsername(username) {
    try {
      const user = await UserModel.findOne({ username: username });
      console.log(`UsersService.findUserByUsername - success id=${user?._id}`);
      return user;
    } catch (error) {
      console.error(`UsersService.findUserByUsername - error username='${username}'`, error);
      throw error;
    }
  }

  /**
   * Function to return a user from collection
   * @param {String} email
   * @returns {Object} user
   */
  static async findUserByEmail(email) {
    try {
      const user = await UserModel.findOne({ email });
      console.log(`UsersService.findUserByEmail - success id=${user?._id}`);
      return user;
    } catch (error) {
      console.error(`UsersService.findUserByEmail - error email='${email}'`, error);
      throw error;
    }
  }

  /**
   * Function to register a new user
   * @param {Object} body
   * @returns {Object} an object of the added user
   */
  static async registerUser(body) {
    try {
      let saltRounds = 10;
      let hashedPass = bcrypt.hashSync(body.password, saltRounds);
      body.password = hashedPass;
      body.role = "User";
      if (body.isVerified === undefined) {
        body.isVerified = false;
      }
      let newUser = new UserModel(body);

      await newUser.save();
      console.log(`UsersService.registerUser - success id=${newUser._id}`);
      return newUser;
    } catch (error) {
      console.error(`UsersService.registerUser - error username=${body.username}`, error);
      throw error;
    }
  }

  /**
   * Function to check if the user has entered correct password or not
   * @param {String} enteredPassword
   * @param {String} actualPassword
   * @returns {Boolean} a boolean value if password is right or not
   */
  static verifyUser(enteredPassword, actualPassword) {
    try {
      const verified = bcrypt.compareSync(enteredPassword, actualPassword);
      console.log(`UsersService.verifyUser - result=${verified}`);
      return verified;
    } catch (error) {
      console.error(`UsersService.verifyUser - error`, error);
      throw error;
    }
  }

  static async userVerified(id){
    try {
      const user = await UserModel.findByIdAndUpdate(id, {
        isVerified: true,
      });
      await user.save();
      console.log(`UsersService.userVerified - success id=${id}`);
      return user;
    } catch (error) {
      console.error(`UsersService.userVerified - error id=${id}`, error);
      throw error;
    }
  }

  /**
   * Function to count the number of donations done by a user
   * @param {ObjectId} id
   * @returns {Number} a value for the donations
   */
  static async countDonations(id) {
    try {
      const donationsCount = await BookModel.count({ donatedById: id });
      console.log(`UsersService.countDonations - success id=${id} count=${donationsCount}`);
      return donationsCount;
    } catch (error) {
      console.error(`UsersService.countDonations - error id=${id}`, error);
      throw error;
    }
  }

  /**
   * 
   * @param {String} id 
   * @returns {Object} donations done by the user
   */
  static async getDonations(id) {
    try {
      const donations = await BookModel.find({ donatedById: id });
      console.log(`UsersService.getDonations - success id=${id} count=${donations.length}`);
      return donations;
    } catch (error) {
      console.error(`UsersService.getDonations - error id=${id}`, error);
      throw error;
    }
  }
  /**
   * Get details of a user from collection
   * @param {String} id
   * @returns
   */
  static async getUser(id) {
    try {
      const user = await UserModel.findOne({ _id: id });
      console.log(`UsersService.getUser - success id=${id}`);
      return user;
    } catch (error) {
      console.error(`UsersService.getUser - error id=${id}`, error);
      throw error;
    }
  }

  /**
   * Finds user by his id from the users collection
   * @param {String} id
   * @returns a user object
   */
  static async findUserById(id) {
    try {
      let user = await UserModel.findOne({ _id: id });
      console.log(`UsersService.findUserById - success id=${id}`);
      return user;
    } catch (error) {
      console.error(`UsersService.findUserById - error id=${id}`, error);
      throw error;
    }
  }

  /**
   * Edits the address of user
   * @param {Object} address 
   * @param {String} id 
   * @returns {Object} Details of the user
   */
  static async addAddress(address,id){
    try {
      const user = await UserModel.findByIdAndUpdate(id, { address: address });
      await user.save();
      console.log(`UsersService.addAddress - success id=${id}`);
      return user;
    } catch (error) {
      console.error(`UsersService.addAddress - error id=${id}`, error);
      throw error;
    }
  }

  /**
   * Returns address of the user
   * @param {String} id 
   * @returns {Object} address of the user
   */
  static async getAddress(id){
    try {
      const user = await UserModel.findOne({ _id: id });
      console.log(`UsersService.getAddress - success id=${id}`);
      return user.address;
    } catch (error) {
      console.error(`UsersService.getAddress - error id=${id}`, error);
      throw error;
    }
  }

  /**
   * Sends the otp to the mail
   * @param {Object} user 
   * @returns {Object} the new otp document created in the otp collection
   */
  static async sendOtp(user){
    try {
      const otp = Math.floor(100000 + Math.random() * 900000);
      const expirationTime = Date.now() + 600000;

      await OtpModel.deleteMany({ userId: user._id });

      const emailObj = {
        name: user.name,
        userEmail: user.email,
        otp,
        from: `Book App ${process.env.EMAIL}`,
        subject: "OTP Details for Book App",
        html: `<p>Dear ${user.name},<br>Your One Time Password (OTP) for verification of your account is: <strong>${otp}.</strong> <br>The OTP will be valid for 10 minutes only. Click on resend otp for a new OTP.<br><br> Regards,<br> Book App</p>`,
      };

      const mailMessage = await CommonEmailService.sendEmail(emailObj);

      const newOtp = new OtpModel({
        email: user.email,
        otp,
        userId: user._id,
        expirationTime,
        isVerified: false,
      });

      await newOtp.save();
      console.log(`UsersService.sendOtp - success userId=${user._id} otp=${otp}`);
      return newOtp;
    } catch (error) {
      console.error(`UsersService.sendOtp - error userId=${user._id}`, error);
      throw error;
    }
  }

  /**
   * Verify the otp entered by the user
   * @param {String} id 
   * @param {Number} otp 
   * @returns {String} whether the otp is verified or not
   */
  static async verifyOtp(id,otp){
    try {
      const userOtp = await OtpModel.findOne({ userId: id });
      const currentTime = Date.now();
      if (!userOtp || userOtp.expirationTime < currentTime) {
        console.log(`UsersService.verifyOtp - expired or missing userId=${id}`);
        return "Invalid or expired OTP";
      }

      if (userOtp.otp !== otp) {
        console.log(`UsersService.verifyOtp - incorrect userId=${id}`);
        return "Incorrect OTP";
      }

      userOtp.verified = true;
      await userOtp.save();
      console.log(`UsersService.verifyOtp - success userId=${id}`);
      return "Correct OTP";
    } catch (error) {
      console.error(`UsersService.verifyOtp - error userId=${id}`, error);
      throw error;
    }
  }
}

module.exports = UsersService;
