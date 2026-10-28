import { useId, useState, type ReactNode } from "react";
import type { EidosBlock, EidosPageMap } from "../types/eidos";
import {
  articleHeader,
  field,
  imageUrl,
  items,
  pagePath,
  plainText,
  referencedArticles,
  targetPage,
  text,
} from "../lib/content";
import { getFileValue } from "../lib/eidos-data";
import { reservationPauseCopy, siteConfig } from "../lib/config";
import { Action, Actions, Heading, RichText, SiteLink } from "./ui";
import { SuiteReservations, SuitesPreview } from "./Reservations";
import { PrayerCalendar } from "./PrayerCalendar";

export interface BlockProps {
  block: EidosBlock;
  pages: EidosPageMap;
  search: string;
}
function IntroCopy({ block }: { block: unknown }) {
  return (
    <>
      <div className="eyebrow">{text(block, "Eyebrow")}</div>
      {text(block, "Title") && <Heading value={text(block, "Title")} />}
      {text(block, "Body") && <RichText html={text(block, "Body")} />}
    </>
  );
}
function SectionHead({ block, search }: { block: unknown; search: string }) {
  return (
    <div className="section-head">
      <div>
        <div className="eyebrow">{text(block, "Eyebrow")}</div>
        {text(block, "Title") && <Heading value={text(block, "Title")} />}
      </div>
      <div className="section-head-actions">
        <Action source={field(block, "Button")} search={search} />
        <Action source={field(block, "Secondary Button")} search={search} />
      </div>
    </div>
  );
}
function Hero({ block, search }: BlockProps) {
  return (
    <section className="hero">
      {imageUrl(block) && (
        <img
          src={imageUrl(block)}
          alt={text(block, "Image Alt")}
          fetchPriority="high"
        />
      )}
      <div className="wrap">
        <div className="eyebrow light">{text(block, "Eyebrow")}</div>
        <Heading as="h1" value={text(block, "Title")} />
        <RichText html={text(block, "Body")} className="hero-copy" />
        <Actions source={block} search={search} />
      </div>
      <div className="hero-bottom">
        <div className="wrap">
          <span>{text(block, "Footer Left")}</span>
          <span>{text(block, "Footer Right")}</span>
        </div>
      </div>
    </section>
  );
}
function PageIntro({ block, search }: BlockProps) {
  return (
    <div className="wrap">
      <div className="page-intro">
        <div className="breadcrumbs">
          <SiteLink to="/" search={search} className="">
            Home
          </SiteLink>
          <span>/</span>
          <span>{text(block, "Eyebrow")}</span>
        </div>
        <div className="eyebrow">{text(block, "Eyebrow")}</div>
        <Heading as="h1" value={text(block, "Title")} />
        <RichText html={text(block, "Body")} className="lede" />
        <Actions source={block} search={search} />
      </div>
    </div>
  );
}
function JumpLinks({ block, search }: BlockProps) {
  const pathways = block.settings?.style === "Pathways";
  return (
    <nav
      aria-label={pathways ? "Ways to take part" : "On this page"}
      className={pathways ? "pathways" : "wrap"}
    >
      <div className={pathways ? "wrap pathway-grid" : "subnav"}>
        {items(block).map((item, index) =>
          pathways ? (
            <div key={index} className="pathway">
              <span className="num">{String(index + 1).padStart(2, "0")}</span>
              <Action
                source={field(item, "Button")}
                search={search}
                className="pathway-link"
              />
            </div>
          ) : (
            <Action
              key={index}
              source={field(item, "Button")}
              search={search}
              className=""
            />
          ),
        )}
      </div>
    </nav>
  );
}
function TextSection({ block, search }: BlockProps) {
  const style = String(block.settings?.style || "");
  const centered = style === "Centered" || style === "Notice";
  const list = items(block);
  const second = text(block, "Second Body");
  const title = (
    <>
      <div className="eyebrow">{text(block, "Eyebrow")}</div>
      {text(block, "Title") && <Heading value={text(block, "Title")} />}
    </>
  );
  const body = <RichText html={text(block, "Body")} />;
  const detailList = list.length > 0 && (
    <dl className="info-list">
      {list.map((item, index) => (
        <div key={index}>
          <dt>{text(item, "Title")}</dt>
          <dd>
            <RichText html={text(item, "Body")} className="" />
          </dd>
        </div>
      ))}
    </dl>
  );
  return (
    <section
      className={`section ${style.includes("Tinted") ? "tinted" : ""} ${centered ? "centered-section" : ""}`}
    >
      <div className="wrap">
        {centered ? (
          <div
            className={style === "Notice" ? "status-panel" : "partner-content"}
          >
            {title}
            {body}
            {second && <RichText html={second} />}
            {detailList}
            <Actions source={block} search={search} />
          </div>
        ) : second ? (
          <>
            {title}
            <div className="split-content text-section-columns">
              {body}
              <RichText html={second} />
            </div>
            {detailList}
            <Actions source={block} search={search} />
          </>
        ) : (
          <div className="split-content">
            <div>
              {title}
              {list.length > 0 && body}
              {list.length > 0 && <Actions source={block} search={search} />}
            </div>
            <div>
              {list.length ? detailList : body}
              {!list.length && <Actions source={block} search={search} />}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
function ImageText({ block, search }: BlockProps) {
  const style = String(block.settings?.style || "");
  return (
    <section className={`section ${style.includes("Tinted") ? "tinted" : ""}`}>
      <div
        className={`wrap community-grid ${style.startsWith("Image Right") ? "text-first" : ""}`}
      >
        <div className="community-photo">
          {imageUrl(block) && (
            <img
              src={imageUrl(block)}
              alt={text(block, "Image Alt")}
              loading="lazy"
            />
          )}
          {text(block, "Caption") && (
            <div className="photo-label">{text(block, "Caption")}</div>
          )}
        </div>
        <div className="community-copy">
          <IntroCopy block={block} />
          {items(block).length > 0 && (
            <div className="threefold">
              {items(block).map((item, index) => (
                <span key={index}>{text(item, "Title")}</span>
              ))}
            </div>
          )}
          <Actions source={block} search={search} primaryClass="text-link" />
        </div>
      </div>
    </section>
  );
}
function ImageBlock({ block }: BlockProps) {
  return imageUrl(block) ? (
    <figure className="wrap standalone-photo">
      <div className="page-photo">
        <img
          src={imageUrl(block)}
          alt={text(block, "Image Alt")}
          loading="lazy"
        />
      </div>
      {text(block, "Caption") && (
        <figcaption>{text(block, "Caption")}</figcaption>
      )}
    </figure>
  ) : null;
}
function Gallery({ block, search }: BlockProps) {
  const uploads = field(block, "Images")?.data?.fileUploads;
  return (
    <section className="section gallery-section">
      <div className="wrap">
        <div className="eyebrow">{text(block, "Eyebrow")}</div>
        {text(block, "Title") && <Heading value={text(block, "Title")} />}
        <RichText html={text(block, "Body")} />
        <div className="article-gallery">
          {Array.isArray(uploads) &&
            uploads.map((entry, index) => {
              const value = getFileValue({ data: { Image: entry } }, "Image");
              return value ? (
                <a
                  href={value}
                  key={index}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open community photograph ${index + 1}`}
                >
                  <img
                    src={imageUrl({ data: { Image: entry } })}
                    alt={
                      text(entry, "Image Alt") ||
                      `Monastery community photograph ${index + 1}`
                    }
                    loading="lazy"
                  />
                </a>
              ) : null;
            })}
        </div>
        <Actions source={block} search={search} />
      </div>
    </section>
  );
}
function CardGrid({ block, search }: BlockProps) {
  const style = String(block.settings?.style || "");
  const values = style === "Values";
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead block={block} search={search} />
        <RichText
          html={text(block, "Body")}
          className="lede section-description"
        />
        <div className={values ? "values" : "project-grid"}>
          {items(block).map((item, index) => (
            <article
              key={index}
              id={text(item, "Anchor") || undefined}
              className={values ? "value" : "project"}
            >
              {imageUrl(item) && (
                <img
                  src={imageUrl(item)}
                  alt={text(item, "Image Alt")}
                  loading="lazy"
                />
              )}
              {values ? (
                <span>{String(index + 1).padStart(2, "0")}</span>
              ) : (
                <div className="eyebrow">{text(item, "Eyebrow")}</div>
              )}
              <Heading as="h3" value={text(item, "Title")} />
              <RichText html={text(item, "Body")} />
              <Action source={field(item, "Button")} search={search} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
function PrayerSchedule({ block, pages, search }: BlockProps) {
  const sourceKey = targetPage(block, "Source Page");
  const source = sourceKey
    ? pages[sourceKey]?.content?.find((item) => item.type === "Prayer Schedule")
    : block;
  const schedule = items(source);
  return (
    <section className="section">
      <div className="wrap prayer-grid">
        <div className="prayer-intro">
          <IntroCopy block={block} />
          <Actions source={block} search={search} primaryClass="text-link" />
        </div>
        <div>
          <div className="schedule">
            {schedule.map((item, index) => (
              <div className="schedule-row" key={index}>
                <time>
                  {text(item, "Time")}
                  <small>{text(item, "Period")}</small>
                </time>
                <div>
                  <span className="title">{text(item, "Title")}</span>
                  <span className="desc">
                    {text(item, "Body").replace(/<[^>]+>/g, "")}
                  </span>
                </div>
                <span className="dot" aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="schedule-note">
            {text(block, "Note") || text(source, "Note")}
          </p>
        </div>
      </div>
    </section>
  );
}
function Discover({ block, search }: BlockProps) {
  const [main, side, note, ...extra] = items(block);
  const story = (item: unknown) => (
    <article className="image-story" id={text(item, "Anchor") || undefined}>
      {imageUrl(item) && (
        <img
          src={imageUrl(item)}
          alt={text(item, "Image Alt")}
          loading="lazy"
        />
      )}
      <div className="story-caption">
        <div className="eyebrow light">{text(item, "Eyebrow")}</div>
        <Heading as="h3" value={text(item, "Title")} />
        <RichText html={text(item, "Body")} />
        <Action source={field(item, "Button")} search={search} />
      </div>
    </article>
  );
  const notice = (item: unknown) => (
    <div className="retreat-note" id={text(item, "Anchor") || undefined}>
      <div className="eyebrow">{text(item, "Eyebrow")}</div>
      <Heading as="h3" value={text(item, "Title")} />
      <RichText html={text(item, "Body")} />
      <Action source={field(item, "Button")} search={search} />
    </div>
  );
  return (
    <section className="section experience">
      <div className="wrap">
        <SectionHead block={block} search={search} />
        <RichText html={text(block, "Body")} />
        <div className="experience-grid">
          {main && story(main)}
          <div className="experience-side">
            {side && story(side)}
            {note && (imageUrl(note) ? story(note) : notice(note))}
          </div>
        </div>
        {extra.length > 0 && (
          <div className="discover-extra">
            {extra.map((item, index) => (
              <div key={index}>
                {imageUrl(item) ? story(item) : notice(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
function FAQ({ block, search }: BlockProps) {
  return (
    <section
      className={`section ${String(block.settings?.style).includes("Tinted") ? "tinted" : ""}`}
    >
      <div className="wrap split-content">
        <div>
          <IntroCopy block={block} />
          <Actions source={block} search={search} />
        </div>
        <div className="faq">
          {items(block).map((item, index) => (
            <details key={index} open={index === 0}>
              <summary>{text(item, "Question")}</summary>
              <RichText html={text(item, "Answer")} className="faq-answer" />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
function Timeline({ block, search }: BlockProps) {
  return (
    <section className="section">
      <div className="wrap split-content">
        <div>
          <IntroCopy block={block} />
          <Actions source={block} search={search} />
        </div>
        <div className="timeline">
          {items(block).map((item, index) => (
            <div key={index}>
              <strong>{text(item, "Date")}</strong>
              <RichText html={text(item, "Body")} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
function People({ block, search }: BlockProps) {
  return (
    <section className="section">
      <div className="wrap">
        <SectionHead block={block} search={search} />
        <RichText html={text(block, "Body")} />
        <div className="people-grid">
          {items(block).map((item, index) => (
            <article
              key={index}
              className="person"
              id={text(item, "Anchor") || undefined}
            >
              {imageUrl(item) && (
                <img
                  className="person-image"
                  src={imageUrl(item)}
                  alt={text(item, "Image Alt")}
                  loading="lazy"
                />
              )}
              <div className="eyebrow">{text(item, "Eyebrow")}</div>
              <Heading as="h3" value={text(item, "Title")} />
              <RichText html={text(item, "Body")} />
              <Action source={field(item, "Button")} search={search} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
function ContactDirections({ block, search }: BlockProps) {
  const contacts = items(block);
  const directionUrl = String(field(block, "Directions URL")?.data?.url || "");
  return (
    <section className="section">
      <div className="wrap contact-grid">
        <div>
          {contacts.length ? (
            contacts.map((item, index) => (
              <article
                className="contact-box"
                id={text(item, "Anchor") || undefined}
                key={index}
              >
                {imageUrl(item) && (
                  <img
                    className="person-image"
                    src={imageUrl(item)}
                    alt={text(item, "Image Alt")}
                    loading="lazy"
                  />
                )}
                <div className="eyebrow">{text(item, "Eyebrow")}</div>
                <Heading value={text(item, "Title")} />
                <RichText html={text(item, "Body")} />
                <Action source={field(item, "Button")} search={search} />
              </article>
            ))
          ) : (
            <>
              <IntroCopy block={block} />
              <dl className="info-list">
                <div>
                  <dt>Address</dt>
                  <dd>
                    <RichText html={text(block, "Address")} className="" />
                  </dd>
                </div>
                <div>
                  <dt>Telephone</dt>
                  <dd>
                    <SiteLink to={`tel:${text(block, "Phone")}`}>
                      {text(block, "Phone")}
                    </SiteLink>
                  </dd>
                </div>
              </dl>
              <Actions source={block} search={search} />
            </>
          )}
        </div>
        <div>
          <div className="map-panel">
            {imageUrl(block) && (
              <img
                src={imageUrl(block)}
                alt={text(block, "Image Alt")}
                loading="lazy"
              />
            )}
            <div className="map-address">
              <div className="eyebrow">
                {contacts.length
                  ? text(block, "Eyebrow")
                  : "Monastery of the Risen Christ"}
              </div>
              {contacts.length ? (
                <Heading as="h3" value={text(block, "Title")} />
              ) : (
                <h3>
                  Find your way
                  <br />
                  to the quiet.
                </h3>
              )}
              <RichText html={text(block, "Address")} className="" />
              <SiteLink to={directionUrl}>Open directions</SiteLink>
            </div>
          </div>
          <p className="schedule-note">{text(block, "Note")}</p>
          {contacts.length > 0 && (
            <>
              <RichText html={text(block, "Body")} />
              <Actions source={block} search={search} />
            </>
          )}
          {contacts.length > 0 && siteConfig.publicReservationsPaused && (
            <div className="status-panel contact-pause">
              <div className="eyebrow">Overnight hospitality</div>
              <h2>Reservations are paused.</h2>
              <p>{reservationPauseCopy}</p>
              <SiteLink to="/retreats" search={search}>
                Read the full update
              </SiteLink>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
function SupportCallout({ block, search }: BlockProps) {
  return (
    <section className="support-band">
      <div className="wrap">
        <div>
          <div className="eyebrow light">{text(block, "Eyebrow")}</div>
          <Heading value={text(block, "Title")} />
        </div>
        <div>
          <RichText html={text(block, "Body")} />
          <Actions
            source={block}
            search={search}
            primaryClass="btn light"
            secondaryClass="btn ghost-light"
          />
        </div>
      </div>
    </section>
  );
}
function GivingSection({ block, search }: BlockProps) {
  const [monthly, setMonthly] = useState(false);
  return (
    <section className="section">
      <div className="wrap giving-layout">
        <div>
          <IntroCopy block={block} />
          <Actions source={block} search={search} primaryClass="text-link" />
        </div>
        <div className="giving-panel">
          <Heading value={text(block, "Panel Title")} />
          <div className="segmented" aria-label="Donation frequency">
            <button onClick={() => setMonthly(false)} aria-pressed={!monthly}>
              Give once
            </button>
            <button onClick={() => setMonthly(true)} aria-pressed={monthly}>
              Give monthly
            </button>
          </div>
          <RichText
            html={text(block, monthly ? "Monthly Body" : "One-time Body")}
          />
          {monthly ? (
            <div className="amounts">
              {items(block).map((item, index) => (
                <Action
                  key={index}
                  source={field(item, "Button")}
                  search={search}
                  className="donation-amount"
                />
              ))}
            </div>
          ) : (
            <Action
              source={field(block, "One-time Donation")}
              search={search}
              className="btn"
            />
          )}
          <p className="giving-note">{text(block, "Giving Note")}</p>
        </div>
      </div>
    </section>
  );
}
function ArticleHeader({ block, search }: BlockProps) {
  const collection = text(block, "Collection").toLowerCase();
  return (
    <header className="article-heading">
      <div className="breadcrumbs">
        <SiteLink to={`/${collection}`} search={search} className="">
          {collection === "news" ? "News & events" : "Reflections & resources"}
        </SiteLink>
        <span>/</span>
        <span>{text(block, "Category")}</span>
      </div>
      <div className="eyebrow">{text(block, "Category")}</div>
      <Heading as="h1" value={text(block, "Title")} />
      <div className="article-meta">
        {text(block, "Author")}
        <br />
        {text(block, "Date Label")}
      </div>
      {imageUrl(block) && (
        <div className="article-feature-image">
          <img src={imageUrl(block)} alt={text(block, "Image Alt")} />
        </div>
      )}
      <RichText html={text(block, "Summary")} className="article-intro" />
    </header>
  );
}
function ArticleCard({
  entry,
  search,
  compact = false,
  news = false,
  label = "",
}: {
  entry: readonly [string, EidosPageMap[string]];
  search: string;
  compact?: boolean;
  news?: boolean;
  label?: string;
}) {
  const [key, page] = entry;
  const header = articleHeader(page);
  return (
    <article
      className={
        news ? "home-news-item" : compact ? "journal-item" : "library-entry"
      }
    >
      {news && imageUrl(header) && (
        <img
          src={imageUrl(header)}
          alt={text(header, "Image Alt")}
          loading="lazy"
        />
      )}
      <div className={news ? "home-news-copy" : "article-card-copy"}>
        <div className="eyebrow">{text(header, "Category")}</div>
        {compact ? (
          <h3>
            <SiteLink to={pagePath(key)} search={search} className="">
              {plainText(text(header, "Title")) || page.title}
            </SiteLink>
          </h3>
        ) : (
          <h2>
            <SiteLink to={pagePath(key)} search={search} className="">
              {plainText(text(header, "Title")) || page.title}
            </SiteLink>
          </h2>
        )}
        <p className="excerpt">
          {plainText(text(header, "Summary")) || page.description}
        </p>
        <div className="author">
          {text(header, "Author")}
          {!compact && (
            <>
              <br />
              {text(header, "Date Label")}
            </>
          )}
        </div>
        <SiteLink to={pagePath(key)} search={search}>
          {label ||
            (news
              ? "Explore the story"
              : text(header, "Category") === "Homily"
                ? "Explore the homily"
                : "Read & reflect")}
        </SiteLink>
      </div>
    </article>
  );
}
function ArticleIndex({ block, pages, search }: BlockProps) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const searchId = useId();
  const entries = referencedArticles(block, pages);
  const categories = [
    ...new Set(
      entries
        .map(([, page]) => text(articleHeader(page), "Category"))
        .filter(Boolean),
    ),
  ];
  const filtered = entries.filter(([, page]) => {
    const header = articleHeader(page);
    const haystack = [
      text(header, "Title"),
      text(header, "Summary"),
      text(header, "Author"),
      ...(page.content
        ?.filter((item) => item.type === "Text Section")
        .map((item) => text(item, "Body").replace(/<[^>]+>/g, " ")) || []),
    ]
      .join(" ")
      .toLowerCase();
    return (
      (category === "All" || text(header, "Category") === category) &&
      haystack.includes(query.trim().toLowerCase())
    );
  });
  return (
    <section className="section sm">
      <div className="wrap">
        <div className="library-toolbar">
          <div className="filters" aria-label="Filter articles">
            {["All", ...categories].map((value) => (
              <button
                className="filter"
                key={value}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {value === "All" ? "All resources" : value}
              </button>
            ))}
          </div>
          <label htmlFor={searchId} className="screen-reader">
            Search the library
          </label>
          <input
            id={searchId}
            className="search"
            type="search"
            placeholder={
              text(block, "Search Placeholder") || "Search the library…"
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {text(block, "Note") && (
          <p className="event-note">{text(block, "Note")}</p>
        )}
        <p className="results-label" aria-live="polite">
          {filtered.length}{" "}
          {text(block, "Collection") === "news"
            ? filtered.length === 1
              ? "story"
              : "stories"
            : filtered.length === 1
              ? "resource"
              : "resources"}
        </p>
        <div className="library-grid">
          {filtered.map((entry) => (
            <ArticleCard key={entry[0]} entry={entry} search={search} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="empty-state">
            No resources match your search. Try another word or category.
          </p>
        )}
      </div>
    </section>
  );
}
function FeaturedArticles({ block, pages, search }: BlockProps) {
  const style = String(block.settings?.style || "Journal");
  const entries = referencedArticles(block, pages);
  if (style === "Feature") {
    return entries.length ? (
      <section className="section sm">
        <div className="wrap">
          {entries.map((entry, index) => {
            const header = articleHeader(entry[1]);
            const label = text(
              items(block).find((item) => targetPage(item) === entry[0]),
              "Label",
            );
            return (
              <article className="news-feature" key={entry[0]}>
                {imageUrl(header) && (
                  <img
                    src={imageUrl(header)}
                    alt={text(header, "Image Alt")}
                    loading="lazy"
                  />
                )}
                <div>
                  <div className="eyebrow">
                    {(index === 0 && text(block, "Eyebrow")) ||
                      text(header, "Category")}
                  </div>
                  <Heading
                    value={
                      (index === 0 && text(block, "Title")) ||
                      text(header, "Title")
                    }
                  />
                  <RichText
                    html={
                      (index === 0 && text(block, "Body")) ||
                      text(header, "Summary")
                    }
                  />
                  <div className="button-row">
                    <SiteLink to={pagePath(entry[0])} search={search}>
                      {label || "Explore the story"}
                    </SiteLink>
                  </div>
                </div>
              </article>
            );
          })}
          <Actions source={block} search={search} />
        </div>
      </section>
    ) : null;
  }
  return (
    <section
      className={`section ${style === "News" ? "home-news" : "journal"}`}
    >
      <div className="wrap">
        <SectionHead block={block} search={search} />
        <RichText html={text(block, "Body")} />
        <div className={style === "News" ? "home-news-grid" : "journal-grid"}>
          {entries.map((entry) => (
            <ArticleCard
              key={entry[0]}
              entry={entry}
              search={search}
              compact
              news={style === "News"}
              label={text(
                items(block).find((item) => targetPage(item) === entry[0]),
                "Label",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export const blockRegistry = {
  Hero,
  "Page Intro": PageIntro,
  "Jump Links": JumpLinks,
  "Text Section": TextSection,
  "Image Text": ImageText,
  Image: ImageBlock,
  "Image Gallery": Gallery,
  "Card Grid": CardGrid,
  "Prayer Schedule": PrayerSchedule,
  "Discover Monastery": Discover,
  "Suites Preview": SuitesPreview,
  "Suite Reservations": SuiteReservations,
  "FAQ Section": FAQ,
  Timeline,
  People,
  "Contact Directions": ContactDirections,
  "Support Callout": SupportCallout,
  "Giving Section": GivingSection,
  "Article Header": ArticleHeader,
  "Article Index": ArticleIndex,
  "Featured Articles": FeaturedArticles,
  "Live Calendar": PrayerCalendar,
};
export function BlockRenderer({
  blocks,
  pages,
  search,
  afterIntro,
}: {
  blocks: EidosBlock[];
  pages: EidosPageMap;
  search: string;
  afterIntro?: ReactNode;
}) {
  return (
    <div className="block-stack">
      {blocks.map((block, index) => {
        const Component =
          blockRegistry[block.type as keyof typeof blockRegistry];
        return (
          <div
            key={`${block.type}-${index}`}
            data-block-type={block.type}
            id={text(block, "Anchor") || undefined}
          >
            {Component ? (
              <Component block={block} pages={pages} search={search} />
            ) : siteConfig.buildTarget === "testing" ? (
              <section className="section">
                <div className="wrap error-notice">
                  Unsupported block: {block.type}
                </div>
              </section>
            ) : null}
            {index === 0 && afterIntro}
          </div>
        );
      })}
    </div>
  );
}
