// local storage key for session
const APP_STORAGE_KEY = "procurement_frontend_session";

const state = {
  apiBase: window.location.origin, // base url for api requests
  session: loadSession(),
  activeTab: "dashboard",
  showAuth: false, // flag for authentication view
};

const endpoints = {
  userLogin: "/api/auth/login",
  userRegister: "/api/auth/register",
  vendorLogin: "/api/vendor-auth/login",
  vendorRegister: "/api/vendor-auth/register",
  vendors: "/vendor/all",
  createVendor: "/vendor/create",
  requisitions: "/com/procurement/requisition/all",
  createRequisition: "/com/procurement/requisition/create",
  purchaseOrders: "/com/procurement/purchase-order/all",
  createPurchaseOrder: "/com/procurement/purchase-order/create",
  approvals: "/com/procurement/approval/all",
  approvePo: (poId, approverId) => `/com/procurement/approval/approve/${poId}?approverId=${approverId}`,
  rejectPo: (poId, approverId, reason) => `/com/procurement/approval/reject/${poId}?approverId=${approverId}&reason=${encodeURIComponent(reason)}`,
  reportVendor: (format = "pdf") => `/reports/vendor?format=${format}`,
  adminPendingUsers: "/api/admin/pending-users",
  adminAllUsers: "/api/admin/all-users",
  adminApproveUser: (id) => `/api/admin/users/${id}/approve`,
  adminRejectUser: (id) => `/api/admin/users/${id}/reject`,
  adminVendorPending: "/api/admin/vendor-accounts/pending",
  adminVendorAll: "/api/admin/vendor-accounts",
  adminApproveVendor: (id) => `/api/admin/vendor-accounts/${id}/approve`,
  adminRejectVendor: (id) => `/api/admin/vendor-accounts/${id}/reject`,
  vendorPortalOrders: "/api/vendor-portal/purchase-orders",
  vendorPortalAccept: (id) => `/api/vendor-portal/purchase-orders/${id}/accept`,
  vendorPortalReject: (id) => `/api/vendor-portal/purchase-orders/${id}/reject`,
  vendorPortalStatus: (id) => `/api/vendor-portal/purchase-orders/${id}/status`,
};

const el = {
  authCard: document.getElementById("authCard"),
  appSection: document.getElementById("appSection"),
  landingSection: document.getElementById("landingSection"),
  getStartedBtn: document.getElementById("getStartedBtn"),
  sessionBadge: document.getElementById("sessionBadge"),
  logoutBtn: document.getElementById("logoutBtn"),
  statusAlert: document.getElementById("statusAlert"),
  tabContent: document.getElementById("tabContent"),
  tabs: document.querySelectorAll("#mainTabs button"),
};

function loadSession() {
  const raw = localStorage.getItem(APP_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    // clear invalid session data
    localStorage.removeItem(APP_STORAGE_KEY);
    return null;
  }
}

// save session to local storage
function persistSession() {
  if (!state.session) {
    localStorage.removeItem(APP_STORAGE_KEY);
    return;
  }
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state.session));
}

function showMessage(message, type = "info") {
  el.statusAlert.className = `alert alert-${type}`;
  el.statusAlert.textContent = message;
}

function clearMessage() {
  el.statusAlert.className = "alert d-none";
  el.statusAlert.textContent = "";
}

function authHeaders(extra = {}) {
  if (!state.session?.token) return extra;
  return {
    ...extra,
    Authorization: `${state.session.type || "Bearer"} ${state.session.token}`,
  };
}

