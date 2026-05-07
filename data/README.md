# Données comptables (hors Git par défaut)

Placer ici les exports utilisés pour alimenter `src/reports/v<V>/model.ts` :

- balance générale (exercice clôturé ou situation à date) ;
- grand livre et/ou **FEC** pour l’exercice cible.

En complément : `client_context.json` à la racine du projet pour des paramètres textuels stables du dossier.

Sans ces fichiers, le gabarit reste illustratif — ne pas inventer de montants.

**Git :** `.gitignore` exclut en général `data/**` (sauf fichiers suivis comme ce README et `.gitkeep`) pour éviter les commits accidentels de fichiers lourds ou sensibles. Les fichiers peuvent exister uniquement sur poste local.
