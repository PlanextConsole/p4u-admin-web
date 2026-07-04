import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";

const INITIAL_PROPERTIES = [
  {
    id: "home-001",
    title: "2 BHK Apartment in Beach Road Nagercoil",
    shortTitle: "2 BHK Apartment in ...",
    address: "Beach Road, Nagercoil",
    type: "Rent",
    property: "Apartment",
    price: "₹8,000",
    bhk: "2",
    area: "1000 sq.ft",
    floor: "2/—",
    furnishing: "Unfurnished",
    parking: "Both",
    facing: "North",
    location: "Beach Road, Nagercoil",
    postedBy: "Rahul Sharma (owner)",
    role: "Owner",
    views: 0,
    enquiries: 0,
    deposit: "₹1,000",
    description: "Best Apartment",
    amenities: ["Intercom", "Air Conditioner", "Lift", "Gas Pipeline", "CCTV"],
    photos: 0,
    submitted: "09 Apr",
    status: "pending",
    autoFlagged: true,
  },
];

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "reported", label: "Reported" },
  { key: "autoFlagged", label: "Auto-Flagged" },
];

function countForTab(items, key) {
  if (key === "pending") return items.filter((item) => item.status === "pending").length;
  if (key === "reported") return items.filter((item) => item.status === "reported").length;
  if (key === "autoFlagged") return items.filter((item) => item.autoFlagged).length;
  return 0;
}

function DetailLine({ label, value }) {
  return (
    <div className='p4u-homes-detail-line'>
      <span>{label}:</span> <strong>{value}</strong>
    </div>
  );
}

function ModerationModal({ property, onClose, onAction }) {
  if (!property) return null;
  return (
    <div className='p4u-homes-modal-backdrop' role='presentation' onClick={onClose}>
      <section className='p4u-homes-modal' role='dialog' aria-modal='true' aria-label='Property details' onClick={(e) => e.stopPropagation()}>
        <button type='button' className='p4u-homes-modal-close' onClick={onClose} aria-label='Close'>
          <Icon icon='mdi:close' />
        </button>
        <h2>{property.title}</h2>
        <div className='p4u-homes-detail-grid'>
          <DetailLine label='Type' value={property.type} />
          <DetailLine label='Property' value={property.property} />
          <DetailLine label='Price' value={property.price} />
          <DetailLine label='BHK' value={property.bhk} />
          <DetailLine label='Area' value={property.area} />
          <DetailLine label='Floor' value={property.floor} />
          <DetailLine label='Furnishing' value={property.furnishing} />
          <DetailLine label='Parking' value={property.parking} />
          <DetailLine label='Facing' value={property.facing} />
          <DetailLine label='Location' value={property.location} />
          <DetailLine label='Posted by' value={property.postedBy} />
          <DetailLine label='Views' value={property.views} />
          <DetailLine label='Enquiries' value={property.enquiries} />
          <DetailLine label='Deposit' value={property.deposit} />
        </div>
        <p className='p4u-homes-description'>{property.description}</p>
        <div className='p4u-homes-amenities'>
          <span>Amenities</span>
          <div>
            {property.amenities.map((item) => <em key={item}>{item}</em>)}
          </div>
        </div>
        <div className='p4u-homes-modal-actions'>
          <button type='button' className='is-approve' onClick={() => onAction(property.id, "approved")}>
            <Icon icon='mdi:check-circle-outline' /> Approve
          </button>
          <button type='button' className='is-reject' onClick={() => onAction(property.id, "rejected")}>
            <Icon icon='mdi:close-circle-outline' /> Reject
          </button>
          <button type='button' className='is-verify' onClick={() => onAction(property.id, "verified")}>
            <Icon icon='mdi:shield-outline' /> Verify
          </button>
        </div>
      </section>
    </div>
  );
}

