import React, { Component } from 'react';
import {AUTH_ENDPOINT} from '../settings';
import { checkToken } from '../auth/auth';
import { getCookie } from '../utility';
import './main.css';


class VisitProfile extends Component {
  constructor(props){
    super(props);
    this.state = {
      user          : {},
      profile       : {},
      isCurrentUser : false,
      editing       : false, 
      message       : {},
      confirming    : false,
      newImage      : null,
      roomsJoined   : [],
      showRooms     : true,
    };
    this.handleSettingsButtonClick = this.handleSettingsButtonClick.bind(this);
    this.fetchProfile = this.fetchProfile.bind(this);
    this.renderSettings = this.renderSettings.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.fetchUpdate = this.fetchUpdate.bind(this);
    this.handleImageSubmit = this.handleImageSubmit.bind(this);
    this.renderPopupConfirmation = this.renderPopupConfirmation.bind(this);
  }

  componentDidMount(){
    if(checkToken()){
      this.fetchProfile(false);
    } else {
      this.props.history.push("/");
    }
  }

  handleImageSubmit(event){
    event.preventDefault();
    const data = new FormData();
    data.append("image", this.state.newImage);
    const headers = {};
    this.fetchUpdate(data, headers);
  }

  handleFormSubmit(e){
    e.preventDefault();
    const data = JSON.stringify({
      user: this.state.user,
      profile: this.state.profile,
    });
    const headers = {
      "Content-Type": "application/json",
    };
    this.fetchUpdate(data, headers);
  }

  fetchUpdate(data, headers){
    headers['X-CSRFToken'] = getCookie("csrftoken");
    const url = AUTH_ENDPOINT + "update";
    const requestOptions = {
      method: "POST",
      headers: headers,
      body: data
    };
    fetch(url, requestOptions).then(response => {
      return response.json();
    })
    .then(data => {
      if(data.error){
        this.setState({
          message: {
            type: "danger",
            content: data.error,
          }
        })
        this.fetchProfile(true);

      } else if(data.user.id){
        this.setState({
          editing: false,
          message: {
            type: "success",
            content: "Successfully updated !",
          }
        });
        this.fetchProfile(false);
      }
    });
  }

  fetchProfile(editing){
    const id = this.props.match.params.userId;
    const url = AUTH_ENDPOINT + id;
    fetch(url).then(response => response.json()).then(data => {
      this.setState({
        user         : data.user,
        profile      : data.profile,
        isCurrentUser: data.isCurrentUser,
        editing      : editing,
        roomsJoined  : data.userRooms
      })
    });
  }

