import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { getHomesPropertyAnalytics } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";

const metricCards = [
  ["totalProperties", "Total Properties", "mdi:home-outline", "teal"],
  ["activeListings", "Active Listings", "mdi:chart-line-variant", "green"],
  ["addedToday", "Added Today", "mdi:star-outline", "orange"],
  ["totalViews", "Total Views", "mdi:eye-outline", "blue"],
  ["contactsRevealed", "Contacts Revealed", "mdi:account-group-outline", "teal"],
  ["enquiries", "Enquiries", "mdi:message-outline", "orange"],
  ["visitRequests", "Visit Requests", "mdi:map-marker-outline", "green"],
  ["shortlisted", "Shortlisted", "mdi:crown-outline", "teal"],
];

function errorMessage(e) {
  return e instanceof ApiError ? e.message : String(e?.message || e || "Something went wrong");
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function seriesValues(items) {
  return (items || []).map((item) => Number(item.value || 0));
}

function seriesLabels(items) {
  return (items || []).map((item) => item.label || "-");
}

function ChartCard({ title, children }) {
  return <section className='p4u-property-reports-chart'><h2>{title}</h2>{children}</section>;
}

export default function HomesPropertyReportsLayer() {
  const [range, setRange] = useState("90d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getHomesPropertyAnalytics({ range }));
    } catch (e) {
      toast.error(errorMessage(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { void load(); }, [load]);

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const topListings = data?.topListings || [];

  const baseOptions = useMemo(() => ({
    chart: { toolbar: { show: false }, fontFamily: "inherit" },
    colors: ["#18a878", "#009f98", "#ff9f29", "#ef3654", "#8b5cf6", "#00a8e8"],
    dataLabels: { enabled: true },
    legend: { show: false },
    grid: { borderColor: "#dce9ee", strokeDashArray: 4 },
  }), []);

  const exportCsv = () => {
    const rows = [["Rank", "Title", "City", "Locality", "Price", "Views", "Enquiries", "Contacts"]];
    topListings.forEach((item, index) => rows.push([index + 1, item.title, item.city, item.locality, item.price, item.views, item.enquiries, item.contacts]));
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "property-reports.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='p4u-property-reports-page'>
      <div className='p4u-property-reports-header'>
        <h1>Property Reports & Analytics</h1>
        <div className='p4u-property-reports-actions'>
          <select value={range} onChange={(e) => setRange(e.target.value)} aria-label='Date range'>
            <option value='30d'>Last 30 days</option>
            <option value='90d'>Last 90 days</option>
            <option value='180d'>Last 180 days</option>
          </select>
          <button type='button' className='p4u-property-reports-export' onClick={exportCsv}>
            <Icon icon='mdi:download' />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? <div className='p4u-property-reports-loading'>Loading analytics...</div> : null}

      <div className='p4u-property-reports-metrics'>
        {metricCards.map(([key, label, icon, tone]) => <article key={key}><Icon icon={icon} className={`is-${tone}`} /><span>{label}</span><strong>{metrics[key] || 0}</strong></article>)}
      </div>

      <div className='p4u-property-reports-grid'>
        <ChartCard title='Listings by Status'>
          <ReactApexChart type='pie' height={250} series={seriesValues(charts.listingsByStatus)} options={{ ...baseOptions, labels: seriesLabels(charts.listingsByStatus), stroke: { width: 1 }, legend: { show: false } }} />
        </ChartCard>
        <ChartCard title='Transaction Types'>
          <ReactApexChart type='bar' height={250} series={[{ data: seriesValues(charts.transactionTypes) }]} options={{ ...baseOptions, xaxis: { categories: seriesLabels(charts.transactionTypes) }, plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } }, dataLabels: { enabled: false } }} />
        </ChartCard>
        <ChartCard title='Top Cities'>
          <ReactApexChart type='bar' height={250} series={[{ data: seriesValues(charts.topCities) }]} options={{ ...baseOptions, xaxis: { categories: seriesLabels(charts.topCities) }, plotOptions: { bar: { horizontal: true, borderRadius: 4 } }, dataLabels: { enabled: false } }} />
        </ChartCard>
        <ChartCard title='Monthly New Listings'>
          <ReactApexChart type='area' height={250} series={[{ data: seriesValues(charts.monthlyNewListings) }]} options={{ ...baseOptions, xaxis: { categories: seriesLabels(charts.monthlyNewListings) }, stroke: { curve: "straight", width: 2 }, dataLabels: { enabled: false }, fill: { opacity: 0.18 } }} />
        </ChartCard>
        <ChartCard title='Daily Enquiries (30 days)'>
          <ReactApexChart type='line' height={250} series={[{ data: seriesValues(charts.dailyEnquiries) }]} options={{ ...baseOptions, xaxis: { categories: seriesLabels(charts.dailyEnquiries) }, dataLabels: { enabled: false } }} />
        </ChartCard>
        <ChartCard title='Property Types'>
          <ReactApexChart type='donut' height={250} series={seriesValues(charts.propertyTypes)} options={{ ...baseOptions, labels: seriesLabels(charts.propertyTypes), legend: { show: false }, stroke: { width: 0 } }} />
        </ChartCard>
      </div>

      <section className='p4u-property-reports-top'>
        <h2>Top Performing Listings</h2>
        {topListings.map((item, index) => <article key={item.id}><b>#{index + 1}</b><div><strong>{item.title}</strong><span>{item.locality}, {item.city} • ₹{money(item.price)}</span></div><ul><li><Icon icon='mdi:eye-outline' />{item.views}</li><li><Icon icon='mdi:message-outline' />{item.enquiries}</li><li><Icon icon='mdi:account-group-outline' />{item.contacts}</li></ul></article>)}
      </section>
    </div>
  );
}