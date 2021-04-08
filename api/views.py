from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import login, logout, authenticate, hashers

from .serializers import *

### FUNCTION FOR HASHING PASSWORDS COMMING FROM THE FRONTEND
make_password = hashers.make_password


############################################################################
##                           USER API VIEWS 
############################################################################

class UsersApi(APIView):
  def get(self, request, *args, **kwargs):
    if request.user.id:
      data = [
        {"username": user.username, "id": user.id, "profile": user.userprofile.image.url, "bio": user.userprofile.bio} for user in User.objects.all() if user.id != request.user.id
      ]
      return Response(data, status=status.HTTP_200_OK)
    return Response(status=status.HTTP_403_FORBIDDEN)

# REGISTERING NEW USER
class CreateUserApi(APIView):
  def post(self, request, *args, **kwargs):
    if not request.session.exists(request.session.session_key):
      request.session.create()

    username = request.data.get('username')
    email    = request.data.get('email')
    password = make_password(request.data.get('password')) if request.data.get("password") else None

    if username and email and password:
      user_already_exists = User.objects.filter(username=username).exists() or User.objects.filter(email=email).exists()
      if not user_already_exists:
        user = User.objects.create(
          username=username,
          email=email,
          password=password
        )
        user.save()
        if user.is_active:
          login(request, user)
          request.session['authToken'] = user.token.key

        data = UserSerializer(user).data
        data['token'] = user.token.key
        return Response(data, status=status.HTTP_201_CREATED)
      return Response({"error": "User with this email or username already exists.."}, status=status.HTTP_306_RESERVED)
    return Response(status=status.HTTP_400_BAD_REQUEST)

# DELETE USER API VIEW
class DeleteUserApi(APIView):
  def post(self, request, format=None):
    user = request.user
    token = request.data.get("token")
    if user.id is not None and token:
      if token == request.session.get("authToken"):
        request.session.pop("authToken")
        logout(request)
        user.delete()
        return Response({"msg": "Account has been deleted."},status=status.HTTP_200_OK)
    return Response({"error": "not authorized"}, status=status.HTTP_403_FORBIDDEN)
      
# LOGGING IN USER
class UserLoginApi(APIView):
  def post(self, request, *args, **kwargs):
    if not request.session.exists(request.session.session_key):
      request.session.create()

    username = request.data.get('username')
    password = request.data.get('password')

    if username is not None and password is not None:
      if User.objects.filter(username=username).exists():
        user = authenticate(username=username, password=password)
        if user is not None:
          if user.is_active:
            login(request, user)
            request.session['authToken'] = user.token.key
            data = UserSerializer(user).data
            data['token'] = user.token.key
            return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Incorrect password.."}, status=status.HTTP_203_NON_AUTHORITATIVE_INFORMATION)
      return Response({"error": "Incorrect username"}, status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_400_BAD_REQUEST)

# USER LOGOUT API
class UserLogoutApi(APIView):
  def get(self, request, *args, **kwargs):
    user = request.user
    if user.id is not None:
      if user.is_authenticated:
        request.session.pop("authToken")
        logout(request)
        return Response(status=status.HTTP_200_OK)
      return Response(status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_400_BAD_REQUEST)

# CHECK USER WITH THE REQUEST IF AUTHENTICATED 
class UserAuthenticatedApi(APIView):
  def get(self, request, *args, **kwargs):
    user = request.user
    if user.id is not None:
      data = {
        "authenticated": request.user.is_authenticated,
        "token": request.session.get("authToken")
      }
      return Response(data, status=status.HTTP_200_OK)
    return Response(status=status.HTTP_204_NO_CONTENT)

# GET THE USER DETAILS AND THE PROFILE
class GetUser(APIView):
  def get(self, request, *args, **kwargs):
    current_user = request.user
    pk = kwargs.get("pk")
    if current_user.id is not None and pk:
      user = User.objects.filter(pk=pk)
      if user.exists():
        user = user[0]
        profile = user.userprofile
        data = {
          "user": UserSerializer(user).data,
          "profile": UserProfileSerializer(profile).data,
          "isCurrentUser": user.id == current_user.id,
          "userRooms": [{"id": member.room.id, "name": member.room.name} for member in user.member_set.all()]
        }
        return Response(data, status=status.HTTP_200_OK)
      return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_400_BAD_REQUEST)

