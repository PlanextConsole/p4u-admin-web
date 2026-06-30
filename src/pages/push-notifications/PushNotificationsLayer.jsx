import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-toastify";
import { listRecentPushNotifications, sendPushNotification } from "../../lib/api/adminApi";
import { ApiError } from "../../lib/api/client";
import { formatDateTime } from "../../lib/formatters";

const AUDIENCE_OPTIONS = [
  { value: "all_users", label: "All Users", icon: "mdi:web" },
  { value: "customers", label: "Customers Only", icon: "mdi:account-group-outline" },
  { value: "vendors", label: "Vendors Only", icon: "mdi:storefront-outline" },
  { value: "riders", label: "Riders Only", icon: "mdi:bell-outline" },
  { value: "specific_users", label: "Specific Users", icon: "mdi:account-search-outline" },
];

function audienceLabel(v) {
  const o = AUDIENCE_OPTIONS.find((x) => x.value === v);
  return o ? o.label : v || "-";
}

const PushNotificationsLayer = () => {
  const [targetAudience, setTargetAudience] = useState("all_users");
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [specificUserIds, setSpecificUserIds] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [recent, setRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const selectedAudience = useMemo(
    () => AUDIENCE_OPTIONS.find((option) => option.value === targetAudience) || AUDIENCE_OPTIONS[0],
    [targetAudience]
  );

  const loadRecent = useCallback(async () => {
    setLoadingRecent(true);
    setError("");
    try {
      const res = await listRecentPushNotifications({ limit: 30, offset: 0 });
      setRecent(Array.isArray(res.items) ? res.items : []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const handleSend = async (e) => {
    e.preventDefault();
    const t = title.trim();
    const b = body.trim();
    const userIds = specificUserIds
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!t) {
      toast.error("Title is required.");
      return;
    }
    if (!b) {
      toast.error("Body is required.");
      return;
    }
    if (targetAudience === "specific_users" && userIds.length === 0) {
      toast.error("User IDs are required for specific users.");
      return;
    }

    setSending(true);
    try {
      await sendPushNotification({
        targetAudience,
        title: t,
        body: b,
        deepLink: deepLink.trim() || null,
        ...(targetAudience === "specific_users" ? { userIds } : {}),
      });
      toast.success("Notification saved. (Connect FCM/APNs to deliver to devices.)");
      setTitle("");
      setBody("");
      setDeepLink("");
      setSpecificUserIds("");
      await loadRecent();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='p4u-push-page'>
      <div className='p4u-push-grid'>
        <section className='p4u-push-card'>
          <h1><Icon icon='mdi:bell-outline' /> Send Notification</h1>

          <form onSubmit={handleSend} className='p4u-push-form'>
            <div className='p4u-push-field p4u-push-audience-wrap'>
              <label>Target Audience</label>
              <button
                type='button'
                className={`p4u-push-select ${audienceOpen ? 'is-open' : ''}`}
                onClick={() => setAudienceOpen((open) => !open)}
                aria-haspopup='listbox'
                aria-expanded={audienceOpen}
              >
                <span><Icon icon={selectedAudience.icon} /> {selectedAudience.label}</span>
                <Icon icon='mdi:chevron-down' />
              </button>
              {audienceOpen && (
                <div className='p4u-push-dropdown' role='listbox'>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type='button'
                      role='option'
                      aria-selected={targetAudience === option.value}
                      className={targetAudience === option.value ? 'is-selected' : ''}
                      onClick={() => {
                        setTargetAudience(option.value);
                        setAudienceOpen(false);
                      }}
                    >
                      <Icon icon={targetAudience === option.value ? 'mdi:check' : option.icon} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {targetAudience === "specific_users" && (
              <div className='p4u-push-field'>
                <label>User IDs (comma-separated)</label>
                <input value={specificUserIds} onChange={(e) => setSpecificUserIds(e.target.value)} placeholder='user-id-1, user-id-2' />
              </div>
            )}

            <div className='p4u-push-field'>
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Notification title' maxLength={255} />
            </div>

            <div className='p4u-push-field'>
              <label>Body</label>
              <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder='Notification message' />
            </div>

            <div className='p4u-push-field'>
              <label>Deep Link (optional)</label>
              <input value={deepLink} onChange={(e) => setDeepLink(e.target.value)} placeholder='/app/orders or /app/product/123' maxLength={512} />
            </div>

            <button type='submit' className='p4u-push-submit' disabled={sending}>
              <Icon icon='mdi:send-outline' />
              <span>{sending ? "Sending..." : "Send Notification"}</span>
            </button>
          </form>
        </section>

        <section className='p4u-push-card p4u-push-recent'>
          <h1>Recent Sends</h1>
          {error && <div className='p4u-push-alert'>{error}</div>}
          {loadingRecent ? (
            <p>Loading...</p>
          ) : recent.length === 0 ? (
            <p>No notifications sent this session.</p>
          ) : (
            <ul>
              {recent.map((n) => (
                <li key={n.id}>
                  <strong>{n.title}</strong>
                  <span>{n.body}</span>
                  <small>
                    {audienceLabel(n.targetAudience)} - {formatDateTime(n.createdAt)}
                    {n.deepLink ? ` - ${n.deepLink}` : ""}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default PushNotificationsLayer;
