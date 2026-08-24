const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const frontendRoot = path.join(root, "ai-recruitment-frontend", "src");
const controllerRoot = path.join(root, "RecruitmentBackend", "RecruitmentBackend", "Controllers");

function walk(directory, extensions) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath, extensions));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) files.push(fullPath);
  }
  return files;
}

function normalizeRoute(route) {
  return route
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\/api\//i, "/")
    .replace(/^api\//i, "")
    .replace(/^\//, "")
    .split("?")[0]
    .replace(/\$\{[^}]+\}/g, "{param}")
    .replace(/\{[^}]+\}/g, "{param}")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function routesMatch(frontendRoute, backendRoute) {
  const frontSegments = normalizeRoute(frontendRoute).split("/").filter(Boolean);
  const backSegments = normalizeRoute(backendRoute).split("/").filter(Boolean);
  if (frontSegments.length !== backSegments.length) return false;
  return frontSegments.every((segment, index) => {
    const backendSegment = backSegments[index];
    return segment === "{param}" || backendSegment === "{param}" || segment === backendSegment;
  });
}

const backendRoutes = [];
for (const file of walk(controllerRoot, [".cs"])) {
  const source = fs.readFileSync(file, "utf8");
  const controllerName = path.basename(file, ".cs").replace(/Controller$/, "");
  const baseMatch = source.match(/\[Route\(\s*"([^"]+)"\s*\)\]/i);
  if (!baseMatch) continue;
  const baseRoute = baseMatch[1].replace(/\[controller\]/gi, controllerName);
  const httpPattern = /\[Http(Get|Post|Put|Delete|Patch)(?:\(\s*"([^"]*)"\s*\))?\]/gi;
  let match;
  while ((match = httpPattern.exec(source))) {
    backendRoutes.push({
      method: match[1].toUpperCase(),
      route: [baseRoute, match[2] || ""].filter(Boolean).join("/"),
      file: path.relative(root, file),
    });
  }
}

const frontendCalls = [];
for (const file of walk(frontendRoot, [".ts", ".tsx"])) {
  const source = fs.readFileSync(file, "utf8");
  const callPattern = /axiosClient\.(get|post|put|delete|patch)(?:<[^()]*?>)?\s*\(\s*([`'"])(.*?)\2/gis;
  let match;
  while ((match = callPattern.exec(source))) {
    const route = match[3];
    if (!route.startsWith("/") && !route.startsWith("http")) continue;
    frontendCalls.push({
      method: match[1].toUpperCase(),
      route,
      file: path.relative(root, file),
      line: source.slice(0, match.index).split(/\r?\n/).length,
    });
  }
}

const unmatched = frontendCalls.filter((call) =>
  !backendRoutes.some((route) => route.method === call.method && routesMatch(call.route, route.route))
);

console.log(`Frontend calls found: ${frontendCalls.length}`);
console.log(`Backend routes found: ${backendRoutes.length}`);
console.log(`Potential unmatched calls: ${unmatched.length}`);
for (const call of unmatched) {
  console.log(`${call.method} ${call.route} | ${call.file}:${call.line}`);
}

process.exitCode = unmatched.length > 0 ? 2 : 0;
