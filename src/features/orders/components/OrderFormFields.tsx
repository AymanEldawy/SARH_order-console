"use client";

interface OrderFormFieldsProps {
  customerName: string;
  customerEmail: string;
  onCustomerNameChange: (value: string) => void;
  onCustomerEmailChange: (value: string) => void;
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

export function OrderFormFields({
  customerName,
  customerEmail,
  onCustomerNameChange,
  onCustomerEmailChange,
}: OrderFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label
          htmlFor="customer-name"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
        >
          Customer Name *
        </label>
        <input
          id="customer-name"
          type="text"
          required
          value={customerName}
          onChange={(event) => onCustomerNameChange(event.target.value)}
          placeholder="e.g. Fatima Al-Otaibi"
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="customer-email"
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
        >
          Customer Email *
        </label>
        <input
          id="customer-email"
          type="email"
          required
          value={customerEmail}
          onChange={(event) => onCustomerEmailChange(event.target.value)}
          placeholder="customer@example.com"
          className={inputClass}
        />
      </div>
    </div>
  );
}
