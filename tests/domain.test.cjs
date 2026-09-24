const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filename,
  });
  module._compile(compiled.outputText, filename);
};

const root = path.resolve(__dirname, "..");
const swagger = JSON.parse(fs.readFileSync(path.join(root, "ourlil-swagger.json"), "utf8"));
const { content } = require("../lib/content.ts");
const {
  allocationFormToCreate,
  allocationFormToPatch,
  batchToValues,
  campaignFormToCreate,
  campaignFormToPatch,
  campaignToValues,
  deviceFormToCreate,
  deviceToValues,
  templateFormToCreate,
  templateFormToPatch,
  templateToValues,
} = require("../lib/edge-service/mappers.ts");
const { serviceFormSchema, validateServiceForm } = require("../lib/edge-service/form-contract.ts");
const { fetchAllPages } = require("../lib/edge-service/pagination.ts");

test("all navigation and card targets have real Next routes", () => {
  const targets = [
    ...content.navigation.map((item) => item.href),
    ...Object.values(content.cards)
      .flat()
      .map((card) => card.href),
  ];
  for (const href of targets) {
    const relative = href === "/" ? "page.tsx" : path.join(href.slice(1), "page.tsx");
    assert.ok(fs.existsSync(path.join(root, "app", "(console)", relative)), href);
  }
});

test("visible navigation contains only resources backed by current service operations", () => {
  assert.deepEqual(
    content.navigation.map((item) => item.key),
    [
      "overview",
      "devices",
      "events",
      "templates",
      "vouchers",
      "sessions",
      "payments",
      "media",
      "insights",
    ],
  );
  for (const removed of ["queue", "history", "settings", "print", "delivery"]) {
    assert.equal(
      content.navigation.some((item) => item.key === removed),
      false,
    );
  }
});

test("camera and printer profiles are opened from devices and return there", () => {
  assert.equal(
    content.cards.templates.some((card) => card.href === "/templates/profiles"),
    false,
  );
  assert.equal(
    content.cards.devices.some((card) => card.href === "/templates/profiles"),
    true,
  );
  const page = fs.readFileSync(
    path.join(root, "components", "profiles", "hardware-profiles-page.tsx"),
    "utf8",
  );
  assert.match(page, /back="\/devices"/);
  assert.equal(page.includes('back="/templates"'), false);
  assert.equal(page.includes("cards.templates"), false);
});

test("voucher batch detail is opened from the list without a second batch picker", () => {
  assert.equal(
    content.cards.vouchers.some((card) => card.href === "/vouchers/allocations"),
    false,
  );
  assert.equal(
    content.cards.vouchers.some((card) => card.href === "/vouchers/ledger"),
    true,
  );
  const editor = fs.readFileSync(
    path.join(root, "app", "(console)", "vouchers", "allocations", "page.tsx"),
    "utf8",
  );
  assert.match(editor, /picker=\{false\}/);
  assert.match(editor, /back="\/vouchers"/);
  const ledger = fs.readFileSync(
    path.join(root, "components", "vouchers", "ledger-page.tsx"),
    "utf8",
  );
  assert.equal(ledger.includes("cards.vouchers[1]"), false);
});

test("frame template detail is opened from the list without a second template picker", () => {
  assert.equal(
    content.cards.templates.some((card) => card.href === "/templates/editor"),
    false,
  );
  assert.equal(
    content.cards.templates.some((card) => card.href === "/templates/sync"),
    true,
  );
  const editor = fs.readFileSync(
    path.join(root, "app", "(console)", "templates", "editor", "page.tsx"),
    "utf8",
  );
  assert.match(editor, /picker=\{false\}/);
  assert.match(editor, /back="\/templates"/);
});

test("campaign detail is opened from the list without a second campaign picker", () => {
  assert.equal(
    (content.cards.events ?? []).some((card) => card.href === "/events/editor"),
    false,
  );
  const editor = fs.readFileSync(
    path.join(root, "app", "(console)", "campaigns", "editor", "page.tsx"),
    "utf8",
  );
  assert.match(editor, /picker=\{false\}/);
  assert.match(editor, /back="\/campaigns"/);
  const topology = fs.readFileSync(
    path.join(root, "components", "events", "deployment-topology.tsx"),
    "utf8",
  );
  assert.equal(topology.includes("scope-picker"), false);
  assert.equal(topology.includes("selectCampaign"), false);
  const overview = fs.readFileSync(
    path.join(root, "components", "pages", "overview-page.tsx"),
    "utf8",
  );
  assert.equal(overview.includes('href="/events"'), false);
  assert.equal(content.navigation.find((item) => item.key === "events")?.href, "/campaigns");
  assert.equal(content.navigation.find((item) => item.key === "insights")?.href, "/reports");
  assert.equal(fs.existsSync(path.join(root, "app", "(console)", "events")), false);
  assert.equal(fs.existsSync(path.join(root, "app", "(console)", "insights")), false);
});

