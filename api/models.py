from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from PIL import Image
import string, random, os


#########################################################
###################### HELPER FUNCTIONS #################

# images upload path
def upload_path(instance, filename):
  return f'profiles/{filename}'

def image_upload_path(instance, filename):
  return f'posts/{filename}'

# generating token key
def generate_token_key():
  choices = string.ascii_letters + string.digits
  length = 30
  while True:
    token = ''.join(random.choices(choices, k=length))
    if not Token.objects.filter(key=token).exists():
      break
  return token

# creating a token for the user
def createUserToken(sender, instance, created, *args, **kwargs):
  if created:
    userToken = Token.objects.create(user=instance)
    userToken.save()

# creating a profile for the user
def createUserProfile(sender, instance, created, *args, **kwargs):
  if created:
    userProfile = UserProfile.objects.create(user=instance)
    userProfile.save()

####################################################
################### M O D E L S ####################

# USER MODEL
User = get_user_model()


# USER PROFILE MODEL
class UserProfile(models.Model):
  user  = models.OneToOneField(User, on_delete=models.CASCADE)
  image = models.ImageField(default="default.jpg", upload_to=upload_path)
  bio   = models.TextField(null=True, blank=True)

  def save(self, *args, **kwargs):
    super(UserProfile, self).save(*args, **kwargs)
    img = Image.open(self.image.path)
    if img.height > 150 or img.width > 150:
      size = (150,150)
      img.thumbnail(size)
      img.save(self.image.path)

  def __str__(self):
    return f'UserProfile({self.user.username})'


# USER TOKEN MODEL USED FOR AUTHENTICATION
class Token(models.Model):
  user = models.OneToOneField(User, on_delete=models.CASCADE)
  key = models.CharField(max_length=30, default=generate_token_key, unique=True)

  def __str__(self):
    return f'Token({self.user.username})'


# ROOM MODEL 
class Room(models.Model):
  admin       = models.ForeignKey(User, on_delete=models.CASCADE)
  name        = models.CharField(max_length=25, unique=True)
  max_members = models.PositiveIntegerField(default=5)
  description = models.TextField(null=True, blank=True)
  created_at  = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return f'Room({self.name})'

  def get_all_members(self):
    return self.member_set.all()

  def get_members_number(self):
    return len(self.get_all_members())

  def create_membership(self, user):
    member = Member(user=user, room=self)
    member.save()

  def remove_membership(self, member):
    memberShip = self.member_set.filter(user=member)
    if memberShip.exists():
      memberShip.delete()
      return self
    return None

  def user_in_room(self, user):
    return self.member_set.filter(user=user).exists()

  def get_messages(self):
    messages = [{
      "id"        : message.id,
      "sender"    : message.sender.username,
      "sender_id" : message.sender.id,
      "content"   : message.content,
      "created_at": message.created_at

    } for message in self.message_set.all()]

    return messages

  def get_posts(self, current_user):
    posts = [{
      "id"             : post.id,
      "caption"        : post.caption,
      "image"          : post.image.url if post.image and hasattr(post.image, 'url') else None,
      "created_at"     : post.created_at,
      "creator"        : post.creator.username,
      "creator_id"     : post.creator.id,
      "creator_profile": post.creator.userprofile.image.url,
      "likes"          : post.get_likes_number(),
      "liked"          : post.liked_by_user(current_user)
      
    } for post in self.post_set.all()]

    return posts


# ROOM MEMBERSHIP MODEL
class Member(models.Model):
  user = models.ForeignKey(User, on_delete=models.CASCADE)
  room = models.ForeignKey(Room, on_delete=models.CASCADE)

  def __str__(self):
    return f'Member({self.user.username} => {self.room.name})'


class Message(models.Model):
  sender     = models.ForeignKey(User, on_delete=models.CASCADE)
  room       = models.ForeignKey(Room, on_delete=models.CASCADE)
  content    = models.TextField()
  created_at = models.DateTimeField(auto_now_add=True) 

  def __str__(self):
    return f"Message({self.sender.username})"

  class Meta:
    ordering = ["created_at"]

  def get_last_25(self):
    return self.objects.all()[:25]


class Post(models.Model):
  creator   = models.ForeignKey(User, on_delete=models.CASCADE)
  room      = models.ForeignKey(Room, on_delete=models.CASCADE)
  caption   = models.TextField()
  image     = models.ImageField(blank=True, null=True, upload_to=image_upload_path)
  created_at= models.DateTimeField(auto_now_add=True) 

  def __str__(self):
    return f'Post({self.creator.username})'

  class Meta:
    ordering = ["-created_at"]

  def get_likes_number(self):
    return len(self.postlike_set.all())

  def liked_by_user(self, user):
    return self.postlike_set.filter(user=user).exists()

  def like(self, user):
    like = PostLike(post=self, user=user)
    like.save()
    return like

  def unlike(self, user):
    like = self.postlike_set.filter(user=user)
    if like.exists():
      like.delete()
      return self
    return None


class PostLike(models.Model):
  post = models.ForeignKey(Post, on_delete=models.CASCADE)
  user = models.ForeignKey(User, on_delete=models.CASCADE)

  def __str__(self):
    return f"Like({self.user.username})"


##################################################
#################### SIGNALS #####################

post_save.connect(createUserToken, sender=User)
post_save.connect(createUserProfile, sender=User)
