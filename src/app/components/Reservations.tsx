import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { field, text } from "../lib/content";
import { siteConfig, reservationPauseCopy } from "../lib/config";
import {
  reservationApi,
  type Availability,
  type BookingInput,
  type GuestDetails,
} from "../lib/reservation-api";
import {
  addDays,
  canAdminCancel,
  decodeGuestText,
  formatDate,
  isBlockingReservation,
  nightsBetween,
  reservationStatus,
  suites,
  todayKey,
  validDateKey,
  validateStay,
  type ReservationSummary,
  type SuiteName,
} from "../lib/reservation-domain";
import { Action, ErrorNotice, Heading, Modal, RichText, SiteLink } from "./ui";
import type { BlockProps } from "./Blocks";

const money = (cents = 12000) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
const sessionKey = "mrc_admin_session";
function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The reservation service is unavailable. Please call 805-544-1810.";
}

export function BookingStatus({ search = "" }: { search?: string }) {
  return (
    <div className="status-panel booking-status" role="note">
      <div className="eyebrow">Current overnight status</div>
      <h2>
        {siteConfig.publicReservationsPaused
          ? "Suite reservations are temporarily paused."
          : "A quiet place for your next retreat."}
      </h2>
      <p>
        {siteConfig.publicReservationsPaused
          ? reservationPauseCopy
          : "Choose a suite and a stay of one to seven nights. A refundable first-night deposit is paid through Stripe Checkout."}
      </p>
      <div className="button-row">
        <SiteLink to="/contact" search={search} className="btn small outline">
          Make an inquiry
        </SiteLink>
        <SiteLink to="/visit" search={search}>
          Public prayer information
        </SiteLink>
      </div>
    </div>
  );
}
export function SuitesPreview({ block, search }: BlockProps) {
  return (
    <section className="section home-suites">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">{text(block, "Eyebrow")}</div>
            <Heading value={text(block, "Title")} />
          </div>
          <div className="suite-heading-copy">
            <RichText html={text(block, "Body")} />
            <Action
              source={field(block, "Button")}
              search={search}
              className="btn"
            />
            <Action source={field(block, "Secondary Button")} search={search} />
          </div>
        </div>
        <div className="suite-grid">
          {suites.map((suite) => (
            <article className="home-suite" key={suite.name}>
              <SiteLink
                to={`/retreats#${suite.id}`}
                search={search}
                className="suite-image"
                aria-label={`Explore ${suite.name}`}
              >
                <img
                  src={suite.image}
                  alt={`Doorway nameplate of the ${suite.name} hospitality suite`}
                  loading="lazy"
                />
              </SiteLink>
              <div className="suite-meta">{suite.meta}</div>
              <h3>
                <SiteLink
                  to={`/retreats#${suite.id}`}
                  search={search}
                  className=""
                >
                  {suite.name}
                </SiteLink>
              </h3>
              <p>{suite.description}</p>
              <SiteLink to={`/retreats#${suite.id}`} search={search}>
                Explore the suite
              </SiteLink>
            </article>
          ))}
        </div>
        <div className="suite-booking-note">
          <div>
            <strong>Planning a future stay?</strong>
            <p>
              {siteConfig.publicReservationsPaused
                ? reservationPauseCopy
                : "Find availability and make your reservation through our secure booking system."}
            </p>
          </div>
          <SiteLink to="/retreats#booking" search={search}>
            Booking & availability
          </SiteLink>
        </div>
      </div>
    </section>
  );
}
export function SuiteReservations({ search }: BlockProps) {
  const [selected, setSelected] = useState<SuiteName | null>(null);
  const location = useLocation();
  const cancelled =
    new URLSearchParams(location.search).get("checkout") === "cancelled";
  return (
    <section className="section sm managed-suites">
      <div className="wrap">
        {cancelled && (
          <p className="status-panel" role="status">
            Checkout was cancelled before payment. Any unpaid hold will release
            automatically if payment is not completed.
          </p>
        )}
        <div className="section-head">
          <div>
            <div className="eyebrow">For future retreat planning</div>
            <h2>Our hospitality suites.</h2>
          </div>
          <span className="muted">
            {siteConfig.publicReservationsPaused
              ? "Reservations currently unavailable"
              : "Choose your suite"}
          </span>
        </div>
        <div className="suite-grid">
          {suites.map((suite, index) => (
            <article className="suite" key={suite.name} id={suite.id}>
              <div className="suite-image">
                <img
                  src={suite.image}
                  alt={`Doorway nameplate for the ${suite.name} suite`}
                  loading="lazy"
                />
                <span className="suite-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3>{suite.name}</h3>
              <div className="suite-meta">{suite.meta}</div>
              <p>{suite.description}</p>
              <details>
                <summary>Explore suite details</summary>
                <p>{suite.details}</p>
              </details>
              <div className="suite-reserve-action">
                <button
                  className="btn outline"
                  disabled={siteConfig.publicReservationsPaused}
                  onClick={() => setSelected(suite.name)}
                >
                  {siteConfig.publicReservationsPaused
                    ? "Overnight reservations paused"
                    : `Reserve ${suite.name}`}
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className="schedule-note">
          The previously published rate is $120 per night. Rates and
          arrangements should be reconfirmed when reservations resume. The
          refundable deposit is set by the reservation service.
        </p>
        <SiteLink to="/cancel-reservation" search={search}>
          Manage or cancel an existing reservation
        </SiteLink>
      </div>
      {selected && !siteConfig.publicReservationsPaused && (
        <BookingDialog suite={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

export function DateCalendar({
  blocked,
  start = "",
  end = "",
  onSelect,
}: {
  blocked: Set<string>;
  start?: string;
  end?: string;
  onSelect?: (key: string) => void;
}) {
  const today = todayKey();
  const [month, setMonth] = useState(
    (validDateKey(start) ? start : today).slice(0, 7) + "-01",
  );
  const current = new Date(`${month}T12:00:00Z`);
  const monthName = current.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
  const firstWeekday = current.getUTCDay();
  const daysInMonth = new Date(
    Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0),
  ).getUTCDate();
  function move(offset: number) {
    const date = new Date(`${month}T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    setMonth(date.toISOString().slice(0, 10));
  }
  return (
    <div className="date-calendar">
      <div className="date-calendar-header">
        <button
          type="button"
          className="plain-button"
          aria-label="Previous month"
          onClick={() => move(-1)}
        >
          ‹
        </button>
        <strong aria-live="polite">{monthName}</strong>
        <button
          type="button"
          className="plain-button"
          aria-label="Next month"
          onClick={() => move(1)}
        >
          ›
        </button>
      </div>
      <div className="date-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span className="weekday" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: firstWeekday }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const key = `${month.slice(0, 7)}-${String(index + 1).padStart(2, "0")}`;
          const reserved = blocked.has(key);
          const choosingCheckout = Boolean(start && !end && key > start);
          const disabled = onSelect
            ? key < today || (reserved && !choosingCheckout)
            : false;
          return (
            <button
              type="button"
              key={key}
              disabled={disabled}
              aria-label={`${formatDate(key)}${reserved ? ", reserved" : ", available"}${key === start ? ", arrival" : key === end ? ", checkout" : ""}`}
              aria-pressed={key === start || key === end}
              className={`${reserved ? "is-reserved" : ""} ${key >= start && start && key < end ? "in-range" : ""} ${key === start || key === end ? "is-selected" : ""} ${key === today ? "is-today" : ""}`}
              onClick={() => onSelect?.(key)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span>
          <i className="legend-open" /> Available
        </span>
        <span>
          <i className="legend-reserved" /> Reserved
        </span>
      </div>
    </div>
  );
}

export function BookingDialog({
  suite,
  onClose,
  adminToken,
  onCreated,
  onSessionExpired,
}: {
  suite: SuiteName;
  onClose: () => void;
  adminToken?: string;
  onCreated?: () => void;
  onSessionExpired?: () => void;
}) {
  const adminMode = Boolean(adminToken);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(1);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [guest, setGuest] = useState<GuestDetails>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const blocked = new Set(availability?.blockedDates || []);
  const selectedSuite = suites.find((item) => item.name === suite)!;
  async function load(signal?: AbortSignal) {
    setLoadError("");
    try {
      const response = await reservationApi.availability(suite, signal);
      if (!response.success)
        throw new Error(response.error || "Availability could not be loaded.");
      setAvailability(response);
    } catch (error) {
      if (!signal?.aborted) setLoadError(errorMessage(error));
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [suite]);
  function selectDate(key: string) {
    setError("");
    if (start && !end && key > start) {
      const issue = validateStay(start, key, blocked, adminMode);
      if (issue) {
        setError(issue);
        return;
      }
      setEnd(key);
    } else {
      setStart(key);
      setEnd("");
    }
  }
  async function submit() {
    if (
      submitting.current ||
      (!adminMode && siteConfig.publicReservationsPaused)
    )
      return;
    const issue = validateStay(start, end, blocked, adminMode);
    if (issue) {
      setError(issue);
      setStep(1);
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    const input: BookingInput = {
      ...guest,
      suite,
      startDate: start,
      endDate: end,
    };
    try {
      const response = adminToken
        ? await reservationApi.adminCreate(input, adminToken)
        : await reservationApi.checkout(input, window.location.origin);
      if ("sessionExpired" in response && response.sessionExpired) {
        onSessionExpired?.();
        onClose();
        return;
      }
      if (!response.success) {
        const message =
          response.error || "The reservation could not be created.";
        setError(message);
        if (
          /no longer available|choose your dates|hold is no longer/i.test(
            message,
          )
        ) {
          await load();
          setStart("");
          setEnd("");
          setStep(1);
        }
        return;
      }
      if (adminToken) {
        onCreated?.();
        onClose();
      } else if (
        "checkoutUrl" in response &&
        typeof response.checkoutUrl === "string"
      ) {
        const checkout = new URL(response.checkoutUrl);
        if (
          checkout.protocol !== "https:" ||
          checkout.hostname !== "checkout.stripe.com"
        )
          throw new Error(
            "The service did not return a valid Stripe Checkout destination. Please call the monastery.",
          );
        window.location.assign(checkout.href);
      } else
        throw new Error(
          "The checkout destination is missing. Please contact the monastery before trying again.",
        );
    } catch (failure) {
      setError(
        `${errorMessage(failure)} If you already completed payment, do not pay again; contact the monastery.`,
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  function nextDates() {
    const issue = validateStay(start, end, blocked, adminMode);
    setError(issue);
    if (!issue) setStep(2);
  }
  return (
    <Modal
      title={`${adminMode ? "Create reservation" : "Reserve a suite"} · ${suite}`}
      onClose={onClose}
      busy={busy}
    >
      <div className="booking-dialog" aria-busy={busy}>
        <ol className="booking-steps" aria-label="Reservation progress">
          {["Dates", "Guest details", adminMode ? "Create" : "Checkout"].map(
            (label, index) => (
              <li
                key={label}
                className={step === index + 1 ? "active" : ""}
                aria-current={step === index + 1 ? "step" : undefined}
              >
                {index + 1}. {label}
              </li>
            ),
          )}
        </ol>
        {loadError ? (
          <>
            <ErrorNotice>{loadError}</ErrorNotice>
            <button className="btn" onClick={() => void load()}>
              Try availability again
            </button>
          </>
        ) : !availability ? (
          <p role="status">Loading live availability…</p>
        ) : (
          <>
            <div className="booking-suite">
              <img
                src={selectedSuite.image}
                alt={`${suite} doorway nameplate`}
              />
              <div>
                <div className="eyebrow">Monastic hospitality</div>
                <h3>{suite}</h3>
                <p>{selectedSuite.meta}</p>
                <p>{money(availability.depositAmount)} refundable deposit</p>
              </div>
            </div>
            {step === 1 && (
              <>
                <h3>Choose your dates</h3>
                <p className="muted">
                  {adminMode
                    ? "Choose arrival and checkout dates. Admin stays may exceed seven nights."
                    : "Choose an arrival date and a checkout date one to seven nights later."}
                </p>
                <div className="booking-grid">
                  <DateCalendar
                    blocked={blocked}
                    start={start}
                    end={end}
                    onSelect={selectDate}
                  />
                  <div className="date-inputs">
                    <label>
                      Arrival
                      <input
                        type="date"
                        value={start}
                        min={todayKey()}
                        onChange={(event) => {
                          setStart(event.target.value);
                          setEnd("");
                          setError("");
                        }}
                      />
                    </label>
                    <label>
                      Checkout
                      <input
                        type="date"
                        value={end}
                        min={start ? addDays(start, 1) : todayKey()}
                        max={
                          !adminMode && start ? addDays(start, 7) : undefined
                        }
                        onChange={(event) => {
                          setEnd(event.target.value);
                          setError("");
                        }}
                      />
                    </label>
                    <p>
                      {formatDate(start)} → {formatDate(end)}
                    </p>
                    <p>{Math.max(0, nightsBetween(start, end))} nights</p>
                    <button className="btn" onClick={nextDates}>
                      Continue to guest details
                    </button>
                  </div>
                </div>
              </>
            )}
            {step === 2 && (
              <form
                className="details-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setError("");
                  setStep(3);
                }}
              >
                <h3>Guest details</h3>
                <p className="muted">
                  {adminMode
                    ? "Enter the guest’s contact information."
                    : "Dates are checked again when checkout starts. They are not held during this step."}
                </p>
                {(["name", "email", "phone"] as const).map((key) => (
                  <label key={key}>
                    {key === "name"
                      ? "Full name"
                      : key === "email"
                        ? "Email address"
                        : "Phone number"}
                    <input
                      autoComplete={key === "phone" ? "tel" : key}
                      type={
                        key === "email"
                          ? "email"
                          : key === "phone"
                            ? "tel"
                            : "text"
                      }
                      required
                      maxLength={
                        key === "name" ? 120 : key === "phone" ? 40 : 254
                      }
                      value={guest[key]}
                      onChange={(event) =>
                        setGuest({ ...guest, [key]: event.target.value })
                      }
                    />
                  </label>
                ))}
                <label>
                  Anything you would like the monastery to know? (optional)
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={guest.message}
                    onChange={(event) =>
                      setGuest({ ...guest, message: event.target.value })
                    }
                  />
                </label>
                <div className="button-row">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => setStep(1)}
                  >
                    Back to dates
                  </button>
                  <button className="btn" type="submit">
                    Review reservation
                  </button>
                </div>
              </form>
            )}
            {step === 3 && (
              <>
                <h3>Review your stay</h3>
                <dl className="reservation-summary">
                  <div>
                    <dt>Suite</dt>
                    <dd>{suite}</dd>
                  </div>
                  <div>
                    <dt>Arrival</dt>
                    <dd>{formatDate(start)}</dd>
                  </div>
                  <div>
                    <dt>Checkout</dt>
                    <dd>{formatDate(end)}</dd>
                  </div>
                  <div>
                    <dt>Nights</dt>
                    <dd>{nightsBetween(start, end)}</dd>
                  </div>
                  <div>
                    <dt>Guest</dt>
                    <dd>{guest.name}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{guest.email}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{guest.phone}</dd>
                  </div>
                  <div>
                    <dt>Deposit</dt>
                    <dd>
                      {adminMode
                        ? "Created through monastery administration"
                        : money(availability.depositAmount)}
                    </dd>
                  </div>
                </dl>
                <p className="muted">
                  {adminMode
                    ? "This creates the reservation directly using the existing administration service."
                    : `You will pay on Stripe’s secure page. The service holds these dates when checkout begins, for approximately ${availability.holdMinutes || 30} minutes. Confirmation follows successful payment.`}
                </p>
                <div className="button-row">
                  <button
                    className="btn outline"
                    disabled={busy}
                    onClick={() => setStep(2)}
                  >
                    Back to details
                  </button>
                  <button
                    className="btn"
                    disabled={busy}
                    onClick={() => void submit()}
                  >
                    {busy
                      ? "Please wait…"
                      : adminMode
                        ? "Create reservation"
                        : "Continue to secure checkout"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {error && <ErrorNotice>{error}</ErrorNotice>}
      </div>
    </Modal>
  );
}

function ReservationDetails({
  reservation,
}: {
  reservation: ReservationSummary;
}) {
  return (
    <dl className="reservation-summary">
      {[
        ["Confirmation", reservation.reservationId],
        ["Suite", reservation.suite],
        ["Guest", decodeGuestText(reservation.name)],
        [
          "Arrival",
          reservation.startDateLabel || formatDate(reservation.startDate),
        ],
        [
          "Checkout",
          reservation.endDateLabel || formatDate(reservation.endDate),
        ],
        ["Nights", reservation.nights],
        ["Deposit", money(reservation.depositAmount)],
      ].map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function ConfirmationPage() {
  const { search } = useLocation();
  const [reservation, setReservation] = useState<ReservationSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const cancelled = params.get("checkout") === "cancelled";
  useEffect(() => {
    setReservation(null);
    setError("");
    setLoading(false);
    if (cancelled) return;
    if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
      setError(
        "We could not find a valid payment session. Please contact the monastery for help.",
      );
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    void reservationApi
      .confirm(sessionId, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          if (
            response.success &&
            response.paymentReceived &&
            response.status === "confirmed"
          )
            setReservation(response);
          else
            setError(
              response.checkoutState === "pending_payment"
                ? "Your payment has not finished processing. Check the status again in a moment; please do not pay a second time."
                : response.error ||
                    "We could not confirm your reservation. Please contact the monastery.",
            );
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(errorMessage(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [sessionId, cancelled, refresh]);
  return (
    <section className="section">
      <div className="wrap transaction-page">
        <div className="eyebrow">Suite reservations</div>
        <h1>
          {cancelled
            ? "Checkout cancelled"
            : reservation
              ? "Reservation confirmed"
              : "Your reservation"}
        </h1>
        {loading && (
          <p role="status">
            Checking your payment with the reservation service…
          </p>
        )}
        {cancelled && (
          <p>
            Your payment was not completed. Any unpaid reservation hold will
            expire automatically.
          </p>
        )}
        {reservation && (
          <>
            <p>Your deposit has been received and your suite is confirmed.</p>
            <ReservationDetails reservation={reservation} />
            <p>
              A confirmation email includes your arrival details and secure
              cancellation link.
            </p>
            {reservation.cancellationUrl && (
              <SiteLink to={reservation.cancellationUrl}>
                Manage this reservation
              </SiteLink>
            )}
          </>
        )}
        {error && (
          <>
            <ErrorNotice>{error}</ErrorNotice>
            {sessionId && (
              <button
                className="btn outline"
                disabled={loading}
                onClick={() => setRefresh((value) => value + 1)}
              >
                Check payment status again
              </button>
            )}
          </>
        )}
        <p className="transaction-support">
          For help, call <a href="tel:+18055441810">805-544-1810</a> or email{" "}
          <a href="mailto:dmangerj@gmail.com">dmangerj@gmail.com</a>.
        </p>
        <SiteLink to="/retreats" className="btn">
          Return to suites
        </SiteLink>
      </div>
    </section>
  );
}
export function CancellationPage() {
  const token = new URLSearchParams(useLocation().search).get("token") || "";
  const [reservation, setReservation] = useState<ReservationSummary | null>(
    null,
  );
  const [lookup, setLookup] = useState({ reservationID: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [verifiedIdentity, setVerifiedIdentity] = useState<
    { token: string } | { reservationID: string; email: string } | null
  >(null);
  const lookupEpoch = useRef(0);
  const mutation = useRef(false);
  useEffect(() => {
    lookupEpoch.current += 1;
    setReservation(null);
    setComplete(false);
    setConfirming(false);
    setVerifiedIdentity(null);
    setError("");
    setBusy(false);
    if (!token) return;
    const controller = new AbortController();
    setBusy(true);
    void reservationApi
      .cancellationPreview(token, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          if (response.success) {
            setReservation(response);
            setVerifiedIdentity({ token });
          } else
            setError(
              response.error ||
                "This cancellation link is invalid or has already been used.",
            );
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(errorMessage(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [token]);
  async function find(event: FormEvent) {
    event.preventDefault();
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError("");
    setReservation(null);
    setVerifiedIdentity(null);
    const epoch = lookupEpoch.current;
    const identity = {
      reservationID: lookup.reservationID.trim(),
      email: lookup.email.trim(),
    };
    try {
      const response = await reservationApi.cancellationLookup(
        identity.reservationID,
        identity.email,
      );
      if (epoch !== lookupEpoch.current) return;
      if (!response.success)
        throw new Error(
          response.error || "We could not verify this reservation.",
        );
      setReservation(response);
      setVerifiedIdentity(identity);
    } catch (failure) {
      if (epoch === lookupEpoch.current) setError(errorMessage(failure));
    } finally {
      mutation.current = false;
      if (epoch === lookupEpoch.current) setBusy(false);
    }
  }
  async function cancel() {
    if (mutation.current || !reservation || !verifiedIdentity) return;
    mutation.current = true;
    setBusy(true);
    setError("");
    const epoch = lookupEpoch.current;
    try {
      const response =
        "token" in verifiedIdentity
          ? await reservationApi.cancelToken(verifiedIdentity.token)
          : await reservationApi.cancelLookup(
              verifiedIdentity.reservationID,
              verifiedIdentity.email,
            );
      if (epoch !== lookupEpoch.current) return;
      if (!response.success)
        throw new Error(
          response.error || "Cancellation could not be completed.",
        );
      setReservation(response);
      setComplete(true);
      setConfirming(false);
    } catch (failure) {
      if (epoch === lookupEpoch.current) {
        setError(errorMessage(failure));
        setConfirming(false);
      }
    } finally {
      mutation.current = false;
      if (epoch === lookupEpoch.current) setBusy(false);
    }
  }
  return (
    <section className="section">
      <div className="wrap transaction-page">
        <div className="eyebrow">Suite reservations</div>
        <h1>
          {complete ? "Reservation cancelled" : "Manage your reservation"}
        </h1>
        {complete ? (
          <p>
            Your cancellation has been processed. The reservation service
            handles any applicable deposit refund and confirmation email.
          </p>
        ) : (
          <p>
            Use your secure email link, or find a reservation using its
            confirmation number and the email address used to book.
          </p>
        )}
        {!token && !reservation && (
          <form className="details-form" onSubmit={find}>
            <label>
              Confirmation number
              <input
                required
                disabled={busy}
                value={lookup.reservationID}
                onChange={(event) =>
                  setLookup({ ...lookup, reservationID: event.target.value })
                }
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                required
                disabled={busy}
                value={lookup.email}
                onChange={(event) =>
                  setLookup({ ...lookup, email: event.target.value })
                }
              />
            </label>
            <button className="btn" disabled={busy}>
              {busy ? "Finding reservation…" : "Find reservation"}
            </button>
          </form>
        )}
        {busy && token && !reservation && (
          <p role="status">Loading your reservation…</p>
        )}
        {reservation && (
          <>
            <ReservationDetails reservation={reservation} />
            {!complete && (
              <button
                className="btn outline"
                disabled={busy}
                onClick={() => setConfirming(true)}
              >
                Cancel this reservation
              </button>
            )}
          </>
        )}
        {error && <ErrorNotice>{error}</ErrorNotice>}
        <p className="transaction-support">
          For help, call <a href="tel:+18055441810">805-544-1810</a>.
        </p>
        <SiteLink to="/retreats">Return to retreat hospitality</SiteLink>
        {confirming && (
          <Modal
            title="Cancel this reservation?"
            busy={busy}
            onClose={() => setConfirming(false)}
          >
            <p>
              This releases the reserved dates. Any applicable deposit refund
              will be processed by the monastery’s reservation service.
            </p>
            <div className="button-row">
              <button
                className="btn outline"
                disabled={busy}
                onClick={() => setConfirming(false)}
              >
                Keep reservation
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() => void cancel()}
              >
                {busy ? "Cancelling…" : "Confirm cancellation"}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </section>
  );
}

export function AdminPage() {
  const [token, setToken] = useState("");
  const tokenRef = useRef("");
  const sessionEpoch = useRef(0);
  const [password, setPassword] = useState("");
  const [records, setRecords] = useState<Record<string, ReservationSummary[]>>(
    {},
  );
  const [active, setActive] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState<SuiteName | null>(null);
  const [cancelling, setCancelling] = useState<ReservationSummary | null>(null);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  function clearSession() {
    sessionEpoch.current += 1;
    try {
      sessionStorage.removeItem(sessionKey);
    } catch {
      /* Private browsing may deny storage. */
    }
    tokenRef.current = "";
    setToken("");
    setRecords({});
    setCreating(null);
    setCancelling(null);
    setPassword("");
  }
  async function refresh(session = tokenRef.current, signal?: AbortSignal) {
    if (!session) return;
    const epoch = sessionEpoch.current;
    const response = await reservationApi.adminReservations(session, signal);
    if (signal?.aborted || epoch !== sessionEpoch.current) return;
    if (response.sessionExpired) {
      clearSession();
      throw new Error(
        response.error || "Your session expired. Please log in again.",
      );
    }
    if (!response.success)
      throw new Error(response.error || "Reservations could not be loaded.");
    tokenRef.current = session;
    setToken(session);
    setRecords(response.reservationsBySuite || {});
    try {
      sessionStorage.setItem(sessionKey, session);
    } catch {
      /* Session remains usable in memory. */
    }
  }
  useEffect(() => {
    let saved = "";
    try {
      saved = sessionStorage.getItem(sessionKey) || "";
    } catch {
      /* Continue with login. */
    }
    if (!saved) return;
    const controller = new AbortController();
    setBusy(true);
    void refresh(saved, controller.signal)
      .catch((failure) => {
        if (!controller.signal.aborted) {
          clearSession();
          setError(errorMessage(failure));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, []);
  async function login(event: FormEvent) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await reservationApi.login(password);
      setPassword("");
      if (!response.success || !response.sessionToken)
        throw new Error(response.error || "The password was not accepted.");
      await refresh(response.sessionToken);
    } catch (failure) {
      clearSession();
      setError(errorMessage(failure));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function logout() {
    const session = tokenRef.current;
    clearSession();
    setError("");
    setMessage("");
    if (session) {
      try {
        await reservationApi.logout(session);
      } catch {
        /* Local token is already removed. */
      }
    }
  }
  async function cancel() {
    if (busyRef.current || !cancelling?.reservationId || !cancelling.suite)
      return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await reservationApi.adminCancel(
        cancelling.reservationId,
        cancelling.suite,
        tokenRef.current,
      );
      if (response.sessionExpired) clearSession();
      if (!response.success)
        throw new Error(
          response.error || "The reservation could not be cancelled.",
        );
      setMessage(
        "Reservation cancelled. Any applicable refund and email are handled by the reservation service.",
      );
      setCancelling(null);
      await refresh();
    } catch (failure) {
      setError(errorMessage(failure));
      setCancelling(null);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const today = todayKey();
  const all = Object.values(records).flat();
  const filtered = (active === "Overview" ? all : records[active] || [])
    .filter(
      (record) =>
        record.email?.toLowerCase() !== "fin@symposio.io" &&
        `${record.name} ${record.email} ${record.reservationId}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
  return (
    <section className="section admin-section">
      <div className="wrap">
        <div className="eyebrow">Monastery administration</div>
        <h1>Suite reservations</h1>
        {!token ? (
          <form className="admin-login details-form" onSubmit={login}>
            <p>
              Log in with the monastery’s reservation administrator password.
            </p>
            <label>
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="btn" disabled={busy}>
              {busy ? "Checking session…" : "Log in"}
            </button>
          </form>
        ) : (
          <>
            <div className="admin-toolbar">
              <nav aria-label="Reservation views">
                {["Overview", ...suites.map((suite) => suite.name)].map(
                  (name) => (
                    <button
                      className="filter"
                      key={name}
                      aria-pressed={active === name}
                      onClick={() => {
                        setActive(name);
                        setPage(0);
                        setQuery("");
                      }}
                    >
                      {name}
                    </button>
                  ),
                )}
              </nav>
              <div className="button-row">
                <button
                  className="btn outline"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    setError("");
                    void refresh()
                      .catch((failure) => setError(errorMessage(failure)))
                      .finally(() => setBusy(false));
                  }}
                >
                  Refresh
                </button>
                <button className="plain-button" onClick={() => void logout()}>
                  Log out
                </button>
              </div>
            </div>
            {active === "Overview" ? (
              <div className="admin-suite-grid">
                {suites.map((suite) => {
                  const suiteRecords = (records[suite.name] || []).filter(
                    (record) => isBlockingReservation(record),
                  );
                  const occupant = suiteRecords.find(
                    (record) =>
                      record.startDate &&
                      record.endDate &&
                      record.startDate <= today &&
                      record.endDate > today,
                  );
                  const next = suiteRecords
                    .filter(
                      (record) => record.startDate && record.startDate > today,
                    )
                    .sort((a, b) =>
                      a.startDate!.localeCompare(b.startDate!),
                    )[0];
                  const blocked = new Set<string>();
                  for (const record of suiteRecords) {
                    if (
                      record.startDate &&
                      record.endDate &&
                      validDateKey(record.startDate) &&
                      validDateKey(record.endDate)
                    )
                      for (
                        let key = record.startDate;
                        key < record.endDate;
                        key = addDays(key, 1)
                      )
                        blocked.add(key);
                  }
                  return (
                    <article key={suite.name} className="admin-suite">
                      <h2>{suite.name}</h2>
                      <DateCalendar blocked={blocked} />
                      <p>
                        <strong>{occupant ? "Occupied" : "Vacant"}</strong>
                        {occupant && (
                          <>
                            {" "}
                            · {decodeGuestText(occupant.name)}
                            <br />
                            Until {formatDate(occupant.endDate)}
                          </>
                        )}
                      </p>
                      <p>
                        {next ? (
                          <>
                            Next: {formatDate(next.startDate)}
                            <br />
                            {decodeGuestText(next.name)}
                          </>
                        ) : (
                          "No future reservations"
                        )}
                      </p>
                      <button
                        className="btn outline"
                        onClick={() => setActive(suite.name)}
                      >
                        View reservations
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="admin-list-toolbar">
                  <button
                    className="btn"
                    onClick={() => setCreating(active as SuiteName)}
                  >
                    Add reservation
                  </button>
                  <label>
                    Find a guest
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setPage(0);
                      }}
                    />
                  </label>
                </div>
                <div className="table-scroll">
                  <table className="reservation-table">
                    <thead>
                      <tr>
                        {[
                          "Status",
                          "Arrival / checkout",
                          "Guest",
                          "Contact",
                          "Payment",
                          "Message",
                          "Actions",
                        ].map((label) => (
                          <th key={label}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered
                        .slice(page * 10, page * 10 + 10)
                        .map((record) => (
                          <tr key={record.reservationId}>
                            <td>{reservationStatus(record)}</td>
                            <td>
                              {formatDate(record.startDate)}
                              <br />
                              {formatDate(record.endDate)}
                              <small>{record.reservationId}</small>
                            </td>
                            <td>{decodeGuestText(record.name)}</td>
                            <td>
                              {decodeGuestText(record.email)}
                              <br />
                              {decodeGuestText(record.phone)}
                            </td>
                            <td>
                              {record.paymentReceived ? "Received" : "Unpaid"}
                              {record.paymentIntentId && (
                                <small>{record.paymentIntentId}</small>
                              )}
                            </td>
                            <td>{decodeGuestText(record.message)}</td>
                            <td>
                              {canAdminCancel(record) && (
                                <button
                                  className="btn outline small"
                                  disabled={busy}
                                  onClick={() => setCancelling(record)}
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && <p>No matching reservations.</p>}
                </div>
                <div className="pagination">
                  <button
                    className="plain-button"
                    disabled={page === 0}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {page + 1} of{" "}
                    {Math.max(1, Math.ceil(filtered.length / 10))}
                  </span>
                  <button
                    className="plain-button"
                    disabled={(page + 1) * 10 >= filtered.length}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}
        {message && (
          <p className="status-panel" role="status">
            {message}
          </p>
        )}
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {creating && token && (
          <BookingDialog
            suite={creating}
            adminToken={token}
            onClose={() => setCreating(null)}
            onSessionExpired={() => {
              clearSession();
              setError("Your session expired. Please log in again.");
            }}
            onCreated={() => {
              setMessage("Reservation created.");
              void refresh().catch((failure) =>
                setError(errorMessage(failure)),
              );
            }}
          />
        )}
        {cancelling && (
          <Modal
            title="Cancel this reservation?"
            busy={busy}
            onClose={() => setCancelling(null)}
          >
            <ReservationDetails reservation={cancelling} />
            <p>
              {cancelling.paymentReceived
                ? "The reservation service will attempt to refund the deposit and email the guest. Any service restriction will be shown here."
                : "No completed payment is recorded. The guest will be notified by the reservation service."}
            </p>
            <div className="button-row">
              <button
                className="btn outline"
                disabled={busy}
                onClick={() => setCancelling(null)}
              >
                Keep reservation
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() => void cancel()}
              >
                {busy ? "Cancelling…" : "Confirm cancellation"}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </section>
  );
}
