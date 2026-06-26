import React, { useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Icon } from "@iconify/react/dist/iconify.js";

const tabs = [
  { key: "overview", label: "Overview", icon: "mdi:chart-bar" },
  { key: "users", label: "Users", icon: "mdi:account-multiple-outline" },
  { key: "moderation", label: "Moderation", icon: "mdi:shield-check-outline" },
  { key: "hashtags", label: "Hashtags", icon: "mdi:pound" },
  { key: "audio", label: "Audio", icon: "mdi:music-note-outline" },
  { key: "config", label: "Config", icon: "mdi:tune-variant" },
];

const overviewCards = [
  { title: "Total Users", value: 33, icon: "mdi:account-group-outline", accent: "#00a6a3", wash: "#e7f4f5" },
  { title: "Total Posts", value: 45, icon: "mdi:image-outline", accent: "#06172a", wash: "#f2f6f8" },
  { title: "Verified", value: 0, icon: "mdi:check-circle-outline", accent: "#06172a", wash: "#f2f6f8" },
  { title: "Creators", value: 0, icon: "mdi:trending-up", accent: "#06172a", wash: "#f2f6f8" },
];

const socialUsers = [
  { username: "@deepika_rzj4", name: "Deepika", type: "Personal", followers: 0, posts: 0, verified: false },
  { username: "@g_vijayalakshmi_5rnl", name: "G.vijayalakshmi", type: "Personal", followers: 0, posts: 0, verified: false },
  { username: "@s_gunasekaran_85dm", name: "S GUNASEKARAN", type: "Personal", followers: 0, posts: 0, verified: false },
  { username: "@jayakumar_n_ma7e", name: "JayaKumar N", type: "Personal", followers: 0, posts: 0, verified: false },
  { username: "@shanmuganathan_0nsg", name: "SHANMUGANATHAN", type: "Personal", followers: 0, posts: 0, verified: false },
  { username: "@gokul_rajan_v8co", name: "Gokul Rajan", type: "Personal", followers: 0, posts: 0, verified: false },
  { username: "@saravanan_79vn", name: "Saravanan", type: "Personal", followers: 0, posts: 0, verified: false },
  { username: "@dr_kishor_anbazhakan_7c8n", name: "Dr. Kishor Anbazhakan", type: "Personal", followers: 0, posts: 0, verified: false },
  { username: "@shriraam_nqwp", name: "Shriraam", type: "Personal", followers: 0, posts: 0, verified: false },
];

const moderationPosts = [
  { type: "Reel", caption: "Entertainment", likes: 2, comments: 0, status: "published" },
  { type: "Reel", caption: "Fire dance", likes: 1, comments: 0, status: "published" },
  { type: "Photo", caption: "New launch", likes: 0, comments: 0, status: "published" },
  { type: "Photo", caption: "-", likes: 1, comments: 0, status: "published" },
  { type: "Photo", caption: "-", likes: 1, comments: 0, status: "published" },
];

const hashtags = [
  { tag: "#p4u", posts: 18, reach: "12.4K", status: "active" },
  { tag: "#shopping", posts: 11, reach: "8.1K", status: "active" },
  { tag: "#localbusiness", posts: 7, reach: "4.9K", status: "active" },
  { tag: "#reels", posts: 5, reach: "3.7K", status: "review" },
];

const audioRows = [
  { title: "Trending Beat", owner: "P4U Library", usage: 16, status: "active" },
  { title: "Festival Promo", owner: "Admin", usage: 8, status: "active" },
  { title: "Creator Voiceover", owner: "Creator", usage: 3, status: "review" },
];

const featureToggles = [
  "Trial Reels",
  "Remix / Duet",
  "Collab Posts",
  "Broadcast Channels",
  "Product Tagging",
  "Creator Subscriptions",
  "Live Badges",
  "AI Restyle (Stories)",
];

