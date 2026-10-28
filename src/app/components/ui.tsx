import DOMPurify from "dompurify";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { field, pagePath, safeExternalUrl, text } from "../lib/content";

declare global {
  var __MRC_SANITIZE_HTML__: undefined | ((html: string) => string);
}
export function sanitizeRichText(html: string) {
  const config = {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["style", "iframe", "form", "input", "button"],
  };
  return typeof window === "undefined"
    ? globalThis.__MRC_SANITIZE_HTML__?.(html) || ""
    : DOMPurify.sanitize(html, config);
}
export function RichText({
  html,
  className = "prose",
}: {
  html: string;
  className?: string;
}) {
  return html ? (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: sanitizeRichText(html.replace(/&nbsp;|\u00a0/g, " ")),
      }}
    />
  ) : null;
}
export function Heading({
  value,
  as = "h2",
}: {
  value: string;
  as?: "h1" | "h2" | "h3";
}) {
  const Tag = as;
  return (
    <Tag
      dangerouslySetInnerHTML={{
        __html: sanitizeRichText(
          value.replace(/\n/g, "<br>").replace(/<\/?p[^>]*>/gi, ""),
        ),
      }}
    />
  );
}
export function SiteLink({
  to,
  search = "",
  children,
  className = "text-link",
  ...rest
}: {
  to: string;
  search?: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
}) {
  const content =
    typeof children === "string" || typeof children === "number" ? (
      <span className="link-label">{children}</span>
    ) : (
      children
    );
  if (/^(https?:|mailto:|tel:)/i.test(to))
    return (
      <a
        href={safeExternalUrl(to)}
        className={className}
        {...rest}
        {...(to.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {content}
      </a>
    );
  const [pathWithQuery, hash = ""] = to.split("#");
  const [pathname, query = ""] = pathWithQuery.split("?");
  const params = new URLSearchParams(query);
  new URLSearchParams(search).forEach((value, key) => params.set(key, value));
  return (
    <Link
      to={{
        pathname: pathname || undefined,
        search: params.size ? `?${params}` : "",
        hash: hash ? `#${hash}` : "",
      }}
      className={className}
      {...rest}
    >
      {content}
    </Link>
  );
}
export function Action({
  source,
  search,
  className = "text-link",
}: {
  source: unknown;
  search: string;
  className?: string;
}) {
  const internal =
    field(source, "Internal Target")?.data?.target ??
    field(source, "Internal Page")?.data?.target;
  const external = field(source, "External URL")?.data?.url;
  const anchor = text(source, "Anchor").replace(/^#/, "");
  const label = text(source, "Button Text");
  const externalStyle =
    (source as { settings?: { style?: string } })?.settings?.style ===
    "External Link";
  const to =
    !externalStyle && typeof internal === "string" && internal
      ? pagePath(internal) + (anchor ? `#${anchor}` : "")
      : typeof external === "string" && external.trim()
        ? safeExternalUrl(external)
        : anchor
          ? `#${anchor}`
          : "";
  return label && to ? (
    <SiteLink to={to} search={search} className={className}>
      {label}
    </SiteLink>
  ) : null;
}
export function Actions({
  source,
  search,
  primaryClass = "btn",
  secondaryClass = "text-link",
}: {
  source: unknown;
  search: string;
  primaryClass?: string;
  secondaryClass?: string;
}) {
  return (
    <div className="button-row">
      <Action
        source={field(source, "Button")}
        search={search}
        className={primaryClass}
      />
      <Action
        source={field(source, "Secondary Button")}
        search={search}
        className={secondaryClass}
      />
    </div>
  );
}
export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <p className="error-notice" role="alert">
      {children}
    </p>
  );
}
export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="modal-top">
        <h2 id={headingId}>{title}</h2>
        <button
          type="button"
          className="plain-button"
          disabled={busy}
          onClick={onClose}
          aria-label="Close dialog"
        >
          Close
        </button>
      </div>
      {children}
    </dialog>
  );
}
