import React from 'react';
import { Route } from 'react-router-dom';
import Login from './Login';
import Home from './Home';
import Register from './Register';
import VisitProfile from './VisitProfile';
import Navbar from './Navbar';
import CreateRoom from './CreateRoom';
import Room from './Room';
import Users from './Users';
import Members from './Members'

const BaseRouter = (authenticated) => (
  <div>
    <Navbar authenticated={authenticated} />
    <Route exact path="/" component={Home} />
    <Route exact path="/login" component={Login} />
    <Route exact path="/signup" component={Register} />
    <Route exact path="/users/:userId" component={VisitProfile} />
    <Route exact path="/rooms/create" component={CreateRoom} />
    <Route exact path="/room/:roomId" component={Room} />
    <Route exact path="/room/:roomId/add-user" component={Users} />
    <Route exact path="/room/:roomId/members" component={Members} />
  </div>

);

export default BaseRouter;
