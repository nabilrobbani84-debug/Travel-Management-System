'use client';

import React from 'react';
import { Invoice, CurrencyCode } from '@/lib/travel-system/types';
import { formatCurrency, formatDate } from '@/lib/travel-system/formatters';
import { X, Printer, CheckCircle, ShieldCheck, MapPin, Building, Calendar, UserCheck } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  currency: CurrencyCode;
  onClose: () => void;
}

export function InvoiceModal({ invoice, currency, onClose }: InvoiceModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-8 shadow-2xl text-slate-800 my-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" />
              OFFICIAL TAX INVOICE (FAKTUR PAJAK)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body (Printable Area) */}
        <div className="space-y-6 print:m-0 print:p-0">
          {/* Brand & Invoice Details */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  NT
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">NUSANTARA TRAVEL SYSTEM</h2>
              </div>
              <p className="text-xs text-slate-500">PT. Nusantara Jelajah Indonesia (Perseroan Terbatas)</p>
              <p className="text-xs text-slate-500">Izin TDUP: No. 9120018274619 / IATA Certified</p>
              <p className="text-xs text-slate-500">Menara Sudirman Lt. 24, Jl. Jend. Sudirman Kav. 60, Jakarta Selatan</p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl font-extrabold text-blue-600">{invoice.invoiceNumber}</div>
              <div className="text-xs text-slate-500 mt-1">
                Booking Reference: <span className="font-mono font-bold text-slate-800">{invoice.bookingCode}</span>
              </div>
              <div className="text-xs text-slate-500">
                Issued Date: <span className="font-medium text-slate-800">{formatDate(invoice.issuedAt)}</span>
              </div>
              <div className="text-xs text-slate-500">
                Payment Ref: <span className="font-mono text-slate-800">{invoice.paymentReference}</span>
              </div>
            </div>
          </div>

          {/* Customer & Travel Schedule Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Billed To (Customer)</div>
              <div className="font-bold text-slate-900 text-sm">{invoice.customerName}</div>
              <div className="text-xs text-slate-600">{invoice.customerEmail}</div>
              <div className="text-xs text-slate-600">{invoice.customerPhone}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Trip Schedule & Details</div>
              <div className="font-bold text-slate-900 text-sm">{invoice.packageTitle}</div>
              <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Schedule: {invoice.scheduleDates}
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                Total Travelers: {invoice.totalTravelers} Person(s)
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{invoice.packageTitle}</div>
                    <div className="text-[11px] text-slate-500">
                      Includes 5-star lodging, private transport, guided tours, entrance permits, and travel insurance
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-slate-800">{invoice.totalTravelers} pax</td>
                  <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(invoice.unitPrice, currency)}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900">{formatCurrency(invoice.subtotal, currency)}</td>
                </tr>
                {invoice.discount > 0 && (
                  <tr className="bg-emerald-50/50">
                    <td colSpan={3} className="py-2.5 px-4 font-medium text-emerald-800">
                      Promotional Discount Voucher Applied
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-emerald-800">
                      - {formatCurrency(invoice.discount, currency)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Tax Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ShieldCheck className="w-4 h-4" />
                Payment Status: {invoice.status} via {invoice.paymentMethod.replace('_', ' ')}
              </div>
              <p>This is a computer-generated official tax invoice and receipt.</p>
              <p>No physical signature required. All transactions are logged in the immutable audit trail.</p>
            </div>

            <div className="w-full sm:w-64 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.subtotal, currency)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span className="font-medium">- {formatCurrency(invoice.discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>PPN 11% (Tax):</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.tax, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Service Fee:</span>
                <span className="font-medium text-slate-900">{formatCurrency(invoice.serviceFee, currency)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-blue-700">
                <span>TOTAL PAID:</span>
                <span>{formatCurrency(invoice.totalAmount, currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
