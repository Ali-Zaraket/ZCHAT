import React, { Component } from 'react';
import {ROOMS_ENDPOINT} from '../settings';
import { checkToken } from '../auth/auth';
import {getCookie} from '../utility';
import Chat from './Chat';
import Feed from './Feed';
import './main.css';


class Room extends Component{
  constructor(props){
    super(props);
    this.state = {
      room      : {},
      isAdmin   : false,
      members   : [],
      editing   : false,
      confirming: false,
      message   : {},
      showChat  : false,
    };
    this.feedElement = React.createRef();
    this.roomId                  = this.props.match.params.roomId;
    this.fetchRoom               = this.fetchRoom.bind(this);
    this.handleFormChange        = this.handleFormChange.bind(this);
    this.renderSettings          = this.renderSettings.bind(this);
    this.fetchUpdateRoom         = this.fetchUpdateRoom.bind(this);
    this.handleFormSubmit        = this.handleFormSubmit.bind(this);
    this.renderPopupConfirmation = this.renderPopupConfirmation.bind(this);
    this.handleDeleteRoomClick   = this.handleDeleteRoomClick.bind(this);
    this.fetchLeaveRoom          = this.fetchLeaveRoom.bind(this);
    this.setMessageCallback      = this.setMessageCallback.bind(this);
  }

  componentDidMount(){
    if(!checkToken()){
      this.props.history.push("/login");
    } else {
      this.fetchRoom(false);
    }
  }

  fetchRoom(editing){
    const url = ROOMS_ENDPOINT + this.roomId;
    fetch(url).then(response => {
      if(!response.ok){
        window.location.replace('/rooms/create');
      }
      return response.json();
    }).then(data=>{
      this.setState({
        room: data.room,
        isAdmin: data.isAdmin,
        members: data.members,
        editing: editing,
      });
    });
  }
  setMessageCallback(message){
    this.setState({
      message: message,
    })
  }

