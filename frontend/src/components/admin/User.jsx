import { useEffect, useState, React } from 'react';
import { useNavigate } from 'react-router-dom';

import '../../styles/style.scss';

import UserService from '../../services/user.service';

/**
 * Function to return user component
 * @param {Object} props 
 * @returns {React.Component} User component
 */
const User = (props) => {
  //State variable for setting the donations made by the user
  const [donations, setDonations] = useState(0);
  
  const navigate = useNavigate();
  
  const {name,username,email,_id} = props.user;
  
  useEffect(() => {
    (async ()=>{
      const donationData =  await UserService.getDonations(_id);
      setDonations(donationData.data.donations);
    })();
  }, []);

  /**
   * Function to navigate to a route which shows details of user with given ID
   * @param {Object} user
   */
  const userDetails = () => {
    navigate(`/profile/${username}`,{
      state: {id:_id}
    });
  };
  
  return (
    <>
    <tr onClick={() => {userDetails()}}>
      <td>{name}</td>
      <td>{username}</td>
      <td>{email}</td>
      <td>{donations}</td>
    </tr>
    </>
  )
}

export default User;