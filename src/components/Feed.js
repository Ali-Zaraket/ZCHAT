import React, { Component } from 'react';
import { POSTS_ENDPOINT, ROOMS_ENDPOINT } from '../settings';
import {getCookie} from '../utility';
import './main.css';


class Feed extends Component {
  constructor(props){
    super(props);
    this.state = {
      posts: [],
      caption: "",
      image: null,
      showForm: false
    };

    this.renderPost = this.renderPost.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.fetchDeletePost = this.fetchDeletePost.bind(this);
    this.fetchPosts = this.fetchPosts.bind(this);
    this.like = this.like.bind(this);
    this.unlike = this.unlike.bind(this);
  }

  componentDidMount(){
    this.fetchPosts();
  }

  fetchPosts() {
    const url = ROOMS_ENDPOINT + this.props.roomId;

    fetch(url).then(response => response.json()).then(data=>{
      this.setState({
        posts: data.posts
      });
    })
  }

  handleFormSubmit(e){
    e.preventDefault();
    var data = new FormData();
    const image = this.state.image;
    if (image !== null){
      data.append("image", image);
    }
    data.append("caption", this.state.caption);
    data.append("room", this.props.roomId);
    data.append("creator", localStorage.getItem("id"));

    const url = POSTS_ENDPOINT + "create";
    const requestOptions = {
      method: "POST",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: data
    };
    fetch(url, requestOptions).then(response => response.json()).then(data=>{
      console.log(data);
      if(data.creator){
        this.setState({
          showForm: false,
          caption: ""
        })
      }
    })
    this.fetchPosts();
  }

  fetchDeletePost(post){
    const postId = post.id;
    const url = POSTS_ENDPOINT + postId + "/delete";
    fetch(url).then(response => {
      if(response.ok){
        var posts = this.state.posts;
        posts.splice(posts.indexOf(post), 1);
        this.setState({
        posts: posts
        })
        this.props.msgCallback({
          type: "success",
          content: "Post Deleted.."
        });
      } else {
        this.props.msgCallback({
          type: "danger",
          content: "Something went wrong, try again later.."
        });
      }
    });
  }
  like(post){
    const url = POSTS_ENDPOINT + post.id + "/like";
    fetch(url).then(response => {
      if(response.ok){
        this.fetchPosts();
      }
    })
  }
  
  unlike(post){
    const url = POSTS_ENDPOINT + post.id + "/unlike";
    fetch(url).then(response => {
      if(response.ok){
        this.fetchPosts();
      }
    })
  }

  renderPost(post){
    const ul = (post) => {
      const currentUser = parseInt(localStorage.getItem("id"));
      if(currentUser === post.creator_id){
        return(
          <div className="dropdown pt-2" style={{color: "white", float:"right"}}>
            <span className="dropdown-toggle bi bi-three-dots-vertical" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false"/>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
              <li><span className="dropdown-item"><span className="bi bi-gear" onClick={null} />  Edit</span></li>
              <li><span className="dropdown-item" onClick={()=>this.fetchDeletePost(post)} ><span className="bi bi-trash"/>  Delete</span></li>
            </ul> 
          </div>
        );
      } else if(currentUser === this.props.admin){
        return(
          <div className="dropdown pt-2" style={{color: "white", float:"right"}}>
            <span className="dropdown-toggle bi bi-three-dots-vertical" type="button" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false"/>
            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
              <li><span className="dropdown-item" onClick={()=>this.fetchDeletePost(post)} ><span className="bi bi-trash"/>  Delete</span></li>
            </ul> 
          </div>
        );
      }
      return null;
    };

    return (
      <div className="post">
        <div className="row border-bottom border-light">
          <div className="col-2">
            <a href={`/users/${post.creator_id}`}>
              <img src={post.creator_profile} alt="Profile" className="rounded-circle" height="40" width="40" />
            </a>
          </div>
          <div className="col-8">
            <legend className="text-white pt-1">{post.creator}</legend>
          </div>
          <div className="col-1">
            {ul(post)}
          </div>
        </div>
        <div className="container pt-3">
          {post.caption}
        </div>
        <div className="pt-2 pb-2">
          {post.image ? <img src={post.image} alt="post" height="100%" width="100%" />:null}
        </div>
        <div style={{paddingLeft: "20px"}}>
          <div className="row">
            <div className="col-1">
              { post.liked 
                ? <span className="bi bi-heart-fill liked" onClick={()=>this.unlike(post)} />
                : <span className="bi bi-heart notliked" onClick={()=>this.like(post)} />
              }
            </div>
            <div className="col-1" style={{paddingTop: "6px"}}>
              <span>
                { post.likes
                  ? post.likes
                  : null
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    return(
      <div className="container pt-3">
        <form encType="multipart/form-data" onSubmit={this.handleFormSubmit}>
          <textarea 
            className="postEntry"
            type="text" 
            required 
            value={this.state.caption} 
            onChange={(e)=>this.setState({
              caption: e.target.value
            })} 
            placeholder="What's in your mind ? POST!"
            onClick={()=>{
              this.setState({
                showForm: true
              })
            }}
          />
          {this.state.showForm ?
            <div style={{paddingLeft: "20px"}}>
              <div className="row pt-3">
                <div className="col-8">
                  <h4 className="text-white">Add an Image</h4>
                  <input type="file" onChange={(e)=>{this.setState({
                    image: e.target.files[0],
                  })}} />
                </div>
                <div className="col-2 pt-3">
                  <button value="submit" className="btn btn-success" type="submit">Post</button>
                </div>
              </div>
            </div>
            :null
          }
        </form>

        <div id="feedWrapper">
          {this.state.posts.map((post)=>(
            this.renderPost(post)
          ))}
        </div>

      </div>
    )
  }
}

export default Feed;