  fetchLeaveRoom(){
    const url = ROOMS_ENDPOINT + this.roomId + "/leave";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        token: localStorage.getItem("token"),
      })
    };
    fetch(url, requestOptions).then(response => {
      if(response.ok){
        window.location.replace("/");
      } else {
        this.setState({
          message: {
            type: "danger",
            content: "Something went wrong try again later.."
          }
        })
      }
    })
  }

  fetchUpdateRoom(){
    const url = ROOMS_ENDPOINT+ "update";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        room: this.state.room,
      })
    };
    fetch(url, requestOptions).then(response => response.json()).then(data=>{
      if(data.error){
        this.setState({
          message: {
            type: "danger",
            content: data.error
          }
        });
        this.fetchRoom(true);
      }
      if(data.id){
        this.setState({
          editing: false,
          message: {
            type: "success",
            content: "Successfully Updated.."
          }
        });
        this.fetchRoom(false);
      }
    })
  }

  handleFormSubmit(e){
    e.preventDefault();
    this.fetchUpdateRoom();
  }

  handleFormChange(e){
    this.setState({
      room: {
        ...this.state.room,
        [e.target.name]: e.target.value,
      }
    })
  }

  handleDeleteRoomClick(){
    const url = ROOMS_ENDPOINT + "delete/" + this.state.room.id;
    fetch(url).then(response => {
      if(response.ok){
        window.location.replace("/");
      }
    })
  }

  renderPopupConfirmation(){
    return(
      <div className="popup">
        <div className="row border-bottom border-2 pb-4">
          <div className="col-10">
            <legend className="display-6">
              Confirm Delete Room
            </legend>
          </div>
          <div className="col-1">
            <span className="bi bi-x icon" onClick={()=>this.setState({confirming: false})} />
          </div>
        </div>
        <div className="pt-4">
          <p>
            Are you sure to delete this Room?<br />
          </p>
        </div>
        <div className="row pt-3">
          <button className="btn btn-danger" onClick={this.handleDeleteRoomClick} >
            Delete Room
          </button>
        </div>
      </div>
    );
  }

  renderSettings(){
    return(
      <div className="container mt-2">
        {this.state.confirming ? this.renderPopupConfirmation():null}
        <div className="profile-wrapper">
          <div className="row pb-3 border-bottom border-2">
            <div align="left">
              <legend className="display-6">
                {this.state.room.name}
              </legend>    
            </div>
          </div>
          <div className="mt-3">
            <form onSubmit={this.handleFormSubmit}>
              <div className="pt-3 pb-3">
                <label className="label">
                  Room Name*
                </label>
                <input type="text" required className="form-control" value={this.state.room.name}
                  placeholder="Room Name"
                  onChange={this.handleFormChange}
                  name="name"
                />
              </div>
              <div className="pt-3 pb-3">
                <label className="label">
                  Maximum Members
                </label>
                <input type="number" required className="form-control" value={this.state.room.max_members}
                  placeholder="max members"
                  onChange={this.handleFormChange}
                  name="max_members"
                />
              </div>
              <div className="pt-3 pb-3">
                <label className="label">
                  Description*
                </label>
                <textarea type="text" className="form-control" value={this.state.room.description}
                  placeholder="description"
                  onChange={this.handleFormChange}
                  name="description"
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
              Delete Room <span className="bi bi-trash-fill" style={{color: 'white', padding: '10px'}}/>
            </button>
          </div>
        </div>
      </div>  
    );
  }

  render() {
    return(
      <div className="container pt-2">
        {
          this.state.message.content ? 
            <div className={`alert alert-${this.state.message.type} pb-3`} id="profile-msg" role="alert">
              {this.state.message.content}
              <i className="bi bi-x" id="delete-profile-msg" onClick={()=>{this.setState({message: {}})}}/>
            </div>
          : null
        }
        {this.state.editing ? this.renderSettings():
        <div>
          <div className="profile-wrapper">
            <div className="row border-bottom border-light border-2" align="left">
              <legend className="display-6 col-7" >{this.state.room.name}</legend>
              <div className="dropdown col-5">
                <span className="dropdown-toggle bi bi-three-dots-vertical" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false" style={{float: "right"}}/>
                {this.state.isAdmin ? 
                  <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                    <li><a className="dropdown-item" href="add-user"><span className="bi bi-person-plus" />  Add Member</a></li>
                    <li><span className="dropdown-item" onClick={()=>(this.feedElement.current ? this.feedElement.current.setState({showForm: true}) : null)}><span className="bi bi-file-post" />   New Post</span></li>

                    <li><span className="dropdown-item" onClick={()=>this.setState({editing: true})}><span className="bi bi-gear"/>  Settings</span></li>
                    <li><a className="dropdown-item" href="members"><span className="bi bi-person" />   Members</a></li>
                  </ul>
                  :
                  <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                    <li><a className="dropdown-item" href="members"><span className="bi bi-person" />   Members</a></li>
                    <li><span className="dropdown-item" onClick={()=>(this.feedElement.current ? this.feedElement.current.setState({showForm: true}) : null)}><span className="bi bi-file-post" />   New Post</span></li>
                    <li><a className="dropdown-item" href="#leave" onClick={this.fetchLeaveRoom}><span className="bi bi-box-arrow-right" />   Leave</a></li>
                  </ul>
                }
              </div>
            </div>
            <div className="row">
              <div className="col-8">
                <small className="text-light">{this.state.room.description}</small>
              </div>
              <div className="col-4">
                <a className="text-light" href="members" >
                  Members: {this.state.members.length}/{this.state.room.max_members}
                  {this.state.members.length === this.state.room.max_members ? <small className="text-danger">   Full</small> : null}
                </a>
              </div>
            </div>
          </div>
          <div className="pt-3">
            <div className="row border-bottom" style={{padding: "5px"}}>
              <div className="col-5" style={{marginLeft: "60px"}}>
                <span className="bi bi-newspaper" id="navbtn" onClick={()=>{this.setState({showChat: false})}}>   Feed</span>
              </div>
              <div className="col-5" style={{marginLeft: "10px"}}>
                <span className="bi bi-chat" id="navbtn" onClick={()=>this.setState({showChat: true})}>   Chats</span>
              </div>
            </div>
          </div>
          {this.state.showChat ? 
            this.state.room.name ?
              <Chat roomId={this.roomId} name={this.state.room.name} admin={this.state.room.admin} /> 

            : <span className="bi bi-hourglass-split" />
            
          : <Feed roomId={this.roomId} ref={this.feedElement} admin={this.state.room.admin} msgCallback={this.setMessageCallback} />}
        </div>
        }
      </div>
    );
  }
}

export default Room;