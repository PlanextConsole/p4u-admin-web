import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { listHomesPropertyUsers } from "../../../lib/api/adminApi";
import { ApiError } from "../../../lib/api/client";

function errorMessage(e) {
  return e instanceof ApiError ? e.message : String(e?.message || e || "Something went wrong");
}

function formatMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return String(value || "0");
  return number.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function statusLabel(status) {
  const normalized = String(status || "active").toLowerCase();
  if (normalized === "pending") return "Submitted";
  if (normalized === "approved" || normalized === "verified") return "Active";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function UserModal({ user, onClose }) {
  if (!user) return null;
  return (
    <div className='p4u-property-users-modal-backdrop' role='presentation' onClick={onClose}>
      <section className='p4u-property-users-modal' role='dialog' aria-modal='true' onClick={(e) => e.stopPropagation()}>
        <button type='button' className='p4u-property-users-close' onClick={onClose} aria-label='Close'>
          <Icon icon='mdi:close' />
        </button>
        <h2>User: {user.name}</h2>
        <p className='p4u-property-users-id'>User ID: {user.id}</p>
        <h3>Properties ({user.listingCount})</h3>
        <div className='p4u-property-users-list'>
          {(user.listings || []).map((property) => (
            <article key={property.id} className='p4u-property-users-property'>
              <div>
                <strong>{property.title}</strong>
                <span>{property.locality || "-"}, {property.city || "-"} • ₹{formatMoney(property.price)}</span>
              </div>
              <div className='p4u-property-users-property-actions'>
                <em className={statusLabel(property.status) === "Active" ? "is-active" : "is-submitted"}>{statusLabel(property.status)}</em>
                {property.verified ? <Icon icon='mdi:shield-outline' /> : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function HomesPropertyUsersLayer() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listHomesPropertyUsers({ limit: 500, offset: 0 });
      setUsers(res.items || []);
      setTotal(Number(res.total || 0));
    } catch (e) {
      toast.error(errorMessage(e));
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => [user.name, user.id].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [users, search]);

  return (
    <div className='p4u-property-users-page'>
      <h1>Property Users</h1>
      <section className='p4u-property-users-stat'>
        <Icon icon='mdi:account-group-outline' />
        <div>
          <span>Total Owners</span>
          <strong>{total}</strong>
        </div>
      </section>

      <section className='p4u-property-users-card'>
        <div className='p4u-property-users-toolbar'>
          <label className='p4u-property-users-search'>
            <Icon icon='mdi:magnify' />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search...' />
          </label>
        </div>
        <div className='p4u-property-users-table-wrap'>
          <table className='p4u-property-users-table'>
            <thead>
              <tr><th>Name</th><th>ID</th><th>Listings</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className='p4u-property-users-empty'>Loading...</td></tr> : null}
              {!loading ? rows.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className='p4u-property-users-name'>
                      <span className='p4u-property-users-avatar' aria-hidden>{String(user.name || 'U').trim().charAt(0).toUpperCase() || 'U'}</span>
                      <strong>{user.name || 'Owner'}</strong>
                    </div>
                  </td>
                  <td><code>{user.id}</code></td>
                  <td><span className='p4u-property-users-count'>{user.listingCount}</span></td>
                  <td>
                    <button type='button' className='p4u-property-users-view' onClick={() => setSelected(user)}>
                      <Icon icon='mdi:eye-outline' /> View
                    </button>
                  </td>
                </tr>
              )) : null}
              {!loading && rows.length === 0 ? <tr><td colSpan={4} className='p4u-property-users-empty'>No property users found.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <div className='p4u-property-users-pagination'>
          <span>Showing {rows.length ? 1 : 0}-{rows.length} of {rows.length}</span>
          <div>
            <button type='button' aria-label='Previous'><Icon icon='mdi:chevron-left' /></button>
            <strong>1</strong>
            <button type='button' aria-label='Next'><Icon icon='mdi:chevron-right' /></button>
          </div>
        </div>
      </section>

      <UserModal user={selected} onClose={() => setSelected(null)} />
    </div>
  );
}