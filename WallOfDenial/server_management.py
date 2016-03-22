import requests
from WallOfDenial.models import *
from django.http import JsonResponse


def get_customers():
    results = {}
    groups = Group.objects.filter().distinct()
    for group in groups:
        results[group.name] = {
            "geo": None,
            "ml": None
        }
        if len(group.geoapi_set.all()) == 1:
            results[group.name]['geo'] = group.geoapi_set.all()[0].url
        if len(group.mlengine_set.all()) == 1:
            results[group.name]['ml'] = group.mlengine_set.all()[0].url
    return results


def format_results():
    geo_servers = []
    ml_servers = []
    customers = get_customers()
    for customer in customers:

        add = True
        for server in geo_servers:
            i = geo_servers.index(server)
            if server['url'] == customers[customer]['geo']:
                geo_servers[i]["customers"].append(customer)
                add = False
                break
        if(add):
            geo_servers.append({
                "url": customers[customer]['geo'],
                "type": "geo",
                "customers": [customer]})
        
        add = True
        for server in ml_servers:
            i = ml_servers.index(server)
            if server['url'] == customers[customer]['ml']:
                ml_servers[i]["customers"].append(customer)
                add = False
                break
        if(add):
            ml_servers.append({
                "url": customers[customer]['ml'],
                "type": "ml",
                "customers": [customer]})

    servers = geo_servers + ml_servers
    return servers


def server_list(request):
    servers = format_results()
    print(servers)
    for item in servers:
        i = servers.index(item)
        if item["type"] == "ml":
            try:
                req = requests.get(item["url"] + "/status")
                servers[i]["details"] = req.json()
            except:
                servers[i]["details"] = "offline"
        if item["type"] == "geo":
            try:
                req = requests.get(
                    item["url"] + "/management/profile",
                    params = {
                        "apikey": "iamheretoencryptdatasourcesanddrinkbeer"
                    }
                )
                servers[i]["details"] = req.json()
            except:
                servers[i]["details"] = "offline"
    return JsonResponse({"results":"ok","servers":servers})

