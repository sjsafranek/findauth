# Import redirect and render shortcuts
from django.shortcuts import render
from django.shortcuts import redirect
from django.shortcuts import render_to_response

# Import reverse_lazy method for reversing names to URLs
from django.core.urlresolvers import reverse_lazy

# Import the login_required decorator which can be applied to views 
# to enforce that the user should be logged in to access the view
from django.contrib.auth.decorators import login_required

import os
import json
import requests
from .models import *
from .Conf import *
import WallOfDenial.utils as utils
from django.http import HttpResponse
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.models import Group
from django.contrib.auth.hashers import check_password

# My hacky way of doing Jinja2 rendering because
# Django Jinja2 GIVES NO ERROR OUTPUT WHEN SOMETHING GOES WRONG - it just quits
# so fuck that.
from jinja2 import Environment, FileSystemLoader
env = Environment(loader=FileSystemLoader('WallOfDenial/templates'))

@login_required(login_url='/find/')
def home(request):
    if request.method == "GET":
        try:
            request_user = User.objects.get(username=request.user.username)
            group = request_user.groups.all()[0]
            results = {
                'username': request.user.username,
                'group': group.name,
            }
            return render(request, "index.html",results)
        except Exception as e:
            print(e)
            return redirect('/error')

@login_required(login_url='/find/')
def help(request):
    if request.method == "GET":
        if request.user.is_authenticated():
            return render(request, "help.html")
        else:
            return redirect('/login')  

@login_required(login_url='/find/')
def management(request):
    if request.method == "GET":
        try:
            user = User.objects.get(username=request.user.username)
            group = user.groups.all()[0]
            results = {
                'username': request.user.username,
                'group': group.name,
                'users': [],
                'layers': {},
                'baselayers': {},
                'servers': json.dumps({
                    'gis': utils.getGeoAPI(group),
                    'ml': utils.getMLEngine(group)
                })
            }
            for user in utils.get_users_by_group(group.name):
                results['users'].append(user.username)
            for baselayer in utils.get_baselayers_by_group(group.name):
                results['baselayers'][baselayer.name] = baselayer.url
            for layer in utils.get_layers_by_group(group.name):
                results['layers'][layer.name] = layer.uuid
            return render(request, "group_management.html",results)
        except Exception as e:
            print(e)
            return redirect('/error')

@login_required(login_url='/find/')
def create_user(request):
    if request.method == "POST":
        print(request.POST)
        user = User.objects.create_user(
                    username=request.POST["username"],
                    email=request.POST["email"],
                    password=request.POST["password"])
        user.save()
        user = User.objects.get(
                    username=request.user.username)
        group = user.groups.all()[0]
        user.groups.add(group)
    return redirect('/management')

@login_required(login_url='/find/')
def create_layer(request):
    if request.method == "POST":
        user = User.objects.get(
                    username=request.user.username)
        group = user.groups.all()[0]
        apiserver = utils.getGeoAPI(group)
        params = {"apikey": apiserver['apikey']}
        req = requests.post(
                    apiserver['address'] + "/api/v1/layer", 
                    params=params)
        if req.status_code != 200:
            raise ValueError(req.text)
        print(req.text)
        res = json.loads(req.json())
        # res = req.json()
        ds = res["datasource"]
        layer = Layer.objects.create(
                    name=request.POST["name"],
                    uuid=ds,
                    owner=group)
        layer.save()
        return redirect('/management')

@login_required(login_url='/find/')
def delete_layer(request):
    if request.method == "POST":
        user = User.objects.get(
                    username=request.user.username)
        group = user.groups.all()[0]
        apiserver = utils.getGeoAPI(group)
        ds = request.POST['layer']
        params = {"apikey": apiserver['apikey']}
        req = requests.delete(
                    apiserver['address'] + "/api/v1/layer/" + ds, 
                    params=params)
        if req.status_code != 200:
            raise ValueError(req.text)
        Layer.objects.all().filter(uuid=ds).delete()
        return JsonResponse(json.loads(req.json()))

@login_required(login_url='/find/')
def create_baselayer(request):
    if request.method == "POST":
        user = User.objects.get(
                    username=request.user.username)
        group = user.groups.all()[0]
        baselayer = Baselayer.objects.create(
                        name=request.POST["name"],
                        url=request.POST["url"],
                        owner=group)
        baselayer.save()
        return redirect('/management')

def get_user_data(request):
    if request.method == "GET":
        username = request.GET["username"]
        password = request.GET["password"]
        print(username, password)
        user = User.objects.get(
                    username=username)
        if check_password(password, user.password):
            group = user.groups.all()[0]
            results = {
                "group": group.name,
                "username": str(username),
                "layers": {},
                "machinelearning": utils.getMLEngine(group.name),
                "geospatial": utils.getGeoAPI(group.name)
            }
            
            for layer in utils.get_layers_by_group(group.name):
                results['layers'][layer.uuid] = {
                    "name": layer.name,
                    "features": []
                }
                apiserver = utils.getGeoAPI(group)
                params = {"apikey": apiserver['apikey']}
                req = requests.get(
                            apiserver['address'] + "/api/v1/layer/" + layer.uuid, 
                            params=params)
                if req.status_code != 200:
                    raise ValueError(req.text)
                res = req.json()
                c = 0
                for feat in res['features']:
                    print(feat['properties'].keys())
                    if feat['geometry']['type'] == "Point" and 'name' in list(feat['properties'].keys()):
                        results['layers'][layer.uuid]["features"].append({
                            "name": feat['properties']['name'], 
                            "k": layer.uuid + ":" + str(c)
                        })
                        print(feat)
                    c += 1
        else:
            results = { 'message': 'error' }
        return JsonResponse(results)
    else:
        results = { 'message': 'error' }
        return JsonResponse(results)

def signup(request):
    if request.method == "GET":
        return render(request, "signup.html")

    if request.method == "POST":
        print(request.POST)
        group = Group.objects.create(name=request.POST["email"])
        user = User.objects.create_user(
                        username=request.POST["email"],
                        email=request.POST["email"],
                        password=request.POST["password"])
        group.save()
        user.save()
        user.groups.add(group)
        mlengine = MLEngine.objects.create(
                        url="http://52.18.218.56:8052",
                        apikey="null",
                        owner=group)
        mlengine.save()
        geoapi = GeoAPI.objects.create(
                        url="http://52.18.218.56:8888",
                        apikey="7q1qcqmsxnvw",
                        owner=group)
        geoapi.save()
        return redirect('/login')


