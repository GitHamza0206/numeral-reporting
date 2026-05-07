import { defineReportModel } from "../../schemas/report.ts";

export const model = defineReportModel({
  meta: {
    title: "Rapport financier (exemple)",
    client: "Client exemple SAS",
    period: "Janvier–décembre 2025",
    year: 2025,
    priorYear: 2024,
    generatedAt: "2026-01-01T12:00:00+00:00",
    source: "Données factices — remplacer par votre export comptable réel",
  },
  pnl: {
    subtitle: "Compte de résultat factice pour illustrer la mise en page.",
    footnote: "Tous les montants sont des exemples ; les remplacer par les valeurs du dossier réel.",
    score: {
      global: 58,
      level: "douteux",
      levelLabel: "Douteux",
      traitement: 76,
      nonTraite: 42,
      ajustement: 55,
      montantTraite: "1 024 912 €",
      montantNonTraite: "60 617 €",
      montantAjuste: "14 487 €",
    },
    produits: [
      { label: "Ventes de marchandises", n: 232457, n1: 233164 },
      { label: "Prestations de services", n: 255045, n1: 158783 },
      { label: "Autres produits", n: 857, n1: 141491 },
    ],
    charges: [
      { label: "Achats consommés", n: 165847, n1: 125744 },
      { label: "Sous-traitance et locations", n: 89973, n1: 79976 },
      { label: "Services externes", n: 44964, n1: 53327 },
      { label: "Charges de personnel", n: 219968, n1: 216658 },
      { label: "Autres charges", n: 15801, n1: 10705 },
    ],
    totals: {
      produitsN: 488359,
      produitsN1: 533438,
      chargesN: 536553,
      chargesN1: 486410,
      resultatExploitationN: -48194,
      resultatExploitationN1: 52735,
      resultatNetN: -48194,
      resultatNetN1: 47028,
    },
  },
  alerts: {
    blocking: [
      {
        label: "Banque A — décaissements en attente de reclassement",
        account: "4716",
        amount: 8094,
        comment: "Exemple factice : ligne bloquante typique des comptes transitoires.",
      },
      {
        label: "Banque B — encaissements en attente de reclassement",
        account: "4717",
        amount: 31034,
        comment: "Exemple factice : même logique que pour les décaissements.",
      },
    ],
    blockingTotal: 39128,
    points: [
      {
        label: "Point TVA (exemple)",
        severity: "alerte",
        amount: 21482,
        comment: "Illustration alerte douce — remplacer par votre revue TVA.",
      },
      {
        label: "Immobilisations vs dotations (exemple)",
        severity: "erreur",
        amount: 18726,
        comment: "Illustration erreur — cohérence bilan / compte de résultat à contrôler.",
      },
    ],
  },
  sig: {
    margeBruteN: 322489,
    margeBruteN1: 318200,
    valeurAjouteeN: 187575,
    valeurAjouteeN1: 192400,
    ebeN: -36109,
    ebeN1: 18420,
    reN: -48194,
    reN1: 52735,
    rcaiN: -48194,
    rcaiN1: 49820,
    rnN: -48194,
    rnN1: 47028,
  },
  monthly: {
    headers: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
    produits: { cells: [19908, 54704, 41030, 60938, 34633, 91027], total: 302313 },
    charges: [
      { label: "Achats", cells: [33320, 15601, 7922, 25339, 13521, 11194], total: 106897 },
      { label: "Personnel", cells: [20083, 20159, 25648, 29686, 22033, 21644], total: 139253 },
      { label: "Autres charges", cells: [6643, 7441, 16118, 19201, 14412, 19559], total: 83374 },
    ],
    chargesTotal: { cells: [60046, 43201, 49688, 74326, 49966, 52397], total: 329524 },
    result: { cells: [-40138, 11576, -8658, -13388, -15333, 38630], total: -27211 },
  },
  structure: {
    balance: {
      actif: [
        { label: "Immobilisations nettes", amount: 14487 },
        { label: "Stocks", amount: 5511 },
        { label: "Créances et avances", amount: 51928 },
        { label: "Trésorerie", amount: 71901, bold: true },
      ],
      passif: [
        { label: "Capital et réserves", amount: 68364 },
        { label: "Résultat provisoire", amount: -48194, bold: true },
        { label: "Dettes fournisseurs", amount: 36143 },
        { label: "Dettes fiscales et sociales", amount: 43970 },
        { label: "Autres dettes", amount: 43544 },
      ],
      totalActif: 143827,
      totalPassif: 143827,
    },
    ratios: [
      { label: "BFR", value: "-22 674 €", hint: "Exemple simplifié." },
      { label: "Trésorerie nette", value: "71 079 €", hint: "Trésorerie brute moins dettes financières." },
    ],
  },
  analyse: {
    scoring: {
      global: 58,
    },
    penalties: [
      {
        label: "Écritures non classées (volume)",
        weight: 18,
        reason: "Part du flux encore en suspens avant reclassement complet.",
      },
      {
        label: "Écart banque / compte de résultat",
        weight: 12,
        reason: "Montants identifiés en attente mais non encore ventilés.",
      },
    ],
    fiscalite: [
      {
        label: "Impôt sur les sociétés (estimation)",
        status: "À confirmer",
        comment: "Montants fictifs — charge réelle dépend des régularisations et reports.",
      },
      {
        label: "TVA déductible / collectée",
        status: "Sous surveillance",
        comment: "Vérifier cohérence déclarations vs livres.",
      },
    ],
    narratives: {
      score: "Texte factice : commenter le score global une fois le dossier réel chargé.",
      pnl: "Texte factice : interpréter le compte de résultat après traitement des données.",
      monthly: "Texte factice : décrire la saisonnalité ou les pics de charges.",
      structure: "Texte factice : expliquer les grandes masses du bilan.",
      sig: "Les SIG sont illustratifs ; les comparer aux exercices antérieurs réels.",
    },
    synthese: [
      {
        label: "Données",
        comment: "Les montants du rapport sont factices ; les aligner sur vos exports pour la production.",
      },
      {
        label: "Priorité",
        comment: "Lever les alertes bloquantes avant publication vers des tiers.",
      },
    ],
    footerExtra: [
      "Ce rapport est un gabarit : ne pas utiliser tel quel pour une décision financière ou fiscale.",
    ],
  },
});
