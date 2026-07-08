# tools

Source scripts that generate the slide decks in `../docs/slides/`.

- `slides_source/build_journey_deck.js` → `journey_full_report.pptx` (the full journey)
- `slides_source/build_deck.js` → `benchmark_results.pptx` (the results demo)

These use [PptxGenJS](https://gitbrent.github.io/PptxGenJS/) and `react-icons` + `sharp`
for icon rasterization. To rebuild:

```bash
npm install -g pptxgenjs react-icons react react-dom sharp
node slides_source/build_journey_deck.js
```

Paths inside the scripts are absolute (they were authored on the original machine) —
adjust the output path and the `node_modules` location before rebuilding. They are
included for transparency/reproducibility, not as a portable build.
