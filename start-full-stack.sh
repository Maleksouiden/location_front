#!/bin/bash

# Script pour démarrer le frontend et le backend ensemble

echo "🚀 Démarrage de la plateforme immobilière Karya TN"
echo "=================================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Node.js et npm sont installés"

# Fonction pour démarrer le backend
start_backend() {
    echo "🔧 Démarrage du backend..."
    cd "$(dirname "$0")"
    
    # Installer les dépendances si nécessaire
    if [ ! -d "node_modules" ]; then
        echo "📦 Installation des dépendances backend..."
        npm install
    fi
    
    # Initialiser la base de données si nécessaire
    if [ ! -f "data/karya_tn.db" ]; then
        echo "🗄️ Initialisation de la base de données..."
        node scripts/init-sqlite.js
        node scripts/insert-test-data.js
    fi
    
    echo "🌐 Démarrage du serveur backend sur http://localhost:3000"
    npm start &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
}

# Fonction pour démarrer le frontend
start_frontend() {
    echo "🎨 Démarrage du frontend..."
    cd "$(dirname "$0")/frontend"
    
    # Installer les dépendances si nécessaire
    if [ ! -d "node_modules" ]; then
        echo "📦 Installation des dépendances frontend..."
        npm install
    fi
    
    echo "🌐 Démarrage du serveur frontend sur http://localhost:3001"
    BROWSER=none PORT=3001 npm start &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
}

# Fonction pour nettoyer les processus à la sortie
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend arrêté"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend arrêté"
    fi
    echo "👋 Au revoir !"
    exit 0
}

# Capturer Ctrl+C pour nettoyer proprement
trap cleanup SIGINT SIGTERM

# Démarrer les serveurs
start_backend
sleep 3  # Attendre que le backend démarre
start_frontend

echo ""
echo "🎉 Plateforme démarrée avec succès !"
echo "📱 Frontend: http://localhost:3001"
echo "🔧 Backend:  http://localhost:3000"
echo "📚 API Docs: http://localhost:3000"
echo ""
echo "💡 Appuyez sur Ctrl+C pour arrêter les serveurs"

# Attendre que les processus se terminent
wait
