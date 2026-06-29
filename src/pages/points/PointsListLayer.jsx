import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { listCustomers, listPlatformVariables, listPointsSettlements } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const PLATFORM_DEFAULTS = {
  WELCOME_BONUS: 300,
  REFERRAL_BONUS: 100,
  VENDOR_REFERRAL_BONUS: 200,
  POST_LIKE_POINTS: 1,
  POST_SHARE_POINTS: 1,
  STORY_LIKE_POINTS: 1,
};

const STAT_CARDS = [
  { key: "totalIssued", title: "Total Points Issued", icon: "mdi:star-outline", accent: "#f97316", wash: "#fff1e5" },
  { key: "redeemed", title: "Points Redeemed", icon: "mdi:trending-up", accent: "#20bf8f", wash: "#e8f8f1" },
  { key: "welcome", title: "Welcome Points", icon: "mdi:gift-outline", accent: "#086d80", wash: "#e7f1f2" },
  { key: "customerReferral", title: "Customer Referral", icon: "mdi:account-group-outline", accent: "#3b6df6", wash: "#edf3ff" },
  { key: "vendorReferral", title: "Vendor Referral", icon: "mdi:store-outline", accent: "#356df3", wash: "#edf3ff" },
  { key: "postLikes", title: "Post Likes", icon: "mdi:heart-outline", accent: "#f43f5e", wash: "#fff1f4" },
  { key: "postShares", title: "Post Shares", icon: "mdi:share-variant-outline", accent: "#f97316", wash: "#fff1e5" },
  { key: "storyLikes", title: "Story Likes", icon: "mdi:instagram", accent: "#e12d68", wash: "#fde8f0" },
];

function parseMeta(m) {
  if (m == null) return {};
  if (typeof m === "string") {
    try {
      return JSON.parse(m) || {};
    } catch {
      return {};
    }
  }
  return typeof m === "object" && !Array.isArray(m) ? m : {};
}

function parsePlatformVarNumeric(value) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    if (value.amount !== undefined && value.amount !== null && value.amount !== "") {
      return parsePlatformVarNumeric(value.amount);
    }
    if (value.value !== undefined && value.value !== null && value.value !== "") {
      return parsePlatformVarNumeric(value.value);
    }
  }
  return null;
}

function platformVarMap(items) {
  const map = new Map();
  (items || []).forEach((row) => {
    if (!row?.key) return;
    if (row.isActive === false) return;
    const n = parsePlatformVarNumeric(row.value);
    if (n != null) map.set(String(row.key).toUpperCase(), n);
  });
  return map;
}

function inferTag(item) {
  if (item.tag) return item.tag;
  const meta = parseMeta(item.metadata || item.meta);
  const s = `${meta.reason || ""} ${meta.type || ""} ${item.reason || ""} ${item.type || ""} ${item.settlementType || ""}`.toLowerCase();
  if (s.includes("welcome")) return "welcome";
  if (s.includes("customer") && s.includes("ref")) return "customer_referral";
  if (s.includes("vendor") && s.includes("ref")) return "vendor_referral";
  if ((s.includes("post") || s.includes("reel") || s.includes("photo")) && s.includes("like")) return "post_like";
  if (s.includes("post") && s.includes("share")) return "post_share";
  if (s.includes("story") && s.includes("like")) return "story_like";
  if (s.includes("redeem")) return "redeemed";
  return "order_reward";
}

function amountFor(item) {
  return Number(item.amount ?? item.points ?? item.rewardPoints ?? 0) || 0;
}

