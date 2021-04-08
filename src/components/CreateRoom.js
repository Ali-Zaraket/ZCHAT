import React, { Component } from 'react';
import  {ROOMS_ENDPOINT} from '../settings';
import {getCookie} from '../utility';
import { checkToken } from '../auth/auth';
import './main.css';

class CreateRoom extends Component {
  constructor(props){
    super(props);
    this.state = {
      roomName   : '',
      maxMembers : '',
      description: '',
      error      : null,
    };
    this.fetchCreateRoom = this.fetchCreateRoom.bind(this);
    this.handleFormChange= this.handleFormChange.bind(this);
  }
  componentDidMount() {
    if(!checkToken()){
      this.props.history.push("/login");
    }
  }

  fetchCreateRoom(){
    const url = ROOMS_ENDPOINT + "create";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")
      },
      body: JSON.stringify({
        roomName: this.state.roomName,
        maxMembers: this.state.maxMembers,
        description: this.state.description,
      })
    };
    fetch(url, requestOptions).then(response => response.json()).then(data=>{
      console.log(data);
      if(data.error){
        this.setState({
          error: data.error,
        });
      } else {
        window.location.replace('/room/' + data.id);
      }
    })
  }

  handleFormSubmit(event){
    event.preventDefault();
    this.fetchCreateRoom();
  }
  
  handleFormChange(event){
    this.setState({
      [event.target.name]: event.target.value,
    })
  }

  render() {
    return(
      <div className="container pt-5">
        <div>
          <legend className="display-6" align="center">
            Create New Room
          </legend>
          <form onSubmit={this.handleFormSubmit.bind(this)} className="login-form form-group">
            <div className="pt-3 pb-3">
              <input
                type="text"
                name="roomName"
                className="entry"
                value={this.state.roomName}
                placeholder="Room Name"
                onChange={this.handleFormChange}
              />
            </div>
            <div className="pt-3 pb-3">
              <input
                type="number"
                name="maxMembers"
                className="entry"
                value={this.state.maxMembers}
                placeholder="Room max members number"
                min="1"
                max="25"
                onChange={this.handleFormChange}
              />
            </div>
            <div className="pt-3 pb-3">
              <textarea
                type="text"
                name="description"
                className="entry"
                maxlength="40"
                value={this.state.description}
                placeholder="description (in 40 characters)"
                onChange={this.handleFormChange}
              />
            </div>
            <div className="button">
              <div className="row pt-4">
                <button type="submit" className="btn btn-danger pt-2 pb-2">Create</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default CreateRoom;