# UPDATING THE USER SEPARATING PROFILE IMAGE FROM SERIALIZED DATA
class UpdateUserApi(APIView):
  parser_classes = [MultiPartParser, FormParser, JSONParser]

  def post(self, request, *args, **kwargs):
    user = request.user
    if user.id is not None and user.is_authenticated:
      if request.data.get("image") is not None:
        if str(type(request.data.get("image"))) == "<class 'str'>":
          return Response({"error": "you did not submit an image"}, status=status.HTTP_200_OK)
        imgSerializer = UpdateImageSerializer(instance=user.userprofile, data=request.data)
        if imgSerializer.is_valid():
          imgSerializer.save()
          data = {"profile": UserProfileSerializer(user.userprofile).data, "user": UserSerializer(user).data}
          return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Cannot upload image.."}, status=status.HTTP_400_BAD_REQUEST)

      else:
        user_already_exists = self.check_exists(user, request.data)
        if user_already_exists.get("accepted") is False:
          return Response({"error": user_already_exists.get("error")}, status=status.HTTP_400_BAD_REQUEST)
        
        userSerializer = UpdateUserSerializer(instance=user, data=request.data.get("user"))
        profileSerializer = UpdateProfileSerializer(instance=user.userprofile, data=request.data.get("profile"))

        if userSerializer.is_valid() and profileSerializer.is_valid():
          userSerializer.save()
          profileSerializer.save()

          data = {"user": userSerializer.data, "profile": profileSerializer.data}
          return Response(data, status=status.HTTP_200_OK)
        return Response({"error": "Invalid data provided , username or email might be missing"}, status=status.HTTP_400_BAD_REQUEST)
      return Response({"error": "you did not submit any data"}, status=status.HTTP_204_NO_CONTENT)
    return Response({"error":"not authorized"}, status=status.HTTP_403_FORBIDDEN)

  def check_exists(self, user, data):
    """[this method checks if user with email or username 
        submitted already exists, due to unique constraits in the user model 
        and return if accepted and the error msg if there is one]
      Args:
        user (User model instance)
        data (request data)
      Returns:
        [dict]: [accepted value (true or false), and error message]
    """

    returnData = {}
    username = data.get("user").get("username")
    email = data.get("user").get("email")

    userQuery = User.objects.filter(username=username)
    if userQuery.exists():
      if user.id != userQuery[0].id:
        returnData['accepted'] = False
        returnData['error'] = "User with this username already exists"
        return returnData

    userQuery = User.objects.filter(email=email)
    if userQuery.exists():
      if user.id != userQuery[0].id:
        returnData['accepted'] = False
        returnData['error'] = "User with this email already exists"
        return returnData
    
    returnData['accepted'] = True
    return returnData


#############################################################################
###                         ROOM API VIEWS 
#############################################################################

class CreateRoomApi(APIView):
  """
    API VIEW that handles a post request send to create a new room object
    values expected from the frontend : 
      room name
      max members allowed in the room
      description of the room (optional)

    the admin value is the user itself sending the request..
  """
  def post(self, request, *args, **kwargs):
    user = request.user
    if user.id is not None:
      admin = user
      name = request.data.get("roomName")
      max_members = request.data.get("maxMembers")
      description = request.data.get("description")

      if name and max_members and admin.id:
        if not Room.objects.filter(name=name).exists():
          room = Room.objects.create(
            admin=admin,
            name=name,
            max_members=max_members,
            description=description
          )
          room.save()
          # CREATING A ROOM MEMBERSHIP FOR THE ADMIN 
          room.create_membership(admin)

          data = RoomSerializer(room).data
          return Response(data ,status=status.HTTP_201_CREATED)
        return Response({"error": "Room with this name already exists"}, status=status.HTTP_204_NO_CONTENT)
      return Response({"error": "Invalid data..."}, status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_403_FORBIDDEN)