// api fetch wrapper with authentication
async function apiRequest(path, options = {}) {
  const response = await fetch(`${state.apiBase}${path}`, {
    ...options,
    headers: authHeaders({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  // handle both json and text responses
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // parse error message
    const msg = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(msg || `Request failed with ${response.status}`);
  }
  return body;
}

function toRowCells(values) {
  return `<tr>${values.map((v) => `<td>${v ?? "-"}</td>`).join("")}</tr>`;
}

function getRoles() {
  return state.session?.roles || [];
}

function hasRole(role) {
  return getRoles().includes(role);
}

function isVendorSession() {
  return hasRole("ROLE_VENDOR");
}

function setSession(data) {
  state.session = data;
  persistSession();
  render();
}

function logout() {
  state.session = null;
  state.showAuth = false;
  persistSession();
  clearMessage();
  render();
}

function bindAuthForms() {
  document.getElementById("userLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();
    try {
      const form = new FormData(e.target);
      const payload = {
        username: form.get("username"),
        password: form.get("password"),
      };
      const data = await apiRequest(endpoints.userLogin, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSession(data);
      showMessage("User login successful.", "success");
      e.target.reset();
    } catch (err) {
      showMessage(err.message, "danger");
    }
  });

  document.getElementById("vendorLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();
    try {
      const form = new FormData(e.target);
      const payload = { email: form.get("email"), password: form.get("password") };
      const data = await apiRequest(endpoints.vendorLogin, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSession({
        ...data,
        username: data.email,
        id: data.vendorId,
      });
      showMessage("Vendor login successful.", "success");
      e.target.reset();
    } catch (err) {
      showMessage(err.message, "danger");
    }
  });

  document.getElementById("userRegisterForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();
    try {
      const form = new FormData(e.target);
      const payload = {
        username: form.get("username"),
        password: form.get("password"),
        email: form.get("email"),
        fullName: form.get("fullName"),
        role: form.get("role"),
      };
      const data = await apiRequest(endpoints.userRegister, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showMessage(typeof data === "string" ? data : data.message || "User registered.", "success");
      e.target.reset();
    } catch (err) {
      showMessage(err.message, "danger");
    }
  });

  document.getElementById("vendorRegisterForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessage();
    try {
      const form = new FormData(e.target);
      const payload = Object.fromEntries(form.entries());
      const data = await apiRequest(endpoints.vendorRegister, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      showMessage(typeof data === "string" ? data : data.message || "Vendor registration submitted.", "success");
      e.target.reset();
    } catch (err) {
      showMessage(err.message, "danger");
    }
  });
}

function visibleTabs() {
  const vendor = isVendorSession();
  return {
    dashboard: true,
    vendors: !vendor,
    requisitions: !vendor,
    purchaseOrders: !vendor,
    approvals: hasRole("ROLE_PROCUREMENT_MANAGER") || hasRole("ROLE_ADMIN"),
    vendorPortal: vendor,
    admin: hasRole("ROLE_ADMIN"),
    reports: !vendor,
  };
}

// render function updates ui based on state
function render() {
  const loggedIn = Boolean(state.session?.token);

  if (loggedIn) {
    // hide authentication views
    el.landingSection.classList.add("d-none");
    el.authCard.classList.add("d-none");
    el.appSection.classList.remove("d-none");
    el.logoutBtn.classList.remove("d-none");

    const roles = getRoles().join(", ") || "No roles";
    el.sessionBadge.className = "badge badge-success";
    el.sessionBadge.textContent = `${state.session.username} (${roles})`;

    const tabRules = visibleTabs();
    el.tabs.forEach((btn) => {
      const tab = btn.dataset.tab;
      const allowed = tabRules[tab];
      btn.classList.toggle("d-none", !allowed);
      if (!allowed && state.activeTab === tab) {
        state.activeTab = "dashboard";
      }
      btn.classList.toggle("active", state.activeTab === tab);
    });

    renderTab();
  } else {
    el.appSection.classList.add("d-none");
    el.logoutBtn.classList.add("d-none");
    el.sessionBadge.className = "badge badge-primary";
    el.sessionBadge.textContent = "Not logged in";

    if (state.showAuth) {
      el.landingSection.classList.add("d-none");
      el.authCard.classList.remove("d-none");
    } else {
      el.landingSection.classList.remove("d-none");
      el.authCard.classList.add("d-none");
    }
  }
}

function tabShell(title, body) {
  return `
    <div class="card glass-panel">
      <h2 class="card-title text-gradient">${title}</h2>
      ${body}
    </div>
  `;
}

function dashboardView() {
  return tabShell("Dashboard", `
    <p class="mb-2">Welcome to the procurement frontend. Use tabs to perform operational tasks.</p>
    <ul>
      <li>Create and manage vendors, requisitions, and purchase orders.</li>
      <li>Approve or reject purchase orders as manager/admin.</li>
      <li>Use vendor portal actions with vendor accounts.</li>
      <li>Download reports directly from reporting APIs.</li>
    </ul>
  `);
}

function renderDataTable(headers, rows) {
  const h = headers.map((x) => `<th>${x}</th>`).join("");
  const r = rows.length ? rows.join("") : `<tr><td colspan="${headers.length}" class="text-center muted">No records found.</td></tr>`;
  return `<div class="table-wrap"><table class="table"><thead><tr>${h}</tr></thead><tbody>${r}</tbody></table></div>`;
}

async function vendorsView() {
  // retrieve vendor list
  const vendors = await apiRequest(endpoints.vendors);
  const body = `
    <form id="createVendorForm" class="form-row mb-4">
      <input class="form-control" name="name" placeholder="Name" required />
      <input class="form-control" name="email" placeholder="Email" required />
      <input class="form-control" name="contactNumber" placeholder="Contact" />
      <input class="form-control" name="address" placeholder="Address" />
      <button class="btn btn-primary">Add</button>
    </form>
    ${renderDataTable(["ID", "Name", "Email", "Contact", "Status"], vendors.map((v) => toRowCells([v.id, v.name, v.email, v.contactNumber, v.status])))}
  `;
  el.tabContent.innerHTML = tabShell("Vendors", body);
  // event listener for new vendor creation
  document.getElementById("createVendorForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const payload = Object.fromEntries(new FormData(e.target).entries());
      payload.status = "ACTIVE";
      await apiRequest(endpoints.createVendor, { method: "POST", body: JSON.stringify(payload) });
      showMessage("Vendor created.", "success");
      await renderTab();
    } catch (err) {
      showMessage(err.message, "danger");
    }
  });
}

async function requisitionsView() {
  const items = await apiRequest(endpoints.requisitions);
  const body = `
    <form id="createReqForm" class="form-row mb-4">
      <input class="form-control" name="requisitionNumber" placeholder="REQ-2026-001" required />
      <input class="form-control" name="requestedById" placeholder="Requested By User ID" required />
      <input class="form-control" name="itemName" placeholder="Item name" required />
      <input class="form-control" name="quantity" type="number" placeholder="Qty" required />
      <input class="form-control" name="estimatedPrice" type="number" step="0.01" placeholder="Price" required />
      <button class="btn btn-primary">Create Requisition</button>
    </form>
    ${renderDataTable(["ID", "Req Number", "Status", "Requested By"], items.map((r) => toRowCells([r.id, r.requisitionNumber, r.status, r.requestedBy?.id])))}
  `;
  el.tabContent.innerHTML = tabShell("Requisitions", body);
  document.getElementById("createReqForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const form = Object.fromEntries(new FormData(e.target).entries());
      const payload = {
        requisitionNumber: form.requisitionNumber,
        requestedBy: { id: Number(form.requestedById) },
        items: [{ itemName: form.itemName, quantity: Number(form.quantity), estimatedPrice: Number(form.estimatedPrice) }],
      };
      await apiRequest(endpoints.createRequisition, { method: "POST", body: JSON.stringify(payload) });
      showMessage("Requisition created.", "success");
      await renderTab();
    } catch (err) {
      showMessage(err.message, "danger");
    }
  });
}