  handleDeleteAccountClick(){
    const url = AUTH_ENDPOINT+ "delete";
    const requestOptions= {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")
      },
      body: JSON.stringify({
        token: localStorage.getItem("token")
      })
    };
    fetch(url, requestOptions).then(res => res.json()).then(data=> {
      if (data.error){
        this.setState({
          message: {
            type: "danger",
            content: data.error,
          }
        })
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("id");
        localStorage.removeItem("user");
        window.location.replace("/");
      }
    });
  }

  handleSettingsButtonClick(){
    this.setState({
      editing: true,
    })
  }
  
  renderSettings(){
    return(
      <div className="container mt-2">
        {this.state.confirming ? this.renderPopupConfirmation(): null}
        <div className="profile-wrapper">
          <div className="row pb-3 border-bottom border-2">
            <div align="center">
              <img src={this.state.profile.image} alt="profile" className="rounded-circle" width="150" height="150" />    
            </div>
            <form encType="multipart/form-data" onSubmit={this.handleImageSubmit}>
              <div className="row">
                <div className="pb-3 pt-3 col-8">
                  <label className="label">
                    Profile Image*
                  </label>
                  <input type="file" onChange={(e)=>{this.setState({
                    newImage: e.target.files[0],
                  })}}/>
                </div>
                <div className="col-5 pb-1 pt-4">
                  <button type="submit" className="btn btn-success">
                    Update Image
                  </button>
                </div>
              </div>
            </form>
          </div>
          <div className="mt-3">
            <form onSubmit={this.handleFormSubmit}>
              <div className="pt-3 pb-3">
                <label className="label">
                  Username*
                </label>
                <input 
                  type="text"
                  required
                  className="form-control" 
                  value={this.state.user.username}
                  placeholder="Username"
                  onChange={(e)=>{
                    this.setState({
                      user: {
                        ...this.state.user,
                        username: e.target.value,
                      }
                    })
                  }}
                  name="userName"
                />
                <span>Username cannot contain symbols..</span>
              </div>
              <div className="pt-3 pb-3">
                <label className="label">
                  Email*
                </label>
                <input 
                  type="email"
                  required
                  className="form-control" 
                  value={this.state.user.email}
                  placeholder="Email"
                  onChange={(e)=>{
                    this.setState({
                      user: {
                        ...this.state.user,
                        email: e.target.value,
                      }
                    })
                  }}
                  name="email"
                />
              </div>
              <div className="pt-3 pb-3">
                <label className="label">
                  Bio*
                </label>
                <textarea 
                  type="text"
                  className="form-control" 
                  value={this.state.profile.bio}
                  placeholder="Bio"
                  onChange={(e)=>{
                    this.setState({
                      profile: {
                        ...this.state.profile,
                        bio: e.target.value,
                      }
                    })
                  }}
                  name="bio"
                  height="120"
                />
              </div>
              <div align="center">
                <div className="row mt-3 mb-5">
                  <div className="col-6">
                    <button className="btn btn-danger" onClick={()=>{this.setState({editing: false, confirming: false})}}>
                      Back
                    </button>
                  </div>
                  <div className="col-6">
                    <button className="btn btn-success" type="submit">
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div className="row pt-3 border-top border-light border-2">
            <button type="submit" className="btn btn-danger" onClick={()=>{
              this.setState({confirming: true});
              }}>
              Delete Account <span className="bi bi-trash-fill" style={{color: 'white', padding: '10px'}}/>
            </button>
          </div>
        </div>
      </div>  
    );
  }
  
  renderPopupConfirmation(){
    return(
      <div className="popup">
        <div className="row border-bottom border-2 pb-4">
          <div className="col-10">
            <legend className="display-6">
              Confirm Delete Account
            </legend>
          </div>
          <div className="col-1">
            <span className="bi bi-x icon" onClick={()=>this.setState({confirming: false})} />
          </div>
        </div>
        <div className="pt-4">
          <p>
            Are you sure to delete your account?<br />
            You will lose all activities <br />
          </p>
        </div>
        <div className="row pt-3">
          <button className="btn btn-danger" onClick={this.handleDeleteAccountClick} >
            Delete Account
          </button>
        </div>
      </div>
    );
  }

  render() {
    return(
      <div className="container pt-4">
        {
          this.state.message.content ? 
            <div className={`alert alert-${this.state.message.type}`} id="profile-msg" role="alert">
              {this.state.message.content}
              <i className="bi bi-x" id="delete-profile-msg" onClick={()=>{this.setState({message: {}})}}/>
            </div>
          : null
        }
        {this.state.editing ? this.renderSettings() : 
          <div className="profile-wrapper">
            <div className="row pb-3">
              <div className="col-4">
                <img src={this.state.profile.image} alt="profile" className="rounded-circle" width="150" height="150"/>
              </div>
              <div className="col-6">
                <h6 className="display-6 border-bottom border-2 border-light ml-4" style={{padding: 25}}>
                  {this.state.user.username}
                </h6>
              </div>
              {this.state.isCurrentUser ? 
                <div className="col-2">
                  <span className="bi bi-gear" id="settings-button" onClick={this.handleSettingsButtonClick}/>
                </div>
              : null}
            </div>
            <div style={{width:300}} className="mt-4 pb-3">
              <p>
                {this.state.profile.bio}
              </p>
            </div>
            <div className="border-top border-2 pt-3">
              <div className="row">
                <div className="col-8">
                  <label className="ml-4 pb-2" style={{fontSize: "25px"}}>
                    Rooms Joined:  <span className="bi bi-caret-down-fill" style={{fontSize: "20px"}} id="toggleRooms" onClick={()=>{
                      if(document.getElementById("toggleRooms").className === "bi bi-caret-right-fill"){
                        document.getElementById("toggleRooms").className = "bi bi-caret-down-fill";
                      } else {
                        document.getElementById("toggleRooms").className = "bi bi-caret-right-fill";
                      }
                      this.setState({
                        showRooms: !this.state.showRooms
                      })
                    }} />  
                  </label>
                </div>
                  {this.state.isCurrentUser ?
                    <div className="col-3">
                      <span className="bi bi-plus-square" id="add-room-button" onClick={()=>{
                        this.props.history.push("/rooms/create");
                      }} />
                    </div>
                    : null
                  }
              </div>
              {
                this.state.showRooms ? 
                  <div className="container ml-4 mr-4 pt-4">
                    {
                      this.state.roomsJoined.map((room)=>{
                        return(
                          <div className="row roomDiv">
                            <div className="col-8">
                              <a href={`/room/${room.id}/`}><legend className="display-6">{room.name}</legend></a>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div> 
                : null
              }
            </div>
          </div>}
      </div>      
    );
  }
}

export default VisitProfile;