export default function HomesModerationQueueLayer() {
  const [properties, setProperties] = useState(INITIAL_PROPERTIES);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const counts = useMemo(() => ({
    pending: countForTab(properties, "pending"),
    reported: countForTab(properties, "reported"),
    autoFlagged: countForTab(properties, "autoFlagged"),
    noPhotos: properties.filter((item) => Number(item.photos || 0) === 0).length,
  }), [properties]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((item) => {
      if (tab === "pending" && item.status !== "pending") return false;
      if (tab === "reported" && item.status !== "reported") return false;
      if (tab === "autoFlagged" && !item.autoFlagged) return false;
      if (!q) return true;
      return [item.title, item.address, item.type, item.role].some((value) => String(value).toLowerCase().includes(q));
    });
  }, [properties, search, tab]);

  const handleAction = (id, status) => {
    setProperties((prev) => prev.map((item) => (item.id === id ? { ...item, status, autoFlagged: status === "pending" && item.autoFlagged } : item)));
    setSelected(null);
  };

  return (
    <div className='p4u-homes-moderation-page'>
      <h1>Moderation Queue</h1>

      <div className='p4u-homes-stat-grid'>
        <article className='p4u-homes-stat is-warm'>
          <Icon icon='mdi:clock-outline' />
          <div><strong>{counts.pending}</strong><span>Pending Review</span></div>
        </article>
        <article className='p4u-homes-stat is-pink'>
          <Icon icon='mdi:flag-outline' />
          <div><strong>{counts.reported}</strong><span>Reports</span></div>
        </article>
        <article className='p4u-homes-stat is-warm'>
          <Icon icon='mdi:alert-outline' />
          <div><strong>{counts.noPhotos}</strong><span>No Photos</span></div>
        </article>
      </div>

      <div className='p4u-homes-tabs' role='tablist' aria-label='Moderation filters'>
        {TABS.map((item) => (
          <button key={item.key} type='button' className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>
            {item.label} ({countForTab(properties, item.key)})
          </button>
        ))}
      </div>

      <section className='p4u-homes-table-card'>
        <div className='p4u-homes-toolbar'>
          <label className='p4u-homes-search'>
            <Icon icon='mdi:magnify' />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Search...' />
          </label>
        </div>

        <div className='p4u-homes-table-wrap'>
          <table className='p4u-homes-table'>
            <thead>
              <tr>
                <th aria-label='Select'></th>
                <th>Property</th>
                <th>Type</th>
                <th>Price</th>
                <th>By</th>
                <th>Photos</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td><input type='checkbox' aria-label={`Select ${item.title}`} /></td>
                  <td>
                    <button type='button' className='p4u-homes-property-link' onClick={() => setSelected(item)}>
                      <strong>{item.shortTitle}</strong>
                      <span>{item.address}</span>
                    </button>
                  </td>
                  <td><span className='p4u-homes-type-pill'>{item.type}</span></td>
                  <td className='p4u-homes-price'>{item.price}</td>
                  <td>{item.role}</td>
                  <td><span className='p4u-homes-photo-pill'>{item.photos}</span></td>
                  <td>{item.submitted}</td>
                  <td>
                    <div className='p4u-homes-row-actions'>
                      <button type='button' className='is-approve' onClick={() => handleAction(item.id, "approved")}>
                        <Icon icon='mdi:check-circle-outline' /> <span>Approve</span>
                      </button>
                      <button type='button' className='is-reject' onClick={() => handleAction(item.id, "rejected")}>
                        <Icon icon='mdi:close-circle-outline' /> <span>Reject</span>
                      </button>
                      <button type='button' className='is-view' onClick={() => setSelected(item)} aria-label='View property'>
                        <Icon icon='mdi:eye-outline' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className='p4u-homes-empty'>No properties found.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className='p4u-homes-pagination'>
          <span>Showing {filtered.length ? '1' : '0'}–{filtered.length} of {filtered.length}</span>
          <div>
            <button type='button' aria-label='Previous page'><Icon icon='mdi:chevron-left' /></button>
            <strong>1</strong>
            <button type='button' aria-label='Next page'><Icon icon='mdi:chevron-right' /></button>
          </div>
        </div>
      </section>

      <ModerationModal property={selected} onClose={() => setSelected(null)} onAction={handleAction} />
    </div>
  );
}