#!/usr/bin/env python3
"""
Script pour supprimer tous les messages et conversations de la base de données
"""

import sqlite3
import os

def clear_messages():
    # Chemin vers la base de données
    db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'karya_tn.db')
    
    if not os.path.exists(db_path):
        print("❌ Base de données non trouvée!")
        return
    
    try:
        # Connexion à la base de données
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Supprimer tous les messages
        cursor.execute("DELETE FROM messages")
        messages_deleted = cursor.rowcount
        
        # Supprimer toutes les conversations
        cursor.execute("DELETE FROM conversations")
        conversations_deleted = cursor.rowcount
        
        # Valider les changements
        conn.commit()
        
        print(f"✅ {messages_deleted} messages supprimés")
        print(f"✅ {conversations_deleted} conversations supprimées")
        print("🧹 Base de données nettoyée avec succès!")
        
    except sqlite3.Error as e:
        print(f"❌ Erreur lors de la suppression: {e}")
    
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🗑️  Suppression de tous les messages et conversations...")
    clear_messages()
