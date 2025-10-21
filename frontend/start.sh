#!/bin/bash

# Script de demarrage rapide pour le frontend SaaS

echo "========================================="
echo "WordPress Agent SaaS - Frontend"
echo "========================================="
echo ""

# Verifier que les dependencies sont installees
if [ ! -d "node_modules" ]; then
    echo "Installation des dependencies..."
    npm install
    echo ""
fi

# Verifier que .env.local existe
if [ ! -f ".env.local" ]; then
    echo "ERREUR: .env.local n'existe pas!"
    echo "Copier .env.example ou creer .env.local avec:"
    echo ""
    echo "NEXT_PUBLIC_AGENT_API_URL=http://localhost:3000"
    echo "NEXT_PUBLIC_WORDPRESS_URL=http://nectar-template.wp.local"
    echo ""
    exit 1
fi

echo "Configuration:"
echo "- Agent API: $(grep NEXT_PUBLIC_AGENT_API_URL .env.local | cut -d '=' -f2)"
echo "- WordPress: $(grep NEXT_PUBLIC_WORDPRESS_URL .env.local | cut -d '=' -f2)"
echo ""

echo "Demarrage du serveur de developpement..."
echo "Ouvrir: http://localhost:3001/editor"
echo ""

npm run dev
