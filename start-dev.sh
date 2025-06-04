#!/bin/bash

# Script pour démarrer le backend et le frontend en développement

echo "🚀 Démarrage de l'application Karya.tn en mode développement"

# Fonction pour nettoyer les processus en arrière-plan
cleanup() {
    echo "🛑 Arrêt des serveurs..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Capturer Ctrl+C pour nettoyer proprement
trap cleanup SIGINT

# Démarrer le backend
echo "📡 Démarrage du serveur backend (port 3000)..."
npm run dev:backend &
BACKEND_PID=$!

# Attendre que le backend soit prêt
sleep 3

# Démarrer le frontend
echo "🌐 Démarrage du serveur frontend (port 3001)..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Serveurs démarrés !"
echo "📍 Backend: http://localhost:3000"
echo "📍 Frontend: http://localhost:3001"
echo "📍 API Documentation: http://localhost:3000"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs"

# Attendre que les processus se terminent
wait $BACKEND_PID $FRONTEND_PID
