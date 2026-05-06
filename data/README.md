# Pièces attendues — dossier Bande de Cheffe

Placer ici les exports utilisés pour remplir `src/reports/v<V>/model.ts` :

- balance générale (exercice clôturé ou situation à date) ;
- grand livre et/ou **FEC** pour l’exercice cible ;
- en complément : `client_context.json` à la racine du projet si votre flux fixe des paramètres dossier.

Sans ces fichiers, le rapport reste volontairement non chiffré — ne pas inventer de montants.

**Note environnement Cursor / git —** les exports `.xlsx` sont généralement listés dans `.gitignore` (`/data/**`) pour éviter les commits accidentels de fichiers volumineux. Ils peuvent être présents sur disque même si l’indexation IDE ne les affiche pas : utiliser une commande système ou `python3 scripts/extract_pnl_from_balance.py` pour les lire depuis la machine locale.
