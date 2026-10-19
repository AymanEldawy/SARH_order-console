"use client";

import React, { useState, useEffect } from "react";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

interface FormItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

export function CreateOrderModal({ isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [status, setStatus] = useState<"PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED">("PENDING");
  const [items, setItems] = useState<FormItem[]>([
    { itemName: "Wireless Ergonomic Mouse", quantity: 1, unitPrice: 49.99 },
  ]);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; replayed?: boolean } | null>(null);

  // Generate a unique idempotency key per new modal open
  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(crypto.randomUUID());
      setError(null);
      setSuccessInfo(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addItem = () => {
    if (items.length >= 5) return;
    setItems([...items, { itemName: "", quantity: 1, unitPrice: 10 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof FormItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);
    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        status,
        items: items.map((it) => ({
          itemName: it.itemName.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(Number(it.unitPrice).toFixed(2)),
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create order");
        return;
      }

      const isReplayed = res.headers.get("X-Idempotency-Replayed") === "true";
      setSuccessInfo({ id: data.data.id, replayed: isReplayed });
      onOrderCreated();

      // Automatically reset form after 1.5 seconds if successful
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch {
      setError("Network failure. Click 'Submit Order' again to retry safely with the same idempotency key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillSampleData = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setCustomerName("Noura Al-Shehri");
    setCustomerEmail(`noura.shehri${randomSuffix}@example.com`);
    setStatus("PENDING");
    setItems([
      { itemName: "Standing Desk Pad XL", quantity: 1, unitPrice: 29.5 },
      { itemName: "USB-C Multi-Hub", quantity: 2, unitPrice: 45.0 },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create New Phone Order</h3>
            <p className="text-xs text-slate-500">
              Guaranteed duplicate-safe via database idempotency constraints
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {successInfo && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
              <strong>Order Saved!</strong> Order ID: <code className="font-mono text-xs">{successInfo.id}</code>
              {successInfo.replayed && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Idempotent Replay
                </span>
              )}
            </div>
          )}

          <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 flex items-center justify-between text-xs text-blue-900">
            <div>
              <span className="font-semibold block">Idempotency Key (sent in header):</span>
              <span className="font-mono text-blue-700 select-all">{idempotencyKey}</span>
            </div>
            <button
              type="button"
              onClick={fillSampleData}
              className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-700 font-medium rounded border border-blue-200 transition cursor-pointer"
            >
              Fill Sample Data
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Fatima Al-Otaibi"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer Email *
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Order Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED")}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Line Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Line Items (1 to 5 items)
              </label>
              {items.length < 5 && (
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 transition cursor-pointer"
                >
                  + Add Line Item
                </button>
              )}
            </div>

            <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Item name"
                    value={item.itemName}
                    onChange={(e) => updateItem(idx, "itemName", e.target.value)}
                    className="flex-3 px-2.5 py-1.5 rounded-md border border-slate-300 text-sm bg-white"
                  />
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-xs text-slate-400">Qty:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-sm bg-white text-center"
                    />
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-xs text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded-md border border-slate-300 text-sm bg-white text-right font-mono"
                    />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Computed Total Banner */}
          <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-lg border border-slate-200 text-sm">
            <span className="font-semibold text-slate-700">Calculated Order Total:</span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Saving Order...</span>
                </>
              ) : (
                <span>Submit Order</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
