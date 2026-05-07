import { defineReportModel, type ReportAlert } from "@/schemas/report";

// Test Historique : pulse diff restitution (sauver model.ts → capture + report-model.json)

/** Basculer : \`as const\` sur la valeur littérale — le cast garde le type union pour les branches v0/v1. */
const REPORT_471_MODE = "v1" as "v0" | "v1";

/** Date d’établissement du document (pied de rapport, format lecture cabinet). */
const RAPPORT_ETABLISSEMENT_ISO = "2026-05-06T12:00:00+02:00";

/**
 * Source agrégées / blocking selon mode :
 *   python3 scripts/reclasse_471_healing.py --mode v0|v1
 */
const HIGH_CONFIDENCE_471_COUNT = 33;
const A_CONFIRMER_471_COUNT = 4;
const HIGH_CONFIDENCE_471_ABS_TOTAL = 34284.07;
const HEALED_471_RESIDUAL_ABS_TOTAL = 4851.05;
const HEALED_RESULTAT_NET_N = -20409.88;
const BASE_RESULTAT_NET_N = -48193.57;

const blocking471V0: ReportAlert[] = [
  { label: "2025-02-03 · BQ1 · VIREMENT SEPA PAR INTERNET VERS 28233 00001 29471131563 56", account: "Suspens banque — débit BQ1", amount: 451.57, comment: "SEPA sans bénéficiaire identifié — ordre ou relevé.", severity: "erreur" },
  { label: "2025-02-07 · BQ1 · *FR CTR MONET INACTIF 8048199", account: "Suspens banque — débit BQ1", amount: 20.0, comment: "Petit frais bancaire CTR — à ventiler.", severity: "erreur" },
  { label: "2025-02-07 · BQ1 · *FR CTR MONET INACTIF 8048200", account: "Suspens banque — débit BQ1", amount: 20.0, comment: "Petit frais bancaire CTR — à ventiler.", severity: "erreur" },
  { label: "2025-02-10 · BQ1 · VIREMENT SEPA PAR INTERNET VERS 42559 10000 08009592821 03", account: "Suspens banque — débit BQ1", amount: 1600.64, comment: "SEPA — rapprocher avec le virement du 12/03 (même RIB).", severity: "erreur" },
  { label: "2025-02-22 · BQ1 · CB WWW.BODUM.COM FACT 200225", account: "Suspens banque — débit BQ1", amount: 14.85, comment: "CB — justificatif à rapprocher.", severity: "erreur" },
  { label: "2025-02-28 · BQ1 · CB Bo Mie Hotel de FACT 260225", account: "Suspens banque — débit BQ1", amount: 98.0, comment: "CB — justificatif à rapprocher.", severity: "erreur" },
  { label: "2025-03-12 · BQ1 · CB ROULEZ JEUNESSE FACT 100325", account: "Suspens banque — débit BQ1", amount: 35.0, comment: "Proposition : entretien et maintenance ; joindre facture au dossier.", severity: "erreur" },
  { label: "2025-03-12 · BQ1 · VIREMENT SEPA PAR INTERNET VERS 42559 10000 08009592821 03", account: "Suspens banque — débit BQ1", amount: 1752.74, comment: "SEPA — lot avec le virement du 10/02 (même bénéficiaire).", severity: "erreur" },
  { label: "2025-03-27 · BQ1 · CB ME-QR.COM FACT 250325 DONT FRAIS DE COMM. 2,66 EUR", account: "Suspens banque — débit BQ1", amount: 94.5, comment: "Proposition : prestations numériques ; contrôler TVA et facture.", severity: "erreur" },
  { label: "2025-04-22 · BQ1 · CB PAYPAL *ITUNESA FACT 180425", account: "Suspens banque — débit BQ1", amount: 11.99, comment: "CB PayPal — nature (abonnement / achat) à préciser.", severity: "erreur" },
  { label: "2025-05-08 · BQ1 · CB PAYPAL *TIPEEE FACT 060525", account: "Suspens banque — débit BQ1", amount: 5.37, comment: "Proposition : plateforme de soutien / pourboire — prestation de service ; conserver justificatif.", severity: "erreur" },
  { label: "2025-06-09 · BQ1 · CB PAYPAL *TIPEEE FACT 060625", account: "Suspens banque — débit BQ1", amount: 5.37, comment: "Proposition : même nature que le mouvement Tipeee précédent.", severity: "erreur" },
  { label: "2025-06-17 · BQ1 · CB PAYPAL *EDREAMS FACT 140625", account: "Suspens banque — débit BQ1", amount: 191.97, comment: "Voyage / billet — compte charge à préciser.", severity: "erreur" },
  { label: "2025-07-28 · BQ1 · VIREMENT SEPA PAR INTERNET - REMBOURSEMENT SUITE REGLEMENT DOUBLE FACTURE", account: "Suspens banque — débit BQ1", amount: 1046.1, comment: "Double règlement — contre-passation avec la facture doublon.", severity: "erreur" },
  { label: "2025-08-20 · BQ1 · PRLV GGVSJ 2522659G10008551", account: "Suspens banque — débit BQ1", amount: 477.8, comment: "Prélèvement GGVSJ — rattacher ligne sociale / URSSAF.", severity: "erreur" },
  { label: "2025-09-18 · BQ1 · CB LCL LE CREDIT L", account: "Suspens banque — débit BQ1", amount: 20.0, comment: "Proposition : frais bancaires si le relevé ne désigne pas de commerçant ; sinon rapprocher avec le ticket.", severity: "erreur" },
  { label: "2025-09-19 · BQ1 · CB LCL LE CREDIT L", account: "Suspens banque — débit BQ1", amount: 80.0, comment: "Idem ligne veille — frais bancaires ou détail carte à obtenir.", severity: "erreur" },
  { label: "2025-10-22 · BQ1 · PRLV B2B DGFIP 2529359J10008036", account: "Suspens banque — débit BQ1", amount: 26.0, comment: "DGFIP — taxe ou cotisation à ventiler.", severity: "erreur" },
  { label: "2025-11-08 · BQ1 · CB SumUp *REPAIR FACT 061125", account: "Suspens banque — débit BQ1", amount: 99.6, comment: "Proposition : réparation / maintenance ; conserver ticket ou facture.", severity: "erreur" },
  { label: "2025-11-10 · BQ1 · * ESPRIT ASSOCIATION", account: "Suspens banque — débit BQ1", amount: 19.75, comment: "Proposition : frais et honoraires bancaires — forfait « Esprit Associations » (Crédit Coopératif).", severity: "erreur" },
  { label: "2025-11-11 · BQ1 · PRLV GP - Fnac Pack Service 2531159G10023773", account: "Suspens banque — débit BQ1", amount: 7.99, comment: "Abonnement / service Fnac — compte à préciser.", severity: "erreur" },
  { label: "2025-11-17 · BQ1 · VIR INST ASSAL EBRAHIMPOUR 2532159I10000272 - REMB ACHATS CHAILLOT 14/11", account: "Suspens banque — débit BQ1", amount: 126.3, comment: "Remboursement d'achats ; proposition : réintégration aux achats ; conserver justificatif.", severity: "erreur" },
  { label: "2025-11-19 · BQ1 · *FRAIS 2 VIR INST", account: "Suspens banque — débit BQ1", amount: 0.44, comment: "Frais de virement instantané — nature frais bancaire probable.", severity: "erreur" },
  { label: "2025-11-20 · BQ1 · PRLV GGVSJ 2532159G10004822", account: "Suspens banque — débit BQ1", amount: 842.73, comment: "Prélèvement GGVSJ — ligne sociale à affecter.", severity: "erreur" },
  { label: "2025-11-25 · BQ1 · PRLV MALAKOFF HUMANIS 2532559G10012622", account: "Suspens banque — débit BQ1", amount: 862.04, comment: "Prélèvement Malakoff — charges sociales / mutuelle.", severity: "erreur" },
  { label: "2025-11-25 · BQ1 · PRLV B2B DGFIP 2532559J10011593", account: "Suspens banque — débit BQ1", amount: 9.0, comment: "DGFIP — taxe à ventiler.", severity: "erreur" },
  { label: "2025-11-28 · BQ1 · ACHATS QUENTIN - REMB. ACHATS LA REDOUTE ET VETEMENTS PRO", account: "Suspens banque — débit BQ1", amount: 100.49, comment: "Remboursement achats ; proposition de réintégration aux achats, à rapprocher de l'écriture de régularisation du 05/12.", severity: "erreur" },
  { label: "2025-12-19 · BQ1 · CB SUPERVAN* POUR FACT 171225", account: "Suspens banque — débit BQ1", amount: 74.0, comment: "Proposition : transport ou logistique ; conserver facture.", severity: "erreur" },
  { label: "2025-09-19 · BQ2 · RAJEESKA", account: "Suspens banque — débit BQ2", amount: 7.0, comment: "Proposition : petite dépense d'épicerie (Paris 12e) en achats divers ; garder ticket si contestation.", severity: "erreur" },
  { label: "2025-07-22 · BQ1 · VIR SEPA MHP COT PLEIADE - 21189673BANDE DE CHEFFES", account: "Suspens banque — crédit BQ1", amount: 2219.24, comment: "Encaissement — produit ou régularisation à affecter.", severity: "erreur" },
  { label: "2025-10-09 · BQ1 · VIR SEPA ALTERNOO - RBST TROP PERCU", account: "Suspens banque — crédit BQ1", amount: 398.15, comment: "Trop-perçu — créance ou produit selon analyse de la pièce.", severity: "erreur" },
  { label: "2025-10-09 · BQ1 · VIR INST MME LELUC ANNE CHARLO - REMBOURSEMENT ACHAT AMAZON", account: "Suspens banque — crédit BQ1", amount: 16.62, comment: "Remboursement tiers — contrepartie achat ou compte tiers selon dossier.", severity: "erreur" },
  { label: "2025-11-26 · BQ1 · VIR SEPA GROUPAMA GAN VIE - AT CT 779135 20000 F2P", account: "Suspens banque — crédit BQ1", amount: 758.88, comment: "Remboursement assurance — rattacher au contrat / sinistre.", severity: "erreur" },
  { label: "2025-12-05 · BQ1 · VIR INST M. LEROUX QUENTIN - Erreur virement bdc", account: "Suspens banque — crédit BQ1", amount: 100.49, comment: "Proposition : régularisation achats en regard du remboursement du 28/11.", severity: "erreur" },
  { label: "2025-12-19 · BQ1 · VIR SEPA GROUPAMA GAN VIE - AT CT 779135 20000 F2P", account: "Suspens banque — crédit BQ1", amount: 269.28, comment: "Remboursement assurance — rattacher au contrat.", severity: "erreur" },
  { label: "2025-12-19 · BQ1 · VIR SEPA ASP AGENCE COMPTABLE - 156272990 EMP. TPUPEX286104I REG ILE DE FRANCE EMPLOI LOCA…", account: "Suspens banque — crédit BQ1", amount: 20067.76, comment: "Aide emploi / subvention région — affectation selon bordereau ASP.", severity: "erreur" },
  { label: "2025-12-29 · BQ1 · VIR SEPA ASP AGENCE COMPTABLE - 156472784 EMP. TPUPEX286104I REG ILE DE FRANCE EMPLOI LOCA…", account: "Suspens banque — crédit BQ1", amount: 7203.46, comment: "Aide emploi / subvention — idem mouvement ASP.", severity: "erreur" },
];

