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
  tableHeaderGapMm: 9,
  tableHeaderBandMm: 9,
  descLineHeightMm: 3.8,
  minRowMm: 8,
  /** Réserve pied de page + paiement sur la dernière page. */
  tableBottomReserveLastPageMm: 82,
  continuationBottomMarginMm: 14,
  continuationTableTopMm: 44,
  colFracs: [0.46, 0.14, 0.15, 0.25] as const,
  addressBlockTopMm: 52,
  addressLineGapMm: 5.2,
  addressLabelGapMm: 6,
  dateRightPadMm: 2,
  factureBannerMm: { w: 72, h: 28 },
  /** Zone logo (fond orange, coin haut-droit). */
  logo: { boxW: 48, boxH: 28, maxW: 34, maxH: 20, rightPadMm: 0, topMm: 5 },
  /** Sous le bandeau FACTURE : numéro de facture. */
  invoiceNoBelowBannerMm: 31.5,
  /** Bloc société sous le logo (centré). */
  header: {
    factureTitleY: 18,
    companyNameY: 36,
    slogan1Y: 40.2,
    slogan2Y: 43.8,
    dateY1: 47.5,
    dateY2: 51.5,
  },
  fontSizes: {
    factureTitle: 22,
    invoiceNo: 10,
    company: 9.5,
    slogan: 6.8,
    body: 9,
    total: 9,
    totalEmphasis: 11,
    footer: 7.5,
    footerTight: 6.8,
  },
  summaryGapAfterTableMm: 14,
  summaryLineGapMm: 5.2,
  summaryLabelColumnMm: 46,
  summaryDividerGapMm: 3,
  totalExtraGapMm: 9,
  paymentBlockGapMm: 16,
  paymentLineGapMm: 4.6,
  paymentTitleGapMm: 6,
  tableRuleWidthMm: 0.08,
  tableClosingRuleWidthMm: 0.25,
  tableVerticalWidthMm: 0.06,
  rowRuleOffsetMm: 3.5,
  footerBandMm: 18,
  footerLine1OffsetMm: 5.6,
  footerLine2OffsetMm: 11.8,
  footerSep: "   ",
} as const;

/** Orange gabarit (#FF8C00, léger ajustement saturation). */
const orangeColor = [252, 138, 4] as [number, number, number];
const whiteColor = [255, 255, 255] as [number, number, number];
const blackColor = [0, 0, 0] as [number, number, number];
/** Traits de tableau plus discrets. */
const grayColor = [165, 165, 165] as [number, number, number];
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
  pdf.setFontSize(LAYOUT.fontSizes.body);
  pdf.setFont("helvetica", "bold");
  const cpad = LAYOUT.cellPadMm;
  pdf.text("DESCRIPTION", colPositions[0] + cpad, yPos);
  textCenterInColumn(pdf, "QUANTITES", colPositions[1], qtyColR, yPos, LAYOUT.fontSizes.body, "bold");
  textCenterInColumn(pdf, "P.U", colPositions[2], puColR, yPos, LAYOUT.fontSizes.body, "bold");
  textRightInColumn(pdf, "PRIX TOTAL", colPositions[3], totColR, yPos, LAYOUT.fontSizes.body, "bold");

  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(LAYOUT.fontSizes.body);
  pdf.setFont("helvetica", "normal");
  const bandBottomY = bandTopY + band;
  return { yAfter: yPos + LAYOUT.tableHeaderGapMm, bandTopY, bandBottomY };
}

