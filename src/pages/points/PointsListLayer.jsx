import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { listPointsSettlements } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";

const POINT_RULES = {
  welcome: 300,
  postLike: 1,
  vendorReferral: 200,
  customerReferral: 100,
  orderRewardRate: 2,
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

const CONFIG_ITEMS = [
  {
    title: "Welcome Bonus",
    value: `${POINT_RULES.welcome} pts`,
    subtitle: "Given to new customers on registration",
  },
  {
    title: "Post Like Reward",
    value: `${POINT_RULES.postLike} pt`,
    subtitle: "Credited when a customer post, reel, or photo is liked",
  },
  {
    title: "Vendor Referral",
    value: `${POINT_RULES.vendorReferral} pts`,
    subtitle: "Customer earns this when their referred vendor completes verification",
  },
  {
    title: "Customer Referral",
    value: `${POINT_RULES.customerReferral} pts`,
    subtitle: "Customer earns this when another customer joins using their code",
  },
  {
    title: "Order Reward Rate",
    value: `${POINT_RULES.orderRewardRate}%`,
    subtitle: "Percentage of order value returned as loyalty points",
  },
];

const SAMPLE_TRANSACTIONS = [
  {
    id: "sample-vendor-referral",
    customerName: "Arthini SV",
    amount: POINT_RULES.vendorReferral,
    reason: "Customer earned vendor referral bonus: Indian Oil got verified",
    createdAt: "2026-06-25T10:00:00.000Z",
    tag: "vendor_referral",
  },
  {
    id: "sample-welcome",
    customerName: "Mini",
    amount: POINT_RULES.welcome,
    reason: "Welcome bonus for joining P4U!",
    createdAt: "2026-06-25T09:30:00.000Z",
    tag: "welcome",
  },
  {
    id: "sample-customer-referral",
    customerName: "S GUNASEKARAN",
    amount: POINT_RULES.customerReferral,
    reason: "Customer referral bonus: G.vijayalakshmi joined using your code",
    createdAt: "2026-06-24T13:00:00.000Z",
    tag: "customer_referral",
  },
  {
    id: "sample-post-like",
    customerName: "Kokilavani",
    amount: POINT_RULES.postLike,
    reason: "Your reel was liked",
    createdAt: "2026-06-22T08:00:00.000Z",
    tag: "post_like",
  },
];

const PointsListLayer = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listPointsSettlements({ limit: 500, offset: 0 });
      setRows(res.items || []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const inferTag = (item) => {
    if (item.tag) return item.tag;
    const meta = item.metadata || item.meta || {};
    const s = `${meta.reason || ""} ${meta.type || ""} ${item.reason || ""} ${item.type || ""} ${item.settlementType || ""}`.toLowerCase();
    if (s.includes("welcome")) return "welcome";
    if (s.includes("customer") && s.includes("ref")) return "customer_referral";
    if (s.includes("vendor") && s.includes("ref")) return "vendor_referral";
    if (s.includes("post") && s.includes("like")) return "post_like";
    if (s.includes("reel") && s.includes("like")) return "post_like";
    if (s.includes("photo") && s.includes("like")) return "post_like";
    if (s.includes("post") && s.includes("share")) return "post_share";
    if (s.includes("story") && s.includes("like")) return "story_like";
    if (s.includes("redeem")) return "redeemed";
    return "order_reward";
  };

  const amountFor = (item) => Number(item.amount ?? item.points ?? item.rewardPoints ?? 0) || 0;

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

  const recentTransactions = useMemo(() => {
    const source = rows.length > 0 ? rows : SAMPLE_TRANSACTIONS;
    return [...source]
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
              />
            ))}
          </section>

          <section className='p4u-points-grid'>
            <div className='p4u-points-panel p4u-points-config-panel'>
              <h5>Points Configuration</h5>
              <div className='p4u-points-config-list'>
                {CONFIG_ITEMS.map((item) => (
                  <ConfigItem key={item.title} {...item} />
                ))}
              </div>
            </div>

            <div className='p4u-points-panel p4u-points-transactions-panel'>
              <h5>Recent Transactions</h5>
              <div className='p4u-points-transaction-list'>
                {recentTransactions.map((item) => {
                  const tag = inferTag(item);
                  const amount = amountFor(item);
                  return (
                    <TransactionRow
                      key={item.id || `${item.createdAt}-${item.customerName}-${amount}`}
                      tag={tag}
                      name={item.customerName || item.userName || item.name || item.vendorName || "Customer"}
                      description={item.description || item.reason || "Points transaction"}
                      amount={amount}
                      createdAt={item.createdAt}
                      formatPts={formatPts}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, accent, wash }) => (
  <article className='p4u-points-stat-card' style={{ "--points-accent": accent, "--points-wash": wash }}>
    <div>
      <p>{title}</p>
      <strong>{value}</strong>
      <span className='p4u-points-trend'>
        <Icon icon='mdi:trending-up' /> +0% <em>vs last month</em>
      </span>
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

