"use client";

/**
 * SharePanel — shown when the "Share" tab is active in the builder.
 * Displays publish toggle, shareable link, and placeholder sharing options.
 */

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Globe,
  EyeOff,
  Copy,
  ExternalLink,
  Mail,
  Code2,
  QrCode,
  Check,
  Link2,
} from "lucide-react";
import { Form } from "@/lib/api";

interface Props {
  form: Form;
  onPublish: () => void;
  publishing: boolean;
}

export default function SharePanel({ form, onPublish, publishing }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = form.public_id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/f/${form.public_id}`
    : null;

  function copyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Share your form</h2>
      <p className="text-sm text-gray-400 mb-8">
        Publish your form first, then share it with respondents via a link, email, or embed.
      </p>

      {/* Publish / unpublish toggle card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${form.status === "published" ? "bg-green-50" : "bg-gray-50"}`}>
              {form.status === "published" ? (
                <Globe size={22} className="text-green-500" />
              ) : (
                <EyeOff size={22} className="text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-semibold text-gray-900">
                  {form.status === "published" ? "Form is published" : "Form is a draft"}
                </h3>
                <span className={`badge ${form.status === "published" ? "badge-published" : "badge-draft"}`}>
                  {form.status === "published" ? "Live" : "Draft"}
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {form.status === "published"
                  ? "Your form is live and accepting responses."
                  : "Publish your form to generate a shareable link."}
              </p>
            </div>
          </div>
          <button
            className={`btn-primary ${form.status === "published" ? "bg-gray-500 hover:bg-gray-600" : ""}`}
            onClick={onPublish}
            disabled={publishing}
          >
            {publishing ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : form.status === "published" ? (
              <><EyeOff size={14} /> Unpublish</>
            ) : (
              <><Globe size={14} /> Publish now</>
            )}
          </button>
        </div>

        {/* Share link */}
        {form.status === "published" && shareUrl && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Share link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <Link2 size={13} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate font-mono">{shareUrl}</span>
              </div>
              <button
                className={`btn-primary flex-shrink-0 text-sm ${copied ? "bg-green-600 hover:bg-green-700" : ""}`}
                onClick={copyLink}
              >
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-shrink-0 text-sm"
                title="Open form in new tab"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Sharing options — placeholders */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">More ways to share</h3>
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Mail size={22} />, label: "Email invitation", desc: "Send directly to email addresses" },
          { icon: <Code2 size={22} />, label: "Embed on website", desc: "Add a snippet to your site" },
          { icon: <QrCode size={22} />, label: "QR Code", desc: "Download and print a QR code" },
        ].map((opt) => (
          <div
            key={opt.label}
            className="bg-white border border-gray-200 rounded-2xl p-5 text-center cursor-default opacity-60 hover:opacity-80 transition-opacity relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
              {opt.icon}
            </div>
            <p className="font-semibold text-gray-700 text-sm mb-1">{opt.label}</p>
            <p className="text-xs text-gray-400">{opt.desc}</p>
            <div className="absolute top-2 right-2">
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                Coming soon
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
