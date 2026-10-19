import { calculateOrderTotal, formatOrderTotal } from "../lib/orders.utils";
import type { OrderFormItem } from "../types/orders.types";

export function OrderTotal({ items }: { items: OrderFormItem[] }) {
  return <div className="flex items-center justify-between p-3.5 bg-slate-100 rounded-lg border border-slate-200 text-sm"><span className="font-semibold text-slate-700">Calculated Order Total:</span><span className="text-lg font-bold text-slate-900 font-mono">${formatOrderTotal(calculateOrderTotal(items))}</span></div>;
}
