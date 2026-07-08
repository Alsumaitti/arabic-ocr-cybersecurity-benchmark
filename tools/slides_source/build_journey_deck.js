const path = require("path");
const NM = "C:/Users/osama/AppData/Roaming/npm/node_modules";
const pptxgen = require(path.join(NM, "pptxgenjs"));
const React = require(path.join(NM, "react"));
const RDS = require(path.join(NM, "react-dom/server"));
const sharp = require(path.join(NM, "sharp"));
const fa = require(path.join(NM, "react-icons/fa"));

const C = {
  navy: "0B1F33", navy2: "13314B", navyLine: "1E4260", ice: "C9DBEA", white: "FFFFFF",
  mint: "02C39A", mintDark: "02735E", mintTint: "EAF7F3",
  steel: "1C7293", steelDark: "0F4C63", steelTint: "EEF4F8",
  coral: "E24B4A", coralDark: "9E2B2A", coralTint: "FCEFEE",
  amber: "BA7517", amberTint: "FAF1E0",
  text: "22313F", muted: "5C6B7A", grayTint: "F3F5F7", border: "D8E0E6",
};
const HEAD = "Cambria", BODY = "Calibri", MONO = "Courier New";
const shadow = () => ({ type: "outer", color: "1A2A38", blur: 7, offset: 2, angle: 45, opacity: 0.14 });

async function iconPng(Icon, color) {
  const svg = RDS.renderToStaticMarkup(React.createElement(Icon, { color, size: "256" }));
  return "image/png;base64," + (await sharp(Buffer.from(svg)).png().toBuffer()).toString("base64");
}