const blocking471V0Total = 39135.12;

/** Résidu 471 après retrait des mouvements classés haute confiance + web-assisted (`reclasse_471_healing.py --mode v1`). */
const blocking471Residual: ReportAlert[] = [
  blocking471V0[0]!,
  blocking471V0[3]!,
  blocking471V0[7]!,
  blocking471V0[13]!,
];

const blocking471Active = REPORT_471_MODE === "v0" ? blocking471V0 : blocking471Residual;
const blocking471ActiveTotal = REPORT_471_MODE === "v0" ? blocking471V0Total : HEALED_471_RESIDUAL_ABS_TOTAL;

/** Agrégés N après reclassement 471 V1 : script \`scripts/reclasse_471_healing.py --mode v1\` (haute confiance + web-assisted quand présent). */
const PNL_HEALED_N = {
  autresProduits: 30940.26,
  achats: 165978.74,
  services: 135720.48,
  impots: 3750.77,
  personnel: 222150.9,
  produitsTotal: 519275.76,
  chargesTotal: 539685.64,
  resultatNet: HEALED_RESULTAT_NET_N,
};

const point471ScriptComment =
  REPORT_471_MODE === "v0"
    ? `Suspens banque : ${blocking471V0.length} lignes bloquantes encore ; compte de résultat inchangé tant que reclassement non acté (${HIGH_CONFIDENCE_471_COUNT} mouvements défendables sur pièce, ${A_CONFIRMER_471_COUNT} sans base suffisante).`
    : `${HIGH_CONFIDENCE_471_COUNT} mouvements retraités hors liste bloquante ; ${A_CONFIRMER_471_COUNT} suspens restants. Totaux indicatifs jusqu’à validation des écritures et du fichier légal.`;

