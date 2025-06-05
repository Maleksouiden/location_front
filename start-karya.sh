#!/bin/bash

echo "🚀 Démarrage de Karya.tn - Plateforme Immobilière"
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

# Installer les dépendances du backend si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances du backend..."
    npm install
fi

# Installer les dépendances du frontend si nécessaire
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installation des dépendances du frontend..."
    cd frontend
    npm install
    cd ..
fi

echo "✅ Toutes les dépendances sont installées"

# Créer le dossier uploads s'il n'existe pas
mkdir -p backend/uploads/properties

# Vérifier si la base de données existe
if [ ! -f "data/karya_tn.db" ]; then
    echo "🗄️  Initialisation de la base de données..."
    mkdir -p data
    node scripts/init-sqlite.js
fi

echo "✅ Base de données prête"

# Fonction pour tuer les processus en arrière-plan
cleanup() {
    echo ""
    echo "🛑 Arrêt de l'application..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturer Ctrl+C pour nettoyer
trap cleanup SIGINT

echo ""
echo "🔥 Démarrage du backend (port 3000)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
sleep 3

echo "🎨 Démarrage du frontend (port 3001)..."
cd frontend
PORT=3001 npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Karya.tn est en cours de démarrage !"
echo "======================================"
echo ""
echo "📍 URLs de l'application :"
echo "   🖥️  Frontend : http://localhost:3001"
echo "   🔧 Backend  : http://localhost:3000"
echo ""
echo "📋 Fonctionnalités disponibles :"
echo "   ✅ Authentification (vendeur/acheteur)"
echo "   ✅ Gestion des propriétés avec images"
echo "   ✅ Messagerie en temps réel"
echo "   ✅ Système de rendez-vous"
echo "   ✅ Recherche avancée + IA"
echo "   ✅ Cartes interactives"
echo ""
echo "🧪 Pour tester :"
echo "   1. Ouvrez http://localhost:3001"
echo "   2. Créez un compte vendeur"
echo "   3. Ajoutez une propriété"
echo "   4. Créez un compte acheteur"
echo "   5. Contactez le vendeur"
echo "   6. Testez la messagerie et les rendez-vous"
echo ""
echo "⏹️  Pour arrêter : Appuyez sur Ctrl+C"
echo ""

# Attendre que l'utilisateur arrête l'application
wait
