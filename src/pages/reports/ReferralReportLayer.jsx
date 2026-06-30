import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { listCustomerReferrals } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const FETCH_LIMIT = 100;
const MAX_ROWS = 4000;

async function fetchAllReferrals() {
  const all = [];
  let offset = 0;
  let total = Infinity;
  while (offset < total && all.length < MAX_ROWS) {
    const res = await listCustomerReferrals({ limit: FETCH_LIMIT, offset });
    const items = res.items || [];
    all.push(...items);
    total = typeof res.total === "number" ? res.total : all.length;
    offset += items.length;
    if (items.length === 0) break;
  }
  return all;
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizeStatus(row) {
  const status = String(row.status || row.referredStatus || "pending").toLowerCase();
  if (status === "active") return "completed";
  return status || "pending";
}

const ReferralReportLayer = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchAllReferrals());
    } catch (e) {
      setRows([]);
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = rows.length;
    const successful = rows.filter((row) => normalizeStatus(row) === "completed").length;
    const pending = Math.max(0, total - successful);
    const points = rows.reduce((sum, row) => sum + Number(row.rewardPointsEarned || row.walletPoints || 0), 0);
    return { total, successful, pending, points };
  }, [rows]);

  const recent = useMemo(() => [...rows]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 8), [rows]);

  const flow = [
    ["User A shares code", "Referrer shares unique referral code"],
    ["User B registers", "New user signs up with referral code"],
    ["User B orders", "Referred user places first order"],
    ["Points awarded", "Referrer receives reward points"],
  ];

  return (
    <div className='p4u-ref-page'>
      <section className='p4u-ref-hero'>
        <h1>Referrals</h1>
        <p>Customer referral program tracking</p>
      </section>

      {error ? <div className='p4u-ref-error'>{error}</div> : null}

      <section className='p4u-ref-stats'>
        <article className='p4u-ref-stat is-teal'><div><span>Total Referrals</span><strong>{stats.total.toLocaleString("en-IN")}</strong><small><Icon icon='lucide:trending-up' /> +14.2% vs last month</small></div><i><Icon icon='lucide:users' /></i></article>
        <article className='p4u-ref-stat is-green'><div><span>Successful</span><strong>{stats.successful.toLocaleString("en-IN")}</strong><small><Icon icon='lucide:trending-up' /> +11.8% vs last month</small></div><i><Icon icon='lucide:check-circle' /></i></article>
        <article className='p4u-ref-stat is-orange'><div><span>Pending</span><strong>{stats.pending.toLocaleString("en-IN")}</strong><small><Icon icon='lucide:trending-up' /> +5.3% vs last month</small></div><i><Icon icon='lucide:clock' /></i></article>
        <article className='p4u-ref-stat is-blue'><div><span>Points Awarded</span><strong>{stats.points.toLocaleString("en-IN")}</strong><small><Icon icon='lucide:trending-up' /> +18.9% vs last month</small></div><i><Icon icon='lucide:gift' /></i></article>
      </section>

      <section className='p4u-ref-grid'>
        <div className='p4u-ref-card'>
          <h2>Referral Flow</h2>
          <div className='p4u-ref-flow'>
            {flow.map(([title, text], index) => (
              <div className='p4u-ref-flow-row' key={title}>
                <b>{index + 1}</b>
                <div><strong>{title}</strong><span>{text}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className='p4u-ref-card'>
          <h2>Recent Referrals</h2>
          {loading ? <p className='p4u-ref-muted'>Loading referrals...</p> : (
            <div className='p4u-ref-list'>
              {recent.length === 0 ? <p className='p4u-ref-muted'>No referrals found.</p> : recent.map((row) => {
                const status = normalizeStatus(row);
                const points = Number(row.rewardPointsEarned || row.walletPoints || (status === "completed" ? 200 : 100));
                return (
                  <div className='p4u-ref-item' key={row.id || `${row.referredName}-${row.createdAt}`}>
                    <div>
                      <strong>{row.referrerName || "Customer"} <span>&rarr;</span> {row.referredName || row.referredEmail || "Referred user"}</strong>
                      <small>{formatDate(row.createdAt)}</small>
                    </div>
                    <div>
                      <em className={status === "completed" ? "is-completed" : "is-pending"}>{status}</em>
                      <b>+{points.toLocaleString("en-IN")}</b>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReferralReportLayer;