(async () => {
  const icons = {};
  const want = {
    shield: [fa.FaShieldAlt, "#02C39A"], book: [fa.FaBookOpen, "#0F4C63"],
    filter: [fa.FaFilter, "#0F4C63"], eye: [fa.FaEye, "#02735E"],
    wrench: [fa.FaWrench, "#02735E"], server: [fa.FaServer, "#0F4C63"],
    scale: [fa.FaBalanceScale, "#02735E"], trophy: [fa.FaTrophy, "#02C39A"],
    table: [fa.FaTable, "#0F4C63"], image: [fa.FaImage, "#0F4C63"],
    sigma: [fa.FaSquareRootAlt, "#0F4C63"], fileAlt: [fa.FaRegFileAlt, "#0F4C63"],
    fileEmpty: [fa.FaRegFile, "#0F4C63"], warn: [fa.FaExclamationTriangle, "#9E2B2A"],
    warnAmber: [fa.FaExclamationTriangle, "#BA7517"], check: [fa.FaCheckCircle, "#02735E"],
    cross: [fa.FaTimesCircle, "#9E2B2A"], ghost: [fa.FaGhost, "#0F4C63"],
    stopwatch: [fa.FaStopwatch, "#0F4C63"], ruler: [fa.FaRulerCombined, "#0F4C63"],
    code: [fa.FaCode, "#9E2B2A"], robot: [fa.FaRobot, "#02735E"],
    search: [fa.FaSearchPlus, "#0F4C63"], scan: [fa.FaFileImage, "#0F4C63"],
    micro: [fa.FaMicrochip, "#0F4C63"], bug: [fa.FaBug, "#9E2B2A"],
    ladder: [fa.FaLayerGroup, "#9E2B2A"], terminal: [fa.FaTerminal, "#0F4C63"],
    markdown: [fa.FaMarkdown, "#9E2B2A"], bulb: [fa.FaLightbulb, "#BA7517"],
    verify: [fa.FaClipboardCheck, "#02735E"], next: [fa.FaArrowRight, "#02735E"],
    lang: [fa.FaLanguage, "#0F4C63"], dice: [fa.FaDice, "#02735E"],
    brain: [fa.FaBrain, "#9E2B2A"], flag: [fa.FaFlagCheckered, "#0F4C63"],
  };
  for (const [k, [ic, col]] of Object.entries(want)) icons[k] = await iconPng(ic, col);

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Osamah Alsumaitti";
  pres.title = "Arabic OCR Journey - Full Report";

  // ---------- helpers ----------
  const card = (s, x, y, w, h, fill, o = {}) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill },
      rectRadius: 0.07, line: o.line || { color: C.border, width: 0.75 },
      shadow: o.flat ? undefined : shadow() });
  const circle = (s, x, y, d, fill) =>
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
  const iconIn = (s, key, x, y, d, tint) => {
    circle(s, x, y, d, tint);
    const p = d * 0.26;
    s.addImage({ data: icons[key], x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p });
  };
  let slideNo = 0;
  const pageNum = (s, dark) => {
    slideNo++;
    s.addText(String(slideNo), { x: 9.45, y: 5.28, w: 0.4, h: 0.3, align: "right",
      fontFace: BODY, fontSize: 10, color: dark ? "56718A" : "9AACB9", margin: 0 });
  };
  // section kicker + big title
  const head = (s, kicker, t, dark = false) => {
    s.addText(kicker.toUpperCase(), { x: 0.55, y: 0.4, w: 8.9, h: 0.3, fontFace: BODY,
      fontSize: 12, bold: true, charSpacing: 3, color: dark ? C.mint : C.steelDark, margin: 0 });
    s.addText(t, { x: 0.55, y: 0.72, w: 8.9, h: 0.75, fontFace: HEAD, fontSize: 30,
      bold: true, color: dark ? C.white : C.navy, margin: 0 });
  };
  // big statement slide body
  const statement = (s, text, y = 2.0, size = 22, color = C.text, w = 8.9) =>
    s.addText(text, { x: 0.55, y, w, h: 1.2, fontFace: HEAD, fontSize: size,
      color, margin: 0, valign: "top" });
  // row of big stat chips
  const statRow = (s, stats, y, opts = {}) => {
    const n = stats.length, gap = 0.22, w = (8.9 - gap * (n - 1)) / n;
    stats.forEach(([num, label, tint, numColor], i) => {
      const x = 0.55 + i * (w + gap);
      card(s, x, y, w, 1.35, tint || C.grayTint, { flat: !!opts.flat, line: opts.line });
      s.addText(num, { x, y: y + 0.14, w, h: 0.66, align: "center", fontFace: HEAD,
        fontSize: opts.numSize || 30, bold: true, color: numColor || C.navy, margin: 0 });
      s.addText(label, { x: x + 0.08, y: y + 0.84, w: w - 0.16, h: 0.44, align: "center",
        fontFace: BODY, fontSize: 12, color: opts.labelColor || C.muted, margin: 0 });
    });
  };
  // icon rows
  const rows = (s, items, y0, rh, w = 8.9, x0 = 0.55, alt = [C.steelTint, C.grayTint]) => {
    items.forEach(([ic, h, d], i) => {
      const y = y0 + i * (rh + 0.14);
      card(s, x0, y, w, rh, alt[i % 2], { flat: true });
      iconIn(s, ic, x0 + 0.16, y + rh / 2 - 0.27, 0.54, C.white);
      s.addText(h, { x: x0 + 0.86, y, w: 2.15, h: rh, fontFace: HEAD, fontSize: 14.5,
        bold: true, color: C.navy, margin: 0, valign: "middle" });
      s.addText(d, { x: x0 + 3.1, y, w: w - 3.3, h: rh, fontFace: BODY, fontSize: 12.5,
        color: C.text, margin: 0, valign: "middle" });
    });
  };

  // ============ 1 TITLE (dark) ============
  {
    const s = pres.addSlide(); s.background = { color: C.navy };
    iconIn(s, "shield", 0.55, 0.5, 0.66, C.navy2);
    s.addText("THE FULL JOURNEY  ·  IDEA → CHALLENGES → RESULTS → NEXT", {
      x: 0.55, y: 1.45, w: 8.9, h: 0.3, fontFace: BODY, fontSize: 12.5, color: C.mint,
      charSpacing: 3, bold: true, margin: 0 });
    s.addText("Benchmarking Arabic OCR", { x: 0.55, y: 1.8, w: 8.9, h: 0.7,
      fontFace: HEAD, fontSize: 38, bold: true, color: C.white, margin: 0 });
    s.addText("on a real cybersecurity library", { x: 0.55, y: 2.52, w: 8.9, h: 0.5,
      fontFace: HEAD, fontSize: 24, color: C.ice, margin: 0 });
    statRow(s, [["46", "books", C.navy2, C.mint], ["5,434", "pages", C.navy2, C.mint],
      ["276", "curated test pages", C.navy2, C.mint], ["4+1", "models tried", C.navy2, C.mint]],
      3.5, { flat: true, line: { color: C.navyLine, width: 0.75 }, labelColor: C.ice });
    s.addText("Osamah Alsumaitti  ·  Panther (QCRI), NVIDIA H200  ·  July 2026", {
      x: 0.55, y: 5.1, w: 8.9, h: 0.3, fontFace: BODY, fontSize: 12, color: "7E97AC", margin: 0 });
    pageNum(s, true);
  }

  // ============ 2 MISSION ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "The mission", "Pick ONE model to extract every page of the library");
    statement(s, "Arabic body text, tables of ports and commands, code screenshots, scanned chapters — one OCR engine has to survive all of it.", 1.75, 20, C.text);
    statRow(s, [["44 + 2", "born-digital + scanned books"],
      ["15–786", "pages per book"], ["4", "candidate VLMs on H200"]], 3.15);
    s.addText("Constraint: no public Arabic benchmark matches this corpus — so the benchmark had to be built first.",
      { x: 0.55, y: 4.85, w: 8.9, h: 0.4, fontFace: BODY, italic: true, fontSize: 14, color: C.steelDark, margin: 0 });
    pageNum(s);
  }

  // ============ 3 THE IDEA ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "The core idea", "Don't score 5,434 pages. Distil every book to 6.");
    statement(s, "Each book is reduced to its 6 most informative pages — chosen to exercise everything an OCR engine can fail at.", 1.8, 21);
    statRow(s, [["5,434", "pages in the corpus"], ["→ 276", "pages in the benchmark", C.mintTint, C.mintDark],
      ["× 20", "cheaper to label, verify & score", C.mintTint, C.mintDark]], 3.15);
    s.addText("Small enough to label and score by hand-checkable effort. Diverse enough to rank four models honestly.",
      { x: 0.55, y: 4.85, w: 8.9, h: 0.4, fontFace: BODY, italic: true, fontSize: 14, color: C.steelDark, margin: 0 });
    pageNum(s);
  }

  // ============ 4 MECHANISM STAGE 1 ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "How the 6 pages were chosen — stage 1", "Cheap programmatic features propose candidates");
    rows(s, [
      ["fileAlt", "Text density", "Character & word counts per page → dense body-text candidates"],
      ["table", "Table detector", "PyMuPDF find_tables(): ≥ 3 rows × 2 columns → table candidates"],
      ["image", "Raster & vector", "≥ 30% image coverage or vector charts → figure candidates"],
      ["sigma", "Math glyphs", "Real math symbols (mod, ^, ×, Greek) — not a plain equals sign"],
      ["fileEmpty", "Ink pixels", "Near-100% white pages → blank-page (hallucination-probe) candidates"],
    ], 1.66, 0.54);
    s.addText("Rule: skip the first and last 12% of every book — no covers, ToC, or indexes.",
      { x: 0.55, y: 5.12, w: 8.9, h: 0.32, fontFace: BODY, italic: true, fontSize: 13, color: C.muted, margin: 0 });
    pageNum(s);
  }

  // ============ 5 MECHANISM STAGE 2 ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "How the 6 pages were chosen — stage 2", "A vision LLM judge verifies every candidate");
    statement(s, "Page geometry lies. So every proposed page was rendered to an image and shown to a multimodal judge (Claude Opus 4.8) to confirm, reject, or relabel.", 1.7, 19);
    const flow = [["search", "Features propose", C.steelTint], ["eye", "Judge looks & rules", C.mintTint],
      ["book", "6 verified pages / book", C.grayTint]];
    flow.forEach(([ic, t, tint], i) => {
      const x = 0.55 + i * 3.1;
      card(s, x, 3.15, 2.85, 1.45, tint);
      iconIn(s, ic, x + 1.13, 3.32, 0.6, C.white);
      s.addText(t, { x, y: 4.02, w: 2.85, h: 0.45, align: "center", fontFace: HEAD,
        fontSize: 14.5, bold: true, color: C.navy, margin: 0 });
      if (i < 2) s.addImage({ data: icons.next, x: x + 2.88, y: 3.72, w: 0.22, h: 0.22 });
    });
    s.addText("Classic propose-then-judge: vision is spent only on the shortlist, never on all 5,434 pages.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.35, fontFace: BODY, italic: true, fontSize: 13.5, color: C.steelDark, margin: 0 });
    pageNum(s);
  }

  // ============ 5B HOW THE 6 SLOTS ARE FILLED ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "How the 6 pages were chosen — the exact rule", "Seed the special types first, then spread the rest");
    rows(s, [
      ["flag", "Seed by priority", "Verified special pages fill the first slots, in fixed order: text → table → figure → formula → empty (only those a book actually has)"],
      ["ruler", "Fill by max-spread", "Remaining slots take body-text pages as far apart (by page number) as possible — different chapters, fonts and layouts, never six adjacent pages"],
      ["scan", "Fallback for scans", "Books with no text layer: pick the densest readable pages by ink — never a blank or pure-image page mislabelled as text"],
    ], 1.7, 0.85, 8.9, 0.55);
    s.addText("Guarantee: exactly 6 distinct pages per book, biased toward the content types that book truly contains.",
      { x: 0.55, y: 4.7, w: 8.9, h: 0.4, fontFace: HEAD, fontSize: 15, color: C.mintDark, margin: 0 });
    pageNum(s);
  }

  // ============ 6 WHAT THE JUDGE OVERTURNED ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Why the judge mattered", "Security books fool every text heuristic");
    rows(s, [
      ["code", "Fake formulas", "SQL injection (OR 1=1), chmod arithmetic and ==== separators matched the math patterns. Only 4 books truly had equations."],
      ["table", "Fake tables", "Flowcharts, pie charts and hex dumps triggered the table detector. Only real ruled grids survived."],
      ["fileEmpty", "False empties", "Chapter dividers with a visible title were expelled — a hallucination probe must be truly blank."],
    ], 1.7, 0.88);
    s.addText("Dozens of feature-based labels were overturned — the labels ARE the benchmark's categories, so this step decided its honesty.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.45, fontFace: BODY, italic: true, fontSize: 13.5, color: C.steelDark, margin: 0 });
    pageNum(s);
  }

  // ============ 7 THE SAMPLE ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "The resulting benchmark", "276 pages, five difficulty types");
    statRow(s, [["208", "text pages", C.steelTint], ["33", "figures", C.grayTint],
      ["25", "tables", C.grayTint], ["6", "empty", C.grayTint], ["4", "formulas", C.grayTint]], 1.85);
    statement(s, "Text-dominant by design — that is what the library actually contains. Every book contributes exactly 6 distinct pages, spread across chapters by a max-distance rule.", 3.55, 17, C.text);
    pageNum(s);
  }

  // ============ 8 FLAW VS KITAB #1 ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Honest comparison — flaw no. 1", "KITAB-Bench is far broader than my benchmark");
    const tbl = [
      ["", "KITAB-Bench", "My benchmark"],
      ["Samples", "8,809", "276"],
      ["Domains", "9 (OCR, layout, charts, diagrams, VQA…)", "1 (cybersecurity books)"],
      ["Structure tasks", "Tables→HTML, charts→JSON, diagrams→code", "Tables only, approximated"],
      ["GT pipeline", "5-phase, native-speaker validated", "Opus 4.8 transcription, one light review"],
    ];
    s.addTable(tbl.map((r, ri) => r.map((c, ci) => ({ text: c, options: {
      bold: ri === 0 || ci === 0, fontFace: BODY, fontSize: 12.5, valign: "middle",
      color: ri === 0 ? C.white : C.text, align: ci === 0 ? "left" : "left",
      fill: { color: ri === 0 ? C.steelDark : ri % 2 ? C.grayTint : "FFFFFF" } } }))),
      { x: 0.55, y: 1.7, w: 8.9, colW: [1.7, 3.7, 3.5], rowH: 0.58, border: { pt: 0.5, color: C.border } });
    s.addText("The trade-off is deliberate: depth on ONE real corpus instead of breadth — but generalization beyond this library is unproven.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.45, fontFace: BODY, italic: true, fontSize: 13.5, color: C.coralDark, margin: 0 });
    pageNum(s);
  }

  // ============ 9 GT CHALLENGE ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Building ground truth", "The PDFs lie: their embedded text was systematically broken");
    rows(s, [
      ["bug", "Reversed ligatures", "Letters stored in visual order (the ToUnicode bug) — text reads scrambled in 6+ books"],
      ["bug", "Kashida bytes", "Unmapped elongation glyphs leak control bytes inside words (book 36)"],
      ["bug", "Fused words", "Visually spaced, merged in the text layer (book 21)"],
      ["scan", "No text at all", "Books 17 & 39 scanned; book 37 has an unrecoverable custom font encoding"],
    ], 1.7, 0.66, 8.9, 0.55, [C.coralTint, C.grayTint]);
    s.addText("A text-dump ground truth would have cheated the evaluation before it began.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.4, fontFace: BODY, italic: true, fontSize: 14, color: C.coralDark, margin: 0 });
    pageNum(s);
  }

  // ============ 10 GT REPAIRS ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Building ground truth — full honesty", "Opus 4.8 wrote it; I reviewed it lightly and accepted");
    rows(s, [
      ["robot", "Who wrote it", "Claude Opus 4.8 transcribed each rendered page to text — the same strong model already used as the sampling judge"],
      ["eye", "The review", "A light human pass, then accepted — not a line-by-line human validation of all 276 pages"],
      ["stopwatch", "The honest reason", "There was no time to hand-write or rigorously proofread 276 pages under the deadline"],
    ], 1.7, 0.82, 8.9, 0.55, [C.amberTint, C.grayTint]);
    card(s, 0.55, 4.55, 8.9, 0.76, C.amberTint, { flat: true });
    s.addText([
      { text: "Stated openly:  ", options: { bold: true, color: C.amber, fontSize: 14 } },
      { text: "the scores measure agreement with a strong-model reference, not a gold human transcription. This is the benchmark's single biggest validity caveat.",
        options: { color: C.text, fontSize: 13.5 } }],
      { x: 0.75, y: 4.55, w: 8.5, h: 0.76, fontFace: BODY, margin: 0, valign: "middle" });
    pageNum(s);
  }

  // ============ 10B CHRONOLOGY: KITAB CAME AFTER ============
  {
    const s = pres.addSlide(); s.background = { color: C.navy };
    head(s, "Full honesty — the order of events", "I read KITAB-Bench only AFTER building the benchmark", true);
    const steps = [
      ["1", "Split & sample", "Books → 6 pages each, using my own heuristics plus an Opus visual judge"],
      ["2", "Ground truth", "Opus 4.8 transcription, a light review, accepted under time pressure"],
      ["3", "Then: KITAB", "Read the paper, retrofitted its metrics, task-separation and hallucination probes onto the evaluation"],
    ];
    steps.forEach(([n, h, d], i) => {
      const x = 0.55 + i * 3.05;
      card(s, x, 1.85, 2.85, 1.95, C.navy2, { line: { color: C.navyLine, width: 0.75 }, flat: true });
      s.addText(n, { x: x + 0.18, y: 2.0, w: 0.6, h: 0.55, fontFace: HEAD, fontSize: 30,
        bold: true, color: C.mint, margin: 0 });
      s.addText(h, { x: x + 0.18, y: 2.58, w: 2.5, h: 0.35, fontFace: HEAD, fontSize: 14.5,
        bold: true, color: C.white, margin: 0 });
      s.addText(d, { x: x + 0.18, y: 2.96, w: 2.52, h: 0.78, fontFace: BODY, fontSize: 11.5,
        color: C.ice, margin: 0, valign: "top" });
      if (i < 2) s.addImage({ data: icons.next, x: x + 2.88, y: 2.72, w: 0.22, h: 0.22 });
    });
    s.addText("So this is KITAB-aligned after the fact — honest borrowing of a strong framework, not a from-scratch replication of it.",
      { x: 0.55, y: 4.2, w: 8.9, h: 0.5, fontFace: HEAD, fontSize: 16, color: C.mint, margin: 0 });
    s.addText("The sampling logic and the metric layer were designed independently, then checked against KITAB and kept where they agreed.",
      { x: 0.55, y: 4.85, w: 8.9, h: 0.4, fontFace: BODY, italic: true, fontSize: 13, color: C.ice, margin: 0 });
    pageNum(s, true);
  }

  // ============ 11 FLAW VS KITAB #2 (txt vs md) ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Honest comparison — flaw no. 2", "Ground truth is plain text — structure is lost");
    rows(s, [
      ["markdown", "Headings flatten", "A chapter title and a body line become identical plain lines — hierarchy untestable"],
      ["markdown", "Lists flatten", "Numbering levels and nesting disappear in plain text"],
      ["warnAmber", "Tables half-saved", "GT serializes tables as | pipes — but the prompt never asked models for any table format"],
    ], 1.7, 0.8, 8.9, 0.55, [C.coralTint, C.grayTint]);
    s.addText("KITAB scores structure natively (tables→HTML, PDF→Markdown). My txt-based CER cannot see structure at all — part of AIN's table F1 = 0 is a prompt artifact, not pure model failure.",
      { x: 0.55, y: 4.6, w: 8.9, h: 0.7, fontFace: BODY, italic: true, fontSize: 13.5, color: C.coralDark, margin: 0 });
    pageNum(s);
  }

  // ============ 12 CONTENDERS ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "The exam", "Four contenders, one identical pipeline");
    const models = [
      ["gemma4_26b", "gemma-4-26B-A4B-it (MoE)", "39.7 s/page", C.steelTint],
      ["gemma4_31b", "gemma-4-31B-it (dense)", "42.1 s/page", C.mintTint],
      ["qwen36", "Qwen3.6-35B-A3B (MoE, thinking)", "124.8 s/page", C.coralTint],
      ["ain", "AIN (Arabic-centric, Qwen2-VL)", "14.7 s/page", C.grayTint],
    ];
    models.forEach(([n, full, sp, tint], i) => {
      const x = 0.55 + (i % 2) * 4.55, y = 1.7 + Math.floor(i / 2) * 1.6;
      card(s, x, y, 4.35, 1.42, tint);
      iconIn(s, "micro", x + 0.16, y + 0.16, 0.5, C.white);
      s.addText(n, { x: x + 0.8, y: y + 0.12, w: 3.4, h: 0.4, fontFace: HEAD, fontSize: 17,
        bold: true, color: C.navy, margin: 0 });
      s.addText(full, { x: x + 0.8, y: y + 0.54, w: 3.4, h: 0.3, fontFace: BODY, fontSize: 11.5,
        color: C.muted, margin: 0 });
      s.addText(sp, { x: x + 0.8, y: y + 0.9, w: 3.4, h: 0.35, fontFace: BODY, fontSize: 14,
        bold: true, color: C.steelDark, margin: 0 });
    });
    s.addText("Identical exam: 320 DPI renders · greedy decoding · 4,096-token cap · same 276 pages · one H200 each.",
      { x: 0.55, y: 5.0, w: 8.9, h: 0.35, align: "center", fontFace: BODY, italic: true,
        fontSize: 13, color: C.muted, margin: 0 });
    pageNum(s);
  }

  // ============ 13 BASEER FELL ============
  {
    const s = pres.addSlide(); s.background = { color: C.navy };
    head(s, "Challenge log · models", "A 5th contender fell before the race: Baseer-Nakba", true);
    card(s, 0.55, 1.75, 8.9, 1.55, C.navy2, { line: { color: C.navyLine, width: 0.75 }, flat: true });
    s.addText("quanegraMais contemplated infoספי举措 legally Brain!!-Pack geilissant_rec\nWhit CH.console制成 alleges cow Firewall Relax只见.sup][( ... يوم/String ...",
      { x: 0.75, y: 1.9, w: 8.5, h: 0.95, fontFace: MONO, fontSize: 13, color: C.ice, margin: 0 });
    s.addText("— its actual OCR output for sample 0, page 1", { x: 0.75, y: 2.92, w: 8.5, h: 0.3,
      fontFace: BODY, italic: true, fontSize: 11, color: "7E97AC", margin: 0 });
    statement(s, "First its processor crashed on loading; once fixed, the output was a multilingual character salad with no relation to the page. Dropped before the benchmark.", 3.6, 17, C.ice);
    s.addText("Evidence: results/sample0_three_models/sample0_baseer.txt + .ERROR.txt", {
      x: 0.55, y: 4.95, w: 8.9, h: 0.3, fontFace: MONO, fontSize: 11, color: "7E97AC", margin: 0 });
    pageNum(s, true);
  }

  // ============ 14 CHALLENGE: DEPENDENCY LADDER ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Challenge log · environment", "The dependency ladder: 3 models failed before page one");
    rows(s, [
      ["ladder", "gemma4", "ModuleNotFoundError: Gemma4Processor — transformers older than the architecture → upgrade"],
      ["ladder", "ain", "Qwen2VLVideoProcessor requires Torchvision — a VIDEO processor, needed just to OCR images"],
      ["ladder", "baseer", "AutoProcessor returned NoneType — the model repo's processor package itself is broken"],
    ], 1.7, 0.8, 8.9, 0.55, [C.coralTint, C.grayTint]);
    s.addText("Lesson: never schedule 46 samples before one PDF succeeds — smoke test first, always.",
      { x: 0.55, y: 4.6, w: 8.9, h: 0.4, fontFace: HEAD, fontSize: 16, color: C.mintDark, margin: 0 });
    s.addText("Evidence: results/sample0_three_models/*.ERROR.txt · .torchvision_install.lock", {
      x: 0.55, y: 5.1, w: 8.9, h: 0.3, fontFace: MONO, fontSize: 10.5, color: C.muted, margin: 0 });
    pageNum(s);
  }

  // ============ 15 CHALLENGE: CLUSTER BATTLES ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Challenge log · cluster", "SLURM battles that were never code bugs");
    rows(s, [
      ["warn", "403 on models", "Token was set — but some code paths read HUGGING_FACE_HUB_TOKEN, not HF_TOKEN. Export both."],
      ["warn", "Silent pip fails", "Root cause: account permissions, not the network"],
      ["warn", "The P100 trap", "gpu-dev handed an old P100 instead of an H200 — timing numbers would have been garbage"],
      ["warn", "Wrong-path 403", "A local model path with wrong case (ain vs AIN) fell through to HF as a fake repo id"],
    ], 1.7, 0.66, 8.9, 0.55, [C.amberTint, C.grayTint]);
    s.addText("Plus: endless PENDING queues (a busy neighbour, not a bug) and the iron rule — nothing heavy on the login node.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.45, fontFace: BODY, italic: true, fontSize: 13.5, color: C.steelDark, margin: 0 });
    pageNum(s);
  }

  // ============ 16 THE PROMPT ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "The exam paper", "The exact OCR prompt every model received");
    card(s, 0.55, 1.7, 8.9, 1.75, C.steelTint, { flat: true });
    s.addText("“You are an expert OCR engine for Arabic and English documents.\nExtract ALL text exactly as it appears. Preserve line breaks,\nparagraphs, punctuation, and reading order.\nOutput only the extracted text.”",
      { x: 0.8, y: 1.88, w: 8.4, h: 1.45, fontFace: MONO, fontSize: 14.5, color: C.navy, margin: 0 });
    statRow(s, [["320", "DPI page renders"], ["4,096", "max new tokens"], ["greedy", "no sampling"]], 3.75, { flat: true, numSize: 22 });
    s.addText("Source: scripts/run_four_models_ocr.py (MODEL_SPECS) — AIN got a slightly shorter bilingual variant.",
      { x: 0.55, y: 5.2, w: 8.9, h: 0.3, fontFace: MONO, fontSize: 10.5, color: C.muted, margin: 0 });
    pageNum(s);
  }

  // ============ 17 PROMPT FLAWS ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Self-critique", "Four things this prompt got wrong");
    rows(s, [
      ["markdown", "Plain text out", "No Markdown requested → headings, lists and hierarchy flattened and untestable"],
      ["table", "No table format", "GT stores tables as pipes, models were never told to — table scores partly measure prompt luck"],
      ["ghost", "No blank rule", "Nothing says what to do with an empty page → Gemma wrote meta-notes, Qwen hallucinated"],
      ["brain", "No thinking control", "Nothing suppressed Qwen's reasoning mode → chain-of-thought flooded the output"],
    ], 1.7, 0.66, 8.9, 0.55, [C.coralTint, C.grayTint]);
    s.addText("The prompt is part of the benchmark. It must be designed, versioned and criticized like any variable.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.4, fontFace: HEAD, fontSize: 15.5, color: C.coralDark, margin: 0 });
    pageNum(s);
  }

  // ============ 18 SCORING KITAB WAY ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Scoring", "Every KITAB-Bench axis that plain-text GT allows");
    const axes = [
      ["lang", "CER / WER", "strict + Arabic-normalized"],
      ["ruler", "chrF", "char n-gram F-score (MARS family)"],
      ["table", "Table cell-F1", "TEDS approximation on pipes"],
      ["ghost", "Hallucination", "blank pages as probes"],
      ["scan", "Robustness", "scanned books 17 / 37 / 39"],
      ["stopwatch", "Efficiency", "seconds/page from run stats"],
    ];
    axes.forEach(([ic, h, d], i) => {
      const x = 0.55 + (i % 3) * 3.05, y = 1.7 + Math.floor(i / 3) * 1.6;
      card(s, x, y, 2.85, 1.42, C.grayTint);
      iconIn(s, ic, x + 0.16, y + 0.16, 0.5, C.white);
      s.addText(h, { x: x + 0.78, y: y + 0.16, w: 2.0, h: 0.5, fontFace: HEAD, fontSize: 15,
        bold: true, color: C.navy, margin: 0, valign: "middle" });
      s.addText(d, { x: x + 0.16, y: y + 0.78, w: 2.55, h: 0.55, fontFace: BODY, fontSize: 11.5,
        color: C.muted, margin: 0 });
    });
    s.addText("Excluded for lack of GT: layout boxes, charts→JSON, diagrams→code, VQA.",
      { x: 0.55, y: 5.05, w: 8.9, h: 0.3, fontFace: BODY, italic: true, fontSize: 12.5, color: C.muted, margin: 0 });
    pageNum(s);
  }

  // ============ 19 BEYOND KITAB ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Scoring", "Three additions KITAB doesn't have");
    rows(s, [
      ["scale", "Win-rate matrix", "All models saw identical pages → page-level head-to-head comparison across all pairs"],
      ["dice", "Paired bootstrap", "10,000 resamples decide whether a gap is real or noise before any winner is declared"],
      ["shield", "Security IOC layer", "Exact-match recall AND precision on CVEs, IPs, hashes, ports, URLs — domain fidelity CER can't see"],
    ], 1.7, 0.88, 8.9, 0.55, [C.mintTint, C.grayTint]);
    s.addText("Possible only because this is a paired design on one corpus — a luxury public benchmarks don't have.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.4, fontFace: BODY, italic: true, fontSize: 13.5, color: C.steelDark, margin: 0 });
    pageNum(s);
  }

  // ============ 20 QWEN LEAK (dark) ============
  {
    const s = pres.addSlide(); s.background = { color: C.navy };
    head(s, "Challenge log · the big one", "qwen36 leaked its chain-of-thought into the OCR", true);
    statRow(s, [["216 / 276", "pages contain </think>", C.navy2, C.coral],
      ["60", "pages truncated mid-thought — zero output", C.navy2, C.coral],
      ["1,756", "chars invented on a blank page", C.navy2, C.coral]],
      1.85, { flat: true, line: { color: C.navyLine, width: 0.75 }, labelColor: C.ice, numSize: 26 });
    statement(s, "Found by reading outputs with my own eyes — no metric flagged it. Scored twice to stay fair: raw (deployment reality) and cleaned (best case). Even cleaned: 45% CER.", 3.5, 17, C.ice);
    s.addText("Production fix: enable_thinking=False + a </think> stripper in run_ocr.py.",
      { x: 0.55, y: 4.85, w: 8.9, h: 0.35, fontFace: MONO, fontSize: 12, color: C.mint, margin: 0 });
    pageNum(s, true);
  }

  // ============ 21 HEADLINE RESULTS ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Results", "Core Arabic text: only the Gemmas survived");
    s.addChart(pres.charts.BAR, [{
      name: "Core-text CER %",
      labels: ["gemma4_31b", "gemma4_26b", "ain", "qwen36_clean", "qwen36 raw"],
      values: [16.3, 16.9, 44.3, 45.0, 99.8],
    }], {
      x: 0.4, y: 1.65, w: 5.9, h: 3.5, barDir: "col",
      chartColors: ["02C39A", "1C7293", "8FA6B5", "D98B6A", "E24B4A"], varyColors: true,
      chartArea: { fill: { color: "FFFFFF" } },
      catAxisLabelColor: "5C6B7A", catAxisLabelFontSize: 10.5,
      valAxisLabelColor: "5C6B7A", valAxisLabelFontSize: 10,
      valAxisMaxVal: 100, valAxisMinVal: 0,
      valGridLine: { color: "E4EAEE", size: 0.5 }, catGridLine: { style: "none" },
      showValue: true, dataLabelPosition: "outEnd", dataLabelColor: "22313F",
      dataLabelFontSize: 12, dataLabelFontBold: true, showLegend: false, showTitle: false,
    });
    card(s, 6.55, 1.65, 2.95, 3.5, C.mintTint);
    s.addText("208 text pages\nnormalized CER\nlower = better", { x: 6.55, y: 1.85, w: 2.95, h: 1.0,
      align: "center", fontFace: BODY, fontSize: 13, color: C.mintDark, margin: 0 });
    s.addText("5.9%", { x: 6.55, y: 2.95, w: 2.95, h: 0.7, align: "center", fontFace: HEAD,
      fontSize: 40, bold: true, color: C.navy, margin: 0 });
    s.addText("median page CER of the winner —\nthe typical page comes out near-clean",
      { x: 6.7, y: 3.75, w: 2.65, h: 0.9, align: "center", fontFace: BODY, fontSize: 12,
        color: C.text, margin: 0 });
    pageNum(s);
  }

  // ============ 22 TABLES BROKE THE TIE ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Results", "Tables broke the tie between the two Gemmas");
    statRow(s, [["69.3%", "gemma4_31b table cell-F1", C.mintTint, C.mintDark],
      ["52.1%", "gemma4_26b table cell-F1", C.steelTint, C.steelDark],
      ["11 – 4", "head-to-head wins (7 ties)", C.grayTint]], 1.85, { numSize: 28 });
    statement(s, "Cybersecurity books live on tables — ports, commands, tool matrices. KITAB names table structure the hardest Arabic task; 17 points of cell-F1 is a decisive, not marginal, gap.", 3.5, 17);
    s.addText("AIN reads table content but emits zero structure — unusable for knowledge extraction.",
      { x: 0.55, y: 4.9, w: 8.9, h: 0.4, fontFace: BODY, italic: true, fontSize: 13.5, color: C.muted, margin: 0 });
    pageNum(s);
  }

  // ============ 23 ROBUSTNESS ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Results", "Scanned books: only the Gemmas are dependable");
    rows(s, [
      ["check", "gemma4_26b", "11.9% CER — steady on every scanned page"],
      ["check", "gemma4_31b", "8.9% CER excluding one repetition-loop page (39_p4) — fixed by decoding guards"],
      ["warnAmber", "qwen36_clean", "32.6% CER and 4 pages lost entirely to thinking truncation"],
      ["cross", "ain", "Collapse — repetition loops up to 15× the page length"],
    ], 1.7, 0.66, 8.9, 0.55);
    s.addText("Books 17, 37, 39: scans and broken encodings — exactly the pages a production engine cannot skip.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.4, fontFace: BODY, italic: true, fontSize: 13.5, color: C.steelDark, margin: 0 });
    pageNum(s);
  }

  // ============ 24 HALLUCINATION ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Results", "Blank pages: three very different personalities");
    const cards3 = [
      ["check", "ain", "0 characters.\nPerfect discipline.", C.mintTint],
      ["warnAmber", "gemma (both)", "~75-char English note:\n“the page is blank”.\nCosmetic — one regex removes it.", C.grayTint],
      ["cross", "qwen36", "1,756 fabricated characters.\nGenuine hallucination.", C.coralTint],
    ];
    cards3.forEach(([ic, n, d, tint], i) => {
      const x = 0.55 + i * 3.05;
      card(s, x, 1.75, 2.85, 2.6, tint);
      iconIn(s, ic, x + 1.13, 1.95, 0.6, C.white);
      s.addText(n, { x, y: 2.68, w: 2.85, h: 0.4, align: "center", fontFace: HEAD,
        fontSize: 17, bold: true, color: C.navy, margin: 0 });
      s.addText(d, { x: x + 0.18, y: 3.12, w: 2.5, h: 1.1, align: "center", fontFace: BODY,
        fontSize: 12, color: C.text, margin: 0, valign: "top" });
    });
    s.addText("Two truly blank pages in the set (6_p4, 37_p3) act as hallucination probes — a KITAB-inspired axis.",
      { x: 0.55, y: 4.75, w: 8.9, h: 0.4, align: "center", fontFace: BODY, italic: true,
        fontSize: 13, color: C.muted, margin: 0 });
    pageNum(s);
  }

  // ============ 25 IOC LEADERBOARD ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Results · security layer", "The IOC leaderboard confirms the same winner");
    const tbl = [
      ["#", "Model", "SecScore", "Char acc.", "IOC-R", "IOC-P", "Fabricated"],
      ["1", "gemma4_31b", "0.706", "0.753", "0.659", "0.564", "55"],
      ["2", "gemma4_26b", "0.647", "0.755", "0.538", "0.331", "117"],
      ["3", "qwen36_clean", "0.643", "0.494", "0.791", "0.689", "37"],
      ["4", "ain", "0.454", "0.490", "0.418", "0.762", "10"],
      ["5", "qwen36 raw", "0.409", "0.005", "0.813", "0.579", "133"],
    ];
    s.addTable(tbl.map((r, ri) => r.map((c, ci) => ({ text: c, options: {
      bold: ri === 0 || ri === 1, fontFace: BODY, fontSize: 13, valign: "middle",
      align: ci <= 1 ? "left" : "center",
      color: ri === 0 ? C.white : ri === 1 ? C.mintDark : C.text,
      fill: { color: ri === 0 ? C.steelDark : ri === 1 ? C.mintTint : ri % 2 ? "FFFFFF" : C.grayTint } } }))),
      { x: 0.55, y: 1.7, w: 8.9, colW: [0.5, 2.0, 1.35, 1.35, 1.2, 1.2, 1.3],
        rowH: 0.5, border: { pt: 0.5, color: C.border } });
    s.addText("SecScore = ½ char accuracy + ½ IOC recall. Caveat owned openly: only 91 IOCs on 34 pages — directional, not load-bearing.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.45, fontFace: BODY, italic: true, fontSize: 12.5, color: C.muted, margin: 0 });
    pageNum(s);
  }

  // ============ 26 RTL DISCOVERY ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Results · a discovery", "RTL reading direction reverses IP addresses");
    const pair = [["Ground truth", "40.80.148.42", C.mintTint, C.mintDark],
      ["Gemma wrote", "42.148.40.42", C.coralTint, C.coralDark]];
    pair.forEach(([l, v, tint, col], i) => {
      const x = 0.55 + i * 4.55;
      card(s, x, 1.8, 4.35, 1.5, tint);
      s.addText(l, { x, y: 1.95, w: 4.35, h: 0.35, align: "center", fontFace: BODY,
        fontSize: 14, color: col, margin: 0 });
      s.addText(v, { x, y: 2.32, w: 4.35, h: 0.7, align: "center", fontFace: MONO,
        fontSize: 30, bold: true, color: C.navy, margin: 0 });
    });
    statement(s, "The octets came out mirrored — the right-to-left habit applied to a Latin token. Tiny in CER, catastrophic in a security corpus. Only the IOC layer could see it.", 3.6, 17);
    s.addText("Production rule derived: never trust an OCR'd IP or hash without a verification pass.",
      { x: 0.55, y: 4.9, w: 8.9, h: 0.4, fontFace: HEAD, fontSize: 15, color: C.coralDark, margin: 0 });
    pageNum(s);
  }

  // ============ 27 DECISION ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "The decision", "Statistics first: the Gemmas tie on accuracy");
    card(s, 0.55, 1.7, 4.3, 1.6, C.steelTint);
    iconIn(s, "dice", 0.73, 1.88, 0.52, C.white);
    s.addText([
      { text: "Bootstrap, 10,000 resamples:", options: { bold: true, fontSize: 14, color: C.navy, breakLine: true } },
      { text: "CER gap +0.6% — CI [−0.8%, +2.1%]", options: { fontSize: 13.5, color: C.text, breakLine: true } },
      { text: "crosses zero → statistical tie", options: { italic: true, fontSize: 13.5, color: C.steelDark } }],
      { x: 1.4, y: 1.85, w: 3.35, h: 1.35, fontFace: BODY, margin: 0, valign: "top" });
    const tb = [["Tie-breaker", "31b", "26b"], ["Page win rate", "51.5%", "37.6%"],
      ["Table cell-F1", "69.3%", "52.1%"], ["Fabricated IOCs", "55", "117"],
      ["Median CER", "5.9%", "6.6%"], ["Speed s/page", "42.1", "39.7"]];
    s.addTable(tb.map((r, ri) => r.map((c, ci) => ({ text: c, options: {
      bold: ri === 0 || (ci === 1 && ri < 5), fontFace: BODY, fontSize: 12.5, valign: "middle",
      align: ci === 0 ? "left" : "center",
      color: ri === 0 ? C.white : ci === 1 && ri < 5 ? C.mintDark : ci === 2 && ri === 5 ? C.mintDark : C.text,
      fill: { color: ri === 0 ? C.steelDark : ri % 2 ? C.grayTint : "FFFFFF" } } }))),
      { x: 5.15, y: 1.7, w: 4.3, colW: [1.9, 1.2, 1.2], rowH: 0.5, border: { pt: 0.5, color: C.border } });
    s.addText("Every tie-breaker except a 6% speed edge points the same way.",
      { x: 0.55, y: 4.85, w: 8.9, h: 0.4, fontFace: HEAD, fontSize: 16, color: C.mintDark, margin: 0 });
    pageNum(s);
  }

  // ============ 28 WINNER (dark) ============
  {
    const s = pres.addSlide(); s.background = { color: C.navy };
    s.addImage({ data: icons.trophy, x: 0.55, y: 0.6, w: 0.65, h: 0.65 });
    s.addText("THE PRODUCTION PICK", { x: 1.4, y: 0.62, w: 8.0, h: 0.3, fontFace: BODY,
      fontSize: 12.5, color: C.mint, charSpacing: 3, bold: true, margin: 0 });
    s.addText("gemma4_31b", { x: 1.4, y: 0.9, w: 8.0, h: 0.8, fontFace: HEAD, fontSize: 44,
      bold: true, color: C.white, margin: 0 });
    const why = [["Best core text", "CER 16.3 · WER 19.4 · chrF 89.3 on 75% of the corpus"],
      ["Decisive on tables", "+17 pts cell-F1, 11–4 head-to-head — the axis that matters most"],
      ["Benign failures", "4 loop pages + a filterable blank note — all already guarded in run_ocr.py"]];
    why.forEach(([h, d], i) => {
      const x = 0.55 + i * 3.05;
      card(s, x, 2.1, 2.85, 1.7, C.navy2, { line: { color: C.navyLine, width: 0.75 }, flat: true });
      s.addText(h, { x: x + 0.16, y: 2.24, w: 2.55, h: 0.35, fontFace: HEAD, fontSize: 15,
        bold: true, color: C.mint, margin: 0 });
      s.addText(d, { x: x + 0.16, y: 2.64, w: 2.55, h: 1.05, fontFace: BODY, fontSize: 12,
        color: C.ice, margin: 0, valign: "top" });
    });
    s.addText("Runner-up gemma4_26b is a legitimate speed-first choice — the accuracy tie is real. The tables are not.",
      { x: 0.55, y: 4.1, w: 8.9, h: 0.45, fontFace: BODY, italic: true, fontSize: 14, color: C.ice, margin: 0 });
    s.addText("Full archive run: 5,434 pages × 42.1 s ≈ 64 GPU-hours ≈ 16–18 h wall-clock on 4 H200 jobs.",
      { x: 0.55, y: 4.75, w: 8.9, h: 0.4, fontFace: BODY, fontSize: 14, bold: true, color: C.mint, margin: 0 });
    pageNum(s, true);
  }

  // ============ 29 VERIFIED ON PANTHER ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Reproducibility", "The whole evaluation re-ran on Panther — identically");
    rows(s, [
      ["verify", "Same numbers", "sbatch eval job 341379 (cpu-all, minutes): CERc 24.7% · table-F1 69.3% · SecScore 0.706 — digit-for-digit identical to the local run"],
      ["verify", "Guards proven", "Benchmark re-run logs show the anti-loop guard firing and retrying: “[guard] 12_sample p5: loop/runaway (4096 tok) → retry”"],
      ["verify", "One contract", "=== Page N === + stats.json — every tool composes on it: runner, checker, scorer, IOC layer"],
    ], 1.7, 0.92, 8.9, 0.55, [C.mintTint, C.grayTint]);
    s.addText("Evidence: logs/eval_341379.out · logs/bench_341352_0.out",
      { x: 0.55, y: 5.05, w: 8.9, h: 0.3, fontFace: MONO, fontSize: 11, color: C.muted, margin: 0 });
    pageNum(s);
  }

  // ============ 30 LESSONS ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "What I learned", "Five lessons that cost real GPU hours");
    rows(s, [
      ["eye", "Eyes before metrics", "The qwen leak was invisible to every number — one manual read caught it"],
      ["terminal", "Prompt = variable", "It must be designed, versioned and criticized like code (txt-vs-md proves it)"],
      ["wrench", "Guard at generation", "Regenerating one loop page beats cleaning poisoned corpora afterwards"],
      ["scale", "Recall needs precision", "The model that fabricates indicators is worse than the one that misses them"],
      ["flag", "Smoke test first", "Three failed loads on sample 0 saved three failed 46-sample runs"],
    ], 1.7, 0.6);
    pageNum(s);
  }

  // ============ 31 LIMITATIONS SUMMARY ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Owning the flaws", "What this benchmark cannot claim");
    rows(s, [
      ["warn", "Model-made GT", "Reference = Opus 4.8 transcription, lightly reviewed — scores measure agreement with a strong model, not gold human truth"],
      ["warn", "One corpus", "276 pages of one library — generalization beyond it is unproven"],
      ["warn", "Structure-blind", "txt GT + txt prompt → hierarchy untested; table-F1 partly a prompt artifact"],
      ["warn", "Thin tails, single run", "4 formulas · 2 blank probes · 2 hashes · 1 CVE; one deterministic pass, TEDS approximated"],
    ], 1.7, 0.66, 8.9, 0.55, [C.coralTint, C.grayTint]);
    s.addText("Every number in the report carries these caveats explicitly — in KITAB's own spirit of transparency.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.4, fontFace: BODY, italic: true, fontSize: 13.5, color: C.steelDark, margin: 0 });
    pageNum(s);
  }

  // ============ 32 NEXT STEP ============
  {
    const s = pres.addSlide(); s.background = { color: C.white };
    head(s, "Happening now", "Next experiment: does Markdown output fix the structure gap?");
    rows(s, [
      ["filter", "10-page mini-set", "10 diverse pages from several books, hand-picked to cover different scenarios, in one test file"],
      ["markdown", "Same prompt, MD out", "Identical instructions, but output format = Markdown — headings, lists and tables keep their structure"],
      ["fileAlt", "Per-page report", "A short review sheet per page × per model (all 4) for fast human comparison"],
    ], 1.7, 0.88, 8.9, 0.55, [C.mintTint, C.grayTint]);
    s.addText("If MD output lifts table and structure scores, the production prompt changes before the 5,434-page run.",
      { x: 0.55, y: 4.95, w: 8.9, h: 0.4, fontFace: HEAD, fontSize: 15, color: C.mintDark, margin: 0 });
    pageNum(s);
  }

  // ============ 33 ROADMAP (dark) ============
  {
    const s = pres.addSlide(); s.background = { color: C.navy };
    head(s, "Roadmap", "From benchmark to production", true);
    const steps = [["1", "MD-output mini-test", "10 pages × 4 models — decide the final prompt"],
      ["2", "Production run", "gemma4_31b on 5,434 pages with guards + post-filter (~64 GPU-h)"],
      ["3", "Verification", "check_results.py + 20-page human sample + IOC cross-check on indicator pages"]];
    steps.forEach(([n, h, d], i) => {
      const x = 0.55 + i * 3.05;
      card(s, x, 1.9, 2.85, 1.9, C.navy2, { line: { color: C.navyLine, width: 0.75 }, flat: true });
      s.addText(n, { x: x + 0.18, y: 2.05, w: 0.6, h: 0.55, fontFace: HEAD, fontSize: 30,
        bold: true, color: C.mint, margin: 0 });
      s.addText(h, { x: x + 0.18, y: 2.62, w: 2.5, h: 0.35, fontFace: HEAD, fontSize: 14.5,
        bold: true, color: C.white, margin: 0 });
      s.addText(d, { x: x + 0.18, y: 3.0, w: 2.5, h: 0.72, fontFace: BODY, fontSize: 11.5,
        color: C.ice, margin: 0, valign: "top" });
    });
    s.addText("Deliverables so far: BENCHMARK_README.md · BENCHMARK_REPORT.md (ar) · LOG_OF_CHALLENGES.md · kitab_eval.py · ioc_eval.py · leaderboard.json · server_pipeline/",
      { x: 0.55, y: 4.35, w: 8.9, h: 0.65, fontFace: MONO, fontSize: 11.5, color: "7E97AC", margin: 0 });
    s.addText("Thank you — questions welcome.", { x: 0.55, y: 5.05, w: 8.9, h: 0.35,
      fontFace: HEAD, fontSize: 16, color: C.mint, margin: 0 });
    pageNum(s, true);
  }

  await pres.writeFile({ fileName: "C:/Users/osama/Downloads/benchmark_samples/OCR_Journey_Full_Report.pptx" });
  console.log("done, slides:", slideNo);
})().catch(e => { console.error(e); process.exit(1); });
