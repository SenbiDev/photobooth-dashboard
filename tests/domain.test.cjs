const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Test the actual TypeScript domain modules without adding a runtime dependency.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(compiled.outputText, filename);
};

const { content } = require("../lib/content.ts");
const { eventReady, inventoryReady } = require("../lib/readiness.ts");
const { publishScope, validateReferences } = require("../lib/reference-validation.ts");
const {
  defaults,
  initialState,
  effectiveValues,
  effectiveRuntime,
  validateValues,
  eligibleJob,
  retryJobs,
  retryDelay,
  diffValues,
  isConsoleState,
} = require("../lib/domain.ts");
const {
  saveDraft,
  validateDraft,
  publishDraft,
  createRecord,
  requestCommand,
} = require("../lib/mutations.ts");

test("all navigation and card targets have real Next folder routes", () => {
  const targets = [
    ...content.navigation.map((item) => item.href),
    ...Object.values(content.cards)
      .flat()
      .map((card) => card.href),
  ];
  for (const href of targets) {
    assert.ok(fs.existsSync(path.join(__dirname, "../app/(console)", href, "page.tsx")), href);
  }
});

test("every localized value contains English and Indonesian", () => {
  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (
      Object.hasOwn(value, "en") ||
      (Object.hasOwn(value, "id") &&
        typeof value.id === "string" &&
        Object.keys(value).length === 2)
    ) {
      if (Object.hasOwn(value, "en")) {
        assert.equal(typeof value.en, "string");
        assert.equal(typeof value.id, "string");
        assert.ok(value.en && value.id);
      }
    }
    Object.values(value).forEach(visit);
  }
  visit(content);
});

test("form contracts have unique fields, defined defaults and valid example values", () => {
  for (const [id, schema] of Object.entries(content.schemas)) {
    const fields = schema.groups.flatMap((group) => group.fields);
    assert.equal(new Set(fields.map((field) => field.key)).size, fields.length, id);
    for (const field of fields) assert.notEqual(field.default, undefined, `${id}.${field.key}`);
    const values = {
      ...defaults(schema),
      reason: "QA",
      name: "QA",
      email: "q@example.com",
      id: "QA-01",
      location: "QA",
    };
    assert.deepEqual(validateValues(schema, values), {}, id);
  }
});

test("null inherits, false and zero override; inputs remain immutable", () => {
  const base = { enabled: true, count: 2, duration: 240 };
  assert.deepEqual(effectiveValues(base, { enabled: false, count: 0, duration: null }), {
    enabled: false,
    count: 0,
    duration: 240,
  });
  assert.equal(base.enabled, true);
});

test("onsite overrides expire and restore lower-precedence values", () => {
  const values = {
    ...defaults(content.schemas.runtime),
    eventLayer: '{"retakes":1}',
    onsite: '{"retakes":0}',
    overrideExpires: "2030-01-01T00:00:00Z",
  };
  assert.equal(effectiveRuntime(values, Date.parse("2029-01-01")).retakes, 0);
  assert.equal(effectiveRuntime(values, Date.parse("2031-01-01")).retakes, 1);
});

test("dates, quotas, offline payment and retention cannot bypass safety guards", () => {
  assert.ok(
    validateValues(content.schemas.event, {
      ...defaults(content.schemas.event),
      validUntil: "2020-01-01",
      activation: "PAYG_QRIS",
      paymentRequired: false,
    }).paymentRequired,
  );
  assert.ok(
    validateValues(content.schemas.rules, {
      ...defaults(content.schemas.rules),
      offlinePayment: "ALLOW",
    }).offlinePayment,
  );
  assert.ok(
    validateValues(content.schemas.retention, {
      ...defaults(content.schemas.retention),
      protectUnacked: false,
    }).protectUnacked,
  );
  assert.ok(
    validateValues(content.schemas.allocation, {
      ...defaults(content.schemas.allocation),
      requestedCount: 10,
      offlineLimit: 11,
    }).offlineLimit,
  );
});

test("templates reject out-of-canvas slots, duplicate IDs and unsafe placeholders", () => {
  const values = defaults(content.schemas.template);
  const slots = JSON.parse(values.slots);
  slots[0].x = 10000;
  assert.ok(
    validateValues(content.schemas.template, { ...values, slots: JSON.stringify(slots) }).slots,
  );
  slots[0].x = 60;
  slots[1].id = slots[0].id;
  assert.ok(
    validateValues(content.schemas.template, { ...values, slots: JSON.stringify(slots) }).slots,
  );
  assert.ok(
    validateValues(content.schemas.template, { ...values, placeholder: "eval(script)" })
      .placeholder,
  );
});

test("safe retry excludes offline, dead-letter and active leases, preserving idempotency", () => {
  const state = initialState();
  assert.ok(eligibleJob(state.jobs[0], state));
  assert.ok(eligibleJob(state.jobs[2], state));
  assert.equal(eligibleJob(state.jobs[3], state), false);
  assert.equal(eligibleJob(state.jobs[4], state), false);
  assert.equal(eligibleJob(state.jobs[5], state), false);
  const next = retryJobs(
    state,
    state.jobs.map((job) => job.id),
  );
  assert.equal(next.jobs[0].status, "QUEUED");
  assert.equal(next.jobs[0].attempts, state.jobs[0].attempts);
  assert.equal(next.jobs[0].idempotency, state.jobs[0].idempotency);
  assert.equal(next.jobs[5].status, "DEAD_LETTER");
  assert.equal(state.jobs[0].status, "FAILED_RETRYABLE");
});

