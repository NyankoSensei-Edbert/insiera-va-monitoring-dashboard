import React from "react";

export default function CopyCell({ value, className, style }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async (e) => {
    e.stopPropagation();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span className={className} style={style}>
        {value || "—"}
      </span>

      {value && (
        <button
          onClick={copy}
          className="btn btn-ghost"
          style={{
            padding: "2px 6px",
            fontSize: 11,
            lineHeight: 1,
          }}
          title="Copy to clipboard"
        >
          {copied ? "✓" : "⧉"}
        </button>
      )}
    </div>
  );
}
