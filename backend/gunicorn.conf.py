# backend/gunicorn.conf.py
"""
Configuración de Gunicorn para SGM Backend
Optimizado para servidor con recursos limitados
"""

import multiprocessing
import os

# Dirección y puerto
bind = "0.0.0.0:8000"

# Workers
# Regla: (2 x CPU cores) + 1
# Para servidor con pocos recursos, usar menos
workers = int(os.getenv("GUNICORN_WORKERS", "3"))

# Tipo de worker
# sync: para requests regulares
# gevent/eventlet: para muchas conexiones I/O bound
worker_class = "sync"

# Threads por worker (para manejo concurrente dentro del worker)
threads = 2

# Timeout para requests lentos (procesamiento de Excel)
timeout = 120
graceful_timeout = 30

# Keepalive
keepalive = 5

# Logs
accesslog = "-"  # stdout
errorlog = "-"   # stdout
loglevel = os.getenv("LOG_LEVEL", "info")

# Logging format
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Preload app (carga la app antes de fork workers - ahorra RAM)
preload_app = True

# Límites
max_requests = 1000  # Reinicia worker después de N requests (previene memory leaks)
max_requests_jitter = 50  # Agrega aleatoriedad al max_requests

# Nombre del proceso
proc_name = "sgm_backend"

# Desarrollo vs Producción
if os.getenv("DEBUG", "False") == "True":
    reload = True  # Auto-reload en desarrollo
    loglevel = "debug"
else:
    reload = False
    workers = max(2, workers)  # Mínimo 2 workers en producción
