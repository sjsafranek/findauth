from django.db import models

# Create your models here.
from django.contrib.auth.models import Group

class Layer(models.Model):
    uuid = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(Group)

# class Feature(models.Model):
#     geoid = models.AutoField(primary_key=True)
#     k = models.CharField(max_length=200)
#     name = models.CharField(max_length=200)
#     layer = models.ForeignKey(Layer)

class Baselayer(models.Model):
    url = models.CharField(max_length=150)
    name = models.CharField(max_length=150)
    owner = models.ForeignKey(Group)

class MLEngine(models.Model):
    url = models.CharField(max_length=150)
    apikey = models.CharField(max_length=150)
    owner = models.ForeignKey(Group)

class GeoAPI(models.Model):
    url = models.CharField(max_length=150)
    apikey = models.CharField(max_length=150)
    owner = models.ForeignKey(Group)


