import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { QuestionType } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function questionTypeLabel(type: QuestionType): string {
  const map: Record<QuestionType, string> = {
    short_text: "Short Text",
    long_text: "Long Text",
    multiple_choice: "Multiple Choice",
    dropdown: "Dropdown",
    email: "Email",
    number: "Number",
    yes_no: "Yes / No",
    rating: "Rating",
  };
  return map[type] ?? type;
}

// Stable card color based on form ID
const CARD_COLORS = [
  "bg-amber-400",
  "bg-teal-300",
  "bg-orange-300",
  "bg-blue-300",
  "bg-purple-300",
  "bg-pink-300",
  "bg-green-300",
  "bg-rose-200",
  "bg-sky-300",
  "bg-violet-300",
  "bg-yellow-300",
  "bg-emerald-300",
];

export function cardColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}
