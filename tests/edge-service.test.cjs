const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const swagger = JSON.parse(fs.readFileSync(path.join(root, "ourlil-swagger.json"), "utf8"));
const client = fs.readFileSync(path.join(root, "lib", "edge-service", "client.ts"), "utf8");
const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");

const operations = Object.entries(swagger.paths).flatMap(([route, methods]) =>
  Object.entries(methods)
    .filter(([method]) => ["get", "post", "patch", "put", "delete"].includes(method))
    .map(([method, operation]) => ({ route, method, operation })),
);

test("service uses the host root without an /api prefix", () => {
  assert.match(client, /https:\/\/ourlilphotobooth\.fastapicloud\.dev/);
  assert.doesNotMatch(client, /fastapicloud\.dev\/api/);
  assert.match(
    envExample,
    /NEXT_PUBLIC_EDGE_API_URL=https:\/\/ourlilphotobooth\.fastapicloud\.dev/,
  );
});

test("all Swagger operations require the bearer access token", () => {
  for (const { route, method, operation } of operations) {
    assert.deepEqual(
      operation.security,
      [{ HTTPBearer: [] }],
      `${method.toUpperCase()} ${route} must use HTTPBearer`,
    );
  }
  assert.deepEqual(swagger.components.securitySchemes.HTTPBearer, {
    type: "http",
    scheme: "bearer",
  });
  assert.match(client, /Cookies\.get\("access_token"\)/);
  assert.match(client, /Bearer \$\{token\}/);
});

test("client covers every product resource represented in the dashboard", () => {
  for (const route of [
    "/campaigns",
    "/booths",
    "/devices",
    "/device_assignments",
    "/sessions",
    "/camera-profiles",
    "/printer-profiles",
    "/frame-templates",
    "/voucher_batches",
    "/vouchers",
    "/payments",
    "/device-history",
    "/reports/revenue/daily",
    "/reports/sessions/funnel",
  ]) {
    assert.ok(swagger.paths[route], `${route} is missing from Swagger`);
    assert.ok(client.includes(`"${route}"`), `${route} is missing from the service client`);
  }
});

test("unsupported PRD modules are not fabricated as service endpoints", () => {
  for (const route of ["/queue", "/media", "/print", "/delivery", "/config-history", "/roles"]) {
    assert.equal(swagger.paths[route], undefined);
  }
});
