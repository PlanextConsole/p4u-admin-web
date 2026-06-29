import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  getSocialDashboard,
  listPlatformVariables,
  listSocialAudio,
  listSocialHashtags,
  listSocialPosts,
  listSocialReports,
  listSocialUsers,
  removeSocialPost,
} from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { isPlatformVariableRowAllowingAction } from "../../lib/platformVariableValue";

const tabs = [
  { key: "overview", label: "Overview", icon: "mdi:chart-bar" },
  { key: "users", label: "Users", icon: "mdi:account-multiple-outline" },
  { key: "moderation", label: "Moderation", icon: "mdi:shield-check-outline" },
  { key: "hashtags", label: "Hashtags", icon: "mdi:pound" },
  { key: "audio", label: "Audio", icon: "mdi:music-note-outline" },
  { key: "config", label: "Config", icon: "mdi:tune-variant" },
];

const OVERVIEW_CARD_META = [
  { key: "totalUsers", title: "Total Users", icon: "mdi:account-group-outline", accent: "#00a6a3", wash: "#e7f4f5" },
  { key: "totalPosts", title: "Total Posts", icon: "mdi:image-outline", accent: "#06172a", wash: "#f2f6f8" },
  { key: "verified", title: "Verified", icon: "mdi:check-circle-outline", accent: "#06172a", wash: "#f2f6f8" },
  { key: "creators", title: "Creators", icon: "mdi:trending-up", accent: "#06172a", wash: "#f2f6f8" },
];

function formatReach(n) {
  const v = Number(n || 0);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}

function formatVarValue(row) {
  const v = row?.value;
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "Enabled" : "Disabled";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (v.amount != null && v.amount !== "") return String(v.amount);
    if (v.text != null && v.text !== "") return String(v.text);
    if (typeof v.enabled === "boolean") return v.enabled ? "Enabled" : "Disabled";
  }
  return "—";
}

