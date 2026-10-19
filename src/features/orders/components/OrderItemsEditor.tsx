"use client";

import type { OrderFormItem } from "../types/orders.types";

interface OrderItemsEditorProps { items: OrderFormItem[]; onChange: (items: OrderFormItem[]) => void; }
const emptyItem = (): OrderFormItem => ({ id: crypto.randomUUID(), itemName: "", quantity: 1, unitPrice: 10 });

export function OrderItemsEditor({ items, onChange }: OrderItemsEditorProps) {
  const update = (id: string, field: keyof Omit<OrderFormItem, "id">, value: string) => onChange(items.map((item) => item.id === id ? { ...item, [field]: field === "itemName" ? value : Number(value) } : item));
  return <div className="space-y-2"><div className="flex items-center justify-between"><label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Line Items (1 to 5 items)</label>
    {items.length < 5 && <button type="button" onClick={() => onChange([...items, emptyItem()])} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition cursor-pointer">+ Add Line Item</button>}
  </div><div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
    {items.map((item) => <div key={item.id} className="flex items-center gap-2">
      <input aria-label="Item name" type="text" required placeholder="Item name" value={item.itemName} onChange={(event) => update(item.id, "itemName", event.target.value)} className="flex-3 px-2.5 py-1.5 rounded-md border border-slate-300 text-sm bg-white" />
      <div className="flex-1 flex items-center gap-1"><span className="text-xs text-slate-400">Qty:</span><input aria-label="Quantity" type="number" min={1} max={100} required value={item.quantity} onChange={(event) => update(item.id, "quantity", event.target.value)} className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-sm bg-white text-center" /></div>
      <div className="flex-1 flex items-center gap-1"><span className="text-xs text-slate-400">$</span><input aria-label="Unit price" type="number" step="0.01" min="0.01" required value={item.unitPrice} onChange={(event) => update(item.id, "unitPrice", event.target.value)} className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-sm bg-white text-right font-mono" /></div>
      {items.length > 1 && <button type="button" onClick={() => onChange(items.filter((candidate) => candidate.id !== item.id))} className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer" title="Remove item" aria-label={`Remove ${item.itemName || "item"}`}>✕</button>}
    </div>)}
  </div></div>;
}
