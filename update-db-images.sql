-- Mise à jour des images pour les biens existants
UPDATE biens SET photo_principale = '/uploads/maison1_main.jpg' WHERE id = 32;
UPDATE biens SET photo_principale = '/uploads/appart1_main.jpg' WHERE id = 33;
UPDATE biens SET photo_principale = '/uploads/appart2_main.jpg' WHERE id = 34;
UPDATE biens SET photo_principale = '/uploads/villa1_main.jpg' WHERE id = 35;
UPDATE biens SET photo_principale = '/uploads/maison2_main.jpg' WHERE id = 8;
UPDATE biens SET photo_principale = '/uploads/terrain1_main.jpg' WHERE id = 7;
UPDATE biens SET photo_principale = '/uploads/bureau1_main.jpg' WHERE id = 6;
UPDATE biens SET photo_principale = '/uploads/appart3_main.jpg' WHERE id = 5;

-- Vérifier les résultats
SELECT id, titre, photo_principale FROM biens WHERE photo_principale IS NOT NULL;
