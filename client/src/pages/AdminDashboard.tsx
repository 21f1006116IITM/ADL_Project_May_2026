import { useEffect, useState } from "react";
import { apiRequest } from "../api";

interface ReportItem {
  id: string;
  reason: string;
  status: "open" | "reviewed" | "resolved";
  created_at: string;
  reporter: { email: string; role: string };
  reported_couple: { id: string; partner_name: string } | null;
  reported_listing: { id: string; title: string } | null;
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [filter, setFilter] = useState("");

  async function loadReports() {
    const query = filter ? `?status=${filter}` : "";
    const data = await apiRequest(`/reports${query}`);
    setReports(data);
  }

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(id: string, status: "reviewed" | "resolved") {
    await apiRequest(`/reports/${id}`, { method: "PATCH", body: { status } });
    loadReports();
  }

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>

      <div className="filter-row">
        <label>
          Filter by status
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
      </div>

      {reports.length === 0 ? (
        <p className="empty-state">No reports match this filter.</p>
      ) : (
        <div className="card-grid">
          {reports.map((r) => (
            <div className="card" key={r.id}>
              <p className="card-meta">Filed by {r.reporter.email} ({r.reporter.role})</p>
              <p>{r.reason}</p>
              {r.reported_couple && <p className="card-meta">Against couple: {r.reported_couple.partner_name}</p>}
              {r.reported_listing && <p className="card-meta">Against listing: {r.reported_listing.title}</p>}
              <p className="card-meta">Status: {r.status}</p>
              <div className="button-row">
                {r.status !== "reviewed" && (
                  <button onClick={() => updateStatus(r.id, "reviewed")}>Mark reviewed</button>
                )}
                {r.status !== "resolved" && (
                  <button onClick={() => updateStatus(r.id, "resolved")}>Mark resolved</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