export default function SocialDashboardLayer() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [audioRows, setAudioRows] = useState([]);
  const [platformVars, setPlatformVars] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [hashtagSearch, setHashtagSearch] = useState("");
  const [audioSearch, setAudioSearch] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const loadOverview = useCallback(async () => {
    const data = await getSocialDashboard();
    setDashboard(data);
  }, []);

  const loadTab = useCallback(async (tab, search) => {
    if (tab === "overview") {
      await loadOverview();
      return;
    }
    if (tab === "users") {
      const res = await listSocialUsers({ limit: 100, offset: 0, search: search || undefined });
      setUsers(res.items || []);
      return;
    }
    if (tab === "moderation") {
      const [postsRes, reportsRes] = await Promise.all([
        listSocialPosts({ limit: 100, offset: 0 }),
        listSocialReports({ limit: 50, offset: 0 }),
      ]);
      setPosts(postsRes.items || []);
      setReports(reportsRes.items || []);
      return;
    }
    if (tab === "hashtags") {
      const res = await listSocialHashtags({ limit: 100 });
      setHashtags(res.items || []);
      return;
    }
    if (tab === "audio") {
      const res = await listSocialAudio({ limit: 100, offset: 0 });
      setAudioRows(res.items || []);
      return;
    }
    if (tab === "config") {
      const res = await listPlatformVariables({ limit: 200, offset: 0 });
      setPlatformVars(res.items || []);
    }
  }, [loadOverview]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const search = activeTab === "users" ? userSearch : undefined;
      await loadTab(activeTab, search);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [activeTab, loadTab, userSearch]);

  useEffect(() => {
    void refresh();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "users") return;
    const t = setTimeout(() => void refresh(), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const overviewCards = useMemo(() => {
    const o = dashboard?.overview || {};
    return OVERVIEW_CARD_META.map((card) => ({
      ...card,
      value: Number(o[card.key] ?? 0),
    }));
  }, [dashboard]);

  const contentSeries = useMemo(() => {
    const chart = dashboard?.contentChart;
    return [
      { name: "Posts", data: chart?.posts || [0, 0, 0, 0, 0, 0, 0] },
      { name: "Reels", data: chart?.reels || [0, 0, 0, 0, 0, 0, 0] },
      { name: "Stories", data: chart?.stories || [0, 0, 0, 0, 0, 0, 0] },
    ];
  }, [dashboard]);

  const contentOptions = useMemo(() => {
    const chart = dashboard?.contentChart;
    const allValues = [...(chart?.posts || []), ...(chart?.reels || []), ...(chart?.stories || [])];
    const maxVal = Math.max(...allValues, 1);
    return {
      chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
      plotOptions: { bar: { borderRadius: 0, columnWidth: "24%" } },
      dataLabels: { enabled: false },
      xaxis: { categories: chart?.categories || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], axisBorder: { color: "#9aa7b2" } },
      yaxis: { min: 0, max: Math.ceil(maxVal * 1.2), tickAmount: 3 },
      colors: ["#0b9f9c", "#0b0f14", "#050505"],
      legend: { show: false },
      grid: { borderColor: "#d8e2ea", strokeDashArray: 3 },
      tooltip: { theme: "light" },
    };
  }, [dashboard]);

  const growthSeries = useMemo(() => {
    const usersData = dashboard?.growthChart?.users || [];
    return [{ name: "users", data: usersData.length ? usersData : [0] }];
  }, [dashboard]);

  const growthOptions = useMemo(() => {
    const usersData = dashboard?.growthChart?.users || [0];
    const maxVal = Math.max(...usersData, 1);
    return {
      chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit", zoom: { enabled: false } },
      stroke: { width: 3, curve: "straight", colors: ["#00a6a3"] },
      dataLabels: { enabled: false },
      xaxis: { categories: dashboard?.growthChart?.categories || ["W1"], axisBorder: { color: "#9aa7b2" } },
      yaxis: { min: 0, max: Math.ceil(maxVal * 1.1), tickAmount: 2 },
      grid: { borderColor: "#d8e2ea", strokeDashArray: 3 },
      markers: { size: 4, colors: ["#ffffff"], strokeColors: "#00a6a3", strokeWidth: 2 },
      tooltip: { theme: "light" },
    };
  }, [dashboard]);

  const filteredHashtags = useMemo(() => {
    const q = hashtagSearch.trim().toLowerCase();
    if (!q) return hashtags;
    return hashtags.filter((row) => row.tag.toLowerCase().includes(q));
  }, [hashtags, hashtagSearch]);

  const filteredAudio = useMemo(() => {
    const q = audioSearch.trim().toLowerCase();
    if (!q) return audioRows;
    return audioRows.filter((row) => (row.title || "").toLowerCase().includes(q) || (row.owner || "").toLowerCase().includes(q));
  }, [audioRows, audioSearch]);

  const socialConfigVars = useMemo(() => {
    return platformVars.filter((row) => {
      const key = String(row.key || "").toUpperCase();
      const category = String(row.category || "").toLowerCase();
      return category.includes("social") || key.startsWith("SOCIAL_") || key.includes("HASHTAG") || key.includes("REEL") || key.includes("STORY");
    });
  }, [platformVars]);

  const featureToggles = useMemo(() => {
    return platformVars.filter((row) => {
      const v = row.value;
      return typeof v === "boolean" || (v && typeof v === "object" && typeof v.enabled === "boolean");
    });
  }, [platformVars]);

  const handleRemovePost = async (id) => {
    if (!window.confirm("Remove this post from the social feed?")) return;
    setRemovingId(id);
    setError("");
    try {
      await removeSocialPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className='p4u-social-page'>
      <header className='p4u-social-hero'>
        <h3>P4U Social - Admin</h3>
        <p>Content moderation, user management, analytics & configuration</p>
      </header>

      {error && (
        <div className='alert alert-danger radius-12 mb-16' role='alert'>
          {error}
        </div>
      )}

      <nav className='p4u-social-tabs' aria-label='P4U Social sections'>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type='button'
            className={activeTab === tab.key ? "is-active" : ""}
            onClick={() => setActiveTab(tab.key)}
          >
            <Icon icon={tab.icon} /> {tab.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className='p4u-points-loading'>Loading social dashboard...</div>
      ) : (
        <>
          {activeTab === "overview" && (
            <OverviewTab
              overviewCards={overviewCards}
              contentOptions={contentOptions}
              contentSeries={contentSeries}
              growthOptions={growthOptions}
              growthSeries={growthSeries}
            />
          )}
          {activeTab === "users" && (
            <UsersTab users={users} search={userSearch} onSearchChange={setUserSearch} />
          )}
          {activeTab === "moderation" && (
            <ModerationTab
              posts={posts}
              reports={reports}
              onRemove={handleRemovePost}
              removingId={removingId}
            />
          )}
          {activeTab === "hashtags" && (
            <SimpleListTab
              title='Hashtag Management'
              rows={filteredHashtags}
              kind='hashtags'
              search={hashtagSearch}
              onSearchChange={setHashtagSearch}
            />
          )}
          {activeTab === "audio" && (
            <SimpleListTab
              title='Audio Library'
              rows={filteredAudio}
              kind='audio'
              search={audioSearch}
              onSearchChange={setAudioSearch}
            />
          )}
          {activeTab === "config" && (
            <ConfigTab contentLimits={socialConfigVars} featureToggles={featureToggles} />
          )}
        </>
      )}
    </div>
  );
}

