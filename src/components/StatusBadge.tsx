interface Props {
  status: string;
}

const labels: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  "phone-screen": "Phone Screen",
  technical: "Technical",
  onsite: "Onsite",
  offer: "Offer",
  rejected: "Rejected",
  accepted: "Accepted",
  withdrawn: "Withdrawn",
};

const colors: Record<string, string> = {
  saved: "bg-gray-100 text-gray-700",
  applied: "bg-blue-100 text-blue-700",
  "phone-screen": "bg-amber-100 text-amber-700",
  technical: "bg-purple-100 text-purple-700",
  onsite: "bg-orange-100 text-orange-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  accepted: "bg-emerald-100 text-emerald-700",
  withdrawn: "bg-gray-100 text-gray-500",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.saved}`}>
      {labels[status] || status}
    </span>
  );
}
