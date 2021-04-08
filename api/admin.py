from django.contrib import admin
from .models import UserProfile, Room, Member, Message, Post

# Register your models here.
admin.site.register(UserProfile)
admin.site.register(Room)
admin.site.register(Member)
admin.site.register(Message)
admin.site.register(Post)