import jsPDF from "jspdf";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

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
}

// =====================
// 1) WEBP -> PNG (dataURL) pour jsPDF
// =====================
async function webpUrlToPngDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Impossible de charger le logo: ${url} (${res.status})`);

  const blob = await res.blob();

  // createImageBitmap marche très bien en navigateur moderne
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context indisponible");

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  // -> PNG base64
  return canvas.toDataURL("image/png");
}

// Petit helper: ajuste un logo au max (sans déformation)
function fitRect(
  imgW: number,
  imgH: number,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  const ratio = Math.min(maxW / imgW, maxH / imgH, 1);
  return { w: imgW * ratio, h: imgH * ratio };
}

export const generateInvoice = async (data: InvoiceData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Couleurs
  const orangeColor = [255, 140, 0] as [number, number, number];
  const whiteColor = [255, 255, 255] as [number, number, number];
  const blackColor = [0, 0, 0] as [number, number, number];
  const grayColor = [128, 128, 128] as [number, number, number];

  // Calculs financiers
  let subtotal = 0;
  let taxRate = data.taxRate ?? 0;
  let taxAmount = 0;
  let total = 0;

  if (data.items && data.items.length > 0) {
    subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
    taxAmount = subtotal * (taxRate / 100);
    total = subtotal + taxAmount;
  } else {
    subtotal = data.order.value ?? 0;
    taxAmount = subtotal * (taxRate / 100);
    total = subtotal + taxAmount;
  }

  const issueDate = data.issueDate
    ? new Date(data.issueDate)
    : new Date(data.order.created_at);
  const dateStr = issueDate
    .toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();
  const location = data.issueLocation ?? "Bruxelles";
  const invoiceNumber = data.invoiceNumber ?? data.order.order_number;

  const billingAddress = data.billingAddress ?? {
    name: data.order.client_name,
    address: data.order.client_address,
    postal_code: data.order.client_postal_code,
    city: data.order.client_city,
    country: data.order.client_country,
  };

  const defaultShippingAddress = {
    name: data.order.recipient_name ?? data.order.client_name,
    address: data.order.recipient_address ?? data.order.destination ?? undefined,
    postal_code: data.order.recipient_postal_code ?? undefined,
    city: data.order.recipient_city ?? undefined,
    country: data.order.recipient_country ?? undefined,
  };
  const shippingAddress = data.shippingAddress ?? defaultShippingAddress;

  const margin = 15;
  const rightMargin = pageWidth - margin;

  const truncateText = (text: string, maxWidth: number, fontSize: number) => {
    pdf.setFontSize(fontSize);
    const textWidth = pdf.getTextWidth(text);
    if (textWidth <= maxWidth) return text;
    let truncated = text;
    while (pdf.getTextWidth(truncated + "...") > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + "...";
  };

  // ========== LOGO (image réelle) ==========
  const logoMaxW = 35;
  const logoMaxH = 25;
  const logoX = rightMargin - logoMaxW - 5;
  const logoY = 5;

  try {
    const logoUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/images/logo.webp`
        : "/images/logo.webp";
    const logoDataUrl = await webpUrlToPngDataUrl(logoUrl);

    // Récupérer les dimensions de l'image
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = logoDataUrl;
    });

    const { w: logoW, h: logoH } = fitRect(img.width, img.height, logoMaxW, logoMaxH);
    pdf.addImage(logoDataUrl, "PNG", logoX, logoY, logoW, logoH);
  } catch (err) {
    // Fallback: cercle orange avec D si le logo ne charge pas
    pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    pdf.circle(logoX + logoMaxW / 2, logoY + logoMaxH / 2, 8, "F");
    pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    const dWidth = pdf.getTextWidth("D");
    pdf.text("D", logoX + logoMaxW / 2 - dWidth / 2, logoY + logoMaxH / 2 + 1.5);
  }

  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);

  // ========== EN-TÊTE ==========
  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.rect(0, 0, 60, 25, "F");

  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("FACTURE", 5, 18);

  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`N°${invoiceNumber}`, 5, 25);

  // Nom entreprise et slogan (à gauche du logo)
  const companyTextX = logoX - 5;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.company.name, companyTextX - 50, 12);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  const slogan = "IMPORT & EXPORT GROUPAGE ET TRANSPORT MARITIME";
  const maxSloganWidth = logoX - companyTextX - 55;
  if (pdf.getTextWidth(slogan) > maxSloganWidth) pdf.setFontSize(6);
  pdf.text(slogan, companyTextX - 50, 18);

  // Date et lieu
  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  const dateLocationText = `${location}, le ${dateStr}`;
  const dateLocationWidth = pdf.getTextWidth(dateLocationText);
  const dateLocationX = Math.min(70, rightMargin - dateLocationWidth - 5);
  pdf.text(dateLocationText, dateLocationX, 25);

  // ========== ADRESSES ==========
  let yPos = 50;

  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("Adresse de facturation:", margin, yPos);

  yPos += 6;
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  const maxAddressWidth = pageWidth / 2 - margin - 10;
  pdf.text(truncateText(billingAddress.name, maxAddressWidth, 9), margin, yPos);
  if (billingAddress.postal_code) {
    yPos += 5;
    pdf.text(billingAddress.postal_code, margin, yPos);
  }
  if (billingAddress.city && billingAddress.country) {
    yPos += 5;
    pdf.text(
      truncateText(
        `${billingAddress.city.toUpperCase()} - ${billingAddress.country.toUpperCase()}`,
        maxAddressWidth,
        9
      ),
      margin,
      yPos
    );
  } else if (billingAddress.city) {
    yPos += 5;
    pdf.text(truncateText(billingAddress.city.toUpperCase(), maxAddressWidth, 9), margin, yPos);
  } else if (billingAddress.country) {
    yPos += 5;
    pdf.text(truncateText(billingAddress.country.toUpperCase(), maxAddressWidth, 9), margin, yPos);
  }

  yPos = 50;
  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  const shippingLabelX = Math.max(logoX, pageWidth / 2 + 5);
  pdf.text("Adresse de livraison", shippingLabelX, yPos);

  yPos += 6;
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  const maxShippingWidth = rightMargin - shippingLabelX;
  pdf.text(truncateText(shippingAddress.name, maxShippingWidth, 9), shippingLabelX, yPos);
  if (shippingAddress.postal_code) {
    yPos += 5;
    pdf.text(shippingAddress.postal_code, shippingLabelX, yPos);
  }
  if (shippingAddress.city && shippingAddress.country) {
    yPos += 5;
    pdf.text(
      truncateText(
        `${shippingAddress.city.toUpperCase()} - ${shippingAddress.country.toUpperCase()}`,
        maxShippingWidth,
        9
      ),
      shippingLabelX,
      yPos
    );
  } else if (shippingAddress.city) {
    yPos += 5;
    pdf.text(
      truncateText(shippingAddress.city.toUpperCase(), maxShippingWidth, 9),
      shippingLabelX,
      yPos
    );
  } else if (shippingAddress.country) {
    yPos += 5;
    pdf.text(
      truncateText(shippingAddress.country.toUpperCase(), maxShippingWidth, 9),
      shippingLabelX,
      yPos
    );
  }

  // ========== TABLEAU DES PRODUITS ==========
  yPos = 85;
  const tableStartX = margin;
  const tableWidth = pageWidth - margin * 2;
  const colWidths = [tableWidth * 0.45, tableWidth * 0.15, tableWidth * 0.15, tableWidth * 0.25];
  const colPositions = [
    tableStartX,
    tableStartX + colWidths[0],
    tableStartX + colWidths[0] + colWidths[1],
    tableStartX + colWidths[0] + colWidths[1] + colWidths[2],
  ];

  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.rect(tableStartX, yPos - 6, tableWidth, 8, "F");

  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("DESCRIPTION", colPositions[0] + 2, yPos);
  pdf.text("QUANTITES", colPositions[1] + 2, yPos);
  pdf.text("P.U", colPositions[2] + 2, yPos);
  pdf.text("PRIX TOTAL", colPositions[3] + 2, yPos);

  yPos += 8;
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");

  const items =
    data.items ?? [
      {
        description: data.order.service_type,
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal,
      },
    ];

  items.forEach((item, index) => {
    const rowY = yPos + index * 8;
    pdf.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.setLineWidth(0.1);
    pdf.line(tableStartX, rowY - 4, tableStartX + tableWidth, rowY - 4);

    const maxDescWidth = colWidths[0] - 4;
    pdf.text(truncateText(item.description, maxDescWidth, 9), colPositions[0] + 2, rowY);
    pdf.text(item.quantity.toString(), colPositions[1] + 2, rowY);
    const unitPriceStr =
      item.unitPrice % 1 === 0
        ? `${item.unitPrice.toFixed(0)}€`
        : `${item.unitPrice.toFixed(2).replace(".", ",")}€`;
    pdf.text(unitPriceStr, colPositions[2] + 2, rowY);
    pdf.text(
      `${Math.round(item.total).toLocaleString("fr-FR")} €`,
      colPositions[3] + 2,
      rowY
    );
  });

  const tableEndY = yPos + items.length * 8;
  pdf.line(tableStartX, tableEndY, tableStartX + tableWidth, tableEndY);

  // ========== RÉSUMÉ FINANCIER ==========
  yPos = tableEndY + 15;
  const summaryLabelWidth = 50;
  const summaryValueWidth = 30;
  const summaryX = rightMargin - summaryLabelWidth - summaryValueWidth;

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("Sous-total", summaryX, yPos);
  const subtotalText = `${subtotal.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
  pdf.text(subtotalText, rightMargin - pdf.getTextWidth(subtotalText), yPos);

  yPos += 6;
  pdf.text("Taux de TVA", summaryX, yPos);
  pdf.text(`${taxRate}`, rightMargin - pdf.getTextWidth(`${taxRate}`), yPos);

  yPos += 6;
  pdf.text("TVA", summaryX, yPos);
  const taxAmountText = `${taxAmount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  pdf.text(taxAmountText, rightMargin - pdf.getTextWidth(taxAmountText), yPos);

  yPos += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.text("TOTAL", summaryX, yPos);
  const totalText = `${total.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`;
  pdf.text(totalText, rightMargin - pdf.getTextWidth(totalText), yPos);

  // ========== DÉTAILS DE PAIEMENT ==========
  yPos += 20;
  pdf.setTextColor(blackColor[0], blackColor[1], blackColor[2]);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("Détails de payement:", margin, yPos);

  yPos += 6;
  pdf.setFont("helvetica", "normal");
  const paymentMethod = data.paymentMethod ?? "Par virement bancaire";
  const maxPaymentWidth = rightMargin - margin;
  pdf.text(truncateText(paymentMethod, maxPaymentWidth, 9), margin, yPos);

  if (data.company.bic && data.company.iban) {
    yPos += 6;
    pdf.text(
      truncateText(`BIC: ${data.company.bic} - IBAN: ${data.company.iban}`, maxPaymentWidth, 9),
      margin,
      yPos
    );
  }

  // ========== FOOTER ==========
  const footerY = pageHeight - 15;
  pdf.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
  pdf.rect(0, footerY, pageWidth, 15, "F");

  pdf.setTextColor(whiteColor[0], whiteColor[1], whiteColor[2]);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");

  const footerYText = footerY + 10;
  let footerX = margin;
  const footerSpacing = 5;
  const maxFooterWidth = rightMargin - margin;

  const footerParts: string[] = [];
  if (data.company.website) {
    const website = data.company.website.replace(/^https?:\/\//, "").replace(/^www\./, "");
    footerParts.push(`www.${website}`);
  }
  if (data.company.phone) footerParts.push(data.company.phone);
  if (data.company.email) footerParts.push(data.company.email);
  if (data.company.tva) footerParts.push(`TVA: ${data.company.tva}`);
  if (data.company.address) footerParts.push(data.company.address);

  let footerFontSize = 8;
  let totalFooterWidth = footerParts.reduce(
    (sum, part) => sum + pdf.getTextWidth(part) + footerSpacing,
    0
  ) - footerSpacing;

  if (totalFooterWidth > maxFooterWidth) {
    footerFontSize = 7;
    totalFooterWidth =
      footerParts.reduce((sum, part) => sum + pdf.getTextWidth(part) + footerSpacing, 0) -
      footerSpacing;
  }

  let actualSpacing = footerSpacing;
  if (totalFooterWidth > maxFooterWidth && footerParts.length > 1) {
    actualSpacing = Math.max(
      2,
      (maxFooterWidth - totalFooterWidth + (footerParts.length - 1) * footerSpacing) /
        (footerParts.length - 1)
    );
  }

  pdf.setFontSize(footerFontSize);
  footerParts.forEach((part, index) => {
    if (index > 0) footerX += actualSpacing;
    const partWidth = pdf.getTextWidth(part);
    const remainingWidth = rightMargin - footerX;
    if (partWidth > remainingWidth) {
      const truncated = truncateText(part, remainingWidth, footerFontSize);
      pdf.text(truncated, footerX, footerYText);
      footerX += pdf.getTextWidth(truncated);
    } else {
      pdf.text(part, footerX, footerYText);
      footerX += partWidth;
    }
  });

  pdf.save(`facture-${invoiceNumber}-${new Date().toISOString().split("T")[0]}.pdf`);
};

export const defaultCompanyData = {
  name: "DANEMO SRL",
  address: "Rue de la croix de pierre 55 - 1060 Bruxelles - Belgique",
  phone: "0488 64 51 83",
  email: "info@danemo.be",
  website: "www.danemo.be",
  siret: "123 456 789 01234",
  tva: "BE0769.814.467",
  iban: "BE94 3632 1173 8714",
  bic: "BBRUBEBB",
};
