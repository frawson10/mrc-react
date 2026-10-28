import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const dom = new JSDOM(
  '<!doctype html><html><body><div id="test-root"></div></body></html>',
  { url: "https://example.test" },
);
for (const name of [
  "window",
  "document",
  "HTMLElement",
  "HTMLInputElement",
  "Event",
  "MouseEvent",
  "sessionStorage",
])
  Object.defineProperty(globalThis, name, {
    value: dom.window[name],
    configurable: true,
    writable: true,
  });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
const { createElement, act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { MemoryRouter, useNavigate } = await import("react-router-dom");
const { AdminPage, CancellationPage, ConfirmationPage } = await import(
  "../.test-server/test-entry.mjs"
);
const container = document.getElementById("test-root");
const response = (data) =>
  new Response(JSON.stringify({ data }), { status: 200 });
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function button(label) {
  const element = [...container.querySelectorAll("button")].find(
    (item) => item.textContent.trim() === label,
  );
  assert.ok(element, `Button ${label} exists`);
  return element;
}
async function click(element) {
  await act(async () =>
    element.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
}
async function enter(element, value) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
let navigate;
function Harness({ component }) {
  navigate = useNavigate();
  return createElement(component);
}
async function mount(component, path) {
  const root = createRoot(container);
  await act(async () =>
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(Harness, { component }),
      ),
    ),
  );
  return root;
}
async function unmount(root) {
  await act(async () => root.unmount());
  sessionStorage.clear();
}
test("late admin refresh cannot restore a logged-out session or guest data", async () => {
  sessionStorage.setItem("mrc_admin_session", "test-session");
  const pending = deferred();
  let reads = 0;
  globalThis.fetch = async (url) => {
    if (url.endsWith("getAdminReservations")) {
      reads += 1;
      return reads === 1
        ? response({
            success: true,
            reservationsBySuite: {
              "St. Scholastica": [
                {
                  reservationId: "private-record",
                  name: "Private Test Guest",
                  startDate: "2027-03-01",
                  endDate: "2027-03-03",
                },
              ],
            },
          })
        : pending.promise;
    }
    if (url.endsWith("logoutAdminSession")) return response({ success: true });
    throw new Error("Unexpected request");
  };
  const root = await mount(AdminPage, "/admin");
  assert.ok(container.textContent.includes("Log out"));
  await click(button("Refresh"));
  await click(button("Log out"));
  await act(async () =>
    pending.resolve(
      response({
        success: true,
        reservationsBySuite: {
          "St. Scholastica": [
            {
              name: "Private Test Guest",
              startDate: "2027-03-01",
              endDate: "2027-03-03",
            },
          ],
        },
      }),
    ),
  );
  assert.equal(sessionStorage.getItem("mrc_admin_session"), null);
  assert.equal(container.textContent.includes("Private Test Guest"), false);
  assert.ok(container.querySelector('input[type="password"]'));
  await unmount(root);
});
test("expired admin session removes the token and private records", async () => {
  sessionStorage.setItem("mrc_admin_session", "expired");
  globalThis.fetch = async () =>
    response({
      success: false,
      sessionExpired: true,
      error: "Session expired.",
    });
  const root = await mount(AdminPage, "/admin");
  assert.equal(sessionStorage.getItem("mrc_admin_session"), null);
  assert.ok(container.textContent.includes("Session expired."));
  await unmount(root);
});
test("stale lookup cannot replace a new token preview, and cancellation uses the verified token", async () => {
  const pending = deferred();
  const calls = [];
  globalThis.fetch = async (url, options) => {
    const data = JSON.parse(options.body).data;
    calls.push({ url, data });
    if (url.endsWith("lookupReservationForCancellation"))
      return pending.promise;
    if (url.endsWith("getCancellableReservation"))
      return response({
        success: true,
        reservationId: "reservationB",
        name: "Guest B",
        suite: "St. Benedict",
        startDate: "2027-03-10",
        endDate: "2027-03-12",
      });
    if (url.endsWith("cancelReservationByToken"))
      return response({
        success: true,
        reservationId: "reservationB",
        status: "cancelled",
      });
    throw new Error("Unexpected request");
  };
  const root = await mount(CancellationPage, "/cancel-reservation");
  const fields = container.querySelectorAll("input");
  await enter(fields[0], "reservationA");
  await enter(fields[1], "a@example.test");
  await act(async () =>
    container
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
  assert.ok(fields[0].disabled && fields[1].disabled);
  await act(async () => navigate("/cancel-reservation?token=verified-token-B"));
  await act(async () =>
    pending.resolve(
      response({
        success: true,
        reservationId: "reservationA",
        name: "Guest A",
      }),
    ),
  );
  assert.ok(container.textContent.includes("Guest B"));
  assert.equal(container.textContent.includes("Guest A"), false);
  await click(button("Cancel this reservation"));
  await click(button("Confirm cancellation"));
  const cancellation = calls.find((call) =>
    call.url.endsWith("cancelReservationByToken"),
  );
  assert.deepEqual(cancellation.data, { token: "verified-token-B" });
  await unmount(root);
});
test("changing a loading confirmation to a cancelled route clears the spinner", async () => {
  const pending = deferred();
  globalThis.fetch = async () => pending.promise;
  const root = await mount(
    ConfirmationPage,
    "/reservation/confirm?session_id=cs_test_pending",
  );
  assert.ok(container.textContent.includes("Checking your payment"));
  await act(async () => navigate("/reservation/confirm?checkout=cancelled"));
  assert.equal(container.textContent.includes("Checking your payment"), false);
  assert.ok(container.textContent.includes("Checkout cancelled"));
  await act(async () =>
    pending.resolve(
      response({ success: true, paymentReceived: true, status: "confirmed" }),
    ),
  );
  assert.equal(container.textContent.includes("Reservation confirmed"), false);
  await unmount(root);
});