export default function SocialDashboardLayer() {
  const [activeTab, setActiveTab] = useState("overview");

  const contentSeries = useMemo(
    () => [
      { name: "Posts", data: [145, 120, 150, 130, 170, 210, 190] },
      { name: "Reels", data: [45, 55, 67, 48, 90, 105, 95] },
      { name: "Stories", data: [230, 180, 310, 245, 345, 455, 405] },
    ],
    [],
  );

  const contentOptions = useMemo(
    () => ({
      chart: { type: "bar", toolbar: { show: false }, fontFamily: "inherit" },
      plotOptions: { bar: { borderRadius: 0, columnWidth: "24%" } },
      dataLabels: { enabled: false },
      xaxis: { categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], axisBorder: { color: "#9aa7b2" } },
      yaxis: { min: 0, max: 660, tickAmount: 3 },
      colors: ["#0b9f9c", "#0b0f14", "#050505"],
      legend: { show: false },
      grid: { borderColor: "#d8e2ea", strokeDashArray: 3 },
      tooltip: { theme: "light" },
    }),
    [],
  );

  const growthSeries = useMemo(() => [{ name: "users", data: [1200, 1450, 1700, 2150, 2620, 3150] }], []);
  const growthOptions = useMemo(
    () => ({
      chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit", zoom: { enabled: false } },
      stroke: { width: 3, curve: "straight", colors: ["#00a6a3"] },
      dataLabels: { enabled: false },
      xaxis: { categories: ["W1", "W2", "W3", "W4", "W5", "W6"], axisBorder: { color: "#9aa7b2" } },
      yaxis: { min: 0, max: 3400, tickAmount: 2 },
      grid: { borderColor: "#d8e2ea", strokeDashArray: 3 },
      markers: { size: 4, colors: ["#ffffff"], strokeColors: "#00a6a3", strokeWidth: 2 },
      tooltip: { theme: "light" },
    }),
    [],
  );

  return (
    <div className='p4u-social-page'>
      <header className='p4u-social-hero'>
        <h3>P4U Social - Admin</h3>
        <p>Content moderation, user management, analytics & configuration</p>
      </header>

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

      {activeTab === "overview" && <OverviewTab contentOptions={contentOptions} contentSeries={contentSeries} growthOptions={growthOptions} growthSeries={growthSeries} />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "moderation" && <ModerationTab />}
      {activeTab === "hashtags" && <SimpleListTab title='Hashtag Management' rows={hashtags} kind='hashtags' />}
      {activeTab === "audio" && <SimpleListTab title='Audio Library' rows={audioRows} kind='audio' />}
      {activeTab === "config" && <ConfigTab />}
    </div>
  );
}

function OverviewTab({ contentOptions, contentSeries, growthOptions, growthSeries }) {
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

function UsersTab() {
  return (
    <Panel title='Social Profiles' className='p4u-social-table-panel' action={<SearchBox placeholder='Search users...' />}>
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
            {socialUsers.map((user) => (
              <tr key={user.username}>
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
    </Panel>
  );
}

function ModerationTab() {
  return (
    <div className='p4u-social-stack'>
      <Panel title='Reported Content' icon='mdi:flag-outline'>
        <div className='p4u-social-empty'>
          <Icon icon='mdi:shield-outline' />
          <strong>No reported content</strong>
          <p>Reports from users will appear here for review</p>
        </div>
      </Panel>

      <Panel title='All Posts' className='p4u-social-table-panel'>
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
              {moderationPosts.map((post, index) => (
                <tr key={`${post.type}-${index}`}>
                  <td><Pill>{post.type}</Pill></td>
                  <td>{post.caption}</td>
                  <td>{post.likes}</td>
                  <td>{post.comments}</td>
                  <td><span className='p4u-social-status'>{post.status}</span></td>
                  <td><button type='button' className='p4u-social-remove'>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function SimpleListTab({ title, rows, kind }) {
  return (
    <Panel title={title} className='p4u-social-table-panel' action={<SearchBox placeholder={`Search ${kind}...`} />}>
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
              <tr key={row.tag || row.title}>
                <td className={kind === "hashtags" ? "is-mono" : ""}>{row.tag || row.title}</td>
                <td>{row.owner || row.posts}</td>
                <td>{row.usage ?? row.reach}</td>
                <td><span className={row.status === "active" ? "p4u-social-status is-active" : "p4u-social-status is-review"}>{row.status}</span></td>
                <td><button type='button' className='p4u-social-action'>...</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function ConfigTab() {
  return (
    <Panel title='Platform Configuration' className='p4u-social-config-panel'>
      <div className='p4u-social-config-grid'>
        <section>
          <h6>Content Limits</h6>
          <ConfigControl label='Max hashtags per post' value='3' />
          <ConfigControl label='Max story segments/day' value='30' />
          <ConfigControl label='Max reel duration' value='90s' select />
        </section>
        <section>
          <h6>Feature Toggles</h6>
          {featureToggles.map((item) => <ToggleRow key={item} label={item} enabled />)}
        </section>
      </div>
      <div className='p4u-social-permissions'>
        <h6>Product Tagging - Account Permissions</h6>
        <ToggleRow label='Personal accounts can tag products' />
        <ToggleRow label='Creator accounts can tag products' enabled />
        <ToggleRow label='Business accounts can tag products' enabled />
        <button type='button'>Save Configuration</button>
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

function SearchBox({ placeholder }) {
  return (
    <label className='p4u-social-search'>
      <Icon icon='mdi:magnify' />
      <input type='search' placeholder={placeholder} />
    </label>
  );
}

function Pill({ children }) {
  return <span className='p4u-social-pill'>{children}</span>;
}

function ConfigControl({ label, value, select }) {
  return (
    <div className='p4u-social-config-row'>
      <span>{label}</span>
      <button type='button'>{value}{select ? <Icon icon='mdi:chevron-down' /> : null}</button>
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
