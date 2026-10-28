import test from "node:test";
import assert from "node:assert/strict";
import {
  createReservationApi,
  nightsBetween,
  validateStay,
  serializeBookingDate,
  validDateKey,
  formatDate,
  addDays,
  reservationStatus,
  isBlockingReservation,
  canAdminCancel,
} from "../.test-server/test-entry.mjs";
const input = {
  suite: "St. Scholastica",
  name: "Test Guest",
  email: "guest@example.test",
  phone: "555-0100",
  message: "",
  startDate: "2027-03-13",
  endDate: "2027-03-15",
};
function mockApi(result, paused = false) {
  const calls = [];
  return {
    calls,
    api: createReservationApi({
      baseUrl: "https://example.test",
      publicPaused: paused,
      fetcher: async (url, options) => {
        calls.push({ url, ...options, payload: JSON.parse(options.body) });
        return new Response(JSON.stringify({ data: result }), { status: 200 });
      },
    }),
  };
}
test("public pause prevents any Checkout network request", async () => {
  const { api, calls } = mockApi({ success: true }, true);
  assert.equal(
    (await api.checkout(input, "https://example.test")).success,
    false,
  );
  assert.equal(calls.length, 0);
});
test("one checkout call uses current onRequest envelope and exact suite/date contract", async () => {
  const { api, calls } = mockApi({
    success: true,
    checkoutUrl: "https://checkout.stripe.com/c/test",
  });
  await api.checkout(input, "http://localhost:5173");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://example.test/mrc-createSuiteReservation");
  assert.deepEqual(calls[0].payload.data, {
    ...input,
    origin: "http://localhost:5173",
    startDate: "2027-03-13T12:00:00.000Z",
    endDate: "2027-03-15T12:00:00.000Z",
  });
  assert.equal("holdToken" in calls[0].payload.data, false);
});
test("HTTP 200 business failures remain failures and do not retry", async () => {
  const { api, calls } = mockApi({
    success: false,
    error: "Selected dates are no longer available",
  });
  const result = await api.checkout(input, "http://localhost:5173");
  assert.equal(result.success, false);
  assert.match(result.error, /no longer available/);
  assert.equal(calls.length, 1);
});
test("unpaid or expired confirmation cannot become confirmed", async () => {
  for (const checkoutState of ["pending_payment", "expired"]) {
    const { api } = mockApi({
      success: false,
      checkoutState,
      error: "Payment has not completed yet.",
    });
    const result = await api.confirm("cs_test_example");
    assert.equal(result.success, false);
    assert.equal(result.checkoutState, checkoutState);
  }
});
test("cancellation lookup uses reservationID while output IDs stay unchanged", async () => {
  const { api, calls } = mockApi({
    success: true,
    reservationId: "legacyReservation123",
  });
  assert.equal(
    (await api.cancellationLookup("legacyReservation123", "guest@example.test"))
      .reservationId,
    "legacyReservation123",
  );
  await api.cancelLookup("legacyReservation123", "guest@example.test");
  await api.cancelToken("abcd");
  assert.deepEqual(calls[0].payload, {
    data: {
      reservationID: "legacyReservation123",
      email: "guest@example.test",
    },
  });
  assert.deepEqual(calls[2].payload, { data: { token: "abcd" } });
});
test("admin requests preserve protected session and no public seven-night ceiling", async () => {
  const { api, calls } = mockApi({ success: true });
  await api.adminCreate({ ...input, endDate: "2027-04-15" }, "session");
  assert.equal(calls[0].payload.data.sessionToken, "session");
  assert.equal("origin" in calls[0].payload.data, false);
  assert.equal(
    validateStay("2027-03-13", "2027-04-15", [], true, "2027-01-01"),
    "",
  );
});
test("session-expired and refund restrictions are passed through accurately", async () => {
  const { api } = mockApi({
    success: false,
    sessionExpired: true,
    error: "Your session has expired.",
  });
  assert.equal((await api.adminReservations("expired")).sessionExpired, true);
  const restriction = mockApi({
    success: false,
    error: "This paid reservation has no Stripe payment reference.",
  });
  assert.match(
    (await restriction.api.adminCancel("id", "St. Benedict", "token")).error,
    /no Stripe payment reference/,
  );
});
test("public date rules allow one and seven nights, reject zero and eight", () => {
  assert.equal(
    validateStay("2027-03-01", "2027-03-02", [], false, "2027-01-01"),
    "",
  );
  assert.equal(
    validateStay("2027-03-01", "2027-03-08", [], false, "2027-01-01"),
    "",
  );
  assert.ok(validateStay("2027-03-01", "2027-03-01", [], false, "2027-01-01"));
  assert.ok(validateStay("2027-03-01", "2027-03-09", [], false, "2027-01-01"));
});
test("checkout dates are exclusive; an occupied checkout day is valid", () => {
  assert.equal(
    validateStay(
      "2027-03-01",
      "2027-03-03",
      ["2027-03-03"],
      false,
      "2027-01-01",
    ),
    "",
  );
  assert.ok(
    validateStay(
      "2027-03-01",
      "2027-03-04",
      ["2027-03-03"],
      false,
      "2027-01-01",
    ),
  );
});
test("date arithmetic and serialization stay stable across DST and visitor timezones", () => {
  for (const tz of [
    "America/Los_Angeles",
    "Pacific/Auckland",
    "Asia/Tokyo",
    "UTC",
  ]) {
    process.env.TZ = tz;
    assert.equal(nightsBetween("2027-03-13", "2027-03-15"), 2);
    assert.equal(nightsBetween("2027-11-06", "2027-11-08"), 2);
    assert.equal(
      serializeBookingDate("2027-03-13"),
      "2027-03-13T12:00:00.000Z",
    );
    assert.match(formatDate("2027-03-13"), /Mar 13/);
    assert.equal(addDays("2027-03-13", 1), "2027-03-14");
  }
  assert.equal(validDateKey("2027-02-30"), false);
});
test("legacy reservations block dates; expired and cancelled records do not", () => {
  assert.equal(reservationStatus({}), "confirmed");
  assert.equal(isBlockingReservation({ paymentReceived: true }), true);
  assert.equal(
    isBlockingReservation({ status: "cancelled", paymentReceived: true }),
    false,
  );
  assert.equal(
    isBlockingReservation({
      status: "pending_payment",
      paymentDeadline: "2020-01-01",
    }),
    false,
  );
  assert.equal(
    isBlockingReservation({
      status: "pending_payment",
      paymentDeadline: "2099-01-01",
    }),
    true,
  );
});
test("admin cancellation remains future-only", () => {
  assert.equal(
    canAdminCancel(
      { startDate: "2027-03-02", status: "confirmed" },
      "2027-03-01",
    ),
    true,
  );
  assert.equal(
    canAdminCancel(
      { startDate: "2027-03-01", status: "confirmed" },
      "2027-03-01",
    ),
    false,
  );
});