test("devices page is the device list and does not open a duplicate registry", () => {
  assert.equal(
    content.cards.devices.some((card) => card.href === "/devices/registry"),
    false,
  );
  const registry = fs.readFileSync(
    path.join(root, "app", "(console)", "devices", "registry", "page.tsx"),
    "utf8",
  );
  assert.match(registry, /redirect\("\/devices"\)/);
  const detail = fs.readFileSync(
    path.join(root, "components", "devices", "device-detail.tsx"),
    "utf8",
  );
  assert.match(detail, /back="\/devices"/);
  assert.equal(detail.includes("/devices/registry"), false);
});

test("removed PRD-only route components do not remain", () => {
  for (const relative of [
    "app/(console)/queue/page.tsx",
    "app/(console)/history/page.tsx",
    "app/(console)/settings/page.tsx",
    "app/(console)/devices/preflight/page.tsx",
    "app/(console)/templates/validate/page.tsx",
    "app/(console)/vouchers/readiness/page.tsx",
    "components/devices/checks-page.tsx",
    "components/queue/queue-page.tsx",
    "components/history/history-page.tsx",
    "components/settings/trust-page.tsx",
  ]) {
    assert.equal(fs.existsSync(path.join(root, relative)), false, relative);
  }
});

test("every localized value contains English and Indonesian", () => {
  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (
      Object.hasOwn(value, "en") ||
      (Object.hasOwn(value, "id") &&
        Object.keys(value).every((key) => key === "en" || key === "id"))
    ) {
      assert.equal(typeof value.en, "string");
      assert.equal(typeof value.id, "string");
      return;
    }
    Object.values(value).forEach(visit);
  }
  visit(content.ui);
  visit(content.navigation);
  visit(content.modules);
  visit(content.cards);
});

const formMappings = {
  register: {
    schema: "DeviceCreate",
    fields: {
      deviceCode: "device_code",
      name: "name",
      serialNumber: "serial_number",
      status: "status",
      capabilities: "capabilities",
      cameraProfileId: "camera_profile_id",
      printerProfileId: "printer_profile_id",
      appVersion: "app_version",
      lastSeenAt: "last_seen_at",
    },
  },
  campaign: {
    schema: "CampaignCreate",
    fields: {
      name: "name",
      status: "status",
      price: "price",
      sessionLimit: "session_limit",
      activeFrom: "active_from",
      activeUntil: "active_until",
      activationRules: "activation_rules",
      frameSet: "frame_set",
      printPolicy: "print_policy",
      deliveryPolicy: "delivery_policy",
      frameTemplateIds: "frame_template_ids",
    },
  },
  template: {
    schema: "FrameTemplateCreate",
    fields: {
      name: "name",
      version: "version",
      aspect: "aspect",
      checksum: "checksum",
      publishState: "publish_state",
      dimensions: "dimensions",
      safeArea: "safe_area",
      assets: "assets",
      transforms: "transforms",
      previewVariant: "preview_variant",
      printVariant: "print_variant",
      digitalVariant: "digital_variant",
      compatibility: "compatibility",
    },
  },
  allocation: {
    schema: "VoucherBatchCreate",
    fields: {
      campaignId: "campaign_id",
      name: "name",
      voucherCount: "voucher_count",
      entitlementRules: "entitlement_rules",
      offlineEligible: "offline_eligible",
    },
  },
};

test("service forms expose exactly the fields declared by create contracts", () => {
  for (const [formId, definition] of Object.entries(formMappings)) {
    const formFields = serviceFormSchema(formId).groups.flatMap((group) => group.fields);
    assert.deepEqual(
      formFields.map((field) => field.key).sort(),
      Object.keys(definition.fields).sort(),
      formId,
    );
    assert.deepEqual(
      Object.values(definition.fields).sort(),
      Object.keys(swagger.components.schemas[definition.schema].properties).sort(),
      definition.schema,
    );
    const requiredApiFields = swagger.components.schemas[definition.schema].required ?? [];
    assert.deepEqual(
      formFields
        .filter((field) => field.required)
        .map((field) => definition.fields[field.key])
        .sort(),
      [...requiredApiFields].sort(),
      `${formId} required fields`,
    );
  }
});

