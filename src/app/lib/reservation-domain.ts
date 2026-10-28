export const suites = [
  {
    name: "St. Scholastica",
    id: "suite-scholastica",
    image: "/assets/suite-scholastica.webp",
    meta: "Two twin beds · Ground floor",
    description:
      "A private suite with exterior access, a meditation and study area, and views of Cerro Romauldo.",
    details:
      "Two twin beds, a full bath and shower, and a meditation, dining, and study area. Patio access, with the kitchen, conference room, and chapel reached from outside.",
    pricePerNight: 120,
  },
  {
    name: "St. Benedict",
    id: "suite-benedict",
    image: "/assets/suite-benedict.webp",
    meta: "One bed · Interior stairs",
    description: "A quiet room for individual retreat, prayer, and reflection.",
    details:
      "The published room description lists one bed and an entrance facing St. Romuald. Contact the monastery for fuller room and access details when hospitality resumes.",
    pricePerNight: 120,
  },
  {
    name: "St. Romuald",
    id: "suite-romuald",
    image: "/assets/suite-romuald.webp",
    meta: "One single bed · Interior stairs",
    description: "A simple space for solitary prayer and a slower rhythm.",
    details:
      "The published room description lists one single bed. Contact the monastery to discuss the room and your needs when hospitality resumes.",
    pricePerNight: 120,
  },
] as const;
export type SuiteName = (typeof suites)[number]["name"];

export function validDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export function todayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function addDays(key: string, days: number) {
  const date = new Date(`${key}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function nightsBetween(start: string, end: string) {
  if (!validDateKey(start) || !validDateKey(end)) return 0;
  return Math.round(
    (Date.parse(`${end}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) /
      86400000,
  );
}
export function formatDate(key?: string) {
  if (!key || !validDateKey(key)) return key || "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${key}T12:00:00Z`));
}
// The existing Functions parser accepts ISO instants. Noon UTC preserves the chosen
// calendar day in its UTC runtime independently of the visitor's local timezone.
export function serializeBookingDate(key: string) {
  if (!validDateKey(key)) throw new Error("Choose a valid date.");
  return `${key}T12:00:00.000Z`;
}
export function validateStay(
  start: string,
  end: string,
  blocked: Iterable<string>,
  adminMode = false,
  minimum = todayKey(),
) {
  if (!validDateKey(start) || !validDateKey(end))
    return "Choose an arrival date and a checkout date.";
  if (start < minimum) return "Arrival must be today or later.";
  const nights = nightsBetween(start, end);
  if (nights < 1 || (!adminMode && nights > 7))
    return adminMode
      ? "Checkout must be after arrival."
      : "Choose a stay between one and seven nights.";
  for (const key of blocked)
    if (key >= start && key < end)
      return "Your stay crosses reserved dates. Please choose another stay.";
  return "";
}
export interface ReservationSummary {
  success?: boolean;
  error?: string;
  reservationId?: string;
  suite?: string;
  status?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  startDate?: string;
  endDate?: string;
  startDateLabel?: string;
  endDateLabel?: string;
  nights?: number;
  depositAmount?: number;
  paymentReceived?: boolean;
  supportPhone?: string;
  supportEmail?: string;
  checkoutState?: string;
  cancellationUrl?: string;
  sessionExpired?: boolean;
  paymentDeadline?: string | null;
  paymentIntentId?: string | null;
  paymentId?: string | null;
  refundId?: string | null;
  stripeMode?: string | null;
  source?: string | null;
  adminCreatedBy?: string | null;
  createdAt?: string | null;
}
export function reservationStatus(
  record: ReservationSummary,
  now = Date.now(),
) {
  if (record.status === "cancelled" || record.status === "expired")
    return record.status;
  if (
    record.status === "pending_payment" ||
    record.status === "pending_details"
  )
    return record.paymentDeadline && Date.parse(record.paymentDeadline) <= now
      ? "expired"
      : record.status;
  if (record.status) return record.status;
  if (record.paymentReceived) return "confirmed";
  if (record.paymentDeadline)
    return Date.parse(record.paymentDeadline) > now
      ? "pending_payment"
      : "expired";
  return "confirmed";
}
export function isBlockingReservation(
  record: ReservationSummary,
  now = Date.now(),
) {
  const status = reservationStatus(record, now);
  return (
    status === "confirmed" ||
    (status === "pending_payment" &&
      Boolean(record.paymentDeadline) &&
      Date.parse(record.paymentDeadline!) > now)
  );
}
export function canAdminCancel(record: ReservationSummary, today = todayKey()) {
  return Boolean(
    record.startDate &&
      record.startDate > today &&
      ["confirmed", "pending_payment"].includes(reservationStatus(record)),
  );
}
export function decodeGuestText(value = "") {
  return value
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
