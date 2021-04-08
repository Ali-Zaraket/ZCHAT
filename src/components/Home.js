import React, { Component } from 'react';
import { checkToken } from '../auth/auth';
import { withRouter } from 'react-router-dom';
import './main.css';


class Home extends Component {
  componentDidMount() {
    if(!checkToken()){
      window.location.replace('/login');
    };
  }

  render() {
    return(
      <div>
        <h1 className="display-5" align="center">Home</h1>
      </div>
    );
  }
}

export default withRouter(Home);