function drawTableColumnSeparators(
  pdf: jsPDF,
  xs: number[],
  yTop: number,
  yBottom: number
) {
  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
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
  pdf.text(truncate(address.name, maxWidth, fontSize), x, y);

  if (address.address) {
    y += lineGap;
    pdf.text(truncate(sanitizeJsPdfText(address.address), maxWidth, fontSize), x, y);
  }
  if (address.postal_code) {
    y += lineGap;
    pdf.text(address.postal_code, x, y);
  }
  if (address.city && address.country) {
    y += lineGap;
    pdf.text(
      truncate(`${address.city.toUpperCase()} - ${address.country.toUpperCase()}`, maxWidth, fontSize),
      x,
      y
    );
  } else if (address.city) {
    y += lineGap;
    pdf.text(truncate(address.city.toUpperCase(), maxWidth, fontSize), x, y);
  } else if (address.country) {
    y += lineGap;
    pdf.text(truncate(address.country.toUpperCase(), maxWidth, fontSize), x, y);
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
  const logoBoxX = rightMargin - logoBoxW;
  const logoBoxY = LAYOUT.logo.topMm;
  const logoMaxW = LAYOUT.logo.maxW;
  const logoMaxH = LAYOUT.logo.maxH;
  const logoCx = logoBoxX + logoBoxW / 2;
  const logoCy = logoBoxY + logoBoxH / 2;

  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.rect(logoBoxX, logoBoxY, logoBoxW, logoBoxH, "F");

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
  pdf.rect(0, 0, LAYOUT.factureBannerMm.w, LAYOUT.factureBannerMm.h, "F");

  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(LAYOUT.fontSizes.factureTitle);
  pdf.setFont("helvetica", "bold");
  pdf.text("FACTURE", 6, LAYOUT.header.factureTitleY);

  const hy = LAYOUT.header;
  const rightBlockCenterX = logoBoxX + logoBoxW / 2;

  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(LAYOUT.fontSizes.company);
  pdf.setFont("helvetica", "bold");
  const companyName = sanitizeJsPdfText(data.company.name);
  pdf.text(companyName, rightBlockCenterX, hy.companyNameY, { align: "center" });

  pdf.setFontSize(LAYOUT.fontSizes.slogan);
  pdf.setFont("helvetica", "normal");
  pdf.text("IMPORT & EXPORT GROUPAGE", rightBlockCenterX, hy.slogan1Y, { align: "center" });
  pdf.text("ET TRANSPORT MARITIME", rightBlockCenterX, hy.slogan2Y, { align: "center" });

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
  pdf.setFontSize(LAYOUT.fontSizes.body);
  pdf.setFont("helvetica", "bold");
  const dr = LAYOUT.dateRightPadMm;
  const d1 = sanitizeJsPdfText(dateLine1);
  const d2 = sanitizeJsPdfText(dateLine2);
  pdf.text(d1, rightMargin - dr, hy.dateY1, { align: "right" });
  pdf.text(d2, rightMargin - dr, hy.dateY2, { align: "right" });

  const addrGap = LAYOUT.addressLineGapMm;
  let yPos: number = LAYOUT.addressBlockTopMm;

  const addressMidX = margin + (pageWidth - 2 * margin) * 0.5;
  const maxAddressWidth = addressMidX - margin - 8;
  const billingBottomMm = drawAddressBlock(pdf, {
    title: "Adresse de facturation :",
    x: margin,
    startY: yPos,
    maxWidth: maxAddressWidth,
    lineGap: addrGap,
    addressLabelGap: LAYOUT.addressLabelGapMm,
    fontSize: LAYOUT.fontSizes.body,
    address: billingAddress,
    truncate: truncateText,
  });

  yPos = LAYOUT.addressBlockTopMm + 3;
  const shippingLabelX = addressMidX + 10;
  const maxShippingWidth = rightMargin - shippingLabelX;
  const shippingBottomMm = drawAddressBlock(pdf, {
    title: "Adresse de livraison",
    x: shippingLabelX,
    startY: yPos,
    maxWidth: maxShippingWidth,
    lineGap: addrGap,
    addressLabelGap: LAYOUT.addressLabelGapMm,
    fontSize: LAYOUT.fontSizes.body,
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
    const descLines = wrapLinesJsPDF(pdf, item.description, maxDescWidth, LAYOUT.fontSizes.body);
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
    pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.setLineWidth(LAYOUT.tableRuleWidthMm);
    pdf.line(
      tableStartX,
      rowY - LAYOUT.rowRuleOffsetMm,
      tableStartX + tableWidth,
      rowY - LAYOUT.rowRuleOffsetMm
    );

    let descYMm = rowY;
    pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
    pdf.setFont("helvetica", "bold");
    for (const line of descLines) {
      pdf.text(line, colPositions[0] + cpad, descYMm);
      descYMm += LAYOUT.descLineHeightMm;
    }

    const unitPriceStr = formatCurrencyEUR(item.unitPrice);
    pdf.setFont("helvetica", "normal");
    textCenterInColumn(
      pdf,
      item.quantity.toString(),
      colPositions[1],
      qtyColR,
      rowY,
      LAYOUT.fontSizes.body,
      "normal"
    );
    textCenterInColumn(pdf, unitPriceStr, colPositions[2], puColR, rowY, LAYOUT.fontSizes.body, "normal");
    textRightInColumn(
      pdf,
      formatCurrencyEUR(item.total),
      colPositions[3],
      totColR,
      rowY,
      LAYOUT.fontSizes.body,
      "normal"
    );

    yPos += rowHeight;
  }

  const tableEndY = yPos;
  const tableEndPage = pdf.getNumberOfPages();

  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.setLineWidth(LAYOUT.tableVerticalWidthMm);
  pdf.line(tableStartX, tableBandTopY, tableStartX + tableWidth, tableBandTopY);
  if (tableStartPage === tableEndPage) {
    const colXs = [tableStartX, colPositions[1], colPositions[2], colPositions[3], tableStartX + tableWidth];
    drawTableColumnSeparators(pdf, colXs, tableBandTopY, tableEndY);
    pdf.line(tableStartX, tableBandTopY, tableStartX, tableEndY);
    pdf.line(tableStartX + tableWidth, tableBandTopY, tableStartX + tableWidth, tableEndY);
  }

  pdf.setLineWidth(LAYOUT.tableClosingRuleWidthMm);
  pdf.line(tableStartX, tableEndY, tableStartX + tableWidth, tableEndY);

  yPos = tableEndY + LAYOUT.summaryGapAfterTableMm;
  const footerSafeTop = pageHeight - LAYOUT.footerBandMm - 8;
  if (yPos + 58 > footerSafeTop) {
    pdf.addPage();
    paintPageBackground(pdf, pageWidth, pageHeight);
    yPos = margin + 6;
  }

  const summaryLabelX = totColR - LAYOUT.summaryLabelColumnMm;
  const summaryDividerX = summaryLabelX - LAYOUT.summaryDividerGapMm;
  const amountX = (txt: string) => totColR - pdf.getTextWidth(txt) - LAYOUT.textRightPadMm;

  const summaryTopY = yPos - 1.5;

  pdf.setFontSize(LAYOUT.fontSizes.body);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.text("Sous-total", summaryLabelX, yPos);
  const subtotalText = formatCurrencyEUR(subtotal);
  pdf.setFont("helvetica", "normal");
  pdf.text(subtotalText, amountX(subtotalText), yPos);

  yPos += LAYOUT.summaryLineGapMm;
  pdf.setFont("helvetica", "italic");
  pdf.text("Taux de TVA", summaryLabelX, yPos);
  const taxRateStr = formatTaxRateDisplay(taxRate);
  pdf.setFont("helvetica", "normal");
  pdf.text(taxRateStr, amountX(taxRateStr), yPos);

  yPos += LAYOUT.summaryLineGapMm;
  pdf.setFont("helvetica", "italic");
  pdf.text("TVA", summaryLabelX, yPos);
  const taxAmountText = formatTaxAmountDisplay(taxAmount);
  pdf.setFont("helvetica", "normal");
  pdf.text(taxAmountText, amountX(taxAmountText), yPos);

  const summaryMidBottomY = yPos + 2;
  pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
  pdf.setLineWidth(0.12);
  pdf.line(summaryDividerX, summaryTopY, summaryDividerX, summaryMidBottomY);

  yPos += LAYOUT.totalExtraGapMm;
  const totalText = formatCurrencyEUR(total);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(LAYOUT.fontSizes.totalEmphasis);
  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.text("TOTAL", summaryLabelX, yPos);
  const totalAmountX = totColR - pdf.getTextWidth(totalText) - LAYOUT.textRightPadMm;
  pdf.text(totalText, totalAmountX, yPos);

  yPos += LAYOUT.paymentBlockGapMm;
  if (yPos + 32 > footerSafeTop) {
    pdf.addPage();
    paintPageBackground(pdf, pageWidth, pageHeight);
    yPos = margin + 6;
  }

  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(LAYOUT.fontSizes.body);
  pdf.setFont("helvetica", "bold");
  const payTitle = "Détails de payement :";
  pdf.text(payTitle, margin, yPos);
  const payTitleW = pdf.getTextWidth(payTitle);
  pdf.setDrawColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setLineWidth(0.2);
  pdf.line(margin, yPos + 1.1, margin + payTitleW, yPos + 1.1);

  yPos += LAYOUT.paymentTitleGapMm;
  pdf.setFont("helvetica", "normal");
  const paymentText = resolveInvoicePaymentText(data.paymentMethod, data.consolidatedInvoice);
  const maxPaymentWidth = rightMargin - margin;
  const payLines = wrapLinesJsPDF(pdf, paymentText, maxPaymentWidth, LAYOUT.fontSizes.body);
  const payGap = LAYOUT.paymentLineGapMm;
  for (const pl of payLines) {
    pdf.text(pl, margin, yPos);
    yPos += payGap;
  }

  if (data.company.bic && data.company.iban) {
    const bicLines = wrapLinesJsPDF(
      pdf,
      `BIC : ${data.company.bic} \u2013 IBAN : ${data.company.iban}`,
      maxPaymentWidth,
      LAYOUT.fontSizes.body
    );
    for (const bl of bicLines) {
      pdf.text(bl, margin, yPos);
      yPos += payGap;
    }
  }

  const pageCount = pdf.getNumberOfPages();
  const websitePart = data.company.website
    ? `www.${data.company.website.replace(/^https?:\/\//, "").replace(/^www\./, "")}`
    : "";
  const line1Parts = [websitePart, data.company.phone, data.company.email, data.company.tva ? `TVA : ${data.company.tva}` : ""].filter(
    Boolean
  ) as string[];
  const footerLine1Base = line1Parts.join(LAYOUT.footerSep);
  const footerLine2Base = data.company.address ? sanitizeJsPdfText(data.company.address) : "";

  const drawFooterOnPage = (pageIdx: number) => {
    pdf.setPage(pageIdx);
    const footerBandMm = LAYOUT.footerBandMm;
    const footerY = pageHeight - footerBandMm;
    pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    pdf.rect(0, footerY, pageWidth, footerBandMm, "F");

    pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
    pdf.setFont("helvetica", "normal");
    const maxFooterWidth = rightMargin - margin;

    let footerFontSize: number = LAYOUT.fontSizes.footer;
    pdf.setFontSize(footerFontSize);
    if (
      pdf.getTextWidth(footerLine1Base) > maxFooterWidth ||
      (footerLine2Base && pdf.getTextWidth(footerLine2Base) > maxFooterWidth)
    ) {
      footerFontSize = LAYOUT.fontSizes.footerTight;
      pdf.setFontSize(footerFontSize);
    }

    pdf.text(
      truncateText(footerLine1Base, maxFooterWidth, footerFontSize),
      margin,
      footerY + LAYOUT.footerLine1OffsetMm
    );
    if (footerLine2Base) {
      pdf.text(
        truncateText(footerLine2Base, maxFooterWidth, footerFontSize),
        margin,
        footerY + LAYOUT.footerLine2OffsetMm
      );
    }
  };

  for (let p = 1; p <= pageCount; p++) {
    drawFooterOnPage(p);
  }

  pdf.setPage(pageCount);
  const safeName = invoiceNumberRaw.replace(/[^\w.-]+/g, "_").slice(0, 48);
  pdf.save(`facture-${safeName}-${new Date().toISOString().split("T")[0]}.pdf`);
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
