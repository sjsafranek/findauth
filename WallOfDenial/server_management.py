import requests
from WallOfDenial.models import *
from django.http import JsonResponse


def register_server(*args):
    # Check for errors in args
    if args[0] not in ["geo","ml"]:
        raise ValueError("Unknown server type")
    if "http" not in args[1]:
        print(args)
        raise ValueError("Incorrect url formatting")
    if len(args) == 3:
        if type(args[2]) != str:
            raise ValueError("apikey error")
    # Add server
    server = {
        "type": args[0],
        "url": args[1],
        "apikey": None
    }
    if len(args) == 3:
        server["apikey"] = args[2]
    return server

def get_api_server():
    # Machine Learning
    engines = MLEngine.objects.filter().distinct()
    mls = []
    for engine in engines:
        if str(engine.url) not in mls:
            mls.append(str(engine.url))
    # Geospatial
    spatial = GeoAPI.objects.filter().distinct()
    geo = []
    for space in spatial:
        arr = [str(space.url),str(space.apikey)]
        if arr not in geo:
            geo.append(arr)
    return mls, geo

def register_servers():
    servers = []
    ml, geo = get_api_server()
    for m in ml:
        server = register_server("ml",m)
        if server not in servers:
            servers.append(server)
    for g in geo:
        server = register_server("geo",g[0],g[1])
        if server not in servers:
            servers.append(server)
    return servers

def server_list(request):
    results = register_servers()
    for item in results:
        if item["type"] == "ml":
            i = results.index(item)
            try:
                req = requests.get(item["url"] + "/server.json")
                results[i]["details"] = req.json()
            except:
                results[i]["details"] = "offline"
        if item["type"] == "geo":
            i = results.index(item)
            try:
                req = requests.get(
                    item["url"] + "/management/profile",
                    params = {
                        "apikey": "iamheretoencryptdatasourcesanddrinkbeer"
                    }
                )
                results[i]["details"] = req.json()
            except:
                results[i]["details"] = "offline"
    return JsonResponse({"results":"ok","servers":results})