test("every service form field and option has a complete localized label", () => {
  for (const formId of Object.keys(formMappings)) {
    const schema = serviceFormSchema(formId);
    for (const localized of [
      schema.title,
      ...schema.groups.flatMap((group) => [
        group.title,
        ...group.fields.flatMap((field) => [
          field.label,
          ...(field.options ?? []).map((option) => option.label),
        ]),
      ]),
    ]) {
      assert.equal(typeof localized?.en, "string", `${formId} English label`);
      assert.notEqual(localized.en.trim(), "", `${formId} English label is not empty`);
      assert.equal(typeof localized?.id, "string", `${formId} Indonesian label`);
      assert.notEqual(localized.id.trim(), "", `${formId} Indonesian label is not empty`);
    }
  }
});

test("JSON columns reject invented scalar text but accept objects", () => {
  const invalid = validateServiceForm("campaign", {
    name: "Campaign",
    activationRules: "not-json",
  });
  assert.equal(invalid.activationRules, "invalidJson");
  assert.deepEqual(
    validateServiceForm("campaign", { name: "Campaign", activationRules: '{"mode":"qr"}' }),
    {},
  );
});

test("campaign mapper preserves only API fields and patch sends changes only", () => {
  const values = {
    name: "Launch",
    status: "active",
    price: 50000,
    sessionLimit: 20,
    activeFrom: "2026-09-23T09:00",
    activeUntil: "2026-09-23T18:00",
    activationRules: '{"mode":"voucher"}',
    frameSet: "",
    printPolicy: "",
    deliveryPolicy: "",
    frameTemplateIds: ["tpl-1"],
  };
  const created = campaignFormToCreate(values);
  assert.deepEqual(
    Object.keys(created).sort(),
    Object.keys(swagger.components.schemas.CampaignCreate.properties).sort(),
  );
  assert.equal(created.session_limit, 20);
  assert.deepEqual(created.activation_rules, { mode: "voucher" });
  assert.deepEqual(campaignFormToPatch({ ...values, price: 75000 }, values), { price: 75000 });

  const roundTrip = campaignToValues({
    id: "cmp-1",
    ...created,
    frame_templates: [{ id: "tpl-1", name: "Frame" }],
  });
  assert.deepEqual(roundTrip.frameTemplateIds, ["tpl-1"]);
  assert.equal(roundTrip.sessionLimit, 20);
});

test("device mapper uses DeviceCreate names and keeps optional relations null", () => {
  const created = deviceFormToCreate({
    deviceCode: "BOOTH-01",
    name: "Lobby",
    serialNumber: "SN-01",
    status: "active",
    capabilities: '{"gpu":true}',
    cameraProfileId: "",
    printerProfileId: "",
    appVersion: "2.0.0",
    lastSeenAt: "",
  });
  assert.deepEqual(
    Object.keys(created).sort(),
    Object.keys(swagger.components.schemas.DeviceCreate.properties).sort(),
  );
  assert.equal(created.camera_profile_id, null);
  assert.deepEqual(created.capabilities, { gpu: true });
  assert.equal(deviceToValues({ id: "dev-1", ...created }).deviceCode, "BOOTH-01");
});

test("template and voucher batch mappers round-trip current API shapes", () => {
  const templateValues = {
    name: "Portrait",
    version: "1",
    aspect: "4:6",
    checksum: "abc",
    publishState: "draft",
    assets: "",
    dimensions: "1200x1800",
    safeArea: "",
    transforms: "",
    previewVariant: "",
    printVariant: "",
    digitalVariant: "",
    compatibility: "",
  };
  const template = templateFormToCreate(templateValues);
  assert.equal(templateToValues({ id: "tpl-1", ...template }).dimensions, "1200x1800");
  assert.deepEqual(templateFormToPatch({ ...templateValues, version: "2" }, templateValues), {
    version: "2",
  });

  const batchValues = {
    campaignId: "cmp-1",
    name: "VIP",
    voucherCount: 10,
    entitlementRules: '{"tier":"vip"}',
    offlineEligible: true,
  };
  const batch = allocationFormToCreate(batchValues);
  assert.equal(batch.campaign_id, "cmp-1");
  assert.deepEqual(batch.entitlement_rules, { tier: "vip" });
  assert.equal(batchToValues({ id: "batch-1", ...batch }).voucherCount, 10);
  assert.deepEqual(allocationFormToPatch({ ...batchValues, name: "VIP 2" }, batchValues), {
    name: "VIP 2",
  });
});

test("service pagination follows total_data when the server caps page size", async () => {
  const calls = [];
  const result = await fetchAllPages(async ({ skip, limit }) => {
    calls.push({ skip, limit });
    const all = [1, 2, 3, 4, 5];
    const data = all.slice(skip, skip + 2);
    return { message: "ok", data, pagination: { total_data: all.length, page: 1, limit: 2 } };
  });
  assert.deepEqual(result.data, [1, 2, 3, 4, 5]);
  assert.deepEqual(
    calls.map((call) => call.skip),
    [0, 2, 4],
  );
});
