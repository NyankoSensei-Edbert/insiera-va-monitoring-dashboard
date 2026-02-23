import React, { useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { apiFetch } from "../lib/api";
import { formatTime } from "../lib/utils";

export default function ResendPage({
  token,
  toast,
  prefillId,
  onClearPrefill,
}) {
  const [activityId, setActivityId] = useLocalStorage(
    "resend:activityId",
    prefillId || "",
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useLocalStorage("resend:history", []);

  // Sync prefillId when it changes (coming from activity card)
  React.useEffect(() => {
    if (prefillId) {
      setActivityId(prefillId);
      onClearPrefill?.();
    }
  }, [prefillId]);

  const handleResend = async () => {
    const id = activityId.trim();
    if (!id) {
      toast("Please enter an activity_id", "error");
      return;
    }

    setLoading(true);
    setResult(null);

    const res = await apiFetch(
      "/insiera-va/monitoring/resend",
      {
        method: "POST",
        body: JSON.stringify({ activity_id: id }),
      },
      token,
    );
    setLoading(false);

    const timestamp = new Date().toISOString();

    if (!res.data) {
      const r = {
        type: "error",
        msg: `Network error: ${res.error || "unknown"}`,
      };
      setResult(r);
      setHistory((h) => [{ id, timestamp, ...r }, ...h.slice(0, 49)]);
      return;
    }

    if (!res.ok) {
      const r = {
        type: "error",
        msg: `Error ${res.status}: ${res.data.message || res.data.error || "Request failed"}`,
      };
      setResult(r);
      setHistory((h) => [{ id, timestamp, ...r }, ...h.slice(0, 49)]);
      return;
    }

    const d = res.data;
    const type =
      d.status === "sent"
        ? "success"
        : d.status === "queued"
          ? "queued"
          : "error";
    const r = {
      type,
      scanId: d.scan_id,
      scanner: d.scanner,
      status: d.status,
      msg: d.message,
    };
    setResult(r);
    setHistory((h) => [{ id, timestamp, ...r }, ...h.slice(0, 49)]);
    toast(
      `Activity ${d.status === "sent" ? "resent" : "queued"}: ${id}`,
      d.status === "sent" ? "success" : "error",
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
        animation: "fadeInUp 0.3s ease",
      }}
    >
      {/* Form */}
      <div className="table-wrap">
        <div className="table-header">
          <span className="table-title">Resend Activity to Core Scanner</span>
        </div>
        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <p style={{ color: "var(--text3)", fontSize: 12, lineHeight: 1.7 }}>
            Resend a specific activity to the core scanner. Requires a valid{" "}
            <code style={{ color: "var(--orange)" }}>X-Seclabid</code> token
            configured above.
          </p>

          <div className="filter-group">
            <label>Activity ID</label>
            <input
              className="filter-input"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleResend()}
              placeholder="act-001"
              style={{ fontSize: 13, padding: "9px 12px", minWidth: 300 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? "..." : "⟳ Resend Activity"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setActivityId("");
                setResult(null);
              }}
            >
              ✕ Clear
            </button>
          </div>

          {result && (
            <div
              className={`modal-result ${result.type}`}
              style={{ display: "block", marginTop: 0 }}
            >
              <strong>
                {result.status?.toUpperCase() || result.type.toUpperCase()}
              </strong>{" "}
              — {result.msg}
              {result.scanId && (
                <div style={{ opacity: 0.7, fontSize: 11, marginTop: 4 }}>
                  Scan ID: {result.scanId} · Scanner: {result.scanner}
                </div>
              )}
            </div>
          )}

          {/* Response codes reference */}
          <div
            style={{
              marginTop: 8,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text3)",
                marginBottom: 10,
              }}
            >
              Response Codes
            </div>
            {[
              [
                "var(--green)",
                "200 sent",
                "Activity successfully resent to core scanner",
              ],
              [
                "var(--orange)",
                "200 queued",
                "Core unavailable, added to retry queue",
              ],
              ["var(--red)", "401", "Missing or invalid X-Seclabid token"],
              ["var(--red)", "404", "Activity ID not found"],
              ["var(--red)", "400", "activity_id field is required"],
            ].map(([color, code, desc]) => (
              <div
                key={code}
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 5,
                  fontSize: 11,
                }}
              >
                <span style={{ color, width: 80, flexShrink: 0 }}>{code}</span>
                <span style={{ color: "var(--text3)" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="table-wrap">
        <div className="table-header">
          <span className="table-title">Resend History</span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: "4px 10px" }}
            onClick={() => setHistory([])}
          >
            Clear History
          </button>
        </div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {!history.length ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-icon">↺</div>
              No resend history yet
            </div>
          ) : (
            history.map((h, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{h.id}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span
                      className={`badge ${
                        h.type === "success"
                          ? "badge-open"
                          : h.type === "queued"
                            ? "badge-queued"
                            : "badge-down"
                      }`}
                    >
                      {h.status || h.type}
                    </span>

                    {h.scanner && (
                      <span className="badge badge-queued">{h.scanner}</span>
                    )}
                  </div>
                </div>
                <span style={{ color: "var(--text3)", fontSize: 11 }}>
                  {h.msg}
                </span>
                {h.scanId && (
                  <span style={{ color: 'var(--text3)', fontSize: 11 }}>
                    Scan: {h.scanId} · Scanner: {h.scanner}
                  </span>
                )}
                <span style={{ color: "var(--text3)", fontSize: 10 }}>
                  {formatTime(h.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