/** Synthèse courte pour le tableau Points d’attention (SOUL). */
const point471TroisListesComment =
  REPORT_471_MODE === "v0"
    ? `${HIGH_CONFIDENCE_471_COUNT} lignes défendables si pièces, ${A_CONFIRMER_471_COUNT} encore ouvertes — sans acte du cabinet, garder les ${blocking471V0.length} mouvements comme suspens plein extrait.`
    : `${HIGH_CONFIDENCE_471_COUNT} hors liste (~ ${HIGH_CONFIDENCE_471_ABS_TOTAL.toLocaleString("fr-FR")} € abs.) ; résidu ${A_CONFIRMER_471_COUNT} (~ ${HEALED_471_RESIDUAL_ABS_TOTAL.toLocaleString("fr-FR")} € abs.). Sans validation : revenir à une lecture prudente sur ${blocking471V0.length} lignes.`;

const point471SuspensLabel =
  REPORT_471_MODE === "v0" ? "Suspens banque — extrait complet" : "Suspens banque — résidu";

const point471SuspensComment =
  REPORT_471_MODE === "v0"
    ? `${blocking471V0.length} lignes, ~ ${blocking471V0Total.toLocaleString("fr-FR")} € cumul absolus. Si tout le défendable est écrit : résidu projeté ~ ${HEALED_471_RESIDUAL_ABS_TOTAL.toLocaleString("fr-FR")} €, RN indicatif ~ ${HEALED_RESULTAT_NET_N.toLocaleString("fr-FR")} €.`
    : `${blocking471Residual.length} suspens (~ ${HEALED_471_RESIDUAL_ABS_TOTAL.toLocaleString("fr-FR")} € abs. cum.) ; les ${HIGH_CONFIDENCE_471_COUNT} autres propositions font passer le RN de ~ ${BASE_RESULTAT_NET_N.toLocaleString("fr-FR")} € à ~ ${HEALED_RESULTAT_NET_N.toLocaleString("fr-FR")} € (indicatif).`;

