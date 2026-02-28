import type { JsonObject, JsonValue } from "../types";

const PRIORITY_FIELDS = [
  "Rating",
  "Current Role",
  "Current Company",
  "Total Experience (Years)",
  "Primary Strength",
  "Profile Summary",
  "Why Shortlisted",
  "Risks / Watch-outs",
  "Phone",
  "Email",
  "LinkedIn"
];

const HEADER_FIELDS = {
  name: "Name",
  rating: "Rating",
  role: "Current Role",
  company: "Current Company"
} as const;

const isObject = (value: JsonValue): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toCandidates = (data: JsonValue): JsonObject[] => {
  if (Array.isArray(data)) {
    return data.filter((item): item is JsonObject => isObject(item));
  }
  if (isObject(data)) return [data];
  return [];
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const prettifyKey = (key: string): string =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeKey = (key: string): string =>
  key.toLowerCase().replace(/[^a-z0-9]/g, "");

const buildKeyIndex = (candidate: JsonObject): Map<string, string> => {
  const index = new Map<string, string>();
  for (const key of Object.keys(candidate)) {
    const normalized = normalizeKey(key);
    if (!index.has(normalized)) index.set(normalized, key);
  }
  return index;
};

const resolveField = (
  candidate: JsonObject,
  index: Map<string, string>,
  canonicalLabel: string
): { actualKey: string; value: JsonValue | undefined } | null => {
  if (canonicalLabel in candidate) {
    return {
      actualKey: canonicalLabel,
      value: candidate[canonicalLabel]
    };
  }

  const matchedKey = index.get(normalizeKey(canonicalLabel));
  if (!matchedKey) return null;
  return {
    actualKey: matchedKey,
    value: candidate[matchedKey]
  };
};

const valueToText = (value: JsonValue | undefined): string => {
  if (value === undefined || value === null || value === "") return "Not provided";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const renderField = (key: string, value: JsonValue | undefined): string => {
  const displayValue = valueToText(value);
  const safeValue = escapeHtml(displayValue);

  if (key === "LinkedIn" && displayValue.startsWith("http")) {
    return `<div class="field"><div class="label">${escapeHtml(prettifyKey(key))}</div><div class="value"><a href="${safeValue}" target="_blank" rel="noreferrer">${safeValue}</a></div></div>`;
  }
  if (key === "Email" && displayValue.includes("@")) {
    return `<div class="field"><div class="label">${escapeHtml(prettifyKey(key))}</div><div class="value"><a href="mailto:${safeValue}">${safeValue}</a></div></div>`;
  }
  if (key === "Phone" && displayValue !== "Not provided") {
    return `<div class="field"><div class="label">${escapeHtml(prettifyKey(key))}</div><div class="value"><a href="tel:${safeValue}">${safeValue}</a></div></div>`;
  }

  return `<div class="field"><div class="label">${escapeHtml(prettifyKey(key))}</div><div class="value">${safeValue}</div></div>`;
};

const renderCandidateCard = (candidate: JsonObject, index: number): string => {
  const keyIndex = buildKeyIndex(candidate);
  const usedKeys = new Set<string>();

  const nameField = resolveField(candidate, keyIndex, HEADER_FIELDS.name);
  const ratingField = resolveField(candidate, keyIndex, HEADER_FIELDS.rating);
  const roleField = resolveField(candidate, keyIndex, HEADER_FIELDS.role);
  const companyField = resolveField(candidate, keyIndex, HEADER_FIELDS.company);

  if (nameField) usedKeys.add(nameField.actualKey);
  if (ratingField) usedKeys.add(ratingField.actualKey);
  if (roleField) usedKeys.add(roleField.actualKey);
  if (companyField) usedKeys.add(companyField.actualKey);

  const name = valueToText(nameField?.value);
  const rating = valueToText(ratingField?.value);
  const role = valueToText(roleField?.value);
  const company = valueToText(companyField?.value);

  const fieldsHtml = PRIORITY_FIELDS.map((field) => {
    const resolved = resolveField(candidate, keyIndex, field);
    if (!resolved) return "";
    usedKeys.add(resolved.actualKey);
    return renderField(field, resolved.value);
  }).join("");

  const remainingFieldsHtml = Object.keys(candidate)
    .filter((key) => !usedKeys.has(key) && candidate[key] !== undefined)
    .map((key) => renderField(key, candidate[key]))
    .join("");

  return `
  <article class="card" data-search="${escapeHtml(
    `${name} ${role} ${company}`.toLowerCase()
  )}">
    <header class="head">
      <div>
        <h2>${escapeHtml(name)}</h2>
        <p>${escapeHtml(role)} | ${escapeHtml(company)}</p>
      </div>
      <div class="badge">Rating ${escapeHtml(rating)}</div>
    </header>
    <div class="field-grid">
      ${fieldsHtml}
      ${remainingFieldsHtml}
    </div>
    <footer class="foot">Candidate ${index + 1}</footer>
  </article>`;
};

const buildHtml = (candidates: JsonObject[], reportTitle: string): string => {
  const cards = candidates.map((c, i) => renderCandidateCard(c, i)).join("\n");
  const generatedAt = new Date().toLocaleString();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(reportTitle)} - Candidate Dossier</title>
  <style>
    :root {
      --bg: #eef3f8;
      --paper: #ffffff;
      --ink: #0f172a;
      --muted: #475569;
      --line: #d9e3ee;
      --accent: #0f766e;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      padding: 18px 12px 28px;
    }
    .wrap {
      width: min(1200px, 100%);
      margin: 0 auto;
    }
    .topbar {
      background: #e7eef8;
      border: 1px solid #ccdae9;
      border-radius: 12px;
      padding: 12px;
      color: #1e293b;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .search {
      flex: 1;
      min-width: 220px;
      border: 1px solid #cbd7e4;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 14px;
      background: #fff;
    }
    .count {
      color: #475569;
      font-size: 12px;
      font-weight: 700;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 10px;
    }
    .card {
      background: var(--paper);
      box-shadow: 0 8px 30px rgba(2, 6, 23, 0.12);
      border: 1px solid #d8e2ec;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      padding: 10px;
      min-height: 340px;
      overflow: hidden;
    }
    .head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      border-bottom: 1px solid var(--line);
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .head h2 {
      margin: 0;
      font-size: 20px;
      line-height: 1.1;
      color: #0b1a33;
    }
    .head p {
      margin: 6px 0 0;
      color: var(--muted);
      font-size: 14px;
    }
    .badge {
      background: #dff6f3;
      border: 1px solid #8ed7cd;
      color: #0f766e;
      border-radius: 999px;
      padding: 6px 10px;
      font-weight: 700;
      font-size: 13px;
      white-space: nowrap;
    }
    .field-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      transform-origin: top left;
    }
    .field {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px 10px;
      background: #fcfdff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .label {
      color: var(--muted);
      font-size: 11px;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      font-weight: 700;
    }
    .value {
      color: #10213e;
      font-size: 14px;
      line-height: 1.35;
      word-wrap: break-word;
      overflow-wrap: anywhere;
    }
    .value a { color: #0c4a8a; text-decoration: none; }
    .foot {
      border-top: 1px solid var(--line);
      padding-top: 8px;
      margin-top: 8px;
      color: #64748b;
      font-size: 11px;
      text-align: right;
    }
    .empty {
      text-align: center;
      color: #64748b;
      padding: 24px 10px;
      border: 1px dashed #cbd5e1;
      border-radius: 10px;
      background: #fff;
    }
    @media (max-width: 850px) {
      .cards {
        grid-template-columns: 1fr;
      }
    }
    @media print {
      @page {
        size: A4;
        margin: 8mm;
      }
      html, body {
        width: 100%;
        height: auto;
      }
      body {
        background: #fff;
        padding: 0;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .wrap {
        width: auto;
        margin: 0;
      }
      .topbar,
      .toolbar {
        display: none;
      }
      .cards {
        display: block;
      }
      .card {
        width: 100%;
        height: calc(297mm - 16mm);
        min-height: calc(297mm - 16mm);
        margin: 0;
        padding: 8mm;
        border: 1px solid #d1dbe7;
        box-shadow: none;
        background: #fff;
        break-inside: avoid;
        page-break-inside: avoid;
        break-after: page;
        page-break-after: always;
      }
      .card:last-child {
        break-after: auto;
        page-break-after: auto;
      }
      .head h2 {
        font-size: 18px;
      }
      .head p {
        font-size: 12px;
      }
      .label {
        font-size: 10px;
      }
      .value {
        font-size: 12px;
        line-height: 1.25;
      }
      .field {
        margin-bottom: 6px;
        padding: 6px 8px;
      }
      .field-grid {
        gap: 6px;
      }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="topbar">
      <div><strong>${escapeHtml(reportTitle)}</strong> | Single window candidate view</div>
      <div>Generated ${escapeHtml(generatedAt)}</div>
    </div>
    <div class="toolbar">
      <input id="searchInput" class="search" placeholder="Search by name, role, or company..." />
      <div id="count" class="count"></div>
    </div>
    <div id="cards" class="cards">
      ${cards}
    </div>
  </div>
  <script>
    const input = document.getElementById("searchInput");
    const cardsHost = document.getElementById("cards");
    const count = document.getElementById("count");
    const cards = Array.from(document.querySelectorAll(".card"));

    function updateCount(visible) {
      count.textContent = visible + " / " + cards.length + " candidate(s)";
    }

    function applyFilter() {
      const query = (input.value || "").toLowerCase().trim();
      let visible = 0;
      cards.forEach((card) => {
        const text = (card.getAttribute("data-search") || "").toLowerCase();
        const show = !query || text.includes(query);
        card.style.display = show ? "" : "none";
        if (show) visible += 1;
      });
      updateCount(visible);

      const existing = document.getElementById("emptyState");
      if (existing) existing.remove();
      if (visible === 0) {
        const div = document.createElement("div");
        div.id = "emptyState";
        div.className = "empty";
        div.textContent = "No candidates match this search.";
        cardsHost.appendChild(div);
      }
    }

    input.addEventListener("input", applyFilter);
    updateCount(cards.length);

    function fitCardForPrint(card) {
      const head = card.querySelector(".head");
      const foot = card.querySelector(".foot");
      const grid = card.querySelector(".field-grid");
      if (!head || !foot || !grid) return;

      grid.style.transform = "scale(1)";
      grid.style.width = "100%";

      const cardStyle = window.getComputedStyle(card);
      const padTop = parseFloat(cardStyle.paddingTop || "0");
      const padBottom = parseFloat(cardStyle.paddingBottom || "0");
      const available = card.clientHeight - head.offsetHeight - foot.offsetHeight - padTop - padBottom - 18;
      const naturalHeight = grid.scrollHeight;
      if (!available || !naturalHeight) return;

      let scale = Math.min(1, available / naturalHeight);
      if (!Number.isFinite(scale) || scale <= 0) scale = 1;
      scale = Math.max(0.62, scale);
      grid.style.transform = "scale(" + scale + ")";
      grid.style.width = (100 / scale) + "%";
    }

    function preparePrintLayout() {
      const printableCards = Array.from(document.querySelectorAll(".card"))
        .filter((card) => card.style.display !== "none");
      printableCards.forEach((card) => fitCardForPrint(card));
    }

    function resetScreenLayout() {
      const allCards = Array.from(document.querySelectorAll(".card"));
      allCards.forEach((card) => {
        const grid = card.querySelector(".field-grid");
        if (!grid) return;
        grid.style.transform = "scale(1)";
        grid.style.width = "100%";
      });
    }

    window.addEventListener("beforeprint", preparePrintLayout);
    window.addEventListener("afterprint", resetScreenLayout);
  </script>
</body>
</html>`;
};

export const openCandidateWebpage = (data: JsonValue, reportTitle: string): void => {
  const candidates = toCandidates(data);
  if (candidates.length === 0) {
    window.alert("No candidate objects found in JSON.");
    return;
  }

  const win = window.open("", "_blank");
  if (!win) {
    window.alert("Pop-up blocked. Please allow pop-ups for this site.");
    return;
  }

  const html = buildHtml(candidates, reportTitle || "Candidate Pages");
  win.document.open();
  win.document.write(html);
  win.document.close();
};
