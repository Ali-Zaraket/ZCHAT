from django.urls import path
from .views import *

urlpatterns = [
  ####### USERS API URLS 
  path("users/", UsersApi.as_view()),
  path('users/create', CreateUserApi.as_view()),
  path('users/login', UserLoginApi.as_view()),
  path('users/logout', UserLogoutApi.as_view()),
  path('users/isAuthenticated', UserAuthenticatedApi.as_view()),
  path("users/<int:pk>", GetUser.as_view()),
  path("users/update", UpdateUserApi.as_view()),
  path("users/delete", DeleteUserApi.as_view()),
  
  ####### ROOMS API URLS
  path('rooms/create', CreateRoomApi.as_view()),
  path('rooms/update', UpdateRoomApi.as_view()),
  path('rooms/<int:roomId>', GetRoomApi.as_view()),
  path('rooms/delete/<int:roomId>', DeleteRoomApi.as_view()),
  path('rooms/<int:roomId>/add-user', AddUserToRoomApi.as_view()),
  path('rooms/<int:roomId>/members', RoomMembersApi.as_view()),
  path('rooms/<int:roomId>/remove-user', RemoveUserFromRoomApi.as_view()),
  path('rooms/<int:roomId>/leave', LeaveRoomApi.as_view()),

  ######## MESSAGE API URLS
  path('messages/create', CreateMessageApi.as_view()),

  #######  POSTS API URLS 
  path('posts/create', CreatePostApi.as_view()),
  path('posts/<int:postId>/delete', DeletePostApi.as_view()),
  path('posts/<int:postId>/like', LikePostApi.as_view()),
  path('posts/<int:postId>/unlike', UnLikePostApi.as_view()),
]