async function purchaseOrdersView() {
  const orders = await apiRequest(endpoints.purchaseOrders);
  const body = `
    <form id="createPoForm" class="form-row mb-4">
      <input class="form-control" name="poNumber" placeholder="PO-2026-001" required />
      <input class="form-control" name="vendorId" placeholder="Vendor ID" required />
      <input class="form-control" name="itemName" placeholder="Item name" required />
      <input class="form-control" type="number" name="quantity" placeholder="Qty" required />
      <input class="form-control" type="number" step="0.01" name="unitPrice" placeholder="Unit Price" required />
      <button class="btn btn-primary">Create Purchase Order</button>
    </form>
    ${renderDataTable(["ID", "PO Number", "Status", "Vendor ID"], orders.map((p) => toRowCells([p.id, p.poNumber, p.status, p.vendor?.id])))}
  `;
  el.tabContent.innerHTML = tabShell("Purchase Orders", body);
  document.getElementById("createPoForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const f = Object.fromEntries(new FormData(e.target).entries());
      const payload = {
        poNumber: f.poNumber,
        vendor: { id: Number(f.vendorId) },
        status: "PENDING",
        items: [{ itemName: f.itemName, quantity: Number(f.quantity), unitPrice: Number(f.unitPrice) }],
      };
      await apiRequest(endpoints.createPurchaseOrder, { method: "POST", body: JSON.stringify(payload) });
      showMessage("Purchase order created.", "success");
      await renderTab();
    } catch (err) {
      showMessage(err.message, "danger");
    }
  });
}

