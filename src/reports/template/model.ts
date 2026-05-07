import { defineReportModel } from "../../schemas/report.ts";

/**
 * Gabarit sans montants préremplis : alimenter depuis les exports comptables du dossier.
 * Ne pas copier de chiffres d’exemple ici (évite la confusion pour les agents et les relecteurs).
 */
export const model = defineReportModel({
  meta: {
    title: "Rapport financier",
    client: "À renseigner",
    period: "À renseigner",
    year: 2025,
    priorYear: 2024,
    generatedAt: "1970-01-01T00:00:00.000Z",
    source: "Aucune balance ni FEC chargés dans ce gabarit — importer les extraites du dossier.",
  },
  pnl: {
    subtitle: "Renseigner les postes et totaux après import des données.",
    footnote:
      "Les totaux et lignes ci-dessus restent vides tant que les produits, charges et résultats ne sont pas saisis ou calculés depuis vos fichiers source.",
    score: {
      global: 0,
      level: "acceptable",
      levelLabel: "Non évalué",
      traitement: 0,
      nonTraite: 0,
      ajustement: 0,
      montantTraite: "—",
      montantNonTraite: "—",
      montantAjuste: "—",
    },
    produits: [],
    charges: [],
    totals: {
      produitsN: null,
      produitsN1: null,
      chargesN: null,
      chargesN1: null,
      resultatExploitationN: null,
      resultatExploitationN1: null,
      resultatNetN: null,
      resultatNetN1: null,
    },
  },
  alerts: {
    blocking: [],
    points: [],
  },
  analyse: {
    footerExtra: [
      "Gabarit Numeral : compléter le modèle avec les montants issus des contrôles comptables avant diffusion.",
    ],
  },
});
