import React, { Component } from 'react';
import { AUTH_ENDPOINT, ROOMS_ENDPOINT } from '../settings';
import { getCookie} from '../utility';
import {checkToken} from '../auth/auth';
import './main.css';

class Users extends Component{
  constructor(props){
    super(props);
    this.state = {
      users: [],
      error: null,
      searchUsers: [],
      searchTerm: '',
    }
    this.roomId = this.props.match.params.roomId;
    this.fetchAddUser = this.fetchAddUser.bind(this);
    this.fetchUsers = this.fetchUsers.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount(){
    if(checkToken()){
      this.fetchUsers();
    } else {
      window.location.replace("/login");
    }
  }

  fetchAddUser(user){
    const url = ROOMS_ENDPOINT + this.roomId + "/add-user";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")  
      },
      body: JSON.stringify({
        user: user
      })
    };
    fetch(url, requestOptions).then(res => res.json()).then(data=>{
      if(data.error){
        this.setState({
          error: data.error
        })
      } else {
        window.location.replace("/room/"+ data.id)
      }
    });
  }

  fetchUsers(){
    const url = AUTH_ENDPOINT + "";
    fetch(url).then(response => response.json()).then(data =>{
      this.setState({users: data, searchUsers:data})
    });
  }

  handleChange(e){
    const searchTerm = e.target.value;
    if(searchTerm){
      const results = [];
      this.state.users.map(user=>{
        if(user.username.toLowerCase().includes(searchTerm.toLowerCase())){
          results.push(user);
        }
      })
      this.setState({
        searchUsers: results,
      })
    } else{
      this.setState({
        searchUsers: this.state.users,
      })
    }
  }

  render(){
    return (
      <div className="container">
        {
          this.state.error ? 
            <div className={`alert alert-danger pb-3`} id="profile-msg" role="alert">
              {this.state.error}
              <i className="bi bi-x" id="delete-profile-msg" onClick={()=>{this.setState({error: null})}}/>
            </div>
          : null
        }
        <div className="profile-wrapper">
          <div className="row border-bottom border-light border-2" align="left">
            <legend className="display-6">
              Users
            </legend>
          </div>
          <div className="pt-2 pb-2" style={{padding: "20px"}}>
            <form className="row">
              <input className="form-control" type="text" onChange={this.handleChange} placeholder="Search for user" />
            </form>
          </div>
          <div className="pt-4">
            {this.state.searchUsers.map((user)=>{
              return(
                <div className="roomDiv">
                  <div className="row">
                    <div className="col-3">
                      <img src={user.profile} className="rounded-circle" alt="profile" width="60" height="60" />
                    </div>
                    <div className="col-6 pt-3">
                      <a href={`/users/${user.id}`}>
                        <legend className="display-6 text-dark">
                          {user.username}
                        </legend>
                      </a>
                    </div>
                    <div className="col-1 pt-2 pl-4">
                      <span className="bi bi-plus add-mem" onClick={()=>this.fetchAddUser(user)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default Users;