class GetRoomApi(APIView):
  """
    API handling the get request of the room object data
    room id is get from the url pattern
  """
  def get(self, request, *args, **kwargs):
    pk = kwargs.get("roomId")
    user = request.user
    if pk and user.id is not None:
      query = Room.objects.filter(pk=pk)
      if query.exists():
        room = query[0]
        if room.user_in_room(user):
          data = {
            'room': RoomSerializer(room).data, 
            'isAdmin': user.id == room.admin.id,
            "members": [{"id": member.user.id, "username": member.user.username, "profile": member.user.userprofile.image.url} for member in room.get_all_members()],
            "messages": room.get_messages(),
            "posts"  : room.get_posts(request.user)
          }
          return Response(data, status=status.HTTP_200_OK)
      return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)


class DeleteRoomApi(APIView):
  def get(self, request, *args, **kwargs):
    pk = kwargs.get("roomId")
    user = request.user
    if pk and user.id:
      room = Room.objects.filter(pk=pk)
      if room.exists():
        room = room[0]
        if user.id == room.admin.id:
          room.delete()
          return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_403_FORBIDDEN)
      return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)

class AddUserToRoomApi(APIView):
  def post(self, request, *args, **kwargs):
    user = request.user
    roomId = kwargs.get("roomId") or None
    userId = request.data.get("user").get("id")

    if userId and roomId and user.id:
      room = Room.objects.filter(pk=roomId)
      addedUser = User.objects.filter(pk=userId)

      if room.exists() and addedUser.exists():
        room = room[0]
        addedUser = addedUser[0]

        # CHECK IF THE USER ALREADY A MEMBER?
        if room.user_in_room(addedUser):
          return Response({"error": "User Already in Room"}, status=status.HTTP_400_BAD_REQUEST)

        if user.id == room.admin.id:

          if room.get_members_number() + 1 <= room.max_members:
            room.create_membership(addedUser)
            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)
          return Response({"error": "Room requested is already full!"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_403_FORBIDDEN)
      return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_400_BAD_REQUEST)


class RemoveUserFromRoomApi(APIView):
  def post(self, request, *args, **kwargs):
    if request.user.id:
      pk = kwargs.get("roomId")
      member = request.data.get("member").get("id")
      if pk and member:
        room = Room.objects.filter(pk=pk)
        member = User.objects.filter(pk=int(member))

        if room.exists() and member.exists():
          room = room[0]
          member = member[0]

          if request.user.id == room.admin.id:
            room.remove_membership(member)
            return Response(status=status.HTTP_200_OK)
          return Response(status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_400_BAD_REQUEST)
      return Response(status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_403_FORBIDDEN)


class UpdateRoomApi(APIView):
  def post(self, request, *args, **kwargs):
    pk = request.data.get("room").get("id")
    user = request.user
    if pk:
      room = Room.objects.filter(pk=int(pk))
      if room.exists():
        room = room[0]

        # CHECK IF THE ROOM NAME SUBMITTED IS ALREADY USED 
        room_already_exists = self.roomName_exists(request.data.get("room").get("name"), room)
        if room_already_exists.get("accepted") is False:
          return Response({"error": room_already_exists.get("error")}, status=status.HTTP_400_BAD_REQUEST)

        # CHECK IF THE NEW MAX MEMBERS THE ADMIN WANTS IS LESS THAN THE MEMBERS
        if self.newMax_is_less(request.data.get("room").get("max_members"), room):
          return Response({"error": "Max members submitted is less than members already in .."},status=status.HTTP_400_BAD_REQUEST)

        if user.id == room.admin.id:
          serializer = RoomSerializer(instance=room, data=request.data.get("room"))
          if serializer.is_valid():
            serializer.save()
            return Response(data=serializer.data, status=status.HTTP_200_OK)
          return Response({"error": "Invalid Data.."}, status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "the user making the request is not the admin"}, status=status.HTTP_403_FORBIDDEN)
      return Response(status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_400_BAD_REQUEST)

  def roomName_exists(self, name, room):
    data = {}
    if Room.objects.filter(name=name).exists():
      if room.id != Room.objects.filter(name=name)[0].id:
        data['accepted'] = False
        data['error'] = "Room with this name already exists!"
        return data
    data['accepted'] = True
    return data

  def newMax_is_less(self, maximum, room):
    return int(maximum) < int(room.get_members_number())


