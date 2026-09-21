import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { jsPDF } from "jspdf";

const ROOT = resolve(".");
const DATA_DIR = resolve("billing", "devis");
const PROFILE_PATH = resolve("billing", "profile.local.json");
const OUTPUT_DIR = resolve("output");
const LOGO_PATH = resolve("scripts", "invoice-template-logo.png");
const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DARK = [61, 61, 61];
const TEXT = [53, 53, 53];
const MUTED = [118, 118, 118];
const PALE = [246, 246, 246];
const WHITE = [255, 255, 255];

function fail(message) {
  throw new Error(message);
}

function money(value) {
  return `${Number(value).toFixed(2).replace(".", ",")} €`;
}

function parseMonth(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "")) {
    fail("Le mois doit utiliser le format AAAA-MM, par exemple 2026-09.");
  }
  return value;
}

function monthLabel(month) {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

function monthStart(month) {
  return `${month}-01`;
}

function monthEnd(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
}

function nextMonthStart(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);
}

function dateFr(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function dataPath(month) {
  return resolve(DATA_DIR, `${month}.json`);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Impossible de lire ${relative(ROOT, path)} : ${error.message}`);
  }
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function loadProfile() {
  if (!existsSync(PROFILE_PATH)) {
    fail("Profil de facturation introuvable. Copiez billing/profile.example.json vers billing/profile.local.json puis renseignez vos coordonnées.");
  }
  const profile = readJson(PROFILE_PATH);
  if (!profile?.issuer?.name || !profile?.issuer?.subtitle) fail("issuer.name et issuer.subtitle sont requis dans billing/profile.local.json.");
  if (!profile?.recipient?.name || !Array.isArray(profile?.recipient?.deliveryAddress)) fail("recipient.name et recipient.deliveryAddress sont requis dans billing/profile.local.json.");
  if (!profile?.payment?.accountHolder || !profile?.payment?.bank || !profile?.payment?.iban || !profile?.payment?.bic) {
    fail("Les coordonnées de paiement sont incomplètes dans billing/profile.local.json.");
  }
  return profile;
}

function git(command) {
  return execFileSync("git", command, { cwd: ROOT, encoding: "utf8" }).trim();
}

function classifyCommit(subject) {
  const text = subject.toLowerCase();
  if (/(auth|security|supabase|api|rate.limit|session|guard|rls)/.test(text)) return "security";
  if (/(document|invoice|client|payment|container|order|export|notification|qr)/.test(text)) return "operations";
  if (/(operator|mobile|tracking|navigation|reception|status|label)/.test(text)) return "operator";
  if (/(audit|test|quality|validat|workflow)/.test(text)) return "quality";
  return "platform";
}

const CATEGORY_DEFINITIONS = {
  security: {
    title: "Sécurisation des accès et de l’API",
    detail: "Sessions, autorisations, routes API et durcissement de la plateforme.",
  },
  operations: {
    title: "Fonctions opérationnelles de gestion logistique",
    detail: "Clients, paiements, documents, exports, conteneurs et notifications.",
  },
  operator: {
    title: "Parcours opérateur mobile, suivi et réception",
    detail: "Navigation mobile, actions opérateur, suivi, QR et réception.",
  },
  quality: {
    title: "Audit, qualité et documentation de livraison",
    detail: "Piste d’audit, validations, tests et documentation de livraison.",
  },
  platform: {
    title: "Évolutions transverses de la plateforme",
    detail: "Évolutions fonctionnelles et correctifs transverses livrés durant la période.",
  },
};

function commitsForMonth(month) {
  const raw = git([
    "log",
    "--no-merges",
    `--since=${monthStart(month)}`,
    `--before=${nextMonthStart(month)}`,
    "--date=short",
    "--pretty=format:%h%x1f%ad%x1f%s",
  ]);
  const commits = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, date, subject] = line.split("\u001f");
      return { hash, date, subject };
    })
    // Les commits de documentation, fusion et maintenance ne gonflent pas les
    // objets facturables initiaux ; ils peuvent être ajoutés manuellement.
    .filter((commit) => !/^(docs|chore|merge|refactor)(\(|:)/i.test(commit.subject));

  if (commits.length === 0) {
    fail(`Aucun commit fonctionnel trouvé pour ${month} sur la branche courante.`);
  }
  return commits;
}

function createMonthlyData(month) {
  const profile = loadProfile();
  const commits = commitsForMonth(month);
  const groups = new Map(Object.keys(CATEGORY_DEFINITIONS).map((key) => [key, []]));
  for (const commit of commits) groups.get(classifyCommit(commit.subject)).push(commit);

  const lineItems = [...groups.entries()]
    .filter(([, group]) => group.length > 0)
    .map(([category, group]) => {
      const definition = CATEGORY_DEFINITIONS[category];
      return {
        title: definition.title,
        detail: `${definition.detail} Commits : ${group.map((commit) => commit.hash).join(", ")}.`,
        // Estimation initiale : à ajuster dans le JSON avant validation.
        quantity: Math.max(1, Math.ceil(group.length / 4)),
        unitPrice: 25,
      };
    });

  const latestCommitDate = commits.map((commit) => commit.date).sort().at(-1) ?? monthEnd(month);
  const period = monthLabel(month);
  return {
    schemaVersion: 1,
    month,
    status: "draft",
    quoteNumber: `DEVIS-${month}`,
    invoiceNumber: `FACTURE-${month}`,
    issueDate: latestCommitDate,
    dueDate: monthEnd(month),
    taxRate: 0,
    issuer: profile.issuer,
    recipient: profile.recipient,
    payment: {
      method: profile.payment.method ?? "Sur validation du devis",
      accountHolder: profile.payment.accountHolder,
      bank: profile.payment.bank,
      iban: profile.payment.iban,
      bic: profile.payment.bic,
    },
    notes: `Devis limité aux prestations livrées durant ${period}. Aucune tâche supplémentaire de roadmap n’est incluse.`,
    terms: {
      quote: `Devis valable jusqu’au ${dateFr(monthEnd(month))}. Les prestations réalisées seront facturées après validation du présent devis.`,
      invoice: "Facture émise après validation du devis et réalisation des prestations indiquées.",
    },
    lineItems,
    generatedFrom: {
      branch: git(["branch", "--show-current"]),
      commits,
    },
  };
}

function assertDocumentData(data, month) {
  if (data?.month !== month) fail(`Le fichier de données ne correspond pas au mois demandé (${month}).`);
  if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) fail("Ajoutez au moins un objet dans lineItems.");
  for (const [index, item] of data.lineItems.entries()) {
    if (!item?.title || !item?.detail) fail(`L’objet ${index + 1} doit définir title et detail.`);
    if (!Number.isFinite(item.quantity) || item.quantity < 0) fail(`La quantité de l’objet ${index + 1} est invalide.`);
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) fail(`Le prix unitaire de l’objet ${index + 1} est invalide.`);
  }
  if (!Number.isFinite(data.taxRate) || data.taxRate < 0) fail("taxRate doit être un nombre positif ou nul.");
}

function totalsFor(data) {
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * data.taxRate;
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

function filenameFor(type, month) {
  return `${type === "quote" ? "Devis" : "Facture"}-DANEMO-${monthLabel(month).replace(" ", "-")}.pdf`;
}

function color(pdf, rgb) {
  pdf.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function fill(pdf, rgb) {
  pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function rightText(pdf, value, x, y, size, style = "normal", rgb = TEXT) {
  color(pdf, rgb);
  pdf.setFont("helvetica", style);
  pdf.setFontSize(size);
  pdf.text(value, x, y, { align: "right" });
}

function pageBackground(pdf, pageWidth, pageHeight) {
  fill(pdf, WHITE);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
}

function logoDataUrl() {
  if (!existsSync(LOGO_PATH)) fail(`Logo introuvable : ${relative(ROOT, LOGO_PATH)}.`);
  return `data:image/png;base64,${readFileSync(LOGO_PATH).toString("base64")}`;
}

function drawHeader(pdf, data, type, totals, logo, pageWidth) {
  const left = 17;
  const right = pageWidth - 17;
  const title = type === "quote" ? "DEVIS" : "FACTURE";
  const documentNumber = type === "quote" ? data.quoteNumber : data.invoiceNumber;
  pdf.addImage(logo, "PNG", left, 15.5, 31, 10.5);
  color(pdf, TEXT);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(25);
  pdf.text(title, right, 17, { align: "right" });
  rightText(pdf, documentNumber, right, 24, 10.5, "normal", MUTED);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text(data.issuer.name, left, 46);
  pdf.setFont("helvetica", "normal");
  pdf.text(data.issuer.subtitle, left, 50);

  color(pdf, MUTED);
  pdf.setFontSize(10);
  pdf.text("A :", left, 60);
  pdf.text("Adresse de livraison :", 64, 60);
  color(pdf, TEXT);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.recipient.name, left, 66);
  const address = data.recipient.deliveryAddress ?? [];
  if (address.length) {
    pdf.text(address.slice(0, 2), 64, 66);
    pdf.setFont("helvetica", "normal");
    pdf.text(address.slice(2), 64, 74);
  }

  const labelX = 163;
  rightText(pdf, "Date:", labelX, 40, 10, "normal", MUTED);
  rightText(pdf, dateFr(data.issueDate), right, 40, 10);
  rightText(pdf, "Modalités de paiement:", labelX, 48, 10, "normal", MUTED);
  rightText(pdf, type === "quote" ? data.payment.method : "Virement bancaire", right, 48, 10);
  rightText(pdf, "A payer avant le:", labelX, 56, 10, "normal", MUTED);
  rightText(pdf, dateFr(data.dueDate), right, 56, 10);
  fill(pdf, PALE);
  pdf.roundedRect(112, 59.5, right - 112, 9, 1.4, 1.4, "F");
  rightText(pdf, "Solde à payer:", labelX, 65.5, 11, "bold");
  rightText(pdf, money(totals.total), right, 65.5, 11, "bold");
}

function drawContinuationHeader(pdf, data, type, logo, pageWidth) {
  const right = pageWidth - 17;
  const title = type === "quote" ? "DEVIS" : "FACTURE";
  const documentNumber = type === "quote" ? data.quoteNumber : data.invoiceNumber;
  pdf.addImage(logo, "PNG", 17, 15.5, 31, 10.5);
  color(pdf, TEXT);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(19);
  pdf.text(title, right, 17, { align: "right" });
  rightText(pdf, documentNumber, right, 24, 10.5, "normal", MUTED);
}

function drawTableHeader(pdf, y, pageWidth) {
  const x = 10;
  const width = pageWidth - 20;
  const objectEnd = 126;
  const quantityEnd = 154;
  const unitEnd = 181;
  fill(pdf, DARK);
  pdf.roundedRect(x, y, width, 7.5, 1.4, 1.4, "F");
  color(pdf, WHITE);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("Objet", x + 5, y + 4.8);
  pdf.text("Quantité", (objectEnd + quantityEnd) / 2, y + 4.8, { align: "center" });
  pdf.text("Prix unitaire", (quantityEnd + unitEnd) / 2, y + 4.8, { align: "center" });
  pdf.text("Montant", (unitEnd + x + width) / 2, y + 4.8, { align: "center" });
  return { x, width, objectEnd, quantityEnd, unitEnd };
}

function itemLayout(pdf, item, table) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.4);
  const titleLines = pdf.splitTextToSize(item.title, table.objectEnd - table.x - 10);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  const detailLines = pdf.splitTextToSize(item.detail, table.objectEnd - table.x - 10);
  return {
    titleLines,
    detailLines,
    rowHeight: Math.max(15, 2 + titleLines.length * 3.5 + detailLines.length * 3.1 + 3),
  };
}

function drawItem(pdf, item, layout, table, y) {
  color(pdf, TEXT);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.4);
  pdf.text(layout.titleLines, table.x + 5, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.text(layout.detailLines, table.x + 5, y + layout.titleLines.length * 3.5 + 0.5);
  const centerY = y + layout.rowHeight / 2 - 1;
  pdf.setFontSize(8.3);
  pdf.text(String(item.quantity), (table.objectEnd + table.quantityEnd) / 2, centerY, { align: "center" });
  pdf.text(money(item.unitPrice), table.unitEnd - 5, centerY, { align: "right" });
  pdf.text(money(item.quantity * item.unitPrice), table.x + table.width - 5, centerY, { align: "right" });
}

function drawTotals(pdf, totals, y, pageWidth) {
  const right = pageWidth - 17;
  const rows = [
    ["Sous-total:", money(totals.subtotal)],
    [`Impôt (${totals.taxRate * 100}%):`, money(totals.taxAmount)],
    ["Total:", money(totals.total)],
  ];
  rows.forEach(([label, value], index) => {
    rightText(pdf, label, 164, y + index * 8, 9.5, "normal", MUTED);
    rightText(pdf, value, right, y + index * 8, 9.5, "normal");
  });
}

function drawNotesPage(pdf, data, type, logo, pageWidth, pageHeight) {
  const left = 17;
  const right = pageWidth - 17;
  pageBackground(pdf, pageWidth, pageHeight);
  drawContinuationHeader(pdf, data, type, logo, pageWidth);
  let y = 45;
  color(pdf, MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Remarques:", left, y);
  color(pdf, TEXT);
  pdf.setFontSize(9.5);
  pdf.text(pdf.splitTextToSize(data.notes, right - left), left, y + 6);

  y += 28;
  color(pdf, MUTED);
  pdf.setFontSize(10);
  pdf.text("Paiement par virement bancaire aux coordonnées suivantes :", left, y);
  color(pdf, TEXT);
  pdf.setFontSize(9.5);
  pdf.text([
    `Titulaire du compte : ${data.payment.accountHolder}`,
    `Banque : ${data.payment.bank}`,
    `IBAN : ${data.payment.iban}`,
    `BIC : ${data.payment.bic}`,
  ], left, y + 13);
  pdf.text(`Merci d’indiquer le numéro de ${type === "quote" ? "devis" : "facture"} en communication lors du virement.`, left, y + 35);

  y += 52;
  color(pdf, MUTED);
  pdf.setFontSize(10);
  pdf.text("Termes:", left, y);
  color(pdf, TEXT);
  pdf.setFontSize(9.5);
  pdf.text(pdf.splitTextToSize(data.terms[type], right - left), left, y + 6);
}

function renderPdf(data, type) {
  const pdf = new jsPDF("p", "mm", "letter");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const logo = logoDataUrl();
  const totals = { ...totalsFor(data), taxRate: data.taxRate };
  pageBackground(pdf, pageWidth, pageHeight);
  drawHeader(pdf, data, type, totals, logo, pageWidth);

  let table = drawTableHeader(pdf, 96, pageWidth);
  let y = 109;
  for (const item of data.lineItems) {
    const layout = itemLayout(pdf, item, table);
    if (y + layout.rowHeight > pageHeight - 40) {
      pdf.addPage();
      pageBackground(pdf, pageWidth, pageHeight);
      drawContinuationHeader(pdf, data, type, logo, pageWidth);
      table = drawTableHeader(pdf, 38, pageWidth);
      y = 51;
    }
    drawItem(pdf, item, layout, table, y);
    y += layout.rowHeight;
  }

  if (y + 32 > pageHeight - 25) {
    pdf.addPage();
    pageBackground(pdf, pageWidth, pageHeight);
    drawContinuationHeader(pdf, data, type, logo, pageWidth);
    y = 45;
  }
  drawTotals(pdf, totals, y + 11, pageWidth);

  pdf.addPage();
  drawNotesPage(pdf, data, type, logo, pageWidth, pageHeight);
  const outputPath = resolve(OUTPUT_DIR, filenameFor(type, data.month));
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, Buffer.from(pdf.output("arraybuffer")));
  return outputPath;
}

function usage() {
  console.log(`\nUsage :
  node scripts/billing-documents.mjs quote --month AAAA-MM [--refresh]
  node scripts/billing-documents.mjs invoice --month AAAA-MM

quote   crée le fichier éditable billing/devis/AAAA-MM.json à partir des commits
        du mois, puis génère le devis. Sans --refresh, vos modifications JSON
        sont conservées.
invoice génère la facture au même style depuis ce JSON, uniquement si
        \"status\" vaut \"validated\".\n`);
}

function parseArgs() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h" || command === "help") return { command: "help" };
  if (!["quote", "invoice"].includes(command)) fail(`Commande inconnue : ${command}.`);
  const monthIndex = args.indexOf("--month");
  if (monthIndex === -1 || !args[monthIndex + 1]) fail("Ajoutez --month AAAA-MM.");
  const allowed = new Set(["--month", args[monthIndex + 1], "--refresh"]);
  if (args.some((arg) => !allowed.has(arg))) fail("Option inconnue. Utilisez --help pour la syntaxe.");
  const refresh = args.includes("--refresh");
  if (command === "invoice" && refresh) fail("--refresh est disponible uniquement pour la commande quote.");
  return { command, month: parseMonth(args[monthIndex + 1]), refresh };
}

function run() {
  const options = parseArgs();
  if (options.command === "help") return usage();
  const path = dataPath(options.month);
  let data;

  if (options.command === "quote") {
    if (!existsSync(path) || options.refresh) {
      const hadExistingData = existsSync(path);
      data = createMonthlyData(options.month);
      writeJson(path, data);
      console.log(`${relative(ROOT, path)} ${hadExistingData ? "actualisé" : "créé"}.`);
    } else {
      data = readJson(path);
    }
  } else {
    if (!existsSync(path)) fail(`Créez d’abord le devis avec : quote --month ${options.month}`);
    data = readJson(path);
    if (data.status !== "validated") {
      fail(`Le devis ${options.month} est en statut \"${data.status}\". Modifiez billing/devis/${options.month}.json et définissez \"status\": \"validated\" après validation.`);
    }
  }

  assertDocumentData(data, options.month);
  const output = renderPdf(data, options.command);
  console.log(`${options.command === "quote" ? "Devis" : "Facture"} généré : ${relative(ROOT, output)}`);
}

try {
  run();
} catch (error) {
  console.error(`Erreur : ${error.message}`);
  process.exitCode = 1;
}
