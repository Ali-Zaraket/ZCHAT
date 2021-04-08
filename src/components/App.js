import React, { Component } from 'react';
import BaseRouter from './Router';
import {authCheckState, checkToken} from '../auth/auth';
import {BrowserRouter as Router} from 'react-router-dom';
import './main.css';

class App extends Component{
  constructor(props){
    super(props);
    this.state = {
      authenticated: null,
    }
  }
  componentDidMount(){
    const checkValidUser = authCheckState();
    checkValidUser();
    this.setState({
      authenticated: checkToken()
    })
  }

  render(){
    return(
      <div>
        {this.state.authenticated !== null ?
          <Router>
            <BaseRouter authenticated={this.state.authenticated} />
          </Router> : <span>LOADING...</span>}
      </div>
    );
  }
}

export default App;