class RoomMembersApi(APIView):
  def get(self, request, *args, **kwargs):
    if request.user.id:
      pk = kwargs.get("roomId")
      if pk is not None:
        room = Room.objects.filter(pk=pk)
        if room.exists():
          room = room[0]
          data = {
            "members": [{"username": member.user.username, "id": member.user.id, "profile": member.user.userprofile.image.url, "bio": member.user.userprofile.bio} for member in room.get_all_members()],
            "roomName": room.name,
            "admin": UserSerializer(room.admin).data,
            "isAdmin": request.user.id == room.admin.id
          }
          return Response(data, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)
      return Response(status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_403_FORBIDDEN)


class LeaveRoomApi(APIView):
  def post(self, request, *args, **kwargs):
    if request.user.id and request.data.get("token") == request.session.get("authToken"):
      room = Room.objects.filter(pk=kwargs.get("roomId"))
      if room.exists():
        room = room[0]
        room = room.remove_membership(request.user)
        if room is not None:
          return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)
      return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_403_FORBIDDEN)

###########################################################################
###                          MESSAGE API VIEWS
###########################################################################

class CreateMessageApi(APIView):
  def post(self, request, *args, **kwargs):
    roomID = request.data.get("roomID")
    user = request.user

    if roomID and user.id:
      if request.data.get("message") and Room.objects.filter(pk=roomID).exists():
        room = Room.objects.filter(pk=roomID)[0]

        if room.user_in_room(user):
          msg = Message.objects.create(
            sender=user,
            room=room,
            content=request.data.get("message")
          )
          msg.save()

          return Response({"message":MessageSerializer(msg).data, "sender": UserSerializer(user).data}, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_403_FORBIDDEN)
      return Response(status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_403_FORBIDDEN)


###########################################################################
###                             POSTS API VIEWS  
###########################################################################


class CreatePostApi(APIView):
  def post(self, request, *args, **kwargs):
    if int(request.data.get("creator")) == request.user.id:
      serializer = CreatePostSerializer(data=request.data)
      if serializer.is_valid():
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)
      return Response(status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_403_FORBIDDEN)


class DeletePostApi(APIView):
  def get(self, request, *args, **kwargs):
    postID = kwargs.get("postId")
    if request.user.id and postID:
      post = Post.objects.filter(pk=postID)
      if post.exists():
        post = post[0]

        if request.user.id == post.creator.id or request.user.id == post.room.admin.id:
          post.delete()
          return Response(status=status.HTTP_200_OK)
        return Response(status=status.HTTP_403_FORBIDDEN)
      return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)


class LikePostApi(APIView):
  def get(self, request, *args, **kwargs):
    postID = kwargs.get("postId")
    user = request.user

    if user.id and postID:
      post = Post.objects.filter(pk=postID)
      if post.exists():
        post = post[0]
        post.like(user)

        return Response(status=status.HTTP_200_OK)
      return Response(status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_403_FORBIDDEN)


class UnLikePostApi(APIView):
  def get(self, request, *args, **kwargs):
    postID = kwargs.get("postId")
    user = request.user

    if user.id and postID:
      post = Post.objects.filter(pk=postID)
      if post.exists():
        post = post[0]
        post.unlike(user)

        return Response(status=status.HTTP_200_OK)
      return Response(status=status.HTTP_400_BAD_REQUEST)
    return Response(status=status.HTTP_403_FORBIDDEN)
