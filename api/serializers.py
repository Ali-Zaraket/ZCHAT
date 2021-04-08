from rest_framework import serializers
from .models import UserProfile, User, Room, Member, Message, Post

# USER MODEL SERIALIZER
class UserSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ('id', 'username', 'email')

# ROOM SERIALIZERS
class RoomSerializer(serializers.ModelSerializer):
  class Meta:
    model = Room
    fields = '__all__'


# PROFILE MODEL SERIALIZER
class UserProfileSerializer(serializers.ModelSerializer):
  class Meta:
    model = UserProfile
    fields = '__all__'

class MessageSerializer(serializers.ModelSerializer):
  class Meta:
    model = Message
    fields = "__all__"



# UPDATE PROFILE AND USER SERIALIZERS
class UpdateUserSerializer(serializers.ModelSerializer):
  class Meta:
    model = User
    fields = ('id', 'username', 'email')

class UpdateProfileSerializer(serializers.ModelSerializer):  
  class Meta:
    model = UserProfile
    fields = ('bio', )

class UpdateImageSerializer(serializers.ModelSerializer):
  class Meta:
    model = UserProfile
    fields = ('image', )


# POST MODEL DATA SERIALIZER 
class CreatePostSerializer(serializers.ModelSerializer):
  class Meta:
    model = Post
    fields = ('creator', 'room', 'caption', 'image')
