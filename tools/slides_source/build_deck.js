const path = require("path");
const NM = "C:/Users/osama/AppData/Roaming/npm/node_modules";
const pptxgen = require(path.join(NM, "pptxgenjs"));
const React = require(path.join(NM, "react"));
const ReactDOMServer = require(path.join(NM, "react-dom/server"));
const sharp = require(path.join(NM, "sharp"));
const fa = require(path.join(NM, "react-icons/fa"));

const C = {
  navy: "0B1F33", navy2: "13314B", ice: "C9DBEA", white: "FFFFFF",
  mint: "02C39A", mintDark: "02735E", mintTint: "EAF7F3",
  steel: "1C7293", steelDark: "0F4C63", steelTint: "EEF4F8",
  coral: "E24B4A", coralDark: "9E2B2A", coralTint: "FCEFEE",
  amber: "BA7517", amberTint: "FAF1E0",
  text: "22313F", muted: "5C6B7A", grayTint: "F3F5F7", border: "D8E0E6",
};
const HEAD = "Cambria", BODY = "Calibri";

async function iconPng(Icon, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

const shadow = () => ({ type: "outer", color: "1A2A38", blur: 7, offset: 2, angle: 45, opacity: 0.14 });

(async () => {
  const icons = {};
  const want = {
    shield: [fa.FaShieldAlt, "#02C39A"],
    shieldNavy: [fa.FaShieldAlt, "#0F4C63"],
    book: [fa.FaBookOpen, "#0F4C63"],
    filter: [fa.FaFilter, "#0F4C63"],
    eye: [fa.FaEye, "#02735E"],
    wrench: [fa.FaWrench, "#02735E"],
    server: [fa.FaServer, "#0F4C63"],
    scale: [fa.FaBalanceScale, "#02735E"],
    flag: [fa.FaFlagCheckered, "#0F4C63"],
    trophy: [fa.FaTrophy, "#02C39A"],
    table: [fa.FaTable, "#0F4C63"],
    image: [fa.FaImage, "#0F4C63"],
    sigma: [fa.FaSquareRootAlt, "#0F4C63"],
    fileAlt: [fa.FaRegFileAlt, "#0F4C63"],
    fileEmpty: [fa.FaRegFile, "#0F4C63"],
    warn: [fa.FaExclamationTriangle, "#9E2B2A"],
    warnAmber: [fa.FaExclamationTriangle, "#BA7517"],
    check: [fa.FaCheckCircle, "#02735E"],
    cross: [fa.FaTimesCircle, "#9E2B2A"],
    ghost: [fa.FaGhost, "#0F4C63"],
    stopwatch: [fa.FaStopwatch, "#0F4C63"],
    chart: [fa.FaChartBar, "#0F4C63"],
    ruler: [fa.FaRulerCombined, "#0F4C63"],
    code: [fa.FaCode, "#9E2B2A"],
    robot: [fa.FaRobot, "#02735E"],
    search: [fa.FaSearchPlus, "#0F4C63"],
    scan: [fa.FaFileImage, "#0F4C63"],
    micro: [fa.FaMicrochip, "#0F4C63"],
    microMint: [fa.FaMicrochip, "#02735E"],
    microCoral: [fa.FaMicrochip, "#9E2B2A"],
    bolt: [fa.FaBolt, "#BA7517"],
    lang: [fa.FaLanguage, "#0F4C63"],
    brain: [fa.FaBrain, "#9E2B2A"],
    dice: [fa.FaDice, "#02735E"],
    arrowsAlt: [fa.FaArrowsAltH, "#5C6B7A"],
  };
  for (const [k, [ic, col]] of Object.entries(want)) icons[k] = await iconPng(ic, col);

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Osamah Alsumaitti";
  pres.title = "Arabic Cybersecurity OCR Benchmark";

  const card = (s, x, y, w, h, fill, opts = {}) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w, h, fill: { color: fill }, rectRadius: 0.07,
      line: opts.line || { color: C.border, width: 0.75 },
      shadow: opts.noShadow ? undefined : shadow(),
    });

  const circle = (s, x, y, d, fill) =>
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });

  const iconIn = (s, key, x, y, d, tint) => {
    circle(s, x, y, d, tint);
    const pad = d * 0.26;
    s.addImage({ data: icons[key], x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad });
  };

  const title = (s, t, sub) => {
    s.addText(t, { x: 0.5, y: 0.32, w: 9.0, h: 0.62, fontFace: HEAD, fontSize: 30,
      bold: true, color: C.navy, margin: 0 });
    if (sub) s.addText(sub, { x: 0.5, y: 0.9, w: 9.0, h: 0.32, fontFace: BODY, fontSize: 13,
      color: C.muted, margin: 0 });
  };

  // ============ S1 — TITLE ============
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    iconIn(s, "shield", 0.55, 0.55, 0.62, C.navy2);
    s.addText("ARABIC CYBERSECURITY OCR BENCHMARK  ·  KITAB-BENCH METHODOLOGY", {
      x: 0.55, y: 1.42, w: 8.9, h: 0.3, fontFace: BODY, fontSize: 12.5, color: C.mint,
      charSpacing: 3, bold: true, margin: 0 });
    s.addText("Choosing the best Arabic OCR model", {
      x: 0.55, y: 1.8, w: 8.9, h: 0.66, fontFace: HEAD, fontSize: 32, bold: true,
      color: C.white, margin: 0 });
    s.addText("The full journey — from sampling 46 cybersecurity books to a statistically justified winner",
      { x: 0.55, y: 2.58, w: 8.4, h: 0.4, fontFace: BODY, fontSize: 15, color: C.ice, margin: 0 });
    const chips = [["46", "books"], ["276", "curated pages"], ["4", "models on H200"], ["6", "metric axes"]];
    chips.forEach(([n, l], i) => {
      const x = 0.55 + i * 2.32;
      card(s, x, 3.55, 2.12, 1.05, C.navy2, { line: { color: "1E4260", width: 0.75 }, noShadow: true });
      s.addText(n, { x, y: 3.68, w: 2.12, h: 0.5, align: "center", fontFace: HEAD,
        fontSize: 28, bold: true, color: C.mint, margin: 0 });
      s.addText(l, { x, y: 4.18, w: 2.12, h: 0.3, align: "center", fontFace: BODY,
        fontSize: 12, color: C.ice, margin: 0 });
    });
    s.addText("Osamah Alsumaitti   ·   Panther server, NVIDIA H200   ·   July 2026", {
      x: 0.55, y: 5.05, w: 8.9, h: 0.3, fontFace: BODY, fontSize: 12, color: "7E97AC", margin: 0 });
  }

  // ============ S2 — THE CHALLENGE ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "The challenge", "One library, thousands of pages, four candidate engines — and no Arabic benchmark that fits");
    const bullets = [
      ["A growing Arabic cybersecurity library needs reliable text extraction — body text, tables, code and figures.", 0],
      ["Scoring OCR on all 5,434 pages is wasteful: most pages repeat the same layout and add no signal.", 0],
      ["Public Arabic benchmarks (KITAB-Bench) show performance collapses unevenly by content type — so the test set must exercise every type.", 0],
      ["Decision needed: which of four locally-hosted vision-language models becomes the production OCR engine?", 0],
    ];
    s.addText(bullets.map(([t], i) => ({
      text: t, options: { bullet: { code: "2022", indent: 14 }, breakLine: true,
        paraSpaceAfter: 12, color: C.text, fontSize: 14.5, fontFace: BODY } })),
      { x: 0.5, y: 1.45, w: 5.15, h: 3.6, valign: "top" });
    const cards = [
      ["46", "books  ·  0.pdf … 45.pdf"], ["5,434", "total pages in corpus"],
      ["44 + 2", "born-digital + scanned"], ["276", "pages sampled (6 / book)"]];
    cards.forEach(([n, l], i) => {
      const x = 6.0 + (i % 2) * 1.8, y = 1.5 + Math.floor(i / 2) * 1.62;
      card(s, x, y, 1.68, 1.4, i === 3 ? C.mintTint : C.grayTint, { noShadow: false });
      s.addText(n, { x, y: y + 0.18, w: 1.68, h: 0.55, align: "center", fontFace: HEAD,
        fontSize: 24, bold: true, color: i === 3 ? C.mintDark : C.navy, margin: 0 });
      s.addText(l, { x: x + 0.08, y: y + 0.76, w: 1.52, h: 0.55, align: "center",
        fontFace: BODY, fontSize: 10.5, color: C.muted, margin: 0 });
    });
    s.addText("Deliverable: a compact, hand-verifiable benchmark + a full multi-axis evaluation in the spirit of KITAB-Bench.",
      { x: 0.5, y: 4.95, w: 9.0, h: 0.35, fontFace: BODY, italic: true, fontSize: 13, color: C.steelDark, margin: 0 });
  }

  // ============ S3 — THE JOURNEY ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "The journey in five stages");
    const steps = [
      ["filter", "1 · Sample", "Distil every book to its 6 most informative pages"],
      ["wrench", "2 · Ground truth", "Repair broken text layers, human-review 270 pages"],
      ["server", "3 · Inference", "Run 4 VLMs over all 276 pages on the H200"],
      ["scale", "4 · Score", "6 KITAB-style metric axes, page-aligned"],
      ["flag", "5 · Decide", "Win rates + paired bootstrap pick the winner"],
    ];
    const w = 1.76, gap = 0.05;
    steps.forEach(([ic, h, d], i) => {
      const x = 0.5 + i * (w + gap + 0.045);
      card(s, x, 1.6, w, 2.9, i === 4 ? C.mintTint : C.grayTint);
      iconIn(s, ic, x + w / 2 - 0.33, 1.88, 0.66, C.white);
      s.addText(h, { x: x + 0.06, y: 2.72, w: w - 0.12, h: 0.34, align: "center",
        fontFace: HEAD, fontSize: 14.5, bold: true, color: C.navy, margin: 0 });
      s.addText(d, { x: x + 0.1, y: 3.1, w: w - 0.2, h: 1.25, align: "center",
        fontFace: BODY, fontSize: 11, color: C.muted, margin: 0, valign: "top" });
    });
    s.addText("Stages 1–2 built the benchmark  ·  stage 3 ran on the GPU server  ·  stages 4–5 ran locally, fully reproducible from kitab_eval.py",
      { x: 0.5, y: 4.85, w: 9.0, h: 0.35, align: "center", fontFace: BODY, italic: true,
        fontSize: 12.5, color: C.muted, margin: 0 });
  }

  // ============ S4 — STAGE 1: SAMPLING ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Stage 1 — building the 276-page sample", "Heuristics propose, a multimodal judge verifies: geometry lies, vision settles it");
    const flow = [
      ["search", "Programmatic features", "Char density, find_tables(), raster coverage, math glyphs, ink pixels — over every page", C.steelTint],
      ["eye", "LLM-as-judge (Claude Opus 4.8)", "Looks at the rendered page image and confirms, rejects or relabels each candidate", C.mintTint],
      ["book", "6 pages per book", "Special types seeded first, then max-spread body text across chapters", C.grayTint],
    ];
    flow.forEach(([ic, h, d, tint], i) => {
      const x = 0.5 + i * 3.2;
      card(s, x, 1.5, 2.9, 1.72, tint);
      iconIn(s, ic, x + 0.16, 1.66, 0.52, C.white);
      s.addText(h, { x: x + 0.78, y: 1.62, w: 2.05, h: 0.62, fontFace: HEAD, fontSize: 12.5,
        bold: true, color: C.navy, margin: 0, valign: "middle" });
      s.addText(d, { x: x + 0.16, y: 2.28, w: 2.6, h: 0.88, fontFace: BODY, fontSize: 10.5,
        color: C.muted, margin: 0, valign: "top" });
      if (i < 2) s.addImage({ data: icons.arrowsAlt, x: x + 2.94, y: 2.2, w: 0.24, h: 0.24 });
    });
    s.addText("Content taxonomy — what the 276 pages exercise", {
      x: 0.5, y: 3.45, w: 9.0, h: 0.3, fontFace: HEAD, fontSize: 14, bold: true, color: C.navy, margin: 0 });
    const tax = [
      ["fileAlt", "208", "text pages", "core Arabic accuracy"],
      ["image", "33", "figures", "diagrams, screenshots"],
      ["table", "25", "tables", "row/column structure"],
      ["fileEmpty", "6", "empty", "hallucination probes"],
      ["sigma", "4", "formulas", "crypto equations"],
    ];
    tax.forEach(([ic, n, l, d], i) => {
      const x = 0.5 + i * 1.86;
      card(s, x, 3.85, 1.72, 1.35, C.grayTint, { noShadow: true });
      s.addImage({ data: icons[ic], x: x + 0.14, y: 4.0, w: 0.3, h: 0.3 });
      s.addText(n, { x: x + 0.5, y: 3.94, w: 1.1, h: 0.42, fontFace: HEAD, fontSize: 21,
        bold: true, color: C.navy, margin: 0 });
      s.addText(l, { x: x + 0.14, y: 4.42, w: 1.5, h: 0.26, fontFace: BODY, fontSize: 11.5,
        bold: true, color: C.steelDark, margin: 0 });
      s.addText(d, { x: x + 0.14, y: 4.68, w: 1.5, h: 0.42, fontFace: BODY, fontSize: 9.5,
        color: C.muted, margin: 0 });
    });
    s.addText("Rules: first/last 12% of every book trimmed (covers, ToC, indexes) · no page reused · label only when features AND judge agree",
      { x: 0.5, y: 5.28, w: 9.0, h: 0.3, fontFace: BODY, italic: true, fontSize: 11, color: C.muted, margin: 0 });
  }

  // ============ S5 — WHAT THE JUDGE CAUGHT ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Why vision adjudication mattered", "In security books, page geometry lies — the judge overturned dozens of feature-based guesses");
    const rows = [
      ["code", "Fake formulas", "Terminal ==== separators, SQL injection (OR 1=1), chmod arithmetic and code all matched the math heuristics. Only 4 books survived with genuine cryptographic equations."],
      ["table", "Fake tables", "Flowcharts, pie/bar charts, decorative page borders and hex dumps triggered the line-counter. Only real ruled grids were kept — plus one raster table the detector had missed."],
      ["image", "Weak figure pages", "Text-heavy banner pages were swapped for cleaner figure-dominated pages, so the image axis really tests figures."],
      ["fileEmpty", "False empties", "Chapter dividers with visible titles were excluded — an empty page must be truly blank to serve as a hallucination probe."],
    ];
    rows.forEach(([ic, h, d], i) => {
      const y = 1.5 + i * 0.98;
      card(s, 0.5, y, 6.1, 0.86, i % 2 ? C.grayTint : C.steelTint, { noShadow: true });
      iconIn(s, ic, 0.64, y + 0.17, 0.52, C.white);
      s.addText(h, { x: 1.32, y: y + 0.08, w: 1.55, h: 0.7, fontFace: HEAD, fontSize: 12.5,
        bold: true, color: C.navy, margin: 0, valign: "middle" });
      s.addText(d, { x: 2.92, y: y + 0.07, w: 3.58, h: 0.74, fontFace: BODY, fontSize: 9.8,
        color: C.text, margin: 0, valign: "middle" });
    });
    card(s, 6.85, 1.5, 2.65, 3.86, C.mintTint);
    iconIn(s, "robot", 7.85, 1.78, 0.66, C.white);
    s.addText("Judge model", { x: 6.85, y: 2.56, w: 2.65, h: 0.3, align: "center",
      fontFace: BODY, fontSize: 11, color: C.mintDark, margin: 0 });
    s.addText("Claude Opus 4.8", { x: 6.85, y: 2.84, w: 2.65, h: 0.35, align: "center",
      fontFace: HEAD, fontSize: 15, bold: true, color: C.navy, margin: 0 });
    s.addText("Vision used only to verify shortlists — never to generate labels blindly. Classic propose-then-judge pattern.",
      { x: 7.03, y: 3.3, w: 2.3, h: 1.9, align: "center", fontFace: BODY, fontSize: 10.5,
        color: C.mintDark, margin: 0, valign: "top" });
  }

  // ============ S6 — STAGE 2: GROUND TRUTH ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Stage 2 — the ground truth (full honesty)", "Opus 4.8 transcribed the pages; a light human review, then accepted");
    const rows = [
      ["Who wrote it", "Claude Opus 4.8 transcribed each rendered page — the same strong model used as the sampling judge"],
      ["The review", "A light human pass, then accepted — not a line-by-line validation of all 276 pages"],
      ["The honest reason", "No time to hand-write or rigorously proofread 276 pages under the deadline"],
      ["Why not a raw dump", "PDF text layers were genuinely broken (reversed ligatures, kashida bytes, fused words, scans) — so a model transcription was used instead"],
    ];
    const colX = [0.5, 2.75], colW = [2.15, 6.75];
    rows.forEach(([a, b], i) => {
      const y = 1.6 + i * 0.72;
      card(s, 0.5, y, 9.0, 0.62, i % 2 ? C.grayTint : C.white, { noShadow: true,
        line: { color: C.border, width: 0.5 } });
      s.addText(a, { x: colX[0] + 0.12, y, w: colW[0], h: 0.62, fontFace: BODY, fontSize: 11.5,
        bold: true, color: C.navy, margin: 0, valign: "middle" });
      s.addText(b, { x: colX[1], y, w: colW[1] - 0.12, h: 0.62, fontFace: BODY, fontSize: 10.5,
        color: C.text, margin: 0, valign: "middle" });
    });
    card(s, 0.5, 4.65, 9.0, 0.7, C.amberTint, { noShadow: true });
    s.addText([{ text: "Stated openly:  ", options: { bold: true, fontSize: 13, color: C.amber } },
      { text: "the scores measure agreement with a strong-model reference, not a gold human transcription — the study's biggest validity caveat.",
        options: { fontSize: 12, color: C.text } }],
      { x: 0.7, y: 4.65, w: 8.6, h: 0.7, fontFace: BODY, margin: 0, valign: "middle" });
  }

  // ============ S7 — THE CONTENDERS ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Stage 3 — four contenders, one exam", "Same 276 pages, same pipeline (320 DPI renders, 4,096-token cap), all on the H200");
    const models = [
      ["ain", "micro", "Arabic-centric VLM", "14.7", "1.2 h", "The sprinter — fastest by far", C.grayTint],
      ["gemma4_26b", "micro", "General VLM · 26B", "39.7", "3.1 h", "The efficient all-rounder", C.steelTint],
      ["gemma4_31b", "microMint", "General VLM · 31B", "42.1", "3.3 h", "The heavyweight favourite", C.mintTint],
      ["qwen36", "microCoral", "Reasoning VLM · 36B", "124.8", "9.6 h", "The thinker — 3× slower", C.coralTint],
    ];
    models.forEach(([name, ic, kind, sec, gpu, tag, tint], i) => {
      const x = 0.5 + i * 2.34, w = 2.18;
      card(s, x, 1.55, w, 3.3, tint);
      iconIn(s, ic, x + w / 2 - 0.31, 1.78, 0.62, C.white);
      s.addText(name, { x, y: 2.5, w, h: 0.35, align: "center", fontFace: HEAD,
        fontSize: 16, bold: true, color: C.navy, margin: 0 });
      s.addText(kind, { x, y: 2.86, w, h: 0.28, align: "center", fontFace: BODY,
        fontSize: 10.5, color: C.muted, margin: 0 });
      s.addText([{ text: sec, options: { bold: true, fontSize: 17, color: C.navy, breakLine: true } },
        { text: "sec / page", options: { fontSize: 9.5, color: C.muted } }],
        { x, y: 3.24, w: w / 2 + 0.1, h: 0.75, align: "center", fontFace: BODY, margin: 0 });
      s.addText([{ text: gpu, options: { bold: true, fontSize: 17, color: C.navy, breakLine: true } },
        { text: "total GPU", options: { fontSize: 9.5, color: C.muted } }],
        { x: x + w / 2 - 0.1, y: 3.24, w: w / 2 + 0.1, h: 0.75, align: "center", fontFace: BODY, margin: 0 });
      s.addText(tag, { x: x + 0.08, y: 4.1, w: w - 0.16, h: 0.6, align: "center",
        fontFace: BODY, italic: true, fontSize: 10.5, color: C.steelDark, margin: 0, valign: "top" });
    });
    s.addText("Outputs: one text file per book with === Page N === markers — alignment validated 276/276 clean for every model.",
      { x: 0.5, y: 5.1, w: 9.0, h: 0.3, align: "center", fontFace: BODY, italic: true,
        fontSize: 12, color: C.muted, margin: 0 });
  }

  // ============ S8 — SCORING METHODOLOGY ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Stage 4 — scoring the KITAB-Bench way", "Every applicable KITAB axis, mapped onto a plain-text ground truth");
    const axes = [
      ["lang", "Accuracy — CER / WER", "Strict + Arabic-normalized (diacritics, alef/taa/ya, digits) — same rules as score_ocr.py"],
      ["ruler", "Similarity — chrF", "Character 1–6-gram F-score (MARS family); robust against long insertions"],
      ["table", "Tables — cell F1", "TEDS approximation: markdown cells matched as multisets"],
      ["ghost", "Hallucination probes", "Blank pages: any non-empty output counts as a failure"],
      ["scan", "Robustness", "Scanned/degraded books 17, 37, 39 scored as a separate sub-benchmark"],
      ["stopwatch", "Efficiency", "Seconds per page on the H200, from the actual run stats"],
    ];
    axes.forEach(([ic, h, d], i) => {
      const x = 0.5 + (i % 3) * 3.2, y = 1.5 + Math.floor(i / 3) * 1.62;
      card(s, x, y, 2.9, 1.44, C.grayTint);
      iconIn(s, ic, x + 0.14, y + 0.14, 0.5, C.white);
      s.addText(h, { x: x + 0.74, y: y + 0.1, w: 2.1, h: 0.58, fontFace: HEAD, fontSize: 12,
        bold: true, color: C.navy, margin: 0, valign: "middle" });
      s.addText(d, { x: x + 0.14, y: y + 0.72, w: 2.62, h: 0.66, fontFace: BODY, fontSize: 9.8,
        color: C.muted, margin: 0, valign: "top" });
    });
    card(s, 0.5, 4.85, 9.0, 0.58, C.mintTint, { noShadow: true });
    s.addText([
      { text: "Beyond KITAB (paired design):  ", options: { bold: true, color: C.mintDark } },
      { text: "page-level win-rate matrix across all models  +  10,000-resample paired bootstrap between the top two",
        options: { color: C.text } }],
      { x: 0.68, y: 4.85, w: 8.7, h: 0.58, fontFace: BODY, fontSize: 12, margin: 0, valign: "middle" });
  }

  // ============ S9 — CRITICAL FINDING (dark) ============
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    s.addText("A CRITICAL FINDING BEFORE ANY SCORE WAS TRUSTED", { x: 0.55, y: 0.5, w: 8.9, h: 0.3,
      fontFace: BODY, fontSize: 12.5, color: C.coral, charSpacing: 3, bold: true, margin: 0 });
    s.addText("qwen36 leaked its chain-of-thought into the OCR output", {
      x: 0.55, y: 0.85, w: 8.9, h: 0.6, fontFace: HEAD, fontSize: 26, bold: true, color: C.white, margin: 0 });
    card(s, 0.55, 1.7, 5.3, 1.5, C.navy2, { line: { color: "1E4260", width: 0.75 }, noShadow: true });
    s.addText("“The user wants the text from the image transcribed exactly.\n1. **Header:** … 2. **First Section (Bullet points):** …”",
      { x: 0.75, y: 1.82, w: 4.9, h: 1.05, fontFace: "Courier New", fontSize: 11.5,
        color: C.ice, margin: 0, valign: "top" });
    s.addText("— actual page output, before any transcription", { x: 0.75, y: 2.88, w: 4.9, h: 0.26,
      fontFace: BODY, italic: true, fontSize: 10, color: "7E97AC", margin: 0 });
    const stats = [
      ["216 / 276", "pages contained a closing </think> tag"],
      ["60 pages", "hit the 4,096-token cap mid-reasoning — zero final text"],
      ["1,756 chars", "fabricated on a truly blank page"]];
    stats.forEach(([n, l], i) => {
      const y = 1.7 + i * 0.93;
      card(s, 6.1, y, 3.35, 0.82, C.navy2, { line: { color: "1E4260", width: 0.75 }, noShadow: true });
      s.addText(n, { x: 6.28, y: y + 0.07, w: 3.0, h: 0.38, fontFace: HEAD, fontSize: 16,
        bold: true, color: C.coral, margin: 0 });
      s.addText(l, { x: 6.28, y: y + 0.44, w: 3.05, h: 0.34, fontFace: BODY, fontSize: 9.8,
        color: C.ice, margin: 0 });
    });
    s.addText([
      { text: "The fair, KITAB-minded response: score two variants. ", options: { bold: true, color: C.white } },
      { text: "qwen36 raw (deployment reality) and qwen36_clean — text after the last </think>, the theoretical best case after perfect post-cleaning.",
        options: { color: C.ice } }],
      { x: 0.55, y: 3.35, w: 5.3, h: 1.05, fontFace: BODY, fontSize: 12, margin: 0, valign: "top" });
    card(s, 0.55, 4.58, 8.9, 0.62, "16324A", { line: { color: "1E4260", width: 0.75 }, noShadow: true });
    s.addText("Verdict preview: even the cleaned variant lands at 45% CER on core text — the leak was not the only problem.",
      { x: 0.75, y: 4.58, w: 8.5, h: 0.62, fontFace: BODY, italic: true, fontSize: 12.5,
        color: C.mint, margin: 0, valign: "middle" });
  }

  // ============ S10 — HEADLINE RESULTS ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Headline results — core Arabic body text", "208 text pages · Arabic-normalized character error rate, clipped at 100% (lower is better)");
    s.addChart(pres.charts.BAR, [{
      name: "Core-text CER %",
      labels: ["gemma4_31b", "gemma4_26b", "ain", "qwen36_clean", "qwen36 raw"],
      values: [16.3, 16.9, 44.3, 45.0, 99.8],
    }], {
      x: 0.4, y: 1.5, w: 5.9, h: 3.6, barDir: "col",
      chartColors: ["02C39A", "1C7293", "8FA6B5", "D98B6A", "E24B4A"],
      chartColorsOpacity: 100, varyColors: true,
      chartArea: { fill: { color: "FFFFFF" } },
      catAxisLabelColor: "5C6B7A", catAxisLabelFontSize: 10.5,
      valAxisLabelColor: "5C6B7A", valAxisLabelFontSize: 10,
      valAxisMaxVal: 100, valAxisMinVal: 0,
      valGridLine: { color: "E4EAEE", size: 0.5 }, catGridLine: { style: "none" },
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: "22313F",
      dataLabelFontSize: 11, dataLabelFontBold: true,
      showLegend: false, showTitle: false,
    });
    card(s, 6.55, 1.5, 2.95, 2.42, C.mintTint);
    s.addImage({ data: icons.trophy, x: 7.78, y: 1.68, w: 0.5, h: 0.5 });
    s.addText("gemma4_31b", { x: 6.55, y: 2.24, w: 2.95, h: 0.4, align: "center",
      fontFace: HEAD, fontSize: 19, bold: true, color: C.navy, margin: 0 });
    s.addText([
      { text: "16.3% CER  ·  89.3% chrF", options: { bold: true, fontSize: 13, color: C.mintDark, breakLine: true } },
      { text: "median page: 5.9% CER", options: { fontSize: 12, color: C.text, breakLine: true } },
      { text: "→ typical page is near-clean", options: { italic: true, fontSize: 11, color: C.muted } }],
      { x: 6.65, y: 2.72, w: 2.75, h: 1.1, align: "center", fontFace: BODY, margin: 0, valign: "top" });
    card(s, 6.55, 4.1, 2.95, 1.0, C.grayTint, { noShadow: true });
    s.addText("ain flattens everything to prose; qwen fails even after cleaning. Only the two Gemmas are in the race.",
      { x: 6.72, y: 4.1, w: 2.62, h: 1.0, fontFace: BODY, fontSize: 10.5, color: C.text,
        margin: 0, valign: "middle" });
  }

  // ============ S11 — TABLES DECIDE ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Tables broke the tie", "Cybersecurity books live on tables — ports, commands, tool matrices. KITAB flags tables as the Achilles' heel of Arabic OCR");
    s.addChart(pres.charts.BAR, [{
      name: "Table cell-F1 %",
      labels: ["gemma4_31b", "gemma4_26b", "qwen36 raw", "qwen36_clean", "ain"],
      values: [69.3, 52.1, 2.3, 0.5, 0.0],
    }], {
      x: 0.4, y: 1.65, w: 5.4, h: 3.3, barDir: "bar",
      chartColors: ["02C39A", "1C7293", "E24B4A", "D98B6A", "8FA6B5"],
      varyColors: true,
      chartArea: { fill: { color: "FFFFFF" } },
      catAxisLabelColor: "5C6B7A", catAxisLabelFontSize: 11,
      valAxisLabelColor: "5C6B7A", valAxisLabelFontSize: 10,
      valAxisMaxVal: 80, valAxisMinVal: 0,
      valGridLine: { color: "E4EAEE", size: 0.5 }, catGridLine: { style: "none" },
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: "22313F",
      dataLabelFontSize: 11, dataLabelFontBold: true,
      showLegend: false, showTitle: false,
    });
    card(s, 6.2, 1.65, 3.3, 1.9, C.mintTint);
    s.addText("Head-to-head on 22 scoreable tables", { x: 6.38, y: 1.8, w: 3.0, h: 0.3,
      fontFace: HEAD, fontSize: 13, bold: true, color: C.navy, margin: 0 });
    const h2h = [["gemma4_31b wins", "11", C.mintDark, true], ["gemma4_26b wins", "4", C.steelDark, false],
      ["ties", "7", C.muted, false]];
    h2h.forEach(([l, v, col, b], i) => {
      const y = 2.2 + i * 0.42;
      s.addText(l, { x: 6.38, y, w: 2.2, h: 0.38, fontFace: BODY, fontSize: 13, bold: b,
        color: col, margin: 0, valign: "middle" });
      s.addText(v, { x: 8.6, y, w: 0.7, h: 0.38, align: "right", fontFace: HEAD, fontSize: 16,
        bold: true, color: col, margin: 0, valign: "middle" });
    });
    card(s, 6.2, 3.75, 3.3, 1.4, C.grayTint, { noShadow: true });
    s.addText([
      { text: "+17 points of structure. ", options: { bold: true, color: C.navy } },
      { text: "ain reads table content but emits zero row/column structure — unusable for knowledge extraction.",
        options: { color: C.text } }],
      { x: 6.38, y: 3.75, w: 2.95, h: 1.4, fontFace: BODY, fontSize: 11, margin: 0, valign: "middle" });
  }

  // ============ S12 — ROBUSTNESS & HALLUCINATION ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "Stress tests — scans and blank pages");
    s.addText("Scanned / degraded books (17, 37, 39)", { x: 0.5, y: 1.3, w: 4.5, h: 0.3,
      fontFace: HEAD, fontSize: 14.5, bold: true, color: C.navy, margin: 0 });
    const scanRows = [
      ["gemma4_26b", "11.9% CER — steady on every page", "check"],
      ["gemma4_31b", "8.9% CER excluding one loop page (39_p4) — fixable in decoding", "check"],
      ["qwen36_clean", "32.6% CER, plus 4 pages lost to truncation", "warnAmber"],
      ["ain", "collapse: repetition loops up to 15× page length", "cross"],
    ];
    scanRows.forEach(([m, d, ic], i) => {
      const y = 1.72 + i * 0.86;
      card(s, 0.5, y, 4.55, 0.74, i % 2 ? C.grayTint : C.steelTint, { noShadow: true });
      s.addImage({ data: icons[ic], x: 0.66, y: y + 0.23, w: 0.28, h: 0.28 });
      s.addText([{ text: m, options: { bold: true, fontSize: 11.5, color: C.navy, breakLine: true } },
        { text: d, options: { fontSize: 9.8, color: C.text } }],
        { x: 1.08, y: y + 0.05, w: 3.85, h: 0.65, fontFace: BODY, margin: 0, valign: "middle" });
    });
    s.addText("Blank-page hallucination probes", { x: 5.45, y: 1.3, w: 4.05, h: 0.3,
      fontFace: HEAD, fontSize: 14.5, bold: true, color: C.navy, margin: 0 });
    const hallRows = [
      ["ain", "outputs nothing — 0 characters. Perfect discipline.", "check", C.mintTint],
      ["gemma (both)", "≈ 75-char English note: “the page is blank”. Cosmetic — one regex removes it.", "warnAmber", C.grayTint],
      ["qwen36", "1,756 fabricated characters. Genuine hallucination.", "cross", C.coralTint],
    ];
    hallRows.forEach(([m, d, ic, tint], i) => {
      const y = 1.72 + i * 1.16;
      card(s, 5.45, y, 4.05, 1.02, tint, { noShadow: true });
      s.addImage({ data: icons[ic], x: 5.61, y: y + 0.37, w: 0.28, h: 0.28 });
      s.addText([{ text: m, options: { bold: true, fontSize: 11.5, color: C.navy, breakLine: true } },
        { text: d, options: { fontSize: 10, color: C.text } }],
        { x: 6.03, y: y + 0.08, w: 3.3, h: 0.88, fontFace: BODY, margin: 0, valign: "middle" });
    });
    s.addText("Only the Gemma pair is dependable on scanned input — and their blank-page behaviour is a filterable formality, not fabrication.",
      { x: 0.5, y: 5.18, w: 9.0, h: 0.3, fontFace: BODY, italic: true, fontSize: 12, color: C.steelDark, margin: 0 });
  }

  // ============ S13 — THE DECISION ============
  {
    const s = pres.addSlide();
    s.background = { color: C.white };
    title(s, "The decision", "Paired bootstrap, 10,000 resamples: the two Gemmas are inseparable on raw accuracy — tie-breakers decide");
    card(s, 0.5, 1.45, 4.4, 1.5, C.steelTint);
    iconIn(s, "dice", 0.68, 1.63, 0.52, C.white);
    s.addText([
      { text: "CER gap (core text): +0.6% for 31b", options: { bold: true, fontSize: 13, color: C.navy, breakLine: true } },
      { text: "95% CI [−0.8%, +2.1%] — crosses zero", options: { fontSize: 12, color: C.text, breakLine: true } },
      { text: "→ statistical tie. Accuracy alone cannot decide.", options: { italic: true, fontSize: 12, color: C.steelDark } }],
      { x: 1.36, y: 1.58, w: 3.4, h: 1.3, fontFace: BODY, margin: 0, valign: "top" });
    card(s, 0.5, 3.15, 4.4, 2.05, C.grayTint, { noShadow: true });
    s.addText("So every remaining axis was compared — and all but one lean the same way.",
      { x: 0.68, y: 3.3, w: 4.05, h: 0.75, fontFace: BODY, fontSize: 12.5, color: C.text, margin: 0 });
    s.addText("The only axis 26b wins is speed — by 6%. For a knowledge-extraction pipeline, table structure is worth far more than 2.4 seconds per page.",
      { x: 0.68, y: 4.1, w: 4.05, h: 0.95, fontFace: BODY, italic: true, fontSize: 12, color: C.steelDark, margin: 0 });
    const tbl = [
      ["Tie-breaker", "gemma4_31b", "gemma4_26b"],
      ["Page win rate", "51.5%", "37.6%"],
      ["Table cell-F1", "69.3%", "52.1%"],
      ["chrF (all pages)", "83.7%", "82.8%"],
      ["Core-text WER", "19.4%", "20.9%"],
      ["Median CER", "5.9%", "6.6%"],
      ["Speed (s/page)", "42.1", "39.7"],
    ];
    const rowsT = tbl.map((r, ri) => r.map((cell, ci) => ({
      text: cell,
      options: {
        bold: ri === 0 || (ci === 1 && ri < 6),
        color: ri === 0 ? C.white : ci === 1 ? (ri < 6 ? C.mintDark : C.text) : ci === 2 && ri === 6 ? C.mintDark : C.text,
        fill: { color: ri === 0 ? C.steelDark : ri % 2 ? C.grayTint : "FFFFFF" },
        align: ci === 0 ? "left" : "center",
        fontFace: BODY, fontSize: 11.5, valign: "middle",
      },
    })));
    s.addTable(rowsT, { x: 5.3, y: 1.45, w: 4.2, colW: [1.8, 1.2, 1.2],
      rowH: 0.53, border: { pt: 0.5, color: C.border } });
  }

  // ============ S14 — WINNER (dark) ============
  {
    const s = pres.addSlide();
    s.background = { color: C.navy };
    s.addImage({ data: icons.trophy, x: 0.55, y: 0.55, w: 0.6, h: 0.6 });
    s.addText("THE PRODUCTION PICK", { x: 1.35, y: 0.55, w: 8.0, h: 0.3, fontFace: BODY,
      fontSize: 12.5, color: C.mint, charSpacing: 3, bold: true, margin: 0 });
    s.addText("gemma4_31b", { x: 1.35, y: 0.82, w: 8.0, h: 0.75, fontFace: HEAD,
      fontSize: 40, bold: true, color: C.white, margin: 0 });
    const why = [
      ["Best where it counts", "Top CER, WER and chrF on the body text that is 75% of the corpus — median page near-clean at 5.9%."],
      ["Decisive on tables", "+17 points cell-F1 and an 11–4 head-to-head — the axis KITAB calls the hardest for Arabic."],
      ["Benign failure modes", "4 loop pages and a filterable blank-page note — vs reasoning leaks, truncation and collapse elsewhere."],
    ];
    why.forEach(([h, d], i) => {
      const x = 0.55 + i * 3.05;
      card(s, x, 1.85, 2.85, 1.62, C.navy2, { line: { color: "1E4260", width: 0.75 }, noShadow: true });
      s.addText(h, { x: x + 0.16, y: 1.98, w: 2.55, h: 0.32, fontFace: HEAD, fontSize: 13.5,
        bold: true, color: C.mint, margin: 0 });
      s.addText(d, { x: x + 0.16, y: 2.34, w: 2.55, h: 1.05, fontFace: BODY, fontSize: 10.8,
        color: C.ice, margin: 0, valign: "top" });
    });
    s.addText("Production roadmap", { x: 0.55, y: 3.7, w: 8.9, h: 0.3, fontFace: HEAD,
      fontSize: 14.5, bold: true, color: C.white, margin: 0 });
    const road = [
      "Repetition penalty 1.1–1.3 + length-ratio guard — kills the loop pages",
      "Regex post-filter for English meta-notes on blank pages",
      "Full 5,434-page archive run ≈ 64 GPU-hours on the H200",
    ];
    road.forEach((t, i) => {
      const x = 0.55 + i * 3.05;
      card(s, x, 4.05, 2.85, 0.98, "16324A", { line: { color: "1E4260", width: 0.75 }, noShadow: true });
      s.addText(String(i + 1), { x: x + 0.14, y: 4.32, w: 0.4, h: 0.45, fontFace: HEAD,
        fontSize: 21, bold: true, color: C.mint, margin: 0 });
      s.addText(t, { x: x + 0.56, y: 4.13, w: 2.2, h: 0.84, fontFace: BODY, fontSize: 10.3,
        color: C.ice, margin: 0, valign: "middle" });
    });
    s.addText("Everything reproducible: kitab_eval.py  ·  per_page_scores.csv  ·  model_summary.json  ·  BENCHMARK_README.md",
      { x: 0.55, y: 5.2, w: 8.9, h: 0.3, fontFace: BODY, fontSize: 11, color: "7E97AC", margin: 0 });
  }

  await pres.writeFile({ fileName: "C:/Users/osama/Downloads/benchmark_samples/OCR_Benchmark_Report.pptx" });
  console.log("done");
})().catch(e => { console.error(e); process.exit(1); });
