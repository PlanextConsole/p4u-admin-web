import React, { useMemo, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import FormModal from "../../components/admin/FormModal";

const defaultPages = [
  {
    id: "privacy-policy",
    slug: "privacy-policy",
    title: "Privacy Policy",
    status: "active",
    metaDescription: "SEO description",
    content: "Privacy Policy\n\nThis page explains how P4U collects, uses, and protects customer and vendor information.",
    updatedAt: "2026-04-11",
  },
  {
    id: "terms-and-conditions",
    slug: "terms-and-conditions",
    title: "Terms and Conditions",
    status: "active",
    metaDescription: "SEO description",
    content: "Terms and Conditions\n\nThese terms govern customer, vendor, service, classified, and platform usage across P4U.",
    updatedAt: "2026-04-11",
  },
  {
    id: "wallet-points-structure",
    slug: "wallet-points-structure",
    title: "Wallet Points Structure",
    status: "active",
    metaDescription: "SEO description",
    content: "How Points Work\nWelcome Bonus: Get 300 points when you register on P4U.\nCustomer Referral: Earn 100 points when your referred friend makes their first purchase.\nVendor Referral: Earn 200 points when a vendor you referred registers successfully.\nPost Share: Earn 1 point every time you share a post on Socio.\nPost Liked: Earn 1 point when someone likes your post.\nStory Liked: Earn 1 point when someone likes your story.\nRedemption Rules\n1 point = ₹1. Points can be redeemed against orders placed on P4U platform only.\nPoints expire 60 days after earning if not redeemed.\nMaximum redemption percentage depends on the vendor/product configuration.",
    updatedAt: "2026-04-11",
  },
];

const emptyPage = () => ({
  id: "",
  slug: "",
  title: "",
  status: "active",
  metaDescription: "",
  content: "",
  updatedAt: new Date().toISOString().slice(0, 10),
});

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CmsPageModal = ({ mode, initialPage, onCancel, onSave }) => {
  const [form, setForm] = useState(initialPage || emptyPage());
  const isCreate = mode === "create";

  const update = (key, value) => {
    setForm((prev) => {
      if (key === "title" && isCreate && !prev.slug) {
        return { ...prev, title: value, slug: slugify(value) };
      }
      if (key === "slug") return { ...prev, slug: slugify(value) };
      return { ...prev, [key]: value };
    });
  };

  const submit = (event) => {
    event.preventDefault();
    const slug = slugify(form.slug || form.title);
    onSave({ ...form, id: form.id || slug, slug, updatedAt: new Date().toISOString().slice(0, 10) });
  };

  return (
    <form className='p4u-cms-modal' onSubmit={submit}>
      <h2>{isCreate ? "Create New Page" : `Edit: ${form.title || "CMS Page"}`}</h2>

      {isCreate ? (
        <label className='p4u-cms-field is-full'>
          <span>Slug (URL path)</span>
          <input value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder='e.g. about-us' autoFocus />
        </label>
      ) : null}

      <div className='p4u-cms-grid'>
        <label className='p4u-cms-field'>
          <span>Title</span>
          <input value={form.title} onChange={(event) => update("title", event.target.value)} required autoFocus={!isCreate} />
        </label>
        <label className='p4u-cms-field'>
          <span>Status</span>
          <select value={form.status} onChange={(event) => update("status", event.target.value)}>
            <option value='active'>Active</option>
            <option value='draft'>Draft</option>
            <option value='inactive'>Inactive</option>
          </select>
        </label>
      </div>

      <label className='p4u-cms-field is-full'>
        <span>Meta Description</span>
        <input value={form.metaDescription} onChange={(event) => update("metaDescription", event.target.value)} placeholder='SEO description' />
      </label>

      <div className='p4u-cms-editor-field'>
        <span>Content (Rich Text)</span>
        <div className='p4u-cms-editor'>
          <div className='p4u-cms-editor-tools'>
            <Icon icon='mdi:format-bold' />
            <Icon icon='mdi:format-italic' />
            <Icon icon='mdi:format-underline' />
            <span>• List</span>
            <span>1. List</span>
            <span>H1</span>
            <span>H2</span>
            <span>H3</span>
            <span>P</span>
          </div>
          <textarea value={form.content} onChange={(event) => update("content", event.target.value)} />
        </div>
      </div>

      <div className='p4u-cms-modal-footer'>
        <button type='button' onClick={onCancel}>Cancel</button>
        <button type='submit'>Save Page</button>
      </div>
    </form>
  );
};

const CmsPagesLayer = () => {
  const [pages, setPages] = useState(defaultPages);
  const [modal, setModal] = useState(null);

  const sortedPages = useMemo(() => [...pages].sort((a, b) => a.title.localeCompare(b.title)), [pages]);

  const savePage = (page) => {
    setPages((prev) => {
      const exists = prev.some((item) => item.id === page.id);
      return exists ? prev.map((item) => (item.id === page.id ? page : item)) : [...prev, page];
    });
    setModal(null);
  };

  return (
    <div className='p4u-cms-page'>
      <section className='p4u-cms-hero'>
        <div>
          <h1>CMS Pages</h1>
          <p>Manage Terms &amp; Conditions, Privacy Policy, and other content pages</p>
        </div>
        <button type='button' onClick={() => setModal({ mode: "create", page: emptyPage() })}>
          <Icon icon='ic:round-plus' />
          Add Page
        </button>
      </section>

      <section className='p4u-cms-list'>
        {sortedPages.map((page) => (
          <article className='p4u-cms-row' key={page.id}>
            <div className='p4u-cms-row-main'>
              <span className='p4u-cms-doc-icon'><Icon icon='lucide:file-text' /></span>
              <div>
                <h2>{page.title}</h2>
                <p>/{page.slug} · Updated {formatDate(page.updatedAt)}</p>
              </div>
            </div>
            <div className='p4u-cms-row-actions'>
              <span className={`p4u-cms-pill is-${page.status}`}>{page.status}</span>
              <button type='button' onClick={() => setModal({ mode: "edit", page })}>
                <Icon icon='lucide:square-pen' />
                Edit
              </button>
            </div>
          </article>
        ))}
      </section>

      {modal ? (
        <FormModal onClose={() => setModal(null)} size='xl'>
          <CmsPageModal mode={modal.mode} initialPage={modal.page} onCancel={() => setModal(null)} onSave={savePage} />
        </FormModal>
      ) : null}
    </div>
  );
};

export default CmsPagesLayer;
