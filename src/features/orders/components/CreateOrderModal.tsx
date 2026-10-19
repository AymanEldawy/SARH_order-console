"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useCreateOrder } from "../hooks/useCreateOrder";
import { OrderFormFields } from "./OrderFormFields";
import { OrderItemsEditor } from "./OrderItemsEditor";
import { OrderTotal } from "./OrderTotal";
import type { CreateOrderFormValues, OrderFormItem } from "../types/orders.types";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

const initialItems = (): OrderFormItem[] => [{ id: crypto.randomUUID(), itemName: "Wireless Ergonomic Mouse", quantity: 1, unitPrice: 49.99 }];

export function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [form, setForm] = useState<CreateOrderFormValues>({ customerName: "", customerEmail: "", items: [] });
  const { idempotencyKey, isSubmitting, error, createdOrder, startNewOrder, submit } = useCreateOrder();

  useEffect(() => {
    if (!isOpen) return;
    setForm({ customerName: "", customerEmail: "", items: initialItems() });
    startNewOrder();
  }, [isOpen, startNewOrder]);

  useEffect(() => {
    if (!createdOrder) return;
    onOrderCreated();
    const closeTimer = window.setTimeout(onClose, 1800);
    return () => window.clearTimeout(closeTimer);
  }, [createdOrder, onClose, onOrderCreated]);

  if (!isOpen) return null;

  const fillSampleData = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setForm({
      customerName: "Noura Al-Shehri",
      customerEmail: `noura.shehri${randomSuffix}@example.com`,
      items: [
        { id: crypto.randomUUID(), itemName: "Standing Desk Pad XL", quantity: 1, unitPrice: 29.5 },
        { id: crypto.randomUUID(), itemName: "USB-C Multi-Hub", quantity: 2, unitPrice: 45 },
      ],
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit(form);
  };

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-order-title">
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"><div><h3 id="create-order-title" className="text-lg font-bold text-slate-900">Create New Phone Order</h3><p className="text-xs text-slate-500">Guaranteed duplicate-safe via database idempotency constraints</p></div>
        <button onClick={onClose} type="button" disabled={isSubmitting} aria-label="Close create order modal" className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer disabled:opacity-50">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && <div role="alert" className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"><strong>Error:</strong> {error}</div>}
        {createdOrder && <div role="status" className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800"><strong>Order Saved!</strong> Order ID: <code className="font-mono text-xs">{createdOrder.order.id}</code>{createdOrder.replayed && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Idempotent Replay</span>}</div>}
        <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 flex items-center justify-between text-xs text-blue-900"><div><span className="font-semibold block">Idempotency Key (sent in header):</span><span className="font-mono text-blue-700 select-all">{idempotencyKey}</span></div><button type="button" onClick={fillSampleData} disabled={isSubmitting} className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 font-medium rounded border border-blue-200 transition cursor-pointer disabled:opacity-50">Fill Sample Data</button></div>
        <OrderFormFields customerName={form.customerName} customerEmail={form.customerEmail} onCustomerNameChange={(customerName) => setForm((current) => ({ ...current, customerName }))} onCustomerEmailChange={(customerEmail) => setForm((current) => ({ ...current, customerEmail }))} />
        <OrderItemsEditor items={form.items} onChange={(items) => setForm((current) => ({ ...current, items }))} />
        <OrderTotal items={form.items} />
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100"><button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer disabled:opacity-50">Cancel</button><button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-2">{isSubmitting ? "Saving Order..." : "Submit Order"}</button></div>
      </form>
    </div>
  </div>;
}
