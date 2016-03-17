from django.contrib import admin

# Register your models here.
from .models import Layer
# from .models import Feature
from .models import Baselayer
from .models import MLEngine
from .models import GeoAPI

admin.site.register(Layer)
# admin.site.register(Feature)
admin.site.register(Baselayer)
admin.site.register(MLEngine)
admin.site.register(GeoAPI)