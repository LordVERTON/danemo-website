import jsPDF from "jspdf";
import {
  computeInvoiceAmounts,
  extractDnOrderNumbersFromDescriptions,
  formatCurrencyEUR,
  formatInvoiceDateLines,
  formatInvoiceDisplayNumber,
  formatTaxAmountDisplay,
  formatTaxRateDisplay,
  resolveInvoicePaymentText,
} from "@/lib/invoice-formatting";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

type InvoiceAddress = {
  name: string;
  address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
};

export interface InvoiceData {
  invoiceNumber?: string;
  issueDate?: string;
  issueLocation?: string;

  order: {
    id: string;
    order_number: string;
    client_name: string;
    client_email: string;
    client_phone?: string;
    client_address?: string;
    client_city?: string;
    client_postal_code?: string;
    client_country?: string;

    recipient_name?: string | null;
    recipient_email?: string | null;
    recipient_phone?: string | null;
    recipient_address?: string | null;
    recipient_city?: string | null;
    recipient_postal_code?: string | null;
    recipient_country?: string | null;

    service_type: string;
    origin: string;
    destination: string;
    weight?: number;
    value?: number;
    status: string;
    created_at: string;
  };

  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    siret: string;
    tva: string;
    iban?: string;
    bic?: string;
  };

  items?: InvoiceItem[];
  billingAddress?: {
    name: string;
    address?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };
  shippingAddress?: {
    name: string;
    address?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };

  taxRate?: number;
  paymentMethod?: string;
  /** Facture multi-commandes client : libellé de paiement adapté. */
  consolidatedInvoice?: boolean;
}

/** Constantes de mise en page (mm, police) — style PAGUI / Danemo. */
const LAYOUT = {
  margin: 15,
  cellPadMm: 3,
  textRightPadMm: 1,
  tableTopMm: 88,
  gapAfterAddressesMm: 16,
  tableHeaderGapMm: 5.5,
  tableHeaderBandMm: 9,
  descLineHeightMm: 3.8,
  minRowMm: 8,
  /** Réserve pied de page + paiement sur la dernière page. */
  tableBottomReserveLastPageMm: 82,
  continuationBottomMarginMm: 14,
  continuationTableTopMm: 44,
  colFracs: [0.46, 0.14, 0.15, 0.25] as const,
  addressBlockTopMm: 66,
  addressLineGapMm: 5.2,
  addressLabelGapMm: 6,
  dateRightPadMm: 2,
  factureBannerMm: { x: 8, w: 92, h: 20, topMm: 31 },
  /** Zone logo (fond orange, coin haut-droit), avec forme arrondie type template. */
  logo: { boxW: 62, boxH: 24, maxW: 34, maxH: 16, rightPadMm: 0, topMm: 0, radiusMm: 18 },
  /** Sous le bandeau FACTURE : numéro de facture. */
  invoiceNoBelowBannerMm: 57,
  /** Bloc société sous le logo (centré). */
  header: {
    factureTitleY: 45.5,
    companyNameY: 41,
    slogan1Y: 43,
    slogan2Y: 48,
    dateY1: 60,
    dateY2: 64,
  },
  fontSizes: {
    factureTitle: 24,
    invoiceNo: 10,
    company: 10,
    slogan: 8.2,
    date: 12,
    address: 12,
    body: 10,
    total: 10,
    totalEmphasis: 11,
    footer: 10.2,
    footerTight: 9.4,
  },
  summaryGapAfterTableMm: 6,
  summaryLineGapMm: 4.4,
  summaryLabelColumnMm: 45,
  summaryDividerGapMm: 3,
  totalExtraGapMm: 6,
  paymentBlockGapMm: 10,
  paymentLineGapMm: 4.8,
  paymentTitleGapMm: 4.5,
  tableRuleWidthMm: 0.08,
  tableClosingRuleWidthMm: 0.25,
  tableVerticalWidthMm: 0.25,
  rowRuleOffsetMm: 3.5,
  tableHeaderFontSize: 12,
  tableOuterFrameWidthMm: 0.25,
  footerBandMm: 22.5,
  footerLine1OffsetMm: 7.2,
  footerLine2OffsetMm: 13.8,
  footerSep: "    ",
} as const;

/** Orange gabarit (#FF8C00, léger ajustement saturation). */
const orangeColor = [252, 138, 4] as [number, number, number];
const footerGradientStartColor = [247, 147, 26] as [number, number, number]; // #F7931A
const footerGradientEndColor = [227, 93, 16] as [number, number, number]; // #E35D10
const whiteColor = [255, 255, 255] as [number, number, number];
const blackColor = [0, 0, 0] as [number, number, number];
const linkBlueColor = [42, 116, 210] as [number, number, number];
/** Traits de tableau plus discrets. */
const grayColor = [165, 165, 165] as [number, number, number];
const tableGridColor = [190, 190, 190] as [number, number, number];
const rowStripeGrayColor = [238, 238, 238] as [number, number, number];
const pageBgColor = [250, 250, 250] as [number, number, number];

