import React, { Component } from 'react';
import {AUTH_ENDPOINT} from '../settings';
import { getCookie } from '../utility';
import {frontEndLogin} from '../auth/auth';
import './main.css';

class Login extends Component{
  constructor(props){
    super(props);
    this.state = {
      username: '',
      password: '',
      error   : null,
    };
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
  }
  
  handleFormSubmit(e){
    e.preventDefault();
    const url = AUTH_ENDPOINT + "login";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password,
      })
    };
    fetch(url, requestOptions).then(response => response.json())
    .then(data => {
      if(data.error){
        this.setState({
          error: data.error,
        })
      }
      if(data.token){
        frontEndLogin(data.token, data.id, data.username);
        this.props.history.push('/');
      }
    })
    .catch(error => {
      console.log(error);
    })
  };

  toggle(){
    var icon = document.getElementById("field-icon");
    var input = document.getElementById('password');
    if (input.type === "text"){
      input.type = "password";
      icon.className = "bi bi-eye-slash";
    } else {
      input.type = "text";
      icon.className = "bi bi-eye";
    }
  }

  handleFormChange(event){
    const value = event.target.value;
    const name = event.target.name;
    this.setState({
      [name]: value,
    })
  }

  render() {
    return(
      <div className="container">
        {
          this.state.error ? 
            <div className="alert alert-danger" id="login-error" role="alert">
              {this.state.error}
              <span className="bi bi-x" id="delete-login-error" onClick={()=>{
                this.setState({error: null})
              }} />
            </div>
          : null
        }
        <div className="login-div">
          <legend className="header">
            Welcome back
          </legend>
          <form onSubmit={this.handleFormSubmit} className="login-form form-group">
            <div className="pt-3 pb-3">
              <input
                type="text"
                name="username"
                className="entry"
                value={this.state.username}
                onChange={this.handleFormChange}
                placeholder="Username"
              />
            </div>
            <div className="pt-3 pb-3">
              <input
                type="password"
                name="password"
                className="entry"
                value={this.state.password}
                onChange={this.handleFormChange}
                placeholder="Password"
                id="password"
              />
              <span className="bi bi-eye-slash" id="field-icon" onClick={this.toggle.bind(this)}></span>
            </div>
            <div className="button">
              <div className="row pt-4">
                <button type="submit" className="btn btn-danger pt-2 pb-2">Login</button>
              </div>
            </div>
            <div className="pt-4">
              <a href="/signup" className="link">Don't have an account yet ?</a>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default Login;
