#!/bin/bash

# Script para generar documentación Swagger
echo "🚀 Generando documentación Swagger para BSync Server..."

# Verificar que swag esté instalado
if ! command -v swag &> /dev/null; then
    echo "📦 Instalando swag..."
    go install github.com/swaggo/swag/cmd/swag@latest
fi

# Generar documentación
echo "📝 Generando documentación..."
swag init

if [ $? -eq 0 ]; then
    echo "✅ Documentación Swagger generada exitosamente!"
    echo "📁 Archivos creados en: ./docs/"
    echo "🌐 Accede a la documentación en: http://localhost:2544/swagger/index.html"
else
    echo "❌ Error generando documentación Swagger"
    exit 1
fi