function OverviewTab({ overviewCards, contentOptions, contentSeries, growthOptions, growthSeries }) {
  return (
    <>
      <section className='p4u-social-stats' aria-label='Social overview metrics'>
        {overviewCards.map((card) => (
          <article className='p4u-social-stat-card' key={card.title} style={{ "--social-accent": card.accent, "--social-wash": card.wash }}>
            <div>
              <p>{card.title}</p>
              <strong>{card.value}</strong>
            </div>
            <span aria-hidden='true'>
              <Icon icon={card.icon} />
            </span>
          </article>
        ))}
      </section>

      <section className='p4u-social-chart-grid'>
        <Panel title='Content Created (This Week)'>
          <ReactApexChart options={contentOptions} series={contentSeries} type='bar' height={280} />
        </Panel>
        <Panel title='User Growth'>
          <ReactApexChart options={growthOptions} series={growthSeries} type='line' height={280} />
        </Panel>
      </section>
    </>
  );
}

function UsersTab({ users, search, onSearchChange }) {
  return (
    <Panel title='Social Profiles' className='p4u-social-table-panel' action={<SearchBox placeholder='Search users...' value={search} onChange={onSearchChange} />}>
      {users.length === 0 ? (
        <div className='p4u-social-empty'>
          <Icon icon='mdi:account-outline' />
          <strong>No social users found</strong>
          <p>Customers with linked accounts will appear here</p>
        </div>
      ) : (
        <div className='p4u-social-table-wrap'>
          <table className='p4u-social-table'>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Type</th>
                <th>Followers</th>
                <th>Posts</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId || user.id}>
                  <td className='is-mono'>{user.username}</td>
                  <td>{user.name}</td>
                  <td><Pill>{user.type}</Pill></td>
                  <td>{user.followers}</td>
                  <td>{user.posts}</td>
                  <td>{user.verified ? "Yes" : "-"}</td>
                  <td><button type='button' className='p4u-social-action'>...</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function ModerationTab({ posts, reports, onRemove, removingId }) {
  return (
    <div className='p4u-social-stack'>
      <Panel title='Reported Content' icon='mdi:flag-outline'>
        {reports.length === 0 ? (
          <div className='p4u-social-empty'>
            <Icon icon='mdi:shield-outline' />
            <strong>No reported content</strong>
            <p>Reports from users will appear here for review</p>
          </div>
        ) : (
          <div className='p4u-social-table-wrap'>
            <table className='p4u-social-table'>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Caption</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reported</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((row) => (
                  <tr key={row.id}>
                    <td><Pill>{row.type}</Pill></td>
                    <td>{row.caption}</td>
                    <td>{row.reasonCode || "—"}</td>
                    <td><span className='p4u-social-status'>{row.status}</span></td>
                    <td>{formatShortDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title='All Posts' className='p4u-social-table-panel'>
        {posts.length === 0 ? (
          <div className='p4u-social-empty'>
            <Icon icon='mdi:image-outline' />
            <strong>No posts yet</strong>
            <p>Published social posts will appear here</p>
          </div>
        ) : (
          <div className='p4u-social-table-wrap'>
            <table className='p4u-social-table'>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Caption</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td><Pill>{post.type}</Pill></td>
                    <td>{post.caption}</td>
                    <td>{post.likes}</td>
                    <td>{post.comments}</td>
                    <td><span className='p4u-social-status'>{post.status}</span></td>
                    <td>
                      <button
                        type='button'
                        className='p4u-social-remove'
                        disabled={removingId === post.id}
                        onClick={() => onRemove(post.id)}
                      >
                        {removingId === post.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function SimpleListTab({ title, rows, kind, search, onSearchChange }) {
  return (
    <Panel
      title={title}
      className='p4u-social-table-panel'
      action={<SearchBox placeholder={`Search ${kind}...`} value={search} onChange={onSearchChange} />}
    >
      {rows.length === 0 ? (
        <div className='p4u-social-empty'>
          <Icon icon={kind === "audio" ? "mdi:music-note-outline" : "mdi:pound"} />
          <strong>No {kind} data yet</strong>
          <p>Data from live social activity will appear here</p>
        </div>
      ) : (
        <div className='p4u-social-table-wrap'>
          <table className='p4u-social-table'>
            <thead>
              <tr>
                <th>{kind === "audio" ? "Title" : "Hashtag"}</th>
                <th>{kind === "audio" ? "Owner" : "Posts"}</th>
                <th>{kind === "audio" ? "Usage" : "Reach"}</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.tag || row.id || row.title}>
                  <td className={kind === "hashtags" ? "is-mono" : ""}>{row.tag || row.title}</td>
                  <td>{row.owner ?? row.posts}</td>
                  <td>{kind === "hashtags" ? formatReach(row.reach) : (row.usage ?? row.reach)}</td>
                  <td><span className={row.status === "active" ? "p4u-social-status is-active" : "p4u-social-status is-review"}>{row.status}</span></td>
                  <td><button type='button' className='p4u-social-action'>...</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function ConfigTab({ contentLimits, featureToggles }) {
  return (
    <Panel title='Platform Configuration' className='p4u-social-config-panel'>
      <div className='p4u-social-config-grid'>
        <section>
          <h6>Content Limits</h6>
          {contentLimits.length === 0 ? (
            <p className='text-secondary-light mb-0'>No social platform variables configured yet. Add variables with category &quot;Social&quot; in Platform Variables.</p>
          ) : (
            contentLimits.map((row) => (
              <ConfigControl key={row.id || row.key} label={row.description || row.key} value={formatVarValue(row)} />
            ))
          )}
        </section>
        <section>
          <h6>Feature Toggles</h6>
          {featureToggles.length === 0 ? (
            <p className='text-secondary-light mb-0'>No boolean feature toggles found in platform variables.</p>
          ) : (
            featureToggles.map((row) => (
              <ToggleRow
                key={row.id || row.key}
                label={row.description || row.key}
                enabled={isPlatformVariableRowAllowingAction(row)}
              />
            ))
          )}
        </section>
      </div>
    </Panel>
  );
}

function Panel({ title, icon, action, className = "", children }) {
  return (
    <section className={`p4u-social-panel ${className}`.trim()}>
      <div className='p4u-social-panel-head'>
        <h5>{icon ? <Icon icon={icon} /> : null}{title}</h5>
        {action}
      </div>
      {children}
    </section>
  );
}

function SearchBox({ placeholder, value, onChange }) {
  return (
    <label className='p4u-social-search'>
      <Icon icon='mdi:magnify' />
      <input type='search' placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Pill({ children }) {
  return <span className='p4u-social-pill'>{children}</span>;
}

function ConfigControl({ label, value }) {
  return (
    <div className='p4u-social-config-row'>
      <span>{label}</span>
      <button type='button'>{value}</button>
    </div>
  );
}

function ToggleRow({ label, enabled = false }) {
  return (
    <div className='p4u-social-toggle-row'>
      <span>{label}</span>
      <button type='button' className={enabled ? "is-on" : ""} aria-label={`${label} ${enabled ? "enabled" : "disabled"}`}>
        <span />
      </button>
    </div>
  );
}

function formatShortDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
