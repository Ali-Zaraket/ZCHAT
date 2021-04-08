import React, { Component } from 'react';
import {logout } from '../auth/auth';
import './main.css';


class Navbar extends Component {
  render() {
    return(
      <nav className="navbar navbar-expand-lg navbar-light bg-light pt-3 pb-3">
      <div className="container-fluid">
        <a className="navbar-brand" href="/">Z-Chat</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          {this.props.authenticated ? 
            <ul className="navbar-nav">
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="" id="navbarDropdownMenuLink" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Account
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                  <li><a className="dropdown-item" href={"/users/" + localStorage.getItem("id")}>Profile</a></li>
                  <li><span className="dropdown-item" onClick={logout}>logout</span></li>
                </ul>
              </li>
            </ul>
            :
            <ul className="navbar-nav">
              <li className="nav-item">
                <a href="/login" className="nav-link">Login</a>
              </li>
              <li className="nav-item">
                <a href="/signup" className="nav-link">Signup</a>
              </li>
            </ul>
          }
        </div>
      </div>
    </nav>
    );
  }
}

export default Navbar;