function sanitizeJsPdfText(text: string): string {
  return text
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2194/g, "<->")
    .replace(/\u21d2/g, "=>")
    .replace(/\u2014/g, "--")
    .replace(/\u2026/g, "...")
    .replace(/\u00a0/g, " ");
}

function toNameCase(value: string): string {
  const cleaned = sanitizeJsPdfText(value).trim().toLowerCase();
  if (!cleaned) return "";
  return cleaned
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function webpUrlToPngDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Impossible de charger le logo: ${url} (${res.status})`);

  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context indisponible");

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  return canvas.toDataURL("image/png");
}

function fitRect(
  imgW: number,
  imgH: number,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  const ratio = Math.min(maxW / imgW, maxH / imgH, 1);
  return { w: imgW * ratio, h: imgH * ratio };
}

function createFooterTrapezoidDataUrl(params: {
  widthMm: number;
  heightMm: number;
  slopeRatio: number;
  rightRadiusMm: number;
}): string | null {
  if (typeof document === "undefined") return null;
  const { widthMm, heightMm, slopeRatio, rightRadiusMm } = params;
  const pxPerMm = 8;
  const w = Math.max(500, Math.round(widthMm * pxPerMm));
  const h = Math.max(90, Math.round(heightMm * pxPerMm));
  const radius = Math.max(1, Math.round(rightRadiusMm * pxPerMm));
  const slopeStartX = Math.round(w * (1 - slopeRatio));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "#F7931A");
  grad.addColorStop(1, "#E35D10");
  ctx.fillStyle = grad;

  // Trapèze: gauche droit (90deg), droite inclinée avec arrondis haut/bas.
  const topCornerX = slopeStartX;
  const topCornerY = 0;
  const bottomCornerX = w;
  const bottomCornerY = h;
  const dx = bottomCornerX - topCornerX;
  const dy = bottomCornerY - topCornerY;
  const len = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;

  const topArcStartX = topCornerX - radius;
  const topArcStartY = 0;
  const topArcEndX = topCornerX + ux * radius;
  const topArcEndY = topCornerY + uy * radius;
  const bottomArcStartX = bottomCornerX - ux * radius;
  const bottomArcStartY = bottomCornerY - uy * radius;
  const bottomArcEndX = bottomCornerX - radius;
  const bottomArcEndY = h;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.max(0, topArcStartX), 0);
  ctx.quadraticCurveTo(topCornerX, topCornerY, topArcEndX, topArcEndY);
  ctx.lineTo(bottomArcStartX, bottomArcStartY);
  ctx.quadraticCurveTo(bottomCornerX, bottomCornerY, bottomArcEndX, bottomArcEndY);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL("image/png");
}

function createHeaderLogoBandDataUrl(params: {
  widthMm: number;
  heightMm: number;
  leftRadiusXMm: number;
  leftRadiusYMm: number;
}): string | null {
  if (typeof document === "undefined") return null;
  const { widthMm, heightMm, leftRadiusXMm, leftRadiusYMm } = params;
  const pxPerMm = 10;
  const w = Math.max(360, Math.round(widthMm * pxPerMm));
  const h = Math.max(120, Math.round(heightMm * pxPerMm));
  const rx = Math.max(16, Math.round(leftRadiusXMm * pxPerMm));
  const ry = Math.max(10, Math.round(leftRadiusYMm * pxPerMm));
  const topCap = Math.min(Math.round(h * 0.46), ry);
  const bottomCap = Math.min(Math.round(h * 0.54), Math.round(ry * 1.08));
  const k = 0.5522847498;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "#F7931A");
  grad.addColorStop(1, "#E35D10");
  ctx.fillStyle = grad;

  // Bloc PAGUI: haut/bas/droite rectilignes, gauche elliptique (rx > ry).
  ctx.beginPath();
  ctx.moveTo(rx, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, h);
  ctx.lineTo(rx, h);
  ctx.bezierCurveTo(
    rx - rx * k,
    h,
    0,
    h - bottomCap + bottomCap * k,
    0,
    h - bottomCap
  );
  ctx.lineTo(0, topCap);
  ctx.bezierCurveTo(
    0,
    topCap - topCap * k,
    rx - rx * k,
    0,
    rx,
    0
  );
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL("image/png");
}

/** Retour à la ligne (mots + paragraphes \n) pour jsPDF. */
function wrapLinesJsPDF(
  pdf: jsPDF,
  text: string,
  maxWidthMm: number,
  fontSize: number,
  fontStyle: "normal" | "bold" = "normal"
): string[] {
  const normalized = sanitizeJsPdfText(text).replace(/\r\n/g, "\n").trim();
  if (!normalized) return [""];

  pdf.setFont("helvetica", fontStyle);
  pdf.setFontSize(fontSize);

  const lines: string[] = [];
  for (const para of normalized.split("\n")) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (pdf.getTextWidth(test) <= maxWidthMm) {
        current = test;
      } else {
        if (current) lines.push(current);
        if (pdf.getTextWidth(word) <= maxWidthMm) {
          current = word;
        } else {
          let chunk = "";
          for (const ch of word) {
            const t = chunk + ch;
            if (pdf.getTextWidth(t) <= maxWidthMm) chunk = t;
            else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          current = chunk;
        }
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [""];
}

/** Aligne le texte à droite dans une colonne [left, right] (mesure avec la même graisse). */
function textRightInColumn(
  pdf: jsPDF,
  text: string,
  colLeft: number,
  colRight: number,
  y: number,
  fontSize: number,
  fontStyle: "normal" | "bold" | "italic" = "normal"
) {
  pdf.setFont("helvetica", fontStyle);
  pdf.setFontSize(fontSize);
  const w = pdf.getTextWidth(text);
  const pad = LAYOUT.textRightPadMm;
  const x = Math.max(colLeft + 0.5, colRight - w - pad);
  pdf.text(text, x, y);
}

function textCenterInColumn(
  pdf: jsPDF,
  text: string,
  colLeft: number,
  colRight: number,
  y: number,
  fontSize: number,
  fontStyle: "normal" | "bold" | "italic" = "normal"
) {
  pdf.setFont("helvetica", fontStyle);
  pdf.setFontSize(fontSize);
  const w = pdf.getTextWidth(text);
  const cx = (colLeft + colRight) / 2;
  pdf.text(text, cx - w / 2, y);
}

function drawProductTableHeader(
  pdf: jsPDF,
  yPos: number,
  tableStartX: number,
  tableWidth: number,
  colPositions: number[],
  colWidths: number[]
): { yAfter: number; bandTopY: number; bandBottomY: number } {
  const band = LAYOUT.tableHeaderBandMm;
  const bandTopY = yPos - (band - 2);
  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.rect(tableStartX, bandTopY, tableWidth, band, "F");

  const qtyColR = colPositions[1] + colWidths[1];
  const puColR = colPositions[2] + colWidths[2];
  const totColR = colPositions[3] + colWidths[3];

  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(LAYOUT.tableHeaderFontSize);
  pdf.setFont("helvetica", "bold");
  const cpad = LAYOUT.cellPadMm;
  textCenterInColumn(pdf, "DESCRIPTION", colPositions[0], colPositions[0] + colWidths[0], yPos, LAYOUT.tableHeaderFontSize, "bold");
  textCenterInColumn(pdf, "QUANTITES", colPositions[1], qtyColR, yPos, LAYOUT.tableHeaderFontSize, "bold");
  textCenterInColumn(pdf, "P.U", colPositions[2], puColR, yPos, LAYOUT.tableHeaderFontSize, "bold");
  textCenterInColumn(pdf, "PRIX TOTAL", colPositions[3], totColR, yPos, LAYOUT.tableHeaderFontSize, "bold");

  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(LAYOUT.fontSizes.body);
  pdf.setFont("helvetica", "normal");
  const bandBottomY = bandTopY + band;
  pdf.setDrawColor(tableGridColor[0], tableGridColor[1], tableGridColor[2]);
  pdf.setLineWidth(LAYOUT.tableVerticalWidthMm);
  pdf.line(colPositions[1], bandTopY, colPositions[1], bandBottomY);
  pdf.line(colPositions[2], bandTopY, colPositions[2], bandBottomY);
  pdf.line(colPositions[3], bandTopY, colPositions[3], bandBottomY);
  return { yAfter: yPos + LAYOUT.tableHeaderGapMm, bandTopY, bandBottomY };
}

function drawTableColumnSeparators(
  pdf: jsPDF,
  xs: number[],
  yTop: number,
  yBottom: number
) {
  pdf.setDrawColor(tableGridColor[0], tableGridColor[1], tableGridColor[2]);
  pdf.setLineWidth(LAYOUT.tableVerticalWidthMm);
  for (const x of xs) {
    pdf.line(x, yTop, x, yBottom);
  }
}

function paintPageBackground(pdf: jsPDF, pageWidth: number, pageHeight: number) {
  pdf.setFillColor(pageBgColor[0], pageBgColor[1], pageBgColor[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
}

function drawAddressBlock(
  pdf: jsPDF,
  params: {
    title: string;
    x: number;
    startY: number;
    maxWidth: number;
    lineGap: number;
    addressLabelGap: number;
    fontSize: number;
    address: InvoiceAddress;
    truncate: (text: string, maxWidth: number, fontSize: number) => string;
  }
): number {
  const { title, x, startY, maxWidth, lineGap, addressLabelGap, fontSize, address, truncate } = params;
  let y = startY;

  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.setFontSize(fontSize);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, x, y);

  y += addressLabelGap;
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFont("helvetica", "normal");
  pdf.text(truncate(toNameCase(address.name), maxWidth, fontSize), x, y);

  if (address.address) {
    y += lineGap;
    pdf.text(truncate(sanitizeJsPdfText(address.address), maxWidth, fontSize), x, y);
  }
  const postalCity = [address.postal_code, address.city]
    .map((value) => (value ? sanitizeJsPdfText(value).trim() : ""))
    .filter(Boolean)
    .join(" ");
  if (postalCity) {
    y += lineGap;
    pdf.text(truncate(postalCity, maxWidth, fontSize), x, y);
  }
  if (address.country) {
    y += lineGap;
    pdf.text(truncate(sanitizeJsPdfText(address.country).toUpperCase(), maxWidth, fontSize), x, y);
  }

  return y;
}

export const generateInvoice = async (data: InvoiceData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = LAYOUT.margin;
  const rightMargin = pageWidth - margin;

  paintPageBackground(pdf, pageWidth, pageHeight);

  const { subtotal, taxRate, taxAmount, total, lines: items } = computeInvoiceAmounts({
    items: data.items,
    orderFallback: { service_type: data.order.service_type, value: data.order.value },
    taxRate: data.taxRate,
  });

  const issueDate = data.issueDate
    ? new Date(data.issueDate)
    : new Date(data.order.created_at);
  const location = data.issueLocation ?? "Bruxelles";
  const invoiceNumberRaw = data.invoiceNumber ?? data.order.order_number;
  const invoiceDisplay = formatInvoiceDisplayNumber(invoiceNumberRaw, {
    itemOrderNumbers: extractDnOrderNumbersFromDescriptions(items),
  });

  const billingAddress: InvoiceAddress = data.billingAddress ?? {
    name: data.order.client_name,
    address: data.order.client_address,
    postal_code: data.order.client_postal_code,
    city: data.order.client_city,
    country: data.order.client_country,
  };

  const defaultShippingAddress: InvoiceAddress = {
    name: data.order.recipient_name ?? data.order.client_name,
    address: data.order.recipient_address ?? data.order.destination ?? undefined,
    postal_code: data.order.recipient_postal_code ?? undefined,
    city: data.order.recipient_city ?? undefined,
    country: data.order.recipient_country ?? undefined,
  };
  const shippingAddress = data.shippingAddress ?? defaultShippingAddress;

  const truncateText = (text: string, maxWidth: number, fontSize: number) => {
    const t0 = sanitizeJsPdfText(text);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fontSize);
    const textWidth = pdf.getTextWidth(t0);
    if (textWidth <= maxWidth) return t0;
    let truncated = t0;
    while (pdf.getTextWidth(truncated + "...") > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + "...";
  };

  const logoBoxW = LAYOUT.logo.boxW;
  const logoBoxH = LAYOUT.logo.boxH;
  const logoBoxX = pageWidth - logoBoxW;
  const logoBoxY = 0;
  const logoMaxW = LAYOUT.logo.maxW;
  const logoMaxH = LAYOUT.logo.maxH;
  const logoCx = logoBoxX + logoBoxW * 0.7;
  const logoCy = logoBoxY + logoBoxH * 0.52;
  const headerLogoBandDataUrl = createHeaderLogoBandDataUrl({
    widthMm: logoBoxW,
    heightMm: logoBoxH,
    leftRadiusXMm: 18,
    leftRadiusYMm: 12,
  });
  if (headerLogoBandDataUrl) {
    pdf.addImage(headerLogoBandDataUrl, "PNG", logoBoxX, logoBoxY, logoBoxW, logoBoxH);
  } else {
    pdf.setFillColor(footerGradientStartColor[0], footerGradientStartColor[1], footerGradientStartColor[2]);
    pdf.rect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, "F");
  }

  try {
    const logoUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/images/logo.webp`
        : "/images/logo.webp";
    const logoDataUrl = await webpUrlToPngDataUrl(logoUrl);

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = logoDataUrl;
    });

    const { w: logoW, h: logoH } = fitRect(img.width, img.height, logoMaxW, logoMaxH);
    const logoImgX = logoCx - logoW / 2;
    const logoImgY = logoCy - logoH / 2;
    pdf.addImage(logoDataUrl, "PNG", logoImgX, logoImgY, logoW, logoH);
  } catch {
    pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    const dWidth = pdf.getTextWidth("D");
    pdf.text("D", logoCx - dWidth / 2, logoCy + 1.5);
  }

  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);

  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.rect(
    LAYOUT.factureBannerMm.x,
    LAYOUT.factureBannerMm.topMm,
    LAYOUT.factureBannerMm.w,
    LAYOUT.factureBannerMm.h,
    "F"
  );

  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(LAYOUT.fontSizes.factureTitle);
  pdf.setFont("helvetica", "bold");
  pdf.text("FACTURE", LAYOUT.factureBannerMm.x + 6, LAYOUT.header.factureTitleY);

  const hy = LAYOUT.header;
  const sloganCenterX = logoBoxX + logoBoxW * 0.7;
  const sloganY1 = logoBoxY + logoBoxH + 8;
  const sloganY2 = sloganY1 + 4.8;
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(LAYOUT.fontSizes.slogan);
  pdf.setFont("helvetica", "normal");
  pdf.text("IMPORT & EXPORT GROUPAGE", sloganCenterX, sloganY1, { align: "center" });
  pdf.text("ET TRANSPORT MARITIME", sloganCenterX, sloganY2, { align: "center" });

  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(LAYOUT.fontSizes.invoiceNo);
  pdf.setFont("helvetica", "normal");
  const invNoMaxW = logoBoxX - margin - 6;
  const invToDraw =
    pdf.getTextWidth(invoiceDisplay) > invNoMaxW
      ? truncateText(invoiceDisplay, invNoMaxW, LAYOUT.fontSizes.invoiceNo)
      : invoiceDisplay;
  pdf.text(invToDraw, margin + 4, LAYOUT.invoiceNoBelowBannerMm);

  const { line1: dateLine1, line2: dateLine2 } = formatInvoiceDateLines(location, issueDate);

  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.setFontSize(LAYOUT.fontSizes.date);
  pdf.setFont("helvetica", "bold");
  const dr = LAYOUT.dateRightPadMm;
  const d1 = sanitizeJsPdfText(dateLine1);
  const d2 = sanitizeJsPdfText(dateLine2);
  pdf.text(d1, rightMargin - dr, hy.dateY1, { align: "right" });
  const d1Width = pdf.getTextWidth(d1);
  const d2Width = pdf.getTextWidth(d2);
  const d1LeftX = rightMargin - dr - d1Width;
  const d2X = d1LeftX + (d1Width - d2Width) / 2;
  pdf.text(d2, d2X, hy.dateY2);

  const addrGap = LAYOUT.addressLineGapMm;
  let yPos: number = LAYOUT.addressBlockTopMm;

  const addressMidX = margin + (pageWidth - 2 * margin) * 0.5;
  const maxAddressWidth = addressMidX - margin - 8;
  const billingBottomMm = drawAddressBlock(pdf, {
    title: "Adresse de facturation :",
    x: margin,
    startY: yPos + 4,
    maxWidth: maxAddressWidth,
    lineGap: addrGap,
    addressLabelGap: LAYOUT.addressLabelGapMm,
    fontSize: LAYOUT.fontSizes.address,
    address: billingAddress,
    truncate: truncateText,
  });

  yPos = LAYOUT.addressBlockTopMm + 3;
  const shippingLabelX = addressMidX + 10;
  const maxShippingWidth = rightMargin - shippingLabelX;
  const shippingBottomMm = drawAddressBlock(pdf, {
    title: "Adresse de livraison",
    x: shippingLabelX,
    startY: yPos + 24,
    maxWidth: maxShippingWidth,
    lineGap: addrGap,
    addressLabelGap: LAYOUT.addressLabelGapMm,
    fontSize: LAYOUT.fontSizes.address,
    address: shippingAddress,
    truncate: truncateText,
  });

  const tableStartX = margin;
  const tableWidth = pageWidth - margin * 2;
  const [f0, f1, f2, f3] = LAYOUT.colFracs;
  const colWidths = [tableWidth * f0, tableWidth * f1, tableWidth * f2, tableWidth * f3];
  const colPositions = [
    tableStartX,
    tableStartX + colWidths[0],
    tableStartX + colWidths[0] + colWidths[1],
    tableStartX + colWidths[0] + colWidths[1] + colWidths[2],
  ];

  const qtyColR = colPositions[1] + colWidths[1];
  const puColR = colPositions[2] + colWidths[2];
  const totColR = colPositions[3] + colWidths[3];

  yPos = Math.max(billingBottomMm, shippingBottomMm) + LAYOUT.gapAfterAddressesMm;
  yPos = Math.max(yPos, LAYOUT.tableTopMm);

  const tableHeader0 = drawProductTableHeader(pdf, yPos, tableStartX, tableWidth, colPositions, colWidths);
  yPos = tableHeader0.yAfter;
  const tableBandTopY = tableHeader0.bandTopY;

  const tableStartPage = pdf.getNumberOfPages();

  const cpad = LAYOUT.cellPadMm;
  const maxDescWidth = colWidths[0] - 2 * cpad;

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const hasMoreItems = index < items.length - 1;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(LAYOUT.fontSizes.body);
    const descriptionText = item.description.toLocaleUpperCase("fr-FR");
    const descLines = wrapLinesJsPDF(pdf, descriptionText, maxDescWidth, LAYOUT.fontSizes.body);
    const rowHeight = Math.max(
      LAYOUT.minRowMm,
      (descLines.length - 1) * LAYOUT.descLineHeightMm + LAYOUT.minRowMm
    );

    const maxYBeforeBreak = hasMoreItems
      ? pageHeight - LAYOUT.continuationBottomMarginMm
      : pageHeight - LAYOUT.tableBottomReserveLastPageMm;

    if (yPos + rowHeight > maxYBeforeBreak) {
      pdf.addPage();
      paintPageBackground(pdf, pageWidth, pageHeight);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.text(`${invoiceDisplay} — suite`, margin, LAYOUT.continuationTableTopMm - 18);
      pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
      pdf.setFont("helvetica", "normal");
      yPos = LAYOUT.continuationTableTopMm;
      const thNext = drawProductTableHeader(pdf, yPos, tableStartX, tableWidth, colPositions, colWidths);
      yPos = thNext.yAfter;
    }

    const rowY = yPos;
    const rowTopY = rowY - LAYOUT.rowRuleOffsetMm;
    const isGrayRow = index % 2 === 0;
    const [r, g, b] = isGrayRow ? rowStripeGrayColor : whiteColor;
    pdf.setFillColor(r, g, b);
    pdf.rect(tableStartX, rowTopY, tableWidth, rowHeight, "F");

    pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.setLineWidth(LAYOUT.tableRuleWidthMm);
    pdf.line(
      tableStartX,
      rowTopY,
      tableStartX + tableWidth,
      rowTopY
    );
    pdf.setDrawColor(tableGridColor[0], tableGridColor[1], tableGridColor[2]);
    pdf.setLineWidth(LAYOUT.tableVerticalWidthMm);
    pdf.line(colPositions[1], rowTopY, colPositions[1], rowTopY + rowHeight);
    pdf.line(colPositions[2], rowTopY, colPositions[2], rowTopY + rowHeight);
    pdf.line(colPositions[3], rowTopY, colPositions[3], rowTopY + rowHeight);

    let descYMm = rowY;
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.setFont("helvetica", "bold");
    for (const line of descLines) {
      pdf.text(line, colPositions[0] + cpad, descYMm);
      descYMm += LAYOUT.descLineHeightMm;
    }

    const unitPriceStr = formatCurrencyEUR(item.unitPrice).replace(/\s+€/g, "€");
    pdf.setFont("helvetica", "normal");
    pdf.text(item.quantity.toString(), colPositions[1] + cpad, rowY);
    pdf.text(unitPriceStr, colPositions[2] + cpad, rowY);
    pdf.text(formatCurrencyEUR(item.total), colPositions[3] + cpad, rowY);

    yPos += rowHeight;
  }

  const tableEndY = yPos;
  const tableEndPage = pdf.getNumberOfPages();

  pdf.setDrawColor(tableGridColor[0], tableGridColor[1], tableGridColor[2]);
  pdf.setLineWidth(LAYOUT.tableVerticalWidthMm);
  pdf.line(tableStartX, tableBandTopY, tableStartX + tableWidth, tableBandTopY);
  if (tableStartPage === tableEndPage) {
    const colXs = [tableStartX, colPositions[1], colPositions[2], colPositions[3], tableStartX + tableWidth];
    drawTableColumnSeparators(pdf, colXs, tableBandTopY, tableEndY);
  }

  pdf.setDrawColor(tableGridColor[0], tableGridColor[1], tableGridColor[2]);

  yPos = tableEndY + LAYOUT.summaryGapAfterTableMm;
  const footerSafeTop = pageHeight - LAYOUT.footerBandMm - 8;
  if (yPos + 58 > footerSafeTop) {
    pdf.addPage();
    paintPageBackground(pdf, pageWidth, pageHeight);
    yPos = margin + 6;
  }

  const summaryLabelX = totColR - LAYOUT.summaryLabelColumnMm;
  const dividerX = totColR - 21.5;
  const amountLeftX = dividerX + 2.2;
  const amountX = (txt: string) =>
    Math.max(amountLeftX, totColR - pdf.getTextWidth(txt) - LAYOUT.textRightPadMm);
  const labelX = (label: string) => dividerX - 2.2 - pdf.getTextWidth(label);
  const summaryTopY = yPos;

  pdf.setFontSize(LAYOUT.fontSizes.body);
  pdf.setFont("helvetica", "bolditalic");
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  const subtotalLabel = "Sous-total";
  pdf.text(subtotalLabel, Math.max(summaryLabelX, labelX(subtotalLabel)), yPos);
  const subtotalText = formatCurrencyEUR(subtotal);
  pdf.setFont("helvetica", "bold");
  pdf.text(subtotalText, amountX(subtotalText), yPos);

  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.setLineWidth(0.18);
  pdf.line(summaryLabelX - 2, yPos + 1.2, totColR, yPos + 1.2);

  yPos += LAYOUT.summaryLineGapMm;
  const taxRateLabel = "Taux de TVA";
  pdf.setFont("helvetica", "bolditalic");
  pdf.text(taxRateLabel, Math.max(summaryLabelX, labelX(taxRateLabel)), yPos);
  const taxRateStr = formatTaxRateDisplay(taxRate);
  pdf.setFont("helvetica", "bold");
  pdf.text(taxRateStr, amountX(taxRateStr), yPos);

  yPos += LAYOUT.summaryLineGapMm;
  const taxAmountLabel = "TVA";
  pdf.setFont("helvetica", "bolditalic");
  pdf.text(taxAmountLabel, Math.max(summaryLabelX, labelX(taxAmountLabel)), yPos);
  const taxAmountText = formatTaxAmountDisplay(taxAmount);
  pdf.setFont("helvetica", "bold");
  pdf.text(taxAmountText, amountX(taxAmountText), yPos);

  yPos += LAYOUT.totalExtraGapMm;
  const totalText = formatCurrencyEUR(total);
  const totalLabel = "TOTAL";
  pdf.setFont("helvetica", "bolditalic");
  pdf.setFontSize(LAYOUT.fontSizes.totalEmphasis);
  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.text(totalLabel, Math.max(summaryLabelX, labelX(totalLabel)), yPos);
  pdf.text(totalText, amountX(totalText), yPos);

  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.setLineWidth(0.18);
  pdf.line(dividerX, summaryTopY - 2.6, dividerX, yPos + 2.6);

  const paymentTitleFontSize = 11;
  const paymentBodyFontSize = 10.5;
  const paymentText = resolveInvoicePaymentText(data.paymentMethod, data.consolidatedInvoice);
  const maxPaymentWidth = rightMargin - margin;
  const payLines = wrapLinesJsPDF(pdf, paymentText, maxPaymentWidth, paymentBodyFontSize);
  const bicLines =
    data.company.bic && data.company.iban
      ? wrapLinesJsPDF(
          pdf,
          `BIC : ${data.company.bic} \u2013 IBAN : ${data.company.iban}`,
          maxPaymentWidth,
          paymentBodyFontSize
        )
      : [];
  const payTitle = "Détails de payement :";
  const payGap = LAYOUT.paymentLineGapMm;
  const paymentBlockHeight =
    LAYOUT.paymentTitleGapMm + (payLines.length + bicLines.length) * payGap;
  let paymentStartY =
    pageHeight - LAYOUT.footerBandMm - 8 - paymentBlockHeight;
  const minPaymentStartY = yPos + LAYOUT.paymentBlockGapMm;

  if (paymentStartY < minPaymentStartY) {
    pdf.addPage();
    paintPageBackground(pdf, pageWidth, pageHeight);
    paymentStartY =
      pageHeight - LAYOUT.footerBandMm - 8 - paymentBlockHeight;
  }

  yPos = paymentStartY;
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(paymentTitleFontSize);
  pdf.setFont("helvetica", "bold");
  pdf.text(payTitle, margin, yPos);
  const payTitleWidth = pdf.getTextWidth(payTitle);
  pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setLineWidth(0.2);
  pdf.line(margin, yPos + 1.1, margin + payTitleWidth, yPos + 1.1);

  yPos += LAYOUT.paymentTitleGapMm;
  pdf.setFontSize(paymentBodyFontSize);
  pdf.setFont("helvetica", "normal");
  for (const pl of payLines) {
    pdf.text(pl, margin, yPos);
    yPos += payGap;
  }
  for (const bl of bicLines) {
    pdf.text(bl, margin, yPos);
    yPos += payGap;
  }

  const pageCount = pdf.getNumberOfPages();
  const websiteHost = data.company.website
    ? data.company.website.replace(/^https?:\/\//, "").replace(/^www\./, "")
    : "";
  const websiteLabel = websiteHost ? `www.${websiteHost}` : "";
  const websiteUrl = websiteHost ? `https://${websiteHost}` : "";
  const emailLabel = data.company.email ? sanitizeJsPdfText(data.company.email) : "";
  const emailUrl = emailLabel ? `mailto:${emailLabel}` : "";
  const phoneLabel = data.company.phone ? sanitizeJsPdfText(data.company.phone) : "";
  const tvaLabel = data.company.tva ? `TVA : ${data.company.tva}` : "";
  const footerLine2Base = data.company.address ? sanitizeJsPdfText(data.company.address) : "";

  const footerBandDataUrl = createFooterTrapezoidDataUrl({
    widthMm: pageWidth,
    heightMm: LAYOUT.footerBandMm,
    slopeRatio: 0.022,
    rightRadiusMm: 3.2,
  });

  const drawFooterOnPage = (pageIdx: number) => {
    pdf.setPage(pageIdx);
    const footerBandMm = LAYOUT.footerBandMm;
    const footerY = pageHeight - footerBandMm;
    if (footerBandDataUrl) {
      pdf.addImage(footerBandDataUrl, "PNG", 0, footerY, pageWidth, footerBandMm);
    } else {
      pdf.setFillColor(footerGradientStartColor[0], footerGradientStartColor[1], footerGradientStartColor[2]);
      pdf.rect(0, footerY, pageWidth, footerBandMm, "F");
    }

    pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
    pdf.setFont("helvetica", "normal");
    const leftPadding = 18;
    const rightPadding = 18;
    const slopeStartX = pageWidth * 0.978;
    const slopeSafety = 12; // évite toute collision visuelle avec la pente
    const contentRightLimitX = Math.min(pageWidth - rightPadding, slopeStartX - slopeSafety);
    const footerContentX = leftPadding;
    const maxFooterWidth = Math.max(20, contentRightLimitX - footerContentX);

    let footerFontSize: number = LAYOUT.fontSizes.footer;
    pdf.setFontSize(footerFontSize);
    const footerLine1Preview = [websiteLabel, phoneLabel, emailLabel, tvaLabel]
      .filter(Boolean)
      .join(LAYOUT.footerSep);
    if (pdf.getTextWidth(footerLine1Preview) > maxFooterWidth || (footerLine2Base && pdf.getTextWidth(footerLine2Base) > maxFooterWidth)) {
      footerFontSize = LAYOUT.fontSizes.footerTight;
      pdf.setFontSize(footerFontSize);
    }

    const line1Y = footerY + footerBandMm * 0.40;
    const line2Y = footerY + footerBandMm * 0.71;
    const addFooterTextPart = (
      label: string,
      x: number,
      align: "left" | "center" | "right",
      opts?: { url?: string; color?: [number, number, number] }
    ) => {
      if (!label) return;
      const safeLabel = sanitizeJsPdfText(label);
      const textColor = opts?.color ?? whiteColor;
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(safeLabel, x, line1Y, { align });
      const w = pdf.getTextWidth(safeLabel);
      let leftX = x;
      if (align === "center") leftX = x - w / 2;
      if (align === "right") leftX = x - w;
      if (opts?.url) {
        pdf.link(leftX, line1Y - footerFontSize * 0.34, w, footerFontSize * 0.55, {
          url: opts.url,
        });
        pdf.setDrawColor(textColor[0], textColor[1], textColor[2]);
        pdf.setLineWidth(0.15);
        pdf.line(leftX, line1Y + 0.45, leftX + w, line1Y + 0.45);
      }
    };

    const usableWidth = maxFooterWidth;
    const colWidth = usableWidth / 4;
    const col1Left = footerContentX;
    const col2Center = footerContentX + colWidth * 1.5;
    const col3Center = footerContentX + colWidth * 2.5;
    const col4Right = footerContentX + colWidth * 4;
    const vatSafeRight = contentRightLimitX - 1.2;
    const vatAnchorX = Math.min(col4Right, vatSafeRight);

    addFooterTextPart(websiteLabel, col1Left, "left", { url: websiteUrl || undefined });
    addFooterTextPart(phoneLabel, col2Center, "center", { color: whiteColor });
    addFooterTextPart(emailLabel, col3Center, "center", {
      url: emailUrl || undefined,
      color: linkBlueColor,
    });
    addFooterTextPart(tvaLabel, vatAnchorX, "right", { color: whiteColor });

    if (footerLine2Base) {
      pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
      pdf.text(
        truncateText(footerLine2Base, maxFooterWidth, footerFontSize),
        footerContentX,
        line2Y
      );
    }
  };

  drawFooterOnPage(pageCount);

  pdf.setPage(pageCount);
  const conciseRef = (invoiceDisplay || invoiceNumberRaw)
    .replace(/^N°\s*/i, "")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const filePrefix = data.consolidatedInvoice ? "danemo-facture-recap" : "danemo-facture";
  pdf.save(`${filePrefix}-${conciseRef || "invoice"}.pdf`);
};

export const defaultCompanyData = {
  name: "DANEMO SRL",
  address: "Rue de la croix de pierre 55 - 1060 Bruxelles – Belgique",
  phone: "0488 64 51 83",
  email: "info@danemo.be",
  website: "www.danemo.be",
  siret: "123 456 789 01234",
  tva: "BE0769.814.467",
  iban: "BE94 3632 1173 8714",
  bic: "BBRUBEBB",
};
