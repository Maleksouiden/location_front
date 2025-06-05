#!/bin/bash

echo "🚀 === PUSH COMPLET VERS GITHUB ==="

# Vérifier le statut Git
echo "📊 Statut Git actuel:"
git status

# Ajouter tous les fichiers
echo "📁 Ajout de tous les fichiers..."
git add .

# Vérifier les fichiers ajoutés
echo "📋 Fichiers à commiter:"
git status --porcelain

# Créer le commit si nécessaire
if [ -n "$(git status --porcelain)" ]; then
    echo "💾 Création du commit..."
    git commit -m "feat: Frontend React complet + Documentation

- Application React 18 avec TypeScript complète
- Système de rendez-vous fonctionnel
- Messagerie en temps réel
- Interface moderne avec Styled Components
- Documentation complète (API, déploiement, changelog)
- Tests automatisés
- Version 2.1.0 - Plateforme immobilière complète"
else
    echo "✅ Aucun changement à commiter"
fi

# Push vers GitHub
echo "🌐 Push vers GitHub..."
git push origin main

# Vérifier le résultat
if [ $? -eq 0 ]; then
    echo "🎉 === PUSH RÉUSSI ==="
    echo "✅ Tous les fichiers ont été poussés vers GitHub"
    echo "🌐 Repository: https://github.com/Maleksouiden/Project_A"
    echo ""
    echo "📁 Contenu pushé:"
    echo "  - Backend Node.js complet"
    echo "  - Frontend React avec TypeScript"
    echo "  - Système de rendez-vous"
    echo "  - Messagerie temps réel"
    echo "  - Documentation complète"
    echo "  - Tests automatisés"
    echo ""
    echo "🚀 La plateforme Karya.tn est maintenant sur GitHub !"
else
    echo "❌ === ERREUR LORS DU PUSH ==="
    echo "Vérifiez votre connexion et vos permissions GitHub"
fi
