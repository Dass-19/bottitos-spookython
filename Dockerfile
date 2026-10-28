# MantaZero Dockerfile
FROM python:3.14-slim

WORKDIR /app

# Copiar requirements
COPY backend/requirements.txt .

# Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY backend ./backend
COPY frontend ./frontend

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/health')"

# Ejecutar
CMD ["python", "-m", "backend.main"]
