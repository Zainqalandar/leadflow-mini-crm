import "dotenv/config";

const baseUrl = "http://localhost:5000";
const results = [];
const failures = [];

const request = async (path, options = {}) => {
  const headers = {
    ...(options.body ? { "content-type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  let body = {};

  try {
    body = await response.json();
  } catch (_error) {
    // Empty responses such as DELETE 204 are expected.
  }

  return { status: response.status, body };
};

const check = (name, result, expectedStatus) => {
  const passed = result.status === expectedStatus;
  results.push(`${passed ? "PASS" : "FAIL"} ${name}: HTTP ${result.status}`);

  if (!passed) {
    failures.push(name);
  }

  return result;
};

const main = async () => {
  check("health", await request("/health"), 200);

  const login = check(
    "admin login",
    await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      }),
    }),
    200,
  );

  const token = login.body.token;
  if (!token) {
    throw new Error("Login token was not returned. Check ADMIN_EMAIL and ADMIN_PASSWORD in api/.env.");
  }

  const auth = { authorization: `Bearer ${token}` };
  const unique = Date.now();

  const wordpressPayload = {
    name: "WordPress Smoke Test",
    email: `wordpress-smoke-${unique}@example.com`,
    phone: "+92 300 1234567",
    service: "Web Development",
    budgetRange: "10k or above",
    message: "Smoke test lead from the WordPress integration endpoint.",
  };

  const wordpressCreate = check(
    "WordPress lead ingest",
    await request("/api/integrations/wordpress/leads", {
      method: "POST",
      headers: { "x-api-secret": process.env.API_SECRET },
      body: JSON.stringify(wordpressPayload),
    }),
    201,
  );
  const wordpressId = wordpressCreate.body.lead?._id;

  check(
    "duplicate WordPress lead rejected",
    await request("/api/integrations/wordpress/leads", {
      method: "POST",
      headers: { "x-api-secret": process.env.API_SECRET },
      body: JSON.stringify(wordpressPayload),
    }),
    409,
  );

  if (wordpressId) {
    check(
      "delete WordPress smoke lead",
      await request(`/api/leads/${wordpressId}`, { method: "DELETE", headers: auth }),
      204,
    );
  }

  const dashboardPayload = {
    name: "Dashboard Smoke Test",
    email: `dashboard-smoke-${unique}@example.com`,
    phone: "+92 301 7654321",
    service: "E-commerce Development",
    budgetRange: "10k or above",
    message: "Smoke test dashboard lead with enough detail for backend scoring.",
  };

  const created = check(
    "dashboard lead create",
    await request("/api/leads", {
      method: "POST",
      headers: auth,
      body: JSON.stringify(dashboardPayload),
    }),
    201,
  );
  const leadId = created.body.lead?._id;
  if (!leadId) {
    throw new Error("Dashboard lead ID was not returned.");
  }

  check("list leads", await request("/api/leads?page=1&limit=20", { headers: auth }), 200);
  check(
    "search and status filter",
    await request("/api/leads?status=New&q=Dashboard&page=1&limit=20", { headers: auth }),
    200,
  );
  check("get lead", await request(`/api/leads/${leadId}`, { headers: auth }), 200);

  check(
    "update lead",
    await request(`/api/leads/${leadId}`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify({
        ...dashboardPayload,
        name: "Updated Dashboard Smoke Test",
        email: `dashboard-updated-${unique}@example.com`,
      }),
    }),
    200,
  );

  check(
    "change lead status",
    await request(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ status: "Contacted" }),
    }),
    200,
  );

  const stats = check("dashboard stats", await request("/api/leads/stats", { headers: auth }), 200);
  results.push(
    `${typeof stats.body.totalLeads === "number" && stats.body.countsByStatus ? "PASS" : "FAIL"} stats response shape`,
  );

  const insights = check("Angular insights", await request("/api/leads/insights", { headers: auth }), 200);
  results.push(
    `${Array.isArray(insights.body.topLeads) && insights.body.topLeads.length <= 5 ? "PASS" : "FAIL"} insights response shape`,
  );

  check(
    "delete dashboard smoke lead",
    await request(`/api/leads/${leadId}`, { method: "DELETE", headers: auth }),
    204,
  );
  check("deleted lead returns 404", await request(`/api/leads/${leadId}`, { headers: auth }), 404);

  console.log(results.join("\n"));

  if (failures.length) {
    throw new Error(`Failed checks: ${failures.join(", ")}`);
  }
};

main().catch((error) => {
  console.error(`SMOKE TEST FAILED: ${error.message}`);
  process.exitCode = 1;
});
