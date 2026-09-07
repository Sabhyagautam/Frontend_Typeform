"use client";

/**
 * QuestionTypeIcon — renders a coloured square icon for a given question type.
 * Also exports ICON_MAP and COLOR_MAP for use in other components.
 */

import {
  AlignLeft,
  AlignJustify,
  CheckSquare,
  ChevronDown,
  Mail,
  Hash,
  ToggleLeft,
  Star,
} from "lucide-react";
import { QuestionType } from "@/lib/api";

export const ICON_MAP: Record<QuestionType, React.ReactNode> = {
  short_text: <AlignLeft size={13} />,
  long_text: <AlignJustify size={13} />,
  multiple_choice: <CheckSquare size={13} />,
  dropdown: <ChevronDown size={13} />,
  email: <Mail size={13} />,
  number: <Hash size={13} />,
  yes_no: <ToggleLeft size={13} />,
  rating: <Star size={13} />,
};

export const COLOR_MAP: Record<QuestionType, string> = {
  short_text: "bg-blue-500",
  long_text: "bg-blue-600",
  multiple_choice: "bg-purple-500",
  dropdown: "bg-indigo-500",
  email: "bg-red-500",
  number: "bg-orange-500",
  yes_no: "bg-teal-500",
  rating: "bg-yellow-500",
};

export default function QuestionTypeIcon({ type }: { type: QuestionType }) {
  return (
    <div
      className={`w-6 h-6 rounded flex items-center justify-center text-white flex-shrink-0 ${COLOR_MAP[type]}`}
    >
      {ICON_MAP[type]}
    </div>
  );
}
