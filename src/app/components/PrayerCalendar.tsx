import { useState } from "react";
import { siteConfig } from "../lib/config";
import type { BlockProps } from "./Blocks";

export function PrayerCalendar(_props: BlockProps) {
  const [view, setView] = useState("MONTH");
  const query = new URLSearchParams({
    src: siteConfig.calendarId,
    ctz: "America/Los_Angeles",
    mode: view,
    bgcolor: "#f8f6ef",
    color: "#354132",
    showTitle: "0",
    showPrint: "0",
    showCalendars: "0",
    wkst: "1",
  });
  return (
    <section className="section sm">
      <div className="wrap">
        <div className="calendar-toolbar">
          <p className="muted">
            Public prayer and monastery gatherings · Pacific time
          </p>
          <div className="segmented calendar-views">
            {[
              ["MONTH", "Month"],
              ["WEEK", "Week"],
              ["AGENDA", "Agenda"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={view === key}
                onClick={() => setView(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <iframe
          className="prayer-calendar"
          title="Monastery of the Risen Christ live prayer calendar"
          src={`https://calendar.google.com/calendar/embed?${query}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <p className="schedule-note">
          Please confirm visiting arrangements with the monastery. If the
          calendar does not load,{" "}
          <a
            href={`https://calendar.google.com/calendar/embed?${query}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            open the live calendar
          </a>{" "}
          or call <a href="tel:+18055441810">805-544-1810</a>.
        </p>
      </div>
    </section>
  );
}
