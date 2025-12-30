/*
  Generates a best-effort mapping between domMan methods and test references.

  Usage:
    node tools/method-coverage.js

  Output:
    METHOD_TEST_COVERAGE.md

  Notes:
  - This is a heuristic (regex search). It won’t perfectly capture Proxy-driven calls,
    property access, or dynamically-computed method names.
*/

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const testDir = path.join(repoRoot, "test");

function listTestFiles() {
  if (!fs.existsSync(testDir)) return [];
  return fs
    .readdirSync(testDir)
    .filter((f) => f.endsWith(".js"))
    .filter((f) => f !== "_dommanTestUtils.js")
    .map((f) => path.join(testDir, f));
}

function safeRead(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countMatches(haystack, regex) {
  let count = 0;
  let m;
  while ((m = regex.exec(haystack))) {
    count++;
  }
  return count;
}

function loadDomManForIntrospection() {
  // Reuse the project’s jsdom loader to evaluate the UMD build.
  // This keeps method enumeration aligned with what tests use.
  // eslint-disable-next-line global-require
  const { loadDomMan } = require(path.join(testDir, "_dommanTestUtils"));
  return loadDomMan();
}

function enumerateProtoMethods(domMan) {
  const pt = domMan && domMan.pt;
  const names = [];
  if (!pt) return names;

  for (const key of Object.keys(pt)) {
    if (typeof pt[key] === "function") names.push(key);
  }

  names.sort();
  return names;
}

function enumerateStaticMethods(domMan) {
  const names = [];
  if (!domMan) return names;

  for (const key of Object.keys(domMan)) {
    if (typeof domMan[key] === "function") names.push(key);
  }

  names.sort();
  return names;
}

function scanUsages(methodNames, fileContentsByPath) {
  const usage = new Map();

  for (const name of methodNames) {
    // Common call forms in tests:
    // - $d().name(
    // - clone().name(
    // - someVar.name(
    // Also capture bracket access and extend blocks:
    // - ['name']
    // - { name() { ... } }
    const dotRegex = new RegExp(`\\.${escapeRegExp(name)}\\b`, "g");
    const bracketRegex = new RegExp(`\\[\"${escapeRegExp(name)}\"\\]|\\[\'${escapeRegExp(name)}\'\\]`, "g");
    const objectMethodRegex = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");

    let total = 0;
    const perFile = {};

    for (const [filePath, content] of Object.entries(fileContentsByPath)) {
      // objectMethodRegex is intentionally not used globally because it’s noisy.
      // We prefer dot/bracket, and use objectMethodRegex only for a few cases.
      const c1 = countMatches(content, dotRegex);
      const c2 = countMatches(content, bracketRegex);
      const c3 = name === "extend" ? countMatches(content, objectMethodRegex) : 0;
      const count = c1 + c2 + c3;

      if (count > 0) {
        perFile[path.relative(repoRoot, filePath)] = count;
        total += count;
      }
    }

    usage.set(name, { total, perFile });
  }

  return usage;
}

function toMarkdownTable(rows, headers) {
  const headerLine = `| ${headers.join(" | ")} |`;
  const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const lines = [headerLine, sepLine];
  for (const row of rows) {
    lines.push(`| ${row.join(" | ")} |`);
  }
  return lines.join("\n");
}

function main() {
  const { domMan } = loadDomManForIntrospection();

  const protoMethods = enumerateProtoMethods(domMan);
  const staticMethods = enumerateStaticMethods(domMan);

  const testFiles = listTestFiles();
  const fileContentsByPath = Object.fromEntries(
    testFiles.map((p) => [p, safeRead(p)])
  );

  const protoUsage = scanUsages(protoMethods, fileContentsByPath);
  const staticUsage = scanUsages(staticMethods, fileContentsByPath);

  const protoUntested = protoMethods.filter((m) => protoUsage.get(m).total === 0);
  const staticUntested = staticMethods.filter((m) => staticUsage.get(m).total === 0);

  const now = new Date().toISOString();

  const topLines = [];
  topLines.push(`# Method → Test Coverage (heuristic)\n`);
  topLines.push(`Generated: ${now}`);
  topLines.push("");
  topLines.push(
    "This report is a best-effort regex scan of `test/*.js` for references to domMan methods."
  );
  topLines.push(
    "It will miss Proxy-driven behaviors and can include occasional false positives/negatives."
  );
  topLines.push("");

  topLines.push("## Summary\n");
  topLines.push(
    `- Prototype methods (domMan.pt): ${protoMethods.length} total, ${protoMethods.length - protoUntested.length} referenced, ${protoUntested.length} not referenced`
  );
  topLines.push(
    `- Static methods (domMan.*): ${staticMethods.length} total, ${staticMethods.length - staticUntested.length} referenced, ${staticUntested.length} not referenced`
  );
  topLines.push("");

  function topRows(methods, usageMap) {
    // Show top 25 referenced methods.
    const ranked = methods
      .map((m) => ({ name: m, total: usageMap.get(m).total }))
      .sort((a, b) => b.total - a.total);

    return ranked.slice(0, 25).map((r) => [r.name, String(r.total)]);
  }

  topLines.push("## Most Referenced Prototype Methods\n");
  topLines.push(toMarkdownTable(topRows(protoMethods, protoUsage), ["Method", "Refs"]));
  topLines.push("");

  topLines.push("## Prototype Methods Not Referenced In Tests\n");
  if (protoUntested.length === 0) {
    topLines.push("All prototype methods are referenced at least once.\n");
  } else {
    topLines.push(protoUntested.map((m) => `- ${m}`).join("\n"));
    topLines.push("");
  }

  topLines.push("## Static Methods Not Referenced In Tests\n");
  if (staticUntested.length === 0) {
    topLines.push("All static methods are referenced at least once.\n");
  } else {
    topLines.push(staticUntested.map((m) => `- ${m}`).join("\n"));
    topLines.push("");
  }

  topLines.push("## Detail (per-file hits)\n");
  topLines.push(
    "For deeper inspection, search in the test folder for these methods; this section lists files where each method name appears.\n"
  );

  function detailSection(title, methods, usageMap) {
    const lines = [];
    lines.push(`### ${title}\n`);

    for (const name of methods) {
      const info = usageMap.get(name);
      const files = Object.entries(info.perFile);
      if (files.length === 0) continue;
      lines.push(`- ${name}: ${files.map(([f, c]) => `${f} (${c})`).join(", ")}`);
    }

    lines.push("");
    return lines.join("\n");
  }

  topLines.push(detailSection("Prototype methods", protoMethods, protoUsage));
  topLines.push(detailSection("Static methods", staticMethods, staticUsage));

  const outPath = path.join(repoRoot, "METHOD_TEST_COVERAGE.md");
  fs.writeFileSync(outPath, topLines.join("\n"), "utf8");

  // Print concise summary to stdout.
  console.log(
    JSON.stringify(
      {
        outFile: path.relative(repoRoot, outPath),
        proto: {
          total: protoMethods.length,
          referenced: protoMethods.length - protoUntested.length,
          unreferenced: protoUntested.length,
        },
        static: {
          total: staticMethods.length,
          referenced: staticMethods.length - staticUntested.length,
          unreferenced: staticUntested.length,
        },
        sampleUnreferencedProto: protoUntested.slice(0, 20),
        sampleUnreferencedStatic: staticUntested.slice(0, 20),
      },
      null,
      2
    )
  );
}

main();