const pnlProduitsRowAutres =
  REPORT_471_MODE === "v0"
    ? { label: "Autres produits d'exploitation", n: 23.49, n1: 4566.9 }
    : {
      label: "Autres produits d'exploitation",
      n: PNL_HEALED_N.autresProduits,
      n1: 4566.9,
      variant: "adjusted" as const,
      details: [
        { label: "Solde balance hors reclassement des suspens (cette ligne)", n: 23.49, variant: "normal" as const },
        {
          label: "Suspens banque → produits / subventions (prop.)",
          account: "À valider sur FEC",
          n: 30916.77,
          variant: "adjusted" as const,
        },
      ],
    };

const pnlCharges =
  REPORT_471_MODE === "v0"
    ? [
      { label: "Achats et variation de stocks", n: 165847.21, n1: 125743.75 },
      { label: "Services extérieurs", n: 134936.5, n1: 133303.56 },
      { label: "Impôts et taxes sur rémunérations", n: 3715.77, n1: 1198.82 },
      { label: "Charges de personnel", n: 219968.33, n1: 216658.25 },
    ]
    : [
      {
        label: "Achats et variation de stocks",
        n: PNL_HEALED_N.achats,
        n1: 125743.75,
        variant: "adjusted" as const,
        details: [
          { label: "Solde balance", n: 165847.21, variant: "normal" as const },
          { label: "Crédit remboursement « Amazon » — réduction des achats", n: -1.77, variant: "adjusted" as const },
          { label: "Proposition : suspens banque → achats et remboursements d’achats (détail BQ2)", n: 133.3, variant: "adjusted" as const },
        ],
      },
      {
        label: "Services extérieurs",
        n: PNL_HEALED_N.services,
        n1: 133303.56,
        variant: "adjusted" as const,
        details: [
          { label: "Solde balance", n: 134936.5, variant: "normal" as const },
          { label: "Proposition : suspens banque → achats, déplacements, abonnements, frais financiers externes", n: 350.39, variant: "adjusted" as const },
          { label: "Proposition : suspens banque → services divers, frais carte et forfaits bancaires", n: 433.59, variant: "adjusted" as const },
        ],
      },
      {
        label: "Impôts et taxes sur rémunérations",
        n: PNL_HEALED_N.impots,
        n1: 1198.82,
        variant: "adjusted" as const,
        details: [
          { label: "Solde balance", n: 3715.77, variant: "normal" as const },
          { label: "Proposition : suspens banque → cotisations et taxes assimilées", n: 35.0, variant: "adjusted" as const },
        ],
      },
      {
        label: "Charges de personnel",
        n: PNL_HEALED_N.personnel,
        n1: 216658.25,
        variant: "adjusted" as const,
        details: [
          { label: "Solde balance", n: 219968.33, variant: "normal" as const },
          { label: "Proposition : suspens banque → charges sociales et organismes", n: 2182.57, variant: "adjusted" as const },
        ],
      },
    ];

