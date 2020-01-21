from django.db import models

# Create your models here.
class User(models.Model):
    aid = models.CharField('account id', max_length=200, unique=True)

