// Explicit localhost-only interface fixture. No Firebase, Stripe, or email access.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const token = `${"a".repeat(32)}.${"b".repeat(64)}`;
const names = ["St. Scholastica", "St. Benedict", "St. Romuald"];
const day = (offset) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
let counter = 1;
const records = [
  {
    success: true,
    reservationId: "fixtureReservation001",
    suite: names[0],
    name: "Sample Retreat Guest",
    email: "guest@example.test",
    phone: "555-0100",
    message: "Synthetic local test record",
    startDate: day(10),
    endDate: day(12),
    nights: 2,
    depositAmount: 12000,
    paymentReceived: true,
    paymentIntentId: "pi_fixture",
    status: "confirmed",
  },
];
const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Content-Type", "application/json");
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  if (request.method !== "POST") {
    response.writeHead(405);
    response.end();
    return;
  }
  const name = request.url.split("/").pop().replace(/^mrc-/, "");
  let raw = "";
  for await (const part of request) raw += part;
  let input;
  try {
    input = JSON.parse(raw).data;
    if (!input) throw new Error();
  } catch {
    response.writeHead(400);
    response.end(JSON.stringify({ error: "Expected data envelope" }));
    return;
  }
  console.log(`Local fixture: ${name}`);
  let result = { success: false, error: "Unknown local fixture operation." };
  if (name === "bitbucket-githubGetPageDataLatest_v2") {
    const site = JSON.parse(
      await readFile(new URL("../public/pages.json", import.meta.url), "utf8"),
    );
    site.pages._home.content[0].data.Title.data.text = `A quiet welcome.<br>Preview: ${String(input.branch || "main").replace(/[<>&]/g, "")}`;
    result = { ...site, commitSha: "local-preview-fixture" };
  } else if (name === "getSuiteAvailability") {
    const blockedDates = [];
    for (const record of records.filter(
      (item) => item.suite === input.suite && item.status === "confirmed",
    ))
      for (let key = record.startDate; key < record.endDate; ) {
        blockedDates.push(key);
        const date = new Date(`${key}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() + 1);
        key = date.toISOString().slice(0, 10);
      }
    result = {
      success: true,
      suite: input.suite,
      blockedDates,
      depositAmount: 12000,
      holdMinutes: 30,
    };
  } else if (name === "createSuiteReservation") {
    result = {
      success: false,
      error:
        "Local simulation completed: the checkout request was received. No payment, reservation, or email was created.",
    };
  } else if (name === "confirmSuiteReservationCheckout") {
    result =
      input.sessionId === "cs_test_pending"
        ? {
            success: false,
            checkoutState: "pending_payment",
            error: "Payment has not completed yet.",
          }
        : {
            ...records[0],
            status: "confirmed",
            paymentReceived: true,
            supportPhone: "805-544-1810",
            supportEmail: "dmangerj@gmail.com",
          };
  } else if (name === "checkAdminPassword")
    result =
      input.password === "local-demo"
        ? {
            success: true,
            sessionToken: token,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          }
        : { success: false, error: "Local fixture password is local-demo." };
  else if (name === "getAdminReservations")
    result =
      input.sessionToken === token
        ? {
            success: true,
            reservationsBySuite: Object.fromEntries(
              names.map((suite) => [
                suite,
                records.filter((record) => record.suite === suite),
              ]),
            ),
          }
        : {
            success: false,
            sessionExpired: true,
            error: "Your local fixture session expired.",
          };
  else if (name === "logoutAdminSession") result = { success: true };
  else if (name === "createAdminSuiteReservation") {
    if (input.sessionToken !== token)
      result = { success: false, sessionExpired: true };
    else {
      const record = {
        ...input,
        startDate: input.startDate.slice(0, 10),
        endDate: input.endDate.slice(0, 10),
        reservationId: `fixtureCreated${String(counter++).padStart(8, "0")}`,
        success: true,
        status: "confirmed",
        paymentReceived: true,
        source: "admin",
        depositAmount: 12000,
      };
      delete record.sessionToken;
      records.push(record);
      result = record;
    }
  } else if (
    name === "getCancellableReservation" ||
    name === "lookupReservationForCancellation"
  )
    result = records.find((record) =>
      name === "getCancellableReservation"
        ? input.token === "fixture-token"
        : record.reservationId === input.reservationID &&
          record.email === input.email,
    ) || { success: false, error: "Synthetic reservation not found." };
  else if (
    name === "cancelReservationByToken" ||
    name === "cancelReservationByLookup" ||
    name === "cancelAdminReservation"
  ) {
    const record = records.find((item) =>
      name === "cancelReservationByToken"
        ? input.token === "fixture-token"
        : item.reservationId === input.reservationID,
    );
    if (record) {
      record.status = "cancelled";
      result = record;
    } else
      result = { success: false, error: "Synthetic reservation not found." };
  }
  response.end(JSON.stringify({ data: result }));
});
server.listen(5176, "127.0.0.1", () =>
  console.log(
    "Local-only reservation fixture: http://127.0.0.1:5176 · no external services",
  ),
);
