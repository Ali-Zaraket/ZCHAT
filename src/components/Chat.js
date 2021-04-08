import React, { Component } from 'react';
import io from "socket.io-client";
import {SERVER_ENDPOINT, ROOMS_ENDPOINT, MESSAGES_ENDPOINT} from '../settings';
import {getTime , getCookie} from '../utility';
import './main.css';


class Chat extends Component {
	constructor(props){
		super(props);
		this.state = {
			message: null,
			messages: [],
		};

		this.sendMessage  = this.sendMessage.bind(this);
		this.loadMessages = this.loadMessages.bind(this);
    this.fetchCreateMessage = this.fetchCreateMessage.bind(this);
    this.renderSentMessage = this.renderSentMessage.bind(this);
    this.renderReceivedMessage = this.renderReceivedMessage.bind(this);
    this.scrollDiv = this.scrollDiv.bind(this);
	}

	componentDidMount() {
    this.loadMessages();
    
		this.socket = io(SERVER_ENDPOINT, {
      withCredentials: true,
    });

    this.socket.emit('join', {
      room: this.props.name
    })

    this.socket.on('serverMSG', (data)=>{
      if(data.sender){
        var msg = `
          <div class="received-message">
            <div class="row">
              <div class="col-1"></div>
              <div class="col-7">
                <a href={"/users/${data.sender_id}"}>
                  <legend class="border-bottom">
                    ${data.sender}
                  </legend>
                </a>
              </div>
              <div class="col-2">
                <small class="text-dark">
                  ${getTime("12345678910"+data.created_at)}
                </small>
              </div>
            </div>
            <div style="padding-left: 10px;">
              <text class="text-dark">
                ${data.content}
              </text>
            </div>
          </div>
        `;
        if(data.sender_id === localStorage.getItem("id")){
          msg = `
            <div class="row">
              <div class="col-3"></div>
              <div class="sent-message col-8">
                <div class="row">
                  <div class="col-1"></div>
                  <div class="col-8">
                    <text class="text-dark">
                      ${data.content}
                    </text>
                  </div>
                  <div class="col-2">
                    <small class="text-dark">
                      ${getTime("12345678910" + data.created_at)}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
        document.getElementById("msgs").innerHTML += msg;
        this.scrollDiv();
      }
    })
	}

	loadMessages(){
		const url = ROOMS_ENDPOINT + this.props.roomId;
		fetch(url).then(response => response.json()).then(data=>{
			this.setState({
				messages: data.messages,
			});
      this.scrollDiv();
		})
	}

  async scrollDiv(){
    var div = document.getElementById("msgWrapper");
    div.scrollTop = div.scrollHeight;
  }

  fetchCreateMessage(){
    const url = MESSAGES_ENDPOINT + "create";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({
        roomID: this.props.roomId,
        message: this.state.message
      })
    };
    fetch(url, requestOptions).then(response => response.json()).then(data=>{
      if(data.message.id){
        this.setState({
          message: ''
        })
      }
    });
  }

	sendMessage(e){
		e.preventDefault();

    if(this.state.message){

      const content = this.state.message;
      const time = new Date().toLocaleTimeString();

      this.fetchCreateMessage();

      this.socket.emit('roomMSG', {
        sender: localStorage.getItem("user"),
        sender_id: localStorage.getItem("id"),
        content: content,
        created_at: time,
        room: this.props.name
      });
      
    }
	}

  renderSentMessage(message){
    return(
      <div className="row">
        <div className="col-3" />
        <div className="sent-message col-8">
          <div className="row">
            <div className="col-1" />
            <div className="col-8">
              <text style={{color:"black"}}>
                {message.content}
              </text>
            </div>
            <div className="col-2">
              <small className="text-dark">
                {getTime(message.created_at)}
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderReceivedMessage(message){
    return(
      <div className="received-message">
        <div className="row">
          <div className="col-1"/>
          <div className="col-7">
            <a href={`/users/${message.sender_id}`}>
              <legend>
                {message.sender} 
                {message.sender_id === this.props.admin ?
                  <small className="text-warning" style={{fontSize:"13px"}}>   admin</small>
                  :null
                }
              </legend>
            </a>
          </div>
          <div className="col-2">
            <small className="text-dark">
              {getTime(message.created_at)}
            </small>
          </div>
        </div>
        <div style={{paddingLeft: "10px"}}>
          <text>
            {message.content}
          </text>
        </div>
      </div>
    );
  }

	render(){
		return(
			<div className="container">
        <div id="msgWrapper">
          <div className="pt-5" id="msgs">
            {this.state.messages.map((message)=>{
              return(
                message.sender_id !== parseInt(localStorage.getItem("id")) ? 
                  this.renderReceivedMessage(message)
                :
                this.renderSentMessage(message)
              )
            })}
          </div>
        </div>
        <div>
          <form onSubmit={this.sendMessage} id="msgForm">
            <div className="row">
              <div className="col-9">
                <input placeholder="enter message" value={this.state.message} type="text" className="form-control" onChange={(e)=>this.setState({message: e.target.value})} />
              </div>
              <div className="col-1"><button type="submit" value="submit" className="btn btn-success">send</button></div>
            </div>
          </form>
        </div>
      </div>
		);
	}
}

export default Chat;