async function approvalsView() {
  const approvals = await apiRequest(endpoints.approvals);
  const rows = approvals.map((a) => toRowCells([
    a.id,
    a.purchaseOrder?.id,
    a.status,
    a.approvedBy?.id || "-",
    `<button data-a="${a.purchaseOrder?.id}" class="btn btn-sm btn-success me-1 act-approve">Approve</button>
     <button data-r="${a.purchaseOrder?.id}" class="btn btn-sm btn-danger act-reject">Reject</button>`
  ]));
  const body = `
    <p class="muted">Approver ID defaults to your account id if available.</p>
    ${renderDataTable(["Approval ID", "PO ID", "Status", "Approver", "Actions"], rows)}
  `;
  el.tabContent.innerHTML = tabShell("Approvals", body);
  const approverId = state.session.id || prompt("Enter your user ID for approval actions:");
  el.tabContent.querySelectorAll(".act-approve").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await apiRequest(endpoints.approvePo(btn.dataset.a, approverId), { method: "POST", body: "{}" });
        showMessage("PO approved.", "success");
        await renderTab();
      } catch (err) {
        showMessage(err.message, "danger");
      }
    });
  });
  el.tabContent.querySelectorAll(".act-reject").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const reason = prompt("Enter rejection reason:");
      if (!reason) return;
      try {
        await apiRequest(endpoints.rejectPo(btn.dataset.r, approverId, reason), { method: "POST", body: "{}" });
        showMessage("PO rejected.", "warning");
        await renderTab();
      } catch (err) {
        showMessage(err.message, "danger");
      }
    });
  });
}

async function vendorPortalView() {
  const orders = await apiRequest(endpoints.vendorPortalOrders);
  const rows = orders.map((o) => toRowCells([
    o.id,
    o.poNumber,
    o.status,
    `<button data-id="${o.id}" class="btn btn-sm btn-success me-1 vp-accept">Accept</button>
     <button data-id="${o.id}" class="btn btn-sm btn-danger me-1 vp-reject">Reject</button>
     <button data-id="${o.id}" class="btn btn-sm btn-outline-primary vp-status">Mark Delivered</button>`
  ]));
  const body = renderDataTable(["ID", "PO Number", "Status", "Actions"], rows);
  el.tabContent.innerHTML = tabShell("Vendor Portal", body);

  el.tabContent.querySelectorAll(".vp-accept").forEach((btn) => btn.addEventListener("click", () => vendorPortalAction(endpoints.vendorPortalAccept(btn.dataset.id), "PO accepted.")));
  el.tabContent.querySelectorAll(".vp-reject").forEach((btn) => btn.addEventListener("click", () => vendorPortalAction(endpoints.vendorPortalReject(btn.dataset.id), "PO rejected.")));
  el.tabContent.querySelectorAll(".vp-status").forEach((btn) => btn.addEventListener("click", () => vendorPortalAction(endpoints.vendorPortalStatus(btn.dataset.id), "PO status updated.")));
}

async function vendorPortalAction(path, message) {
  try {
    await apiRequest(path, { method: "PUT", body: "{}" });
    showMessage(message, "success");
    await renderTab();
  } catch (err) {
    showMessage(err.message, "danger");
  }
}

