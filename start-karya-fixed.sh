#!/bin/bash

# 🚀 Script de démarrage Karya.tn avec correction CORS
echo "🚀 Démarrage de Karya.tn avec configuration CORS corrigée..."

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages colorés
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    log_error "Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    log_error "npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

log_info "Vérification des dépendances..."

# Installer les dépendances du backend si nécessaire
if [ ! -d "node_modules" ]; then
    log_warning "Installation des dépendances du backend..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "Erreur lors de l'installation des dépendances du backend"
        exit 1
    fi
    log_success "Dépendances du backend installées"
fi

# Installer les dépendances du frontend si nécessaire
if [ ! -d "frontend/node_modules" ]; then
    log_warning "Installation des dépendances du frontend..."
    cd frontend
    npm install
    cd ..
    if [ $? -ne 0 ]; then
        log_error "Erreur lors de l'installation des dépendances du frontend"
        exit 1
    fi
    log_success "Dépendances du frontend installées"
fi

# Créer le dossier uploads s'il n'existe pas
if [ ! -d "uploads" ]; then
    mkdir -p uploads/properties
    log_success "Dossier uploads créé"
fi

# Créer le dossier data s'il n'existe pas
if [ ! -d "data" ]; then
    mkdir -p data
    log_success "Dossier data créé"
fi

# Fonction pour tuer les processus en cours
cleanup() {
    log_warning "Arrêt des serveurs..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Capturer Ctrl+C pour nettoyer les processus
trap cleanup SIGINT

log_info "Démarrage du backend sur le port 3000..."

# Démarrer le backend avec le port explicite
BACKEND_PORT=3000 node server.js &
BACKEND_PID=$!

# Attendre que le backend soit prêt
sleep 3

# Vérifier si le backend est démarré
if ! curl -s http://localhost:3000 > /dev/null; then
    log_error "Le backend n'a pas pu démarrer sur le port 3000"
    cleanup
    exit 1
fi

log_success "Backend démarré sur http://localhost:3000"

log_info "Démarrage du frontend sur le port 3001..."

# Démarrer le frontend sur le port 3001
cd frontend
PORT=3001 npm start &
FRONTEND_PID=$!
cd ..

log_success "Frontend en cours de démarrage sur http://localhost:3001"

echo ""
echo "🎉 Karya.tn est en cours de démarrage !"
echo ""
echo "📍 URLs d'accès :"
echo "   🌐 Frontend: http://localhost:3001"
echo "   🔧 Backend API: http://localhost:3000"
echo "   📚 Documentation API: http://localhost:3000"
echo ""
echo "👥 Comptes de test :"
echo "   👨‍💼 Admin: admin@karya.tn / password123"
echo "   🏪 Vendeur: mohamed.benali@email.com / password123"
echo "   🛒 Acheteur: leila.bouazizi@email.com / password123"
echo ""
echo "🔧 Configuration CORS corrigée :"
echo "   ✅ Support des ports 3000 et 3001"
echo "   ✅ Headers CORS complets"
echo "   ✅ Gestion des requêtes OPTIONS"
echo "   ✅ Timeout augmenté à 15s"
echo ""
echo "⚠️  Appuyez sur Ctrl+C pour arrêter les serveurs"
echo ""

# Attendre que les processus se terminent
wait $BACKEND_PID $FRONTEND_PID