/**
 * v0 — Données : agrégats issus des balances PennyLane sous `data/`
 * (`scripts/extract_pnl_from_balance.py`, solde colonne E, N-1 colonne F).
 * Exercice N = balance provisoire 2025 ; N-1 = 2024 (montants repris depuis l’export 2025 où F renseigne le comparatif).
 */

const SOURCE_REF =
  "PennyLane : balances 2024 (arrêtée), 2025 (provisoire au 31/12) ; comparatif N-1 quand figurant sur l’export.";

export const model = defineReportModel({
  meta: {
    title: "Rapport financier — Bande de Cheffe · test Historique (pulse)",
    client: "Bande de Cheffe SAS",
    period: "Exercices 2024 (clôturé) et 2025 (balance provisoire au 31/12)",
    year: 2025,
    priorYear: 2024,
    generatedAt: RAPPORT_ETABLISSEMENT_ISO,
    currentPeriodLabel: "2025 (provisoire)",
    priorPeriodLabel: "2024",
    periodDescription:
      "Exercice 2025 : balance générale en situation provisoire au 31 décembre (export PennyLane). Le comparatif N-1 est repris lorsque la colonne équivalente figure sur l’export.",
    source: SOURCE_REF,
  },
  pnl: {
    subtitle:
      "Compte de résultat par nature — regroupement charges et produits selon les intitulés de balance générale PennyLane.",
    footnote:
      REPORT_471_MODE === "v0"
        ? "Charges et produits ventilés par postes ci-dessous ; hors activité financière, exceptionnel et impôt sur les sociétés dans ce périmètre. Suspens banque hors totaux jusqu’à arbitrage cabinet."
        : "Totaux avec affectations **provisoires** des mouvements en suspens bancaire (lignes « ajustées »). Valider les pièces et le fichier des écritures avant usage définitif ; résidu encore signalé en anomalies.",
    score: {
      global: REPORT_471_MODE === "v0" ? 56 : 65,
      level: "acceptable",
      levelLabel: "Acceptable",
      traitement: REPORT_471_MODE === "v0" ? 70 : 88,
      nonTraite: REPORT_471_MODE === "v0" ? 20 : 5,
      ajustement: REPORT_471_MODE === "v0" ? 45 : 64,
      montantTraite:
        REPORT_471_MODE === "v0"
          ? "Suspens banque relus au grand livre ; propositions sans incidence sur les totaux figurant ici."
          : "Suspens banque ; le détail des propositions figure sous les postes « ajustés ».",
      montantNonTraite:
        REPORT_471_MODE === "v0"
          ? "2025 provisoire ; tout le suspens banque encore ouvert ; compte courant d’associés non ventilé dans ce tableau."
          : `${blocking471Residual.length} mouvements suspens banque encore ouverts (~ ${HEALED_471_RESIDUAL_ABS_TOTAL.toLocaleString("fr-FR")} € en valeur absolue) ; suivre aussi le compte courant d’associés.`,
      montantAjuste:
        REPORT_471_MODE === "v0"
          ? "Aucun reclassement des suspens banque dans les totaux N affichés."
          : "Propositions intégrées aux montants N ; détail sous les postes concernés.",
    },
    produits: [
      { label: "Ventes de marchandises", n: 232456.58, n1: 233163.58 },
      { label: "Prestations de services", n: 255045.42, n1: 158783.35 },
      { label: "Ventes de produits finis", n: 833.5, n1: 136923.91 },
      pnlProduitsRowAutres,
    ],
    charges: [
      ...pnlCharges,
      { label: "Autres charges de gestion courante", n: 12084.75, n1: 463.92 },
      { label: "Charges financières", n: 0, n1: 47.08 },
      { label: "Charges exceptionnelles", n: 0, n1: 1095.0 },
      { label: "Dotations aux amortissements", n: 0, n1: 2193.42 },
      { label: "Impôt sur les bénéfices", n: 0, n1: 5707.24 },
    ],
    totals:
      REPORT_471_MODE === "v0"
        ? {
          produitsN: 488358.99,
          produitsN1: 533437.74,
          chargesN: 536552.56,
          chargesN1: 486411.04,
          resultatExploitationN: -48193.57,
          resultatExploitationN1: 56069.44,
          resultatNetN: -48193.57,
          resultatNetN1: 47026.7,
        }
        : {
          produitsN: PNL_HEALED_N.produitsTotal,
          produitsN1: 533437.74,
          chargesN: PNL_HEALED_N.chargesTotal,
          chargesN1: 486411.04,
          resultatExploitationN: PNL_HEALED_N.resultatNet,
          resultatExploitationN1: 56069.44,
          resultatNetN: PNL_HEALED_N.resultatNet,
          resultatNetN1: 47026.7,
        },
  },
  alerts: {
    blocking: blocking471Active,
    blockingTotal: blocking471ActiveTotal,
    points: [
      {
        label: "Balance 2025 provisoire",
        severity: "alerte",
        comment:
          "Balance 2025 provisoire — chiffres mobiles jusqu’à arrêté. À actualiser après clôture ; contrôle cut-off 31/12.",
      },
      {
        label: "Suspens banque — proposition vs lignes encore bloquantes",
        severity: "info",
        account: "Suspens banque — périmètre complet",
        amount: HIGH_CONFIDENCE_471_ABS_TOTAL,
        comment: point471ScriptComment,
      },
      {
        label: "Suspens banque — vue d’ensemble propositions et résidu",
        severity: "info",
        comment: point471TroisListesComment,
      },
      {
        label: "Suspens banque — libellés à identifier",
        severity: "info",
        comment:
          "Sans facture : proposition non opposable — rester en suspens tant que la piste manque.",
      },
      {
        label: point471SuspensLabel,
        severity: "alerte",
        account: "Suspens banque — débit et crédit",
        comment: point471SuspensComment,
      },
      {
        label: "Compte courant d’associés",
        severity: "info",
        account: "Compte courant d’associés",
        amount: -1177.22,
        comment:
          "Compte courant créditeur : −1 177 € sur 2025 contre −1 424 € sur l’exercice précédent. Vérifier les conventions entre associés avant toute mise en distribution.",
      },
    ],
  },
  analyse: {
    scoring: {
      global: REPORT_471_MODE === "v0" ? 56 : 65,
    },
    penalties: [
      {
        label: "Exercice 2025 provisoire",
        weight: 15,
        reason: "Clôture non finalisée — balance provisoire PennyLane.",
      },
      {
        label: "Comptes d’attente bancaires",
        weight: REPORT_471_MODE === "v0" ? 12 : 6,
        reason:
          REPORT_471_MODE === "v0"
            ? "Suspens banque encore ouverts — rapprochements et pièces à finaliser."
            : `${blocking471Residual.length} mouvements suspens banque résiduels après propositions — poursuivre les rapprochements.`,
      },
      {
        label: "Dépendance au regroupement charges / produits",
        weight: 8,
        reason: "Indicateurs intermédiaires non rejoués ici — seuls les agrégats de résultat issus de la balance.",
      },
    ],
    fiscalite: [
      {
        label: "IS exercice",
        status: "Vu sur balance — ligne IS",
        comment:
          "2024 : impôt sur les sociétés 6 707,24 €. Exercice 2025 provisoire : aucune charge d’impôt correspondante sur cet extrait — à confirmer après liasse officielle.",
      },
      {
        label: "TVA",
        status: "À contrôler sur fichier des écritures et liasse",
        comment: "Plusieurs sous-comptes TVA en balance ; contrôle à mener sur le fichier des écritures et la liasse officielle, pas à partir de ce tableau seul.",
      },
    ],
    narratives: {
      score:
        REPORT_471_MODE === "v0"
          ? "Totaux charges et produits cohérents avec la balance exportée. Exercice et suspens banque encore provisoires : prudence jusqu’aux écritures définitives et au fichier légal."
          : "Couverture améliorée après proposition d’affectation des suspens banque ; reste du suspens résiduel et balance provisoire avant arrêt définitif.",
      pnl:
        REPORT_471_MODE === "v0"
          ? "Résultat net provisoire environ −48 k€ contre environ +47 k€ en 2024. La masse salariale et les services extérieurs absorbent la marge ; la ligne produits « finis » est marginale au provisoire alors que marchandises et prestations portent essentiellement le chiffre d’affaires."
          : `Résultat net indicatif d’environ ${(PNL_HEALED_N.resultatNet / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k€ après propositions sur les suspens banque (contre environ −48 k€ en lecture balance brute avant ces reclassements). L’écart porte pour l’essentiel sur des produits encore en attente ; la structure des charges récurrentes hors ce périmètre reste comparable.`,
      monthly:
        "Pas de ventilation mensuelle ici — à extraire du grand livre si besoin.",
      structure:
        "Bilan fonctionnel non développé ici ; les soldes de suspens et de banque peuvent être prolongés à partir du même dossier.",
      sig: "Indicateurs détaillés de gestion absents du présent PDF — ils peuvent être dérivés du plan comptable si les organes l’exigent.",
    },
    synthese: [
      {
        label: "Suspens banque — lecture du tableau des anomalies",
        comment:
          REPORT_471_MODE === "v0"
            ? `${blocking471V0.length} lignes signalées ; ${HIGH_CONFIDENCE_471_COUNT} mouvements défendables sur pièce, ${A_CONFIRMER_471_COUNT} ouverts — le compte de résultat reste inchangé tant que les écritures ne sont pas passées. Après arbitrage : résidu attendu environ ${blocking471Residual.length} lignes à confirmer sur le fichier légal.`
            : `${blocking471Residual.length} anomalies (~ ${HEALED_471_RESIDUAL_ABS_TOTAL.toLocaleString("fr-FR")} € en valeur absolue cumulée) malgré ${HIGH_CONFIDENCE_471_COUNT} sorties traitées ; l’extrait initial comptait ${blocking471V0.length} lignes (${blocking471V0Total.toLocaleString("fr-FR")} € cumulés en valeur absolue). Présentation « tout suspens » possible en annexe sur demande.`,
      },
      {
        label: "Vigilance clôture",
        comment:
          "Finaliser au 31/12/2025 ; avoir soldé les suspens bancaires avant toute mise en distribution de résultats ou régularisation sensible de rémunération.",
      },
      {
        label: "Analyse métier fine",
        comment:
          "Pour comparer précisément l’activité événements et les autres lignes du chiffre d’affaires : repartir du grand livre ou du fichier des écritures — invisible dans ce regroupement de synthèse.",
      },
    ],
    footerExtra: [
      SOURCE_REF,
      "Les totaux recoupent les intitulés de ligne figurant ci-dessus, sur le périmètre des balances PennyLane sources.",
      "Les propositions d’affectation des suspens bancaires ne sont opposables ni au cabinet ni en contrôle externe tant qu’elles ne sont pas inscrites au journal après validation.",
    ],
  },
});
