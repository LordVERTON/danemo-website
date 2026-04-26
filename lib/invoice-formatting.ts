/**
 * Formatage et règles d’affichage partagés : PDF, HTML, impression.
 */

export type InvoiceLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type OrderFallbackForTotals = {
  service_type: string;
  value?: number;
};

const LEGACY_GROUPED_PAYMENT = "Paiement groupé - voir référence facture";

/** Montants en euros, espace avant €, séparateurs fr-FR. */
export function formatCurrencyEUR(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const cents = Math.round(rounded * 100);
  const hasDecimals = cents % 100 !== 0;
  const n = hasDecimals ? rounded : Math.round(rounded);
  const formatted = n
    .toLocaleString("fr-FR", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
    })
    .replace(/[\u202f\u00a0]/g, " ");
  return `${formatted} €`;
}

/** Ligne TVA : « 0 » sans symbole si nul (gabarit PAGUI). */
export function formatTaxAmountDisplay(taxAmount: number): string {
  return Math.abs(taxAmount) < 1e-6 ? "0" : formatCurrencyEUR(taxAmount);
}

export function formatTaxRateDisplay(rate: number): string {
  const r = Math.round(rate * 100) / 100;
  if (Number.isInteger(r) || Math.abs(r - Math.round(r)) < 1e-6) return `${Math.round(r)}`;
  return `${r}`.replace(".", ",");
}

export function computeInvoiceAmounts(params: {
  items?: InvoiceLineInput[];
  orderFallback: OrderFallbackForTotals;
  taxRate?: number;
}): { subtotal: number; taxRate: number; taxAmount: number; total: number; lines: InvoiceLineInput[] } {
  const taxRate = params.taxRate ?? 0;
  let lines: InvoiceLineInput[];
  let subtotal: number;

  if (params.items && params.items.length > 0) {
    lines = params.items;
    subtotal = lines.reduce((s, i) => s + i.total, 0);
  } else {
    subtotal = params.orderFallback.value ?? 0;
    lines = [
      {
        description: params.orderFallback.service_type,
        quantity: 1,
        unitPrice: subtotal,
        total: subtotal,
      },
    ];
  }

  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxRate, taxAmount, total, lines };
}

/**
 * Numéro affiché : préfère les commandes DNYYYYXXXXXX → N°YYYY-NNNNN.
 */
export function formatInvoiceDisplayNumber(
  invoiceNumber: string,
  options?: { itemOrderNumbers?: string[] }
): string {
  const raw = invoiceNumber.trim();
  const dnPair = raw.match(/^DN(\d{4})(\d{6})$/i);
  if (dnPair) {
    const year = dnPair[1];
    const seq = dnPair[2].replace(/^0+/, "") || "0";
    return `N°${year}-${seq}`;
  }

  const embedded = raw.match(/DN(\d{4})(\d{6})/i);
  if (embedded) {
    const year = embedded[1];
    const seq = embedded[2].replace(/^0+/, "") || "0";
    return `N°${year}-${seq}`;
  }

  const singles = options?.itemOrderNumbers?.filter((n) => /^DN\d{10}$/i.test(n.trim())) ?? [];
  if (singles.length === 1) {
    return formatInvoiceDisplayNumber(singles[0]);
  }

  if (raw.length > 26 && /^INV-/i.test(raw)) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `N°${y}${m}${day}-${raw.slice(-4)}`;
  }

  if (raw.length > 32) {
    const core = raw.replace(/^N°\s*/i, "");
    return `N°${core.slice(0, 14)}…`;
  }

  return raw.startsWith("N°") ? raw : `N°${raw}`;
}

export function formatInvoiceDateLines(location: string, date: Date): { line1: string; line2: string } {
  const line1 = `${location}, le ${date
    .toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    .toUpperCase()}`;
  const line2 = `${date.getFullYear()}`;
  return { line1, line2 };
}

export function resolveInvoicePaymentText(
  paymentMethod: string | undefined,
  consolidatedInvoice?: boolean
): string {
  if (paymentMethod && paymentMethod !== LEGACY_GROUPED_PAYMENT) {
    return paymentMethod;
  }
  if (consolidatedInvoice || paymentMethod === LEGACY_GROUPED_PAYMENT) {
    return "Facture récapitulative — règlement par virement sur le compte indiqué ci-dessous, selon les modalités convenues.";
  }
  return "Par virement bancaire";
}

export function extractDnOrderNumbersFromDescriptions(lines: InvoiceLineInput[]): string[] {
  const out: string[] = [];
  const re = /\b(DN\d{10})\b/gi;
  for (const line of lines) {
    let m: RegExpExecArray | null;
    const s = line.description;
    re.lastIndex = 0;
    while ((m = re.exec(s)) !== null) {
      out.push(m[1].toUpperCase());
    }
  }
  return out;
}