function monthBounds(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function computeTrendPct(rows) {
  const now = new Date();
  const cur = monthBounds(now);
  const prevEnd = new Date(cur.start.getTime() - 1);
  const prev = monthBounds(prevEnd);

  let curTotal = 0;
  let prevTotal = 0;
  rows.forEach((r) => {
    const amt = amountFor(r);
    if (amt <= 0) return;
    const created = new Date(r.createdAt);
    if (Number.isNaN(created.getTime())) return;
    if (created >= cur.start && created <= cur.end) curTotal += amt;
    if (created >= prev.start && created <= prev.end) prevTotal += amt;
  });

  if (prevTotal === 0) return curTotal > 0 ? 100 : 0;
  return Math.round(((curTotal - prevTotal) / prevTotal) * 100);
}

const PointsListLayer = () => {
  const [rows, setRows] = useState([]);
  const [platformVars, setPlatformVars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [pointsRes, varsRes, customersRes] = await Promise.all([
        listPointsSettlements({ limit: 500, offset: 0 }),
        listPlatformVariables({ limit: 200, offset: 0 }),
        listCustomers({ limit: 500, offset: 0 }),
      ]);
      setRows(pointsRes.items || []);
      setPlatformVars(varsRes.items || []);
      setCustomers(customersRes.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const varMap = useMemo(() => platformVarMap(platformVars), [platformVars]);

  const getVar = (key) => {
    const k = String(key).toUpperCase();
    return varMap.has(k) ? varMap.get(k) : PLATFORM_DEFAULTS[k];
  };

  const configItems = useMemo(() => {
    const items = [
      {
        title: "Welcome Bonus",
        value: `${getVar("WELCOME_BONUS") ?? "—"} pts`,
        subtitle: "Given to new customers on registration",
      },
      {
        title: "Post Like Reward",
        value: `${getVar("POST_LIKE_POINTS") ?? "—"} pt`,
        subtitle: "Credited when a customer post, reel, or photo is liked",
      },
      {
        title: "Post Share Reward",
        value: `${getVar("POST_SHARE_POINTS") ?? "—"} pt`,
        subtitle: "Credited when a customer shares a post",
      },
      {
        title: "Story Like Reward",
        value: `${getVar("STORY_LIKE_POINTS") ?? "—"} pt`,
        subtitle: "Credited when a customer story is liked",
      },
      {
        title: "Vendor Referral",
        value: `${getVar("VENDOR_REFERRAL_BONUS") ?? "—"} pts`,
        subtitle: "Customer earns this when their referred vendor completes verification",
      },
      {
        title: "Customer Referral",
        value: `${getVar("REFERRAL_BONUS") ?? "—"} pts`,
        subtitle: "Customer earns this when another customer joins using their code",
      },
    ];
    const orderReward = varMap.get("ORDER_REWARD_RATE") ?? varMap.get("LOYALTY_ORDER_REWARD_PERCENT");
    if (orderReward != null) {
      items.push({
        title: "Order Reward Rate",
        value: `${orderReward}%`,
        subtitle: "Percentage of order value returned as loyalty points",
      });
    }
    return items;
  }, [varMap]);

  const customerNameById = useMemo(() => {
    const m = new Map();
    customers.forEach((c) => {
      m.set(c.id, c.fullName || c.name);
      if (c.keycloakUserId) m.set(c.keycloakUserId, c.fullName || c.name);
    });
    return m;
  }, [customers]);

  const resolveCustomerName = (item) => {
    const meta = parseMeta(item.metadata || item.meta);
    const cid = meta.customerId || meta.customerProfileId || meta.customer_id || item.customerId || null;
    return (
      meta.customerName ||
      meta.fullName ||
      (cid && customerNameById.get(cid)) ||
      item.customerName ||
      item.userName ||
      item.name ||
      item.vendorName ||
      "Customer"
    );
  };

  const stats = useMemo(() => {
    const out = {
      totalIssued: 0,
      redeemed: 0,
      welcome: 0,
      customerReferral: 0,
      vendorReferral: 0,
      postLikes: 0,
      postShares: 0,
      storyLikes: 0,
    };

    rows.forEach((r) => {
      const amt = amountFor(r);
      const tag = inferTag(r);
      if (amt > 0) out.totalIssued += amt;
      if (tag === "redeemed") out.redeemed += Math.abs(amt);
      if (tag === "welcome") out.welcome += amt;
      if (tag === "customer_referral") out.customerReferral += amt;
      if (tag === "vendor_referral") out.vendorReferral += amt;
      if (tag === "post_like") out.postLikes += amt;
      if (tag === "post_share") out.postShares += amt;
      if (tag === "story_like") out.storyLikes += amt;
    });

    return out;
  }, [rows]);

  const trendPct = useMemo(() => computeTrendPct(rows), [rows]);

  const recentTransactions = useMemo(() => {
    return [...rows]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 12);
  }, [rows]);

  const formatPts = (n) => Number(n || 0).toLocaleString("en-IN");

  return (
    <div className='p4u-points-page'>
      <div className='p4u-points-hero'>
        <h3>Loyalty Points</h3>
        <p>Welcome, referral, social, and order reward points management</p>
      </div>

      {error && (
        <div className='alert alert-danger radius-12 mb-16' role='alert'>
          {error}
        </div>
      )}

      {loading ? (
        <div className='p4u-points-loading'>Loading points dashboard...</div>
      ) : (
        <>
          <section className='p4u-points-stats' aria-label='Loyalty points overview'>
            {STAT_CARDS.map((card) => (
              <StatCard
                key={card.key}
                title={card.title}
                value={formatPts(stats[card.key])}
                icon={card.icon}
                accent={card.accent}
                wash={card.wash}
                trendPct={card.key === "totalIssued" ? trendPct : null}
              />
            ))}
          </section>

          <section className='p4u-points-grid'>
            <div className='p4u-points-panel p4u-points-config-panel'>
              <h5>Points Configuration</h5>
              <div className='p4u-points-config-list'>
                {configItems.map((item) => (
                  <ConfigItem key={item.title} {...item} />
                ))}
              </div>
            </div>

            <div className='p4u-points-panel p4u-points-transactions-panel'>
              <h5>Recent Transactions</h5>
              {recentTransactions.length === 0 ? (
                <p className='text-secondary-light mb-0'>No point transactions yet.</p>
              ) : (
                <div className='p4u-points-transaction-list'>
                  {recentTransactions.map((item) => {
                    const tag = inferTag(item);
                    const amount = amountFor(item);
                    const meta = parseMeta(item.metadata || item.meta);
                    return (
                      <TransactionRow
                        key={item.id || `${item.createdAt}-${amount}-${tag}`}
                        tag={tag}
                        name={resolveCustomerName(item)}
                        description={meta.description || item.description || meta.reason || item.reason || "Points transaction"}
                        amount={amount}
                        createdAt={item.createdAt}
                        formatPts={formatPts}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, accent, wash, trendPct }) => (
  <article className='p4u-points-stat-card' style={{ "--points-accent": accent, "--points-wash": wash }}>
    <div>
      <p>{title}</p>
      <strong>{value}</strong>
      {trendPct != null && (
        <span className='p4u-points-trend'>
          <Icon icon={trendPct >= 0 ? "mdi:trending-up" : "mdi:trending-down"} />
          {trendPct >= 0 ? "+" : ""}{trendPct}% <em>vs last month</em>
        </span>
      )}
    </div>
    <span className='p4u-points-stat-icon' aria-hidden='true'>
      <Icon icon={icon} />
    </span>
  </article>
);

const ConfigItem = ({ title, value, subtitle }) => (
  <div className='p4u-points-config-item'>
    <p>{title}</p>
    <strong>{value}</strong>
    <span>{subtitle}</span>
  </div>
);

const TransactionRow = ({ tag, name, description, amount, createdAt, formatPts }) => {
  const tagLabel = tag.replace(/_/g, " ");
  return (
    <div className='p4u-points-transaction-row'>
      <span className={`p4u-points-tag p4u-points-tag-${tag}`}>{tagLabel}</span>
      <div className='p4u-points-transaction-copy'>
        <strong>{name}</strong>
        <p>{description}</p>
      </div>
      <div className='p4u-points-transaction-amount'>
        <strong className={amount >= 0 ? "is-positive" : "is-negative"}>
          {amount >= 0 ? "+" : ""}{formatPts(amount)}
        </strong>
        <span>{formatShortDate(createdAt)}</span>
      </div>
    </div>
  );
};

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default PointsListLayer;
