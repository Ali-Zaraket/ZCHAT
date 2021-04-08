import React, { Component } from 'react';
import { AUTH_ENDPOINT } from '../settings';
import { getCookie } from '../utility';
import {frontEndLogin} from '../auth/auth';
import './main.css';

class Register extends Component{
  constructor(props){
    super(props);
    this.state = {
      username : '',
      email    : '',
      password1: '',
      password2: '',
      error    : null,
    };
    this.validateFormSubmit = this.validateFormSubmit.bind(this);
  }
  validateFormSubmit(){
    var errorMessage = 'valid';
    if(this.state.password1 !== this.state.password2){
      errorMessage = "Passwords does not match ...";
    }
    else if(this.state.password1.length < 8){
      errorMessage = "Password must not be less than 8 characters..";
    }
    else if(this.state.password1.includes(this.state.username)){
      errorMessage = "password cannot contain personal information..";
    }
    else if(!isNaN(this.state.password1)){
      errorMessage = "Password cannot be entirely numeric..";
    }
    return errorMessage;
  }

  handleFormSubmit(e){
    e.preventDefault();
    const validator = this.validateFormSubmit();

    if(validator === "valid"){
      const url = AUTH_ENDPOINT + "create";
      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          username: this.state.username,
          email: this.state.email,
          password: this.state.password1,
        })
      };

      fetch(url, requestOptions).then(res => res.json()).then(data =>{
        if(data.error){
          this.setState({
            error: data.error
          })
        }
        if(data.token){
          frontEndLogin(data.token, data.id, data.username);
          this.props.history.push("/");
        }
      })

    } else {
      this.setState({
        error: validator,
      });
    }
  }

  handleFormChange(e){
    const value = e.target.value;
    const name  = e.target.name;
    this.setState({
      [name]: value,
    })
  }

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

  render() {
    return(
      <div className="container">
        {
          this.state.error ? 
            <div className="alert alert-danger" id="login-error" role="alert">
              {this.state.error}
              <span className="bi bi-x" id="delete-register-error" onClick={()=>{
                this.setState({error: null})
              }} />
            </div>
          : null
        }
        <div className="login-div">
          <legend className="header">
            Join Now !
          </legend>
          <form onSubmit={this.handleFormSubmit.bind(this)} className="login-form form-group">
            <div className="pt-3 pb-3">
              <input
                type="text"
                name="username"
                className="entry"
                value={this.state.username}
                onChange={this.handleFormChange.bind(this)}
                placeholder="Username"
              />
            </div>
            <div className="pt-3 pb-3">
              <input
                type="email"
                name="email"
                className="entry"
                value={this.state.email}
                onChange={this.handleFormChange.bind(this)}
                placeholder="username@email.com"
              />
            </div>
            <div className="pt-3 pb-3">
              <input
                type="password"
                name="password1"
                className="entry"
                value={this.state.password1}
                onChange={this.handleFormChange.bind(this)}
                placeholder="Password"
                id="password"
              />
              <span className="bi bi-eye-slash" id="field-icon" onClick={this.toggle.bind(this)}></span>
            </div>
            <div className="pt-3 pb-3">
              <input
                type="password"
                name="password2"
                className="entry"
                value={this.state.password2}
                onChange={this.handleFormChange.bind(this)}
                placeholder="Confirm password"
              />
            </div>
            <div className="button">
              <div className="row pt-4">
                <button type="submit" className="btn btn-danger pt-2 pb-2">Create</button>
              </div>
            </div>
            <div className="pt-4">
              <a href="/login" className="link">Already have an account ?</a>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default Register;