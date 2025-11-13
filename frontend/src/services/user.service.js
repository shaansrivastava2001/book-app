import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const userServiceUrl = `${process.env.REACT_APP_USER_MS_URL}/users`;
const orderServiceUrl = `${process.env.REACT_APP_ORDER_MS_URL}/orders`;

/**
 * Utility class for handling User Services
 */
class UserService{

/**
 * Function to send request at backend for number of donations
 * @param {String} url
 * @returns {Number} the number of donations made by a user
 */
async getDonations(id) {
  const url = `${userServiceUrl}/donations/${id}`;
  const response = await axios.get(url, {
    params: {
      token: Cookies.get('token')
    }
  });
  return response;
};

/**
 * Get users based on pagination and filtering
 * @param {Number} page 
 * @param {Number} limit 
 * @param {String} search 
 * @returns {Promise<{users,usersCount}>}
 */
async getUsers(page,limit,search) {
  const url = `${userServiceUrl}/getUsers`;
  return ( await axios.post(url,{
    page: page, limit: limit, 
    searchQuery: search,
    token: Cookies.get('token')
  }));
};

// Fetch donations done by the user
async fetchDonations(userId){
  const url = `${userServiceUrl}/donations/${userId}`;
  return await axios.get(url,{
    params: {
      token: Cookies.get('token')
    }
  });
}

// Fetch donations done by the user
async fetchOrders(userId){
  const url = `${orderServiceUrl}/getOrder/${userId}`;
  return await axios.get(url, {
    params: {
      token: Cookies.get('token')
    }
  });
}

// Fetch donations done by the user
async fetchAllOrders(filters){
  const url = `${orderServiceUrl}/admin/getOrders`;
  return await axios.get(url, {
    params: {
      token: Cookies.get('token'),
      page: filters.page, limit: filters.limit, searchQuery: filters.search
    }
  });
}

/**
 * Sends Axios request to the backend for login
 * @param {String} email
 * @param {String} password
 * @returns
 */
async loginUser (email, password) {
  let res = await axios.post(`${userServiceUrl}/login`, {email, password});
  return res;
};

/**
 * Register new user to the backend database
 * @param {String} name
 * @param {String} username
 * @param {String} email
 * @param {String} password
 */
async registerUser (name, username, email, password) {
  try {
    const response = await axios
      .post(`${process.env.REACT_APP_USER_MS_URL}/register`, {
        name: name,
        email: email,
        username: username,
        password: password,
      });

      return response;
    } catch (error) {
      toast.error("User already exists");
    }
  };
  
  /**
   * Fetches user details
   * @param {String} url 
   * @returns response from backend after fetching user details
  */
async getUser (id){
  const url = `${userServiceUrl}/${id}`;
  const result = await axios.get(url,{
    params: 
    {
      token: Cookies.get('token')
    }
  });
  return result;
}

/**
 * Post google user to backend
 * @param {Object} userObj
*/
async postGoogleUser (userObj) {
  try {
    let res = await axios
    .post(`${process.env.REACT_APP_USER_MS_URL}/registerGoogleUser`, userObj);
    return res;
  } catch (error) {
    console.log(error);
    toast.error("User already exists");
  }
};

/**
 * Gets the profile of user
 * @param {String} id 
 * @returns {Object} Details of the user
*/
async getUserProfile(id) {
  try {
    return await axios
    .get(`${userServiceUrl}/${id}`,{
      params: {
        token: Cookies.get('token')
      }
    })
    .then((res)=> res.data);
  } catch (error) {
    console.log(error);
  }
};

/**
 * Saves the address in the backend
 * @param {Object} address 
 * @returns {Object} Response from the API call at backend
*/
async addAddress(address){
  try {
    let res = await axios.post(`${userServiceUrl}/addAddress`,{
      address,token: Cookies.get('token'),id: JSON.parse(Cookies.get('userToken'))._id
    });

    return res;
  } catch (error) {
    console.log(error);
  }
}

/**
 * 
 * @returns Address of the user
*/
async getAddress(userId){
  let response = await axios.get(`${userServiceUrl}/info/getAddress`,{
    params: {
      token: Cookies.get('token'),
      id: userId
    }
  });
  
  return response;
}

/**
 * Sends otp to the user after registration
 * @param {String} id 
 * @returns response whether otp has been sent
*/
async sendOtp(id){
  let response = await axios.post(`${userServiceUrl}/sendOtp`,{id});
  return response;
}

/**
 * Verifies the otp that user has entered
 * @param {String} id 
 * @param {Number} code 
 * @returns whether the otp is correct or not
*/
async verifyOtp(id,code){
  let response = await axios.post(`${userServiceUrl}/verifyOtp`,{id,otp:code});
  return response;
}

};

export default new UserService();