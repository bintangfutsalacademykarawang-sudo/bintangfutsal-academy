import { Invoice, CashMutation } from '../types';

/**
 * Calculates dynamic status for invoice based on remainingAmount and dueDate.
 * Rules:
 * - Database persists 'LUNAS', 'SEBAGIAN', or 'BELUM BAYAR'.
 * - 'MENUNGGAK' is calculated dynamically on-the-fly: remainingAmount > 0 && dueDate < today.
 * - Zero cron / batch / timer mutations needed.
 */
export function getDynamicInvoiceStatus(
  invoice: Invoice
): 'LUNAS' | 'SEBAGIAN' | 'BELUM BAYAR' | 'MENUNGGAK' {
  const invTotal = invoice.amount || 0;
  const paid = invoice.paidAmount !== undefined 
    ? invoice.paidAmount 
    : (invoice.status === 'LUNAS' ? invTotal : 0);
  const remaining = invoice.remainingAmount !== undefined 
    ? invoice.remainingAmount 
    : Math.max(0, invTotal - paid);

  if (remaining <= 0 || invoice.status === 'LUNAS') {
    return 'LUNAS';
  }

  const today = new Date().toISOString().split('T')[0];
  if (invoice.dueDate && invoice.dueDate < today) {
    return 'MENUNGGAK';
  }

  if (paid > 0) {
    return 'SEBAGIAN';
  }

  return 'BELUM BAYAR';
}

/**
 * Authoritative Cash Balance Formula:
 * SALDO KAS = TOTAL SELURUH PEMASUKAN - TOTAL SELURUH PENGELUARAN
 * Calculated directly from cashMutations collection.
 * No daily, monthly, or yearly reset.
 */
export function calculateFinanceTotals(mutations: CashMutation[]) {
  const totalPemasukan = mutations
    .filter((m) => m.type === 'Pemasukan')
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  
  const totalPengeluaran = mutations
    .filter((m) => m.type === 'Pengeluaran')
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  
  const totalKas = totalPemasukan - totalPengeluaran;

  return {
    totalPemasukan,
    totalPengeluaran,
    totalKas,
  };
}

/**
 * Comprehensive summary of invoice payments and receivables.
 */
export function getInvoicePaymentSummary(invoices: Invoice[]) {
  let totalBilled = 0;
  let totalPaid = 0;
  let totalUnpaid = 0;
  let countLunas = 0;
  let countSebagian = 0;
  let countBelumBayar = 0;
  let countMenunggak = 0;

  for (const inv of invoices) {
    const amount = Number(inv.amount) || 0;
    const paid = inv.paidAmount !== undefined 
      ? Number(inv.paidAmount) || 0 
      : (inv.status === 'LUNAS' ? amount : 0);
    const remaining = inv.remainingAmount !== undefined 
      ? Math.max(0, Number(inv.remainingAmount) || 0)
      : Math.max(0, amount - paid);

    totalBilled += amount;
    totalPaid += paid;
    totalUnpaid += remaining;

    const dynamicStatus = getDynamicInvoiceStatus(inv);
    if (dynamicStatus === 'LUNAS') countLunas++;
    else if (dynamicStatus === 'SEBAGIAN') countSebagian++;
    else if (dynamicStatus === 'MENUNGGAK') countMenunggak++;
    else countBelumBayar++;
  }

  return {
    totalBilled,
    totalPaid,
    totalUnpaid,
    countLunas,
    countSebagian,
    countBelumBayar,
    countMenunggak,
  };
}

/**
 * Creates unique, idempotent payment ID ONCE before runTransaction begins.
 * Never execute Date.now() or random inside transaction callback!
 */
export function generateIdempotentPaymentId(invoiceId: string): string {
  const cleanInvId = invoiceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `PAY_${cleanInvId}_${timestamp}_${randomPart}`;
}

/**
 * Generates unique ID for manual cash mutation.
 */
export function generateManualMutationId(): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `MUT_${timestamp}_${randomPart}`;
}
