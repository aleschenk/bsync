#!/bin/bash

# Script para iniciar el desarrollo con TypeScript
echo "🚀 Iniciando desarrollo de BSync Chrome Extension..."

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado. Por favor instala npm primero."
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Compilar TypeScript en modo watch
echo "🔧 Iniciando compilación en modo watch..."
echo "📝 Los cambios en src/ se compilarán automáticamente a dist/"
echo "🔄 Recarga la extensión en Chrome después de cada cambio"
echo ""
echo "Para detener el desarrollo, presiona Ctrl+C"
echo ""

# Iniciar compilación en modo watch
npm run dev
