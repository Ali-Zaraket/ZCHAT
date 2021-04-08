import axios from 'axios';
import {AUTH_ENDPOINT} from '../settings';

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("id");
  localStorage.removeItem("user");
  axios.get(AUTH_ENDPOINT + "logout");
  window.location.replace('/login');
}

export const frontEndLogin = (token, id, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("id", id);
  localStorage.setItem("user", user);
};

export const authSuccess = (token) => {
  return {
    type: "AUTH_SUCCESS",
    token: token
  }
};

export const authCheckState = () => {
  return () => {
    const token = localStorage.getItem('token');
    if (token){
      axios.get(AUTH_ENDPOINT + "isAuthenticated")
      .then(res => {
        const realToken = res.data.token;
        if(token === realToken && res.data.authenticated){
          authSuccess(token)
        } else {
          logout()
        }
      })
    }
  }
}

export const checkToken = () => {
  if(localStorage.getItem('token')){
    return true;
  }
  return false;
}
