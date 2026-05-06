---
name: numeral-memory-update
description: >-
  Met a jour `MEMORY.md` pour un dossier Numeral avec les
  informations durables apprises pendant le tour. Utilise ce skill
  quand tu identifies une regle metier, un reclassement valide,
  une contrepartie recurrente, un point de vigilance stable, ou quand
  l utilisateur te donne une information qui devra etre reutilisee
  plus tard sur le meme dossier.
---

# Numeral Memory Update

Mets a jour la memoire dans le meme tour que la decouverte utile.
N attends pas "plus tard" si l information a une valeur durable pour le
dossier.

## Quand ecrire dans la memoire

- Regle metier donnee par l utilisateur.
- Reclassement valide metier qui pourra resservir.
- Nature recurrente d un flux bancaire ou d un tiers.
- Vigilance durable sur le dossier : TVA, paie, comptes d attente,
  amortissements, habitudes de classement.
- Contrainte de presentation ou de lecture voulue par l utilisateur si
  elle doit rester vraie sur les prochains tours.

## Quand ne pas ecrire dans la memoire

- Version active du moment.
- Etat temporaire d une demande en cours.
- Resultat purement cosmetique d une version.
- Donnee facilement relue dans `reports/meta.json`.
- Brouillon ou hypothese non validee.

## Workflow

1. Lis `MEMORY.md` si elle existe.
2. Isole ce qui est durable et reusable.
3. Retire ou corrige les lignes devenues fausses ou temporaires.
4. Ajoute la nouvelle information en une phrase concrete et exploitable.
5. Garde la memoire courte, stable et orientee dossier.

## Regles d ecriture

- Ecris des phrases courtes.
- Prefere des faits et des regles a des analyses longues.
- Une ligne doit aider un prochain tour a mieux classer, mieux expliquer
  ou eviter une erreur.
- Si une ligne devient obsolette, corrige-la au lieu d empiler des
  contradictions.

## Exemples utiles

- `CB PAYPAL *EDREAMS` doit etre traite en depense de voyage.
- Les aides `ASP` de decembre sont a lire comme subventions
  d exploitation.
- L utilisateur prefere voir dans les erreurs bloquantes le detail des
  libelles bancaires non classes, avec commentaire.

## Obligation

Si tu apprends une information durable pendant un tour Numeral, mets a
jour la memoire avant de finir le tour, sauf si l information est deja
presente de facon correcte.
