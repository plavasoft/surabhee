export function upiPayUri(input: {
  vpa: string;
  payeeName: string;
  amount: number;
  note: string;
}) {
  return `upi://pay?pa=${input.vpa}&pn=${encodeURIComponent(input.payeeName)}&am=${input.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(input.note)}`;
}
