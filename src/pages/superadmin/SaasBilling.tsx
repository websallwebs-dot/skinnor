import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  Receipt
} from 'lucide-react';
import { INITIAL_SAAS_INVOICES, INITIAL_TENANTS, SaasInvoice } from './superAdminData';

export default function SaasBilling() {
  const [invoices, setInvoices] = useState<SaasInvoice[]>(INITIAL_SAAS_INVOICES);

  const totalMrr = INITIAL_TENANTS.reduce((acc, t) => acc + t.mrrUsd, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Finanzas, Planes SaaS & Facturación Global
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Recaudación mensual recurrente (MRR), facturas emitidas por organización médica y cargos por sobreconsumo de IA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200 py-1">
            Pasarela Stripe Connect / Facturación Médica: Activa
          </Badge>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <span className="text-xs text-slate-500 font-semibold uppercase">MRR Total (Ingreso Mensual)</span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">${totalMrr.toLocaleString()} USD</div>
          <p className="text-[11px] text-emerald-700 font-medium">+18.5% respecto al mes anterior</p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <span className="text-xs text-slate-500 font-semibold uppercase">ARR Proyectado (Anual)</span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">${(totalMrr * 12).toLocaleString()} USD</div>
          <p className="text-[11px] text-slate-500">Contratos multianuales hospitalarios</p>
        </Card>

        <Card className="border-slate-200 shadow-xs bg-white rounded-xl p-4 space-y-2">
          <span className="text-xs text-slate-500 font-semibold uppercase">Tasa de Morosidad</span>
          <div className="text-2xl font-bold text-emerald-800 tabular-nums">0.0%</div>
          <p className="text-[11px] text-emerald-700 font-medium">100% de facturas cobradas exitosamente</p>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="border-slate-200 shadow-xs bg-white rounded-xl overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-200 bg-slate-50/70">
          <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-700" />
            Historial de Facturación por Organización Médica
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-900">N° Factura</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Organización Médica</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Fecha Emisión</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Plan Suscrito</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Monto Facturado</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900">Método de Pago</TableHead>
                <TableHead className="text-xs font-semibold text-slate-900 text-right">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="text-xs font-mono font-medium text-slate-900">
                    {inv.id}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-900">
                    {inv.tenantName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {inv.date}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {inv.tier}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 tabular-nums">
                    ${inv.amountUsd.toFixed(2)} USD
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {inv.paymentMethod}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {inv.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
