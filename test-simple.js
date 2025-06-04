console.log('Test Node.js - OK');
console.log('Version Node.js:', process.version);

// Test des modules
try {
  const express = require('express');
  console.log('✅ Express chargé');
  
  const sqlite3 = require('sqlite3');
  console.log('✅ SQLite3 chargé');
  
  const bcrypt = require('bcrypt');
  console.log('✅ Bcrypt chargé');
  
  console.log('🎉 Tous les modules sont OK !');
} catch (error) {
  console.error('❌ Erreur:', error.message);
}