async function adminView() {
  const [pendingUsers, allUsers, pendingVendors, allVendors] = await Promise.all([
    apiRequest(endpoints.adminPendingUsers),
    apiRequest(endpoints.adminAllUsers),
    apiRequest(endpoints.adminVendorPending),
    apiRequest(endpoints.adminVendorAll),
  ]);

  const pendingUserRows = pendingUsers.map((u) => toRowCells([
    u.id, u.username, u.email, u.accountStatus,
    `<button data-id="${u.id}" class="btn btn-sm btn-success me-1 au-approve">Approve</button>
     <button data-id="${u.id}" class="btn btn-sm btn-danger au-reject">Reject</button>`
  ]));
  const allUserRows = allUsers.map((u) => toRowCells([u.id, u.username, u.email, u.accountStatus]));
  const pendingVendorRows = pendingVendors.map((v) => toRowCells([
    v.id, v.email, v.status,
    `<button data-id="${v.id}" class="btn btn-sm btn-success me-1 av-approve">Approve</button>
     <button data-id="${v.id}" class="btn btn-sm btn-danger av-reject">Reject</button>`
  ]));
  const allVendorRows = allVendors.map((v) => toRowCells([v.id, v.email, v.status, v.vendor?.name]));

  const body = `
    <h3 class="section-title">Pending User Approvals</h3>
    ${renderDataTable(["ID", "Username", "Email", "Status", "Actions"], pendingUserRows)}
    <h3 class="section-title">All Users</h3>
    ${renderDataTable(["ID", "Username", "Email", "Status"], allUserRows)}
    <h3 class="section-title">Pending Vendor Accounts</h3>
    ${renderDataTable(["ID", "Email", "Status", "Actions"], pendingVendorRows)}
    <h3 class="section-title">All Vendor Accounts</h3>
    ${renderDataTable(["ID", "Email", "Status", "Company"], allVendorRows)}
  `;
  el.tabContent.innerHTML = tabShell("Admin Control Center", body);

  bindAdminButtons("au-approve", (id) => apiRequest(endpoints.adminApproveUser(id), { method: "PUT", body: "{}" }), "User approved.");
  bindAdminButtons("au-reject", (id) => apiRequest(endpoints.adminRejectUser(id), { method: "PUT", body: "{}" }), "User rejected.");
  bindAdminButtons("av-approve", (id) => apiRequest(endpoints.adminApproveVendor(id), { method: "PUT", body: "{}" }), "Vendor approved.");
  bindAdminButtons("av-reject", (id) => apiRequest(endpoints.adminRejectVendor(id), { method: "PUT", body: "{}" }), "Vendor rejected.");
}

function bindAdminButtons(className, action, successMessage) {
  el.tabContent.querySelectorAll(`.${className}`).forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await action(btn.dataset.id);
        showMessage(successMessage, "success");
        await renderTab();
      } catch (err) {
        showMessage(err.message, "danger");
      }
    });
  });
}

async function reportsView() {
  const body = `
    <form id="vendorReportForm" class="form-row">
      <input class="form-control" type="number" name="vendorId" placeholder="Vendor ID" />
      <input class="form-control" type="number" name="poId" placeholder="PO ID" />
      <input class="form-control" type="date" name="startDate" />
      <input class="form-control" type="date" name="endDate" />
      <button class="btn btn-primary" data-format="pdf">Download PDF</button>
      <button class="btn btn-outline-primary" data-format="excel">Download Excel</button>
    </form>
  `;
  el.tabContent.innerHTML = tabShell("Reports", body);

  const form = document.getElementById("vendorReportForm");
  form.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const format = btn.dataset.format;
      const values = Object.fromEntries(new FormData(form).entries());
      const payload = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ""));
      try {
        const response = await fetch(`${state.apiBase}${endpoints.reportVendor(format)}`, {
          method: "POST",
          headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vendor-report.${format === "excel" ? "xlsx" : "pdf"}`;
        a.click();
        URL.revokeObjectURL(url);
        showMessage("Report downloaded.", "success");
      } catch (err) {
        showMessage(err.message, "danger");
      }
    });
  });
}

async function renderTab() {
  const tab = state.activeTab;
  clearMessage();
  try {
    if (tab === "dashboard") el.tabContent.innerHTML = dashboardView();
    if (tab === "vendors") await vendorsView();
    if (tab === "requisitions") await requisitionsView();
    if (tab === "purchaseOrders") await purchaseOrdersView();
    if (tab === "approvals") await approvalsView();
    if (tab === "vendorPortal") await vendorPortalView();
    if (tab === "admin") await adminView();
    if (tab === "reports") await reportsView();
  } catch (err) {
    el.tabContent.innerHTML = tabShell("Error", `<p class="text-danger mb-0">${err.message}</p>`);
  }
}

function bindGlobalEvents() {
  el.logoutBtn.addEventListener("click", logout);
  if (el.getStartedBtn) {
    el.getStartedBtn.addEventListener("click", () => {
      state.showAuth = true;
      render();
    });
  }
  el.tabs.forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.activeTab = btn.dataset.tab;
      render();
    });
  });
}

function init() {
  bindAuthForms();
  bindGlobalEvents();
  render();
}

init();
