import { siteConfig } from "./config";
import {
  serializeBookingDate,
  type ReservationSummary,
  type SuiteName,
} from "./reservation-domain";

export interface Availability {
  success?: boolean;
  error?: string;
  blockedDates?: string[];
  depositAmount?: number;
  holdMinutes?: number;
}
export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  message: string;
}
export interface BookingInput extends GuestDetails {
  suite: SuiteName;
  startDate: string;
  endDate: string;
}
export interface AdminData {
  success?: boolean;
  error?: string;
  sessionExpired?: boolean;
  sessionExpiresAt?: string;
  reservationsBySuite?: Record<string, ReservationSummary[]>;
}
export interface AdminSession {
  success?: boolean;
  error?: string;
  sessionToken?: string;
  expiresAt?: string;
  sessionExpired?: boolean;
}
export interface CheckoutResult {
  success?: boolean;
  error?: string;
  checkoutUrl?: string;
  reservationId?: string;
  expiresAt?: string;
  holdMinutes?: number;
}

export function createReservationApi(
  options: {
    baseUrl?: string;
    fetcher?: typeof fetch;
    publicPaused?: boolean;
  } = {},
) {
  const base = (options.baseUrl || siteConfig.reservationApiBase).replace(
    /\/$/,
    "",
  );
  const fetcher =
    options.fetcher || ((...args: Parameters<typeof fetch>) => fetch(...args));
  async function call<T>(
    name: string,
    data: object,
    signal?: AbortSignal,
  ): Promise<T> {
    const response = await fetcher(`${base}/mrc-${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ data }),
      signal: signal || AbortSignal.timeout(30000),
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok)
      throw new Error(
        "The reservation service could not be reached. Please try again or call 805-544-1810.",
      );
    const envelope = await response.json();
    const result = envelope?.data ?? envelope?.result;
    if (!result || typeof result !== "object")
      throw new Error(
        "The reservation service returned an unexpected response. Please call the monastery.",
      );
    return result as T;
  }
  const dates = (input: BookingInput) => ({
    ...input,
    startDate: serializeBookingDate(input.startDate),
    endDate: serializeBookingDate(input.endDate),
  });
  return {
    availability: (suite: string, signal?: AbortSignal) =>
      call<Availability>("getSuiteAvailability", { suite }, signal),
    checkout: (input: BookingInput, origin: string) => {
      if (options.publicPaused ?? siteConfig.publicReservationsPaused)
        return Promise.resolve<CheckoutResult>({
          success: false,
          error: "Public reservations are temporarily paused.",
        });
      return call<CheckoutResult>("createSuiteReservation", {
        ...dates(input),
        origin,
      });
    },
    confirm: (sessionId: string, signal?: AbortSignal) =>
      call<ReservationSummary>(
        "confirmSuiteReservationCheckout",
        { sessionId },
        signal,
      ),
    login: (password: string) =>
      call<AdminSession>("checkAdminPassword", { password }),
    adminReservations: (sessionToken: string, signal?: AbortSignal) =>
      call<AdminData>("getAdminReservations", { sessionToken }, signal),
    logout: (sessionToken: string) =>
      call<{ success?: boolean }>("logoutAdminSession", { sessionToken }),
    adminCreate: (input: BookingInput, sessionToken: string) =>
      call<ReservationSummary>("createAdminSuiteReservation", {
        ...dates(input),
        sessionToken,
      }),
    adminCancel: (reservationID: string, suite: string, sessionToken: string) =>
      call<ReservationSummary>("cancelAdminReservation", {
        reservationID,
        suite,
        sessionToken,
      }),
    cancellationPreview: (token: string, signal?: AbortSignal) =>
      call<ReservationSummary>("getCancellableReservation", { token }, signal),
    cancellationLookup: (reservationID: string, email: string) =>
      call<ReservationSummary>("lookupReservationForCancellation", {
        reservationID,
        email,
      }),
    cancelToken: (token: string) =>
      call<ReservationSummary>("cancelReservationByToken", { token }),
    cancelLookup: (reservationID: string, email: string) =>
      call<ReservationSummary>("cancelReservationByLookup", {
        reservationID,
        email,
      }),
  };
}
export const reservationApi = createReservationApi();
