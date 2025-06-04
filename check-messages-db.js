#!/usr/bin/env node
/**
 * Vérification spécifique du système de messages dans la base de données
 */

const { query } = require('./config/database-sqlite');

async function checkMessagesDatabase() {
  console.log('🔍 === VÉRIFICATION DU SYSTÈME DE MESSAGES ===\n');

  try {
    // 1. Vérifier les conversations avec détails
    console.log('💬 CONVERSATIONS:');
    const conversations = await query(`
      SELECT 
        c.id,
        c.acheteur_id,
        c.vendeur_id,
        c.bien_id,
        c.date_creation,
        ua.nom as acheteur_nom,
        ua.prenom as acheteur_prenom,
        uv.nom as vendeur_nom,
        uv.prenom as vendeur_prenom,
        b.titre as bien_titre
      FROM conversations c
      JOIN utilisateurs ua ON c.acheteur_id = ua.id
      JOIN utilisateurs uv ON c.vendeur_id = uv.id
      LEFT JOIN biens b ON c.bien_id = b.id
      ORDER BY c.date_creation DESC
      LIMIT 5
    `);

    if (conversations.length === 0) {
      console.log('  Aucune conversation trouvée');
    } else {
      conversations.forEach(conv => {
        console.log(`  ID: ${conv.id}`);
        console.log(`  Acheteur: ${conv.acheteur_prenom} ${conv.acheteur_nom} (ID: ${conv.acheteur_id})`);
        console.log(`  Vendeur: ${conv.vendeur_prenom} ${conv.vendeur_nom} (ID: ${conv.vendeur_id})`);
        console.log(`  Bien: ${conv.bien_titre || 'Conversation directe'} (ID: ${conv.bien_id || 'N/A'})`);
        console.log(`  Date: ${conv.date_creation}`);
        console.log('  ---');
      });
    }

    // 2. Vérifier les messages avec détails
    console.log('\n📨 MESSAGES RÉCENTS:');
    const messages = await query(`
      SELECT 
        m.id,
        m.conversation_id,
        m.expediteur_id,
        m.contenu,
        m.date_envoi,
        u.nom as expediteur_nom,
        u.prenom as expediteur_prenom
      FROM messages m
      JOIN utilisateurs u ON m.expediteur_id = u.id
      ORDER BY m.date_envoi DESC
      LIMIT 10
    `);

    if (messages.length === 0) {
      console.log('  Aucun message trouvé');
    } else {
      messages.forEach(msg => {
        console.log(`  ID: ${msg.id} | Conv: ${msg.conversation_id}`);
        console.log(`  De: ${msg.expediteur_prenom} ${msg.expediteur_nom} (ID: ${msg.expediteur_id})`);
        console.log(`  Contenu: ${msg.contenu.substring(0, 50)}...`);
        console.log(`  Date: ${msg.date_envoi}`);
        console.log('  ---');
      });
    }

    // 3. Statistiques
    const convCount = await query('SELECT COUNT(*) as total FROM conversations');
    const msgCount = await query('SELECT COUNT(*) as total FROM messages');

    console.log('\n📊 STATISTIQUES:');
    console.log(`  Total conversations: ${convCount[0].total}`);
    console.log(`  Total messages: ${msgCount[0].total}`);

    // 4. Vérifier la conversation 15 spécifiquement (pour les tests)
    console.log('\n🎯 CONVERSATION 15 (pour test):');
    const conv15Messages = await query(`
      SELECT 
        m.id,
        m.contenu,
        m.date_envoi,
        u.nom as expediteur_nom,
        u.prenom as expediteur_prenom
      FROM messages m
      JOIN utilisateurs u ON m.expediteur_id = u.id
      WHERE m.conversation_id = 15
      ORDER BY m.date_envoi ASC
    `);

    if (conv15Messages.length === 0) {
      console.log('  Aucun message trouvé dans la conversation 15');
    } else {
      conv15Messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. [${msg.date_envoi}] ${msg.expediteur_prenom} ${msg.expediteur_nom}: ${msg.contenu}`);
      });
    }

    // 5. Vérifier les utilisateurs de test
    console.log('\n👥 UTILISATEURS DE TEST:');
    const testUsers = await query(`
      SELECT id, nom, prenom, email, role 
      FROM utilisateurs 
      WHERE email IN ('acheteur@test.com', 'vendeur@test.com')
    `);

    testUsers.forEach(user => {
      console.log(`  ${user.prenom} ${user.nom} (${user.email}) - ${user.role} - ID: ${user.id}`);
    });

    console.log('\n🎉 === VÉRIFICATION TERMINÉE ===');
    console.log('✅ Base de données vérifiée avec succès');

  } catch (error) {
    console.error('\n💥 === ERREUR DE VÉRIFICATION ===');
    console.error('Erreur:', error.message);
  }
}

checkMessagesDatabase();
