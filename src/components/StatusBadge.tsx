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
  saved: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  applied: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  "phone-screen": "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  technical: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  onsite: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300",
  offer: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  rejected: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  accepted: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  withdrawn: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.saved}`}>
      {labels[status] || status}
    </span>
  );
}