test("full jitter stays within exponential cap", () => {
  assert.equal(retryDelay(0, 30, 600, 1), 30);
  assert.equal(retryDelay(20, 30, 600, 1), 600);
  assert.equal(retryDelay(5, 30, 600, 0), 0);
});

test("publish requires validated exact draft and reauthentication; never fabricates acknowledgement", () => {
  const initial = initialState();
  const values = { ...defaults(content.schemas.event), reason: "QA" };
  const draft = saveDraft(initial, "event:EVT-001", values);
  assert.equal(publishDraft(draft, "event:EVT-001", "event", true), draft);
  const validated = validateDraft(draft, "event:EVT-001", "event");
  assert.equal(publishDraft(validated, "event:EVT-001", "event", false), validated);
  const published = publishDraft(validated, "event:EVT-001", "event", true);
  assert.equal(published.revisions.length, initial.revisions.length + 1);
  assert.equal(published.devices[0].active, 142);
  assert.equal(published.devices[0].desired, 143);
  assert.equal(published.devices[1].desired, 142);
  values.retakes = 99;
  assert.equal(published.revisions.at(-1).values.retakes, 2);
});

test("registration stays pending and duplicate identifiers are rejected", () => {
  const state = initialState();
  const values = {
    ...defaults(content.schemas.register),
    id: "QA-NEW",
    name: "QA",
    location: "QA",
  };
  const next = createRecord(state, "register", values);
  assert.equal(next.devices.at(-1).status, "PENDING_ENROLLMENT");
  assert.equal(next.devices.at(-1).active, 0);
  assert.equal(createRecord(next, "register", values), next);
});

test("invitation addresses are masked and no credentials are created", () => {
  const state = initialState();
  const values = {
    ...defaults(content.schemas.invite),
    name: "QA",
    email: "tester@example.com",
    reason: "QA",
  };
  const next = createRecord(state, "invite", values);
  assert.equal(next.entities.operators.at(-1).values.email, "t***@example.com");
  assert.equal(next.entities.operators.at(-1).status, "DRAFT");
});

test("commands are allowlisted, audited, pending and never change device trust locally", () => {
  const state = initialState();
  assert.equal(requestCommand(state, state.devices[0].id, "shell", "QA", true), state);
  assert.equal(requestCommand(state, state.devices[0].id, "revoke", "QA", false), state);
  const next = requestCommand(state, state.devices[0].id, "revoke", "QA", true);
  assert.equal(next.commands[0].status, "PENDING");
  assert.equal(next.devices[0].trust, "TRUSTED");
  assert.equal(next.audit.length, 1);
});

test("diff uses actual changed fields; local state has a version boundary", () => {
  assert.equal(diffValues({ a: 1, b: false }, { a: 2, b: false }).length, 1);
  assert.equal(isConsoleState(initialState()), true);
  assert.equal(isConsoleState({ version: 1 }), false);
  assert.equal(isConsoleState(null), false);
});

test("offline admission checks signed allocation, event scope and timezone window", () => {
  const state = initialState();
  const now = new Date("2026-09-08T03:00:00Z");
  assert.equal(eventReady(state, state.devices[0], now), true);
  assert.equal(inventoryReady(state, state.devices[0], now), true);
  assert.equal(inventoryReady(state, state.devices[2], now), false);
  assert.equal(eventReady(state, state.devices[0], new Date("2030-01-01")), false);
  state.entities.allocations[0].status = "UNSIGNED_REQUEST";
  assert.equal(inventoryReady(state, state.devices[0], now), false);
});

test("rollout cannot include devices outside the event allowlist", () => {
  const state = initialState();
  const values = { ...defaults(content.schemas.event), rollout: "all" };
  assert.deepEqual(publishScope(state, values), ["LIL-BOOTH-014", "LIL-BOOTH-009"]);
  assert.ok(validateReferences(state, "event", { ...values, deviceId: "UNKNOWN" }).deviceId);
});

test("allocation publication never mints balance or overwrites a signed allocation", () => {
  const state = initialState();
  const values = {
    ...defaults(content.schemas.allocation),
    available: 116,
    reserved: 1,
    consumed: 1,
    reason: "QA",
  };
  const draft = validateDraft(
    saveDraft(state, "allocation:ALC-007", values),
    "allocation:ALC-007",
    "allocation",
  );
  const next = publishDraft(draft, "allocation:ALC-007", "allocation", true);
  assert.equal(next.entities.allocations[0].values.available, 116);
  assert.equal(next.entities.allocations.at(-1).status, "UNSIGNED_REQUEST");
  assert.equal(next.entities.allocations.at(-1).values.available, undefined);
  assert.equal(next.devices[0].desired, state.devices[0].desired);
  assert.ok(validateReferences(next, "allocation", values).version);
});

test("published template versions cannot be overwritten", () => {
  const state = initialState();
  assert.ok(
    validateReferences(state, "template", { ...defaults(content.schemas.template), version: 12 })
      .version,
  );
  assert.equal(
    validateReferences(state, "template", {
      ...defaults(content.schemas.template),
      reason: "QA",
      version: 13,
    }).version,
    undefined,
  );
});
