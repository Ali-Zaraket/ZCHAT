import React from 'react';
import { checkToken } from '../auth/auth';
import {ROOMS_ENDPOINT} from '../settings';
import { getCookie} from '../utility';
import './main.css';


class Members extends React.Component{
  constructor(props){
    super(props);
    this.state = {
      members : [],
      roomName: null,
      success : null,
      admin   : null,
      isAdmin : false
    };
    this.roomId = this.props.match.params.roomId;
    this.fetchMembers = this.fetchMembers.bind(this);
    this.fetchDeleteMember = this.fetchDeleteMember.bind(this);
  }
  componentDidMount(){
    if(checkToken()){
      this.fetchMembers();
    } else {
      window.location.replace('/login');
    }
  }

  fetchMembers(){
    const url = ROOMS_ENDPOINT + this.roomId + "/members";
    fetch(url).then(response => response.json()).then(data=> {
      this.setState({
        members: data.members,
        roomName: data.roomName,
        admin: data.admin,
        isAdmin: data.isAdmin
      });
    })
  }

  fetchDeleteMember(member){
    const url = ROOMS_ENDPOINT + this.roomId + "/remove-user";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")
      },
      body: JSON.stringify({
        member: member
      })
    };

    fetch(url, requestOptions).then(response => {
      if (response.ok){
        this.setState({
          success: "Member removed successfully..."
        });
        this.fetchMembers();
      }
    })

  }

  render(){
    return(
      <div className="container">
        {
          this.state.success ? 
            <div className={`alert alert-success pb-3`} id="profile-msg" role="alert">
              {this.state.success}
              <i className="bi bi-x" id="delete-profile-msg" onClick={()=>{this.setState({success: null})}}/>
            </div>
          : null
        }
        <div className="profile-wrapper">
          <div className="row border-bottom border-2 border-light">
            <legend className="display-6 pb-3">
              {this.state.roomName} Members
            </legend>
          </div>
          <div className="container pt-2">
            {
              this.state.members.map((member)=>{
                return(
                  <div className="roomDiv row">
                    <div className="col-3">
                      <img src={member.profile} className="rounded-circle" alt="profile" width="60" height="60" />
                    </div>
                    <div className="col-6 pt-3">
                      <a href={`/users/${member.id}`}>
                        <legend className="display-6 text-dark">
                          {member.username}
                        </legend>
                      </a>
                    </div>
                    <div className="col-1 pt-2 pl-4">
                      {member.id !== this.state.admin.id ? 
                        this.state.isAdmin ? <span className="bi bi-person-dash add-mem" onClick={()=>{this.fetchDeleteMember(member)}} /> : null
                        : <span className="bi bi-star-fill" style={{color: "yellow", fontSize: "24px"}} />
                      }
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    );
  }
}

export default Members;