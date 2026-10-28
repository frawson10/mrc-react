// One-time, reproducible import of the approved mockup. Eidos edits public/pages.json.
// Regeneration intentionally replaces editorial changes: never run this during a normal build.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (name) =>
  JSON.parse(await readFile(resolve(root, "content", name), "utf8"));
const [collection, originals, sources] = await Promise.all(
  ["mockup-articles.json", "mrc-originals.json", "asset-sources.json"].map(
    read,
  ),
);
const output = async (name, data) => {
  await mkdir(dirname(resolve(root, name)), { recursive: true });
  await writeFile(
    resolve(root, name),
    typeof data === "string" ? data : `${JSON.stringify(data, null, 2)}\n`,
  );
};
const id = (path) =>
  createHash("sha256").update(`mrc-react:${path}`).digest("hex").slice(0, 12);
const text = (label, rich = false, max = 3000) => ({
  kind: "text",
  label,
  settings: {
    minCharacters: 0,
    maxCharacters: max,
    placeholder: "",
    formatting: rich,
    multipleLines: rich,
  },
});
const file = (label) => ({
  kind: "fileUpload",
  label,
  settings: { allowedTypes: ".png,.jpg,.jpeg,.webp,.svg", maxSizeKb: 10240 },
});
const action = (label) => ({
  kind: "object",
  label,
  styleOptions: "Internal Page, External Link",
  children: [
    text("Button Text"),
    {
      kind: "internalNavAction",
      label: "Internal Target",
      settings: { payloadKey: null },
    },
    {
      kind: "externalNavAction",
      label: "External URL",
      settings: { payloadKey: null },
    },
    text("Anchor"),
  ],
});
const list = (label, children) => ({
  kind: "listOfObjects",
  label,
  settings: { minItems: null, maxItems: null },
  children,
});
const common = () => [
  text("Eyebrow"),
  text("Title", true, 1000),
  text("Body", true, 100000),
  text("Anchor"),
  action("Button"),
  action("Secondary Button"),
];
const imageFields = () => [file("Image"), text("Image Alt")];
const itemFields = () => [
  text("Eyebrow"),
  text("Title", true, 1000),
  text("Body", true, 100000),
  ...imageFields(),
  action("Button"),
  text("Anchor"),
];
const definitions = [
  {
    label: "Hero",
    children: [
      ...common(),
      ...imageFields(),
      text("Footer Left"),
      text("Footer Right"),
    ],
  },
  { label: "Page Intro", children: common() },
  {
    label: "Jump Links",
    styleOptions: "Pathways, On This Page",
    children: [list("Items", [action("Button")])],
  },
  {
    label: "Text Section",
    styleOptions: "Default, Tinted, Centered, Notice",
    children: [
      ...common(),
      text("Second Body", true, 100000),
      list("Items", [text("Title"), text("Body", true, 100000)]),
    ],
  },
  {
    label: "Image Text",
    styleOptions:
      "Image Left, Image Right, Image Left Tinted, Image Right Tinted",
    children: [
      ...common(),
      ...imageFields(),
      text("Caption"),
      list("Items", [text("Title")]),
    ],
  },
  {
    label: "Image",
    children: [...imageFields(), text("Caption"), text("Anchor")],
  },
  {
    label: "Image Gallery",
    children: [
      ...common(),
      {
        kind: "listOfFileUploads",
        label: "Images",
        settings: { allowedTypes: ".png,.jpg,.jpeg,.webp", maxSizeKb: 10240 },
      },
    ],
  },
  {
    label: "Card Grid",
    styleOptions: "Default, Values, Projects",
    children: [...common(), list("Items", itemFields())],
  },
  {
    label: "Prayer Schedule",
    children: [
      ...common(),
      text("Note"),
      list("Items", [
        text("Time"),
        text("Period"),
        text("Title"),
        text("Body"),
      ]),
      {
        kind: "internalNavAction",
        label: "Source Page",
        settings: { payloadKey: null },
      },
    ],
  },
  {
    label: "Discover Monastery",
    children: [...common(), list("Items", itemFields())],
  },
  {
    label: "Suites Preview",
    children: common(),
    description:
      "Editable introduction; suite identities, descriptions and availability are managed in application code.",
  },
  {
    label: "Suite Reservations",
    kind: "managed",
    description:
      "Managed suite availability, checkout, confirmation and cancellation. No CMS-controlled payment or booking settings.",
  },
  {
    label: "FAQ Section",
    styleOptions: "Default, Tinted",
    children: [
      ...common(),
      list("Items", [text("Question"), text("Answer", true, 10000)]),
    ],
  },
  {
    label: "Timeline",
    children: [
      ...common(),
      list("Items", [text("Date"), text("Body", true, 10000)]),
    ],
  },
  { label: "People", children: [...common(), list("Items", itemFields())] },
  {
    label: "Contact Directions",
    children: [
      ...common(),
      ...imageFields(),
      text("Address", true),
      text("Phone"),
      {
        kind: "externalNavAction",
        label: "Directions URL",
        settings: { payloadKey: null },
      },
      text("Note"),
      list("Items", itemFields()),
    ],
  },
  { label: "Support Callout", children: common() },
  {
    label: "Giving Section",
    children: [
      ...common(),
      text("Panel Title"),
      text("One-time Body", true),
      action("One-time Donation"),
      text("Monthly Body", true),
      text("Giving Note"),
      list("Items", [action("Button")]),
    ],
  },
  {
    label: "Article Header",
    children: [
      text("Title", true, 1000),
      text("Category"),
      text("Collection"),
      text("Author"),
      text("Date Label"),
      text("Summary", true, 5000),
      ...imageFields(),
      text("Original Title"),
      text("Original ID"),
      action("Video"),
      action("Resource"),
      text("Source Credit"),
    ],
  },
  {
    label: "Article Index",
    children: [
      text("Collection"),
      text("Search Placeholder"),
      text("Note"),
      list("Items", [
        {
          kind: "internalNavAction",
          label: "Page",
          settings: { payloadKey: null },
        },
      ]),
    ],
  },
  {
    label: "Featured Articles",
    styleOptions: "Journal, News, Feature",
    children: [
      ...common(),
      list("Items", [
        {
          kind: "internalNavAction",
          label: "Page",
          settings: { payloadKey: null },
        },
        text("Label"),
      ]),
    ],
  },
  {
    label: "Live Calendar",
    kind: "managed",
    description:
      "Public MRC Google prayer calendar. Feed and display logic are maintained in application code.",
  },
];

const schemaNode = (definition, path) => ({
  id: id(path),
  kind: definition.kind || "object",
  label: definition.label,
  description:
    definition.description || `Edit ${definition.label.toLowerCase()} content.`,
  version: "1.0.0",
  language: "en",
  multipleLanguages: false,
  styleOptions: definition.styleOptions || [],
  ...(definition.settings ? { settings: definition.settings } : {}),
  ...(definition.children
    ? {
        children: definition.children.map((child) =>
          schemaNode(child, `${path}/${child.label}`),
        ),
      }
    : {}),
});
const schema = { blocks: definitions.map((def) => schemaNode(def, def.label)) };
const defs = Object.fromEntries(
  schema.blocks.map((block) => [block.label, block]),
);
const field = (label, type, data = {}, settings = {}) => ({
  label,
  type,
  description: `Content for ${label}.`,
  settings,
  data,
});
const makeField = (def, value) => {
  if (def.kind === "object") {
    return field(
      def.label,
      def.kind,
      makeData(def.children, value || {}),
      value?.$style ? { style: value.$style } : {},
    );
  }
  if (def.kind === "listOfObjects")
    return field(def.label, def.kind, {
      objects: (value || []).map((row, index) => ({
        nickname: row.Title || row.Question || row.Date || `Item ${index + 1}`,
        type: "object",
        description: "Repeatable item.",
        settings: {},
        data: makeData(def.children, row),
      })),
    });
  if (def.kind === "listOfFileUploads")
    return field(def.label, def.kind, {
      fileUploads: (value || []).map((url) => ({
        nickname: "Article photograph",
        type: "fileUpload",
        description: "Photograph from the selected original MRC article.",
        settings: {},
        data: { file: url },
      })),
    });
  return field(def.label, def.kind, {
    [{
      text: "text",
      fileUpload: "file",
      internalNavAction: "target",
      externalNavAction: "url",
    }[def.kind]]: value || "",
  });
};
function makeData(children, values) {
  return Object.fromEntries(
    children.map((def) => [def.label, makeField(def, values[def.label])]),
  );
}
const block = (type, values = {}, style = "", nickname = "") => ({
  nickname: nickname || values.Title?.replace(/<[^>]*>/g, " ") || type,
  type,
  description: defs[type].description,
  settings: style ? { style } : {},
  data: defs[type].children ? makeData(defs[type].children, values) : {},
});
const a = (label, page, anchor = "") => ({
  "Button Text": label,
  "Internal Target": page,
  Anchor: anchor,
  $style: "Internal Page",
});
const ext = (label, url) => ({
  "Button Text": label,
  "External URL": url,
  $style: "External Link",
});
const imageSource = Object.fromEntries(
  sources.assets.map((asset) => [asset.filename, asset]),
);
const img = (name) => imageSource[name]?.source_url || "";
const pic = (name, alt) => ({
  Image: img(name),
  "Image Alt": alt || imageSource[name]?.subject || "",
});
const p = (...paras) =>
  paras.map((paragraph) => `<p>${paragraph}</p>`).join("");
const cleanHtml = (value) =>
  (value || "")
    .replace(/\sstyle=("[^"]*"|'[^']*')/gi, "")
    .replace(/\sclass=("[^"]*"|'[^']*')/gi, "")
    .replace(/<\/?span[^>]*>/gi, "")
    .replace(/&nbsp;/g, " ");
const intro = (eyebrow, title, body) =>
  block("Page Intro", { Eyebrow: eyebrow, Title: title, Body: p(body) });
const supportBand = () =>
  block("Support Callout", {
    Eyebrow: "A shared work of hospitality",
    Title: "Help this quiet<br>life continue.",
    Body: p(
      "Your generosity helps sustain the prayer, hospitality, grounds, and everyday life of the monastery. There are many ways to take part.",
    ),
    Button: a("Support the monastery", "support"),
    "Secondary Button": a("Offer your time", "support", "volunteer"),
  });
const textSection = (eyebrow, title, body, button, style = "", extra = {}) =>
  block(
    "Text Section",
    { Eyebrow: eyebrow, Title: title, Body: body, Button: button, ...extra },
    style,
  );
const refItems = (kind, ids, labels = {}) =>
  ids.map((key) => ({ Page: `${kind}/${key}`, Label: labels[key] || "" }));
const featured = (eyebrow, title, kind, ids, button, style = "Journal") =>
  block(
    "Featured Articles",
    {
      Eyebrow: eyebrow,
      Title: title,
      Items: refItems(kind, ids),
      Button: button,
    },
    style,
  );
const prayerTimes = [
  { Time: "7:30", Period: "AM", Title: "Lauds", Body: "Morning prayer" },
  { Time: "11:00", Period: "AM", Title: "Eucharist", Body: "Mass" },
  {
    Time: "5:30",
    Period: "PM",
    Title: "Adoration & meditation",
    Body: "Exposition of the Blessed Sacrament",
  },
  { Time: "6:00", Period: "PM", Title: "Vespers", Body: "Evening prayer" },
];
const prayerNote =
  "Published public prayer times. Please confirm the schedule for your planned visit. Vigils and Compline are private.";
const directions = encodeURI(
  "https://www.google.com/maps/search/?api=1&query=2308 O’Connor Way, San Luis Obispo, CA 93405",
);
const contactPanel = (items) =>
  block("Contact Directions", {
    Eyebrow: "Find your way here",
    Title: "In the hills<br>of San Luis Obispo.",
    Address: "2308 O’Connor Way<br>San Luis Obispo, CA 93405",
    Phone: "805-544-1810",
    "Directions URL": directions,
    ...pic("landscape.webp", "The hills surrounding the monastery"),
    Note: "Please call before travelling to confirm visiting arrangements, prayer times, and any particular access needs.",
    Items: items,
    Button: a("Contact & directions", "contact"),
  });

const pages = {};
const addPage = (key, title, description, content, order = null, seo = {}) => {
  pages[key] = {
    title,
    url: key === "_home" ? "/" : key,
    description,
    keywords: [],
    settings: {
      showMenu: order !== null,
      showFooter: true,
      ...(order !== null ? { menuOrder: order } : {}),
    },
    seo: {
      seoTitle: title,
      metaDescription: description,
      canonicalPath: key === "_home" ? "/" : `/${key}`,
      ogImage: img("hero.webp"),
      ...seo,
    },
    content,
  };
};

addPage(
  "_home",
  "Home",
  "A Camaldolese Benedictine community of prayer, hospitality, and contemplative life in the hills of San Luis Obispo, California.",
  [
    block("Hero", {
      Eyebrow: "Camaldolese Benedictine · California’s Central Coast",
      Title: "Come into<br>the <em>quiet.</em>",
      Body: p(
        "A life rooted in prayer. A welcome open to you.<br>Discover our contemplative community in the hills of San Luis Obispo.",
      ),
      ...pic("hero.webp"),
      Button: a("Book a stay", "retreats", "booking"),
      "Secondary Button": a("Explore our suites", "_home", "suites"),
      "Footer Left": "Monastery of the Risen Christ",
      "Footer Right": "Solitude · Community · Contemplative outreach",
    }),
    block(
      "Jump Links",
      {
        Items: [
          ["visit", "Pray with us"],
          ["retreats", "Find stillness"],
          ["community", "Meet the community"],
          ["reflections", "Read & reflect"],
          ["support", "Offer your support"],
        ].map(([key, title]) => ({ Title: title, Button: a(title, key) })),
      },
      "Pathways",
    ),
    block("Suites Preview", {
      Eyebrow: "Stay at the monastery",
      Title: "Three suites.<br>Room to be still.",
      Body: p(
        "Find a quiet place for prayer, reading, and renewal in one of our three hospitality suites.",
      ),
      Anchor: "suites",
      Button: a("Book a stay", "retreats", "booking"),
    }),
    block("Prayer Schedule", {
      Eyebrow: "An invitation to pause",
      Title: "A rhythm of prayer.<br>A place to belong.",
      Body: p(
        "You are welcome to share in the prayer of our monastic community. Come for a moment of stillness, for the Eucharist, or for the simple grace of praying together.",
      ),
      Button: a("Prayer & visiting information", "visit"),
      "Source Page": "visit",
      Note: "",
    }),
    block("Discover Monastery", {
      Eyebrow: "Space for the life within",
      Title: "Discover the monastery.",
      Button: a("Plan your visit", "visit"),
      Items: [
        {
          Eyebrow: "Prayer & presence",
          Title: "Gather in the chapel.",
          Body: p(
            "Share in communal worship and the contemplative life that gives this place its rhythm.",
          ),
          ...pic("chapel.webp"),
          Button: a("Join us for prayer", "visit"),
        },
        {
          Eyebrow: "Silence & landscape",
          Title: "Let the quiet speak.",
          ...pic("labyrinth.webp"),
          Button: a("Explore our life", "community"),
        },
        {
          Eyebrow: "Overnight hospitality update",
          Title: "Making room for our brothers.",
          Body: p(
            "Our suites are temporarily housing monks evacuated from New Camaldoli Hermitage. Reservations are paused, with reopening hoped for after February 2027, circumstances permitting.",
          ),
          Button: a("Read the retreat update", "retreats"),
        },
      ],
    }),
    block(
      "Image Text",
      {
        Eyebrow: "Rooted in an ancient tradition",
        Title: "Contemplative life,<br>in the heart of<br>the Central Coast.",
        Body: p(
          "We are a Catholic community in the Camaldolese Benedictine tradition. Our life brings together personal prayer, life in community, and a contemplative presence in the world.",
        ),
        ...pic("community.webp"),
        Caption: "A life shared, a tradition lived.",
        Items: ["Solitude", "Community", "Outreach"].map((Title) => ({
          Title,
        })),
        Button: a("Our community & tradition", "community"),
      },
      "Image Left",
    ),
    featured(
      "Words for the journey",
      "Read. Listen. Reflect.",
      "reflections",
      ["labyrinth-peace-walk", "apocalypse-or-renewal", "monastic-reading"],
      a("Explore the library", "reflections"),
    ),
    featured(
      "Around the monastery",
      "A living community.",
      "news",
      ["renewed-chapel", "welcome-elizabeth-matthew"],
      a("News & community stories", "news"),
      "News",
    ),
    supportBand(),
  ],
);

addPage(
  "visit",
  "Visit & Prayer",
  "Public prayer times, visiting guidance, the live monastery calendar, and directions to MRC in San Luis Obispo.",
  [
    intro(
      "Visit & prayer",
      "A welcome into<br>our life of prayer.",
      "Find the prayer schedule, directions, and practical guidance for spending time with the community.",
    ),
    block(
      "Jump Links",
      {
        Items: [
          ["prayer", "Public prayer"],
          ["visiting", "Before you visit"],
          ["calendar", "Calendar"],
          ["directions", "Directions"],
        ].map(([anchor, title]) => ({
          Title: title,
          Button: a(title, "visit", anchor),
        })),
      },
      "On This Page",
    ),
    block("Prayer Schedule", {
      Eyebrow: "Pray with the community",
      Title: "The rhythm<br>of our day.",
      Body: p(
        "The public is welcome at the prayer times published by the monastery. Vigils and Compline remain private to the monastic community.",
      ),
      Button: ext("Call to confirm your visit", "tel:+18055441810"),
      Anchor: "prayer",
      Items: prayerTimes,
      Note: prayerNote,
    }),
    block(
      "Image",
      pic("chapel.webp", "Visitors gathered in the monastery chapel"),
    ),
    block("FAQ Section", {
      Eyebrow: "Before you arrive",
      Title: "A few things<br>to know.",
      Body: p(
        "Our monastery is a place of prayer and contemplation. Please help preserve the quiet atmosphere, and contact us if you are unsure about visiting arrangements.",
      ),
      Anchor: "visiting",
      Items: [
        {
          Question: "Can I join public prayer?",
          Answer: p(
            "Yes. The monastery invites the public to share in the published prayer schedule. Confirm any changes before travelling, especially on weekends and special occasions.",
          ),
        },
        {
          Question: "Can I stay overnight?",
          Answer: p(
            "Overnight reservations are temporarily unavailable while the hospitality suites accommodate evacuated monks from New Camaldoli. See our retreat page for the full update.",
          ),
        },
        {
          Question: "What should I expect?",
          Answer: p(
            "A gentle, contemplative atmosphere, with respect for silence and the community’s rhythm of prayer. For access to the grounds outside public prayer, please arrange your visit with the monastery.",
          ),
        },
        {
          Question: "What about access or mobility needs?",
          Answer: p(
            "Please call 805-544-1810 to discuss your access needs before visiting. We can help you clarify the arrangements for your particular visit.",
          ),
        },
      ],
    }),
    textSection(
      "Prayer & gatherings",
      "Keep in touch<br>with our rhythm.",
      p(
        "Use the monastery’s live calendar for current prayer entries. Community notices and gatherings are collected on our News & Events page.",
      ),
      a("Open the live calendar", "calendar"),
      "Tinted",
      {
        Anchor: "calendar",
        "Secondary Button": a("News & events", "news"),
        Items: [
          {
            Title: "Live calendar",
            Body: p(
              "Week and month views of the monastery’s published schedule.",
            ),
          },
          {
            Title: "Community gatherings",
            Body: p("Events, celebrations, and news from the monastery."),
          },
        ],
      },
    ),
    {
      ...contactPanel([]),
      data: {
        ...contactPanel([]).data,
        Anchor: field("Anchor", "text", { text: "directions" }),
      },
    },
  ],
  0,
);

addPage(
  "retreats",
  "Retreat Hospitality",
  "Discover the monastery’s hospitality suites, contemplative retreats, and guidance for planning a future stay.",
  [
    intro(
      "Retreat hospitality",
      "Room for silence.<br>Space for renewal.",
      "Our monastic hospitality offers an opportunity for prayer, reading, and quiet reflection. People of all faiths are welcome to explore this contemplative experience.",
    ),
    textSection(
      "The monastic hospitality experience",
      "A gentle, profound silence.",
      p(
        "Hospitality is part of our Benedictine way of life. Private accommodation allows space for solitary prayer, reading, and meditation, alongside opportunities to share in the community’s prayer.",
      ),
      null,
      "Default",
      {
        "Second Body": p(
          "The chapel, landscape, labyrinth, and meditation walks give shape to a retreat that values spaciousness. Our hospitality is contemplative and usually oriented toward an individual experience.",
        ),
      },
    ),
    block(
      "Image",
      pic(
        "landscape.webp",
        "Rolling hills and the quiet landscape around the monastery",
      ),
    ),
    block(
      "Suite Reservations",
      {},
      "",
      "Managed suite booking and current hospitality status",
    ),
    block(
      "FAQ Section",
      {
        Eyebrow: "Prepare for a future retreat",
        Title: "Simple arrangements.<br>Time to be still.",
        Body: p(
          "These are the monastery’s published hospitality guidelines. Please reconfirm details when overnight hospitality resumes.",
        ),
        Items: [
          {
            Question: "What is included?",
            Answer: p(
              "Published hospitality access includes the chapel, patio, conference area, labyrinth, Way of the Cross walks, hiking trails, library, grounds, and parking. Book and gift shop hours vary.",
            ),
          },
          {
            Question: "Are meals provided?",
            Answer: p(
              "Meals are not provided. The published suite information lists a microwave, small refrigerator, and hot-pot. Guests may bring food or visit nearby restaurants.",
            ),
          },
          {
            Question: "How long may I stay?",
            Answer: p(
              "The published overnight stay range is one to seven nights. A refundable first-night deposit is required when reservations are available. Confirm terms when booking resumes.",
            ),
          },
          {
            Question: "What are the arrival and departure times?",
            Answer: p(
              "Published check-in is 2:00 p.m. and check-out is 1:00 p.m. Guests check in at the monastic bookstore beside the chapel, or call 805-544-1810 if it is closed.",
            ),
          },
          {
            Question: "What helps preserve the silence?",
            Answer: p(
              "The monastery asks retreatants to refrain from radios, musical instruments, and other disruptive sound. Pets are not permitted in overnight accommodation.",
            ),
          },
        ],
      },
      "Tinted",
    ),
    textSection(
      "Beyond overnight hospitality",
      "Workshops &<br>spiritual renewal.",
      p(
        "Prior Daniel’s published ministry includes off-site workshops and retreats for pastoral groups, parishes, religious communities, priests, and university students. Themes can be discussed according to the group’s needs.",
      ),
      a("Inquire about a workshop", "contact", "daniel"),
    ),
  ],
  1,
);

addPage(
  "community",
  "Our Community",
  "Meet the Camaldolese Benedictine community, its threefold tradition, history, and wider Oblate family.",
  [
    intro(
      "Our community",
      "An ancient tradition.<br>A living presence.",
      "We are a Catholic Camaldolese Benedictine community, living a contemplative life of prayer, work, and hospitality on California’s Central Coast.",
    ),
    block("Image", pic("monastery.webp")),
    block(
      "Card Grid",
      {
        Eyebrow: "The Camaldolese way",
        Title: "Three gifts.<br>One way of life.",
        Body: p(
          "Our tradition holds together solitude, community, and contemplative outreach. Each nourishes the others: a personal life of prayer, a shared monastic rhythm, and a presence that reaches beyond the monastery.",
        ),
        Items: [
          {
            Title: "Solitude",
            Body: p(
              "Space for personal prayer, deep listening, and meditation. A quiet openness to the presence of God.",
            ),
          },
          {
            Title: "Community",
            Body: p(
              "Life shared in communal prayer, work, and the everyday responsibilities of the monastery.",
            ),
          },
          {
            Title: "Contemplative outreach",
            Body: p(
              "Hospitality, retreats, teaching, and spiritual accompaniment that share the gifts of this life with others.",
            ),
          },
        ],
      },
      "Values",
    ),
    block(
      "Image Text",
      {
        Eyebrow: "Ora et labora",
        Title: "A day shaped<br>by prayer & work.",
        Body: p(
          "The Liturgy of the Hours, Eucharist, meditation, Lectio Divina, and personal prayer shape the monastic day. Work includes the practical care of the community and the sharing of gifts in art, writing, music, and ministry.",
        ),
        ...pic("community.webp"),
        Button: a("Share in our prayer", "visit"),
      },
      "Image Left Tinted",
    ),
    block("Timeline", {
      Eyebrow: "Our roots",
      Title: "A story of<br>faithful presence.",
      Body: p(
        "Our community is part of a wider Benedictine and Camaldolese family, rooted in the spiritual inheritance of St. Benedict and St. Romuald.",
      ),
      Items: [
        {
          Date: "1027",
          Body: p(
            "The monastery’s history recalls the founding of the Hermitage at Camaldoli in Italy and the tradition that continues to shape our life.",
          ),
        },
        {
          Date: "1987",
          Body: p(
            "The Monastery of the Risen Christ began as a mission from Our Lady of Guadalupe Abbey in Pecos, New Mexico.",
          ),
        },
        {
          Date: "1992",
          Body: p(
            "The hospitality account traces the beginning of the monastery’s welcome to retreat guests to this year.",
          ),
        },
        {
          Date: "2014",
          Body: p(
            "MRC became a dependent monastery of New Camaldoli Hermitage in Big Sur, California.",
          ),
        },
      ],
    }),
    textSection(
      "A wider circle of belonging",
      "Our Oblate<br>community.",
      p(
        "The monastery’s Oblates share a relationship with the Camaldolese community. If you are interested in learning about this path, Fr. Stephen Coffey is the published contact for oblate inquiries.",
      ),
      a("Ask about becoming an Oblate", "contact", "stephen"),
      "Tinted",
      { Anchor: "oblates", "Secondary Button": a("Community news", "news") },
    ),
    block("People", {
      Eyebrow: "People & ministry",
      Title: "A personal welcome.",
      Button: a("Get in touch", "contact"),
      Items: [
        {
          Eyebrow: "Prior",
          Title: "Fr. Daniel Manger",
          Body: p(
            "Contact Prior Daniel for published workshop and spiritual-renewal ministries, and for inquiries about the monastery’s contemplative life.",
          ),
          Button: a("Contact Fr. Daniel", "contact", "daniel"),
        },
        {
          Eyebrow: "Oblate chaplain",
          Title: "Fr. Stephen Coffey",
          Body: p(
            "Contact Fr. Stephen to learn about the Camaldolese Oblate community and ways of belonging to the monastery’s wider spiritual family.",
          ),
          Button: a("Contact Fr. Stephen", "contact", "stephen"),
        },
      ],
    }),
    textSection(
      "Contemplative outreach",
      "Connections<br>beyond our walls.",
      p(
        "Explore the Restorative Partners material shared by the monastery, and discover another expression of care within the San Luis Obispo community.",
      ),
      a("About Restorative Partners", "partners"),
      "Tinted",
    ),
    supportBand(),
  ],
  2,
);

addPage(
  "reflections",
  "Reflections & Resources",
  "Explore MRC reflections, recorded homilies, reading lists, and contemplative resources.",
  [
    intro(
      "Reflections & resources",
      "Words to sit with.<br>Wisdom to return to.",
      "Explore reflections, recorded homilies, reading lists, and resources shared by the monastery. Original monastery writings and transcripts accompany these introductions.",
    ),
    block("Article Index", {
      Collection: "reflections",
      "Search Placeholder": "Search the library…",
      Items: refItems(
        "reflections",
        collection.reflections.map((item) => item.id),
      ),
    }),
  ],
  3,
);
addPage(
  "news",
  "News & Events",
  "Gatherings, milestones, and community stories from the Monastery of the Risen Christ.",
  [
    intro(
      "News & events",
      "Life in our<br>community.",
      "Gatherings, milestones, and moments from the monastery and its wider circle of friends.",
    ),
    featured(
      "From the community",
      "A renewed space<br>for prayer.",
      "news",
      ["renewed-chapel"],
      null,
      "Feature",
    ),
    block("Article Index", {
      Collection: "news",
      Note: "Some original notices do not include a year. Please confirm event dates directly with the monastery before making plans.",
      Items: refItems(
        "news",
        collection.news.map((item) => item.id),
      ),
    }),
    textSection(
      "Take part",
      "Your gifts<br>have a place here.",
      p(
        "The monastery’s published volunteering opportunities include event support, community outreach, retreat support, and care of the grounds.",
      ),
      a("Explore volunteering", "support", "volunteer"),
      "Tinted",
    ),
  ],
  4,
);

const monthly = [
  ["10", "28odTo8hz1tEdkQfZ2"],
  ["20", "8wM3eKgO5dcm0y43cf"],
  ["25", "28o02y9lDfkubcI149"],
  ["50", "eVadTofK1fku0y47sy"],
  ["75", "eVa8z42Xf6NYbcI3cj"],
  ["100", "dR6g1w9lDa0agx25ks"],
  ["200", "00g7v0cxP8W680w28h"],
];
// Preserve exact destinations from the current Stripe donation buttons.
monthly[4][1] = "eVa8z42Xf6NYbcI3cj";
addPage(
  "support",
  "Support Our Life",
  "Support the monastery’s prayer, hospitality, buildings, grounds, and continuing presence through giving and volunteering.",
  [
    intro(
      "Support our life",
      "A quiet life.<br>A shared responsibility.",
      "Your generosity helps sustain our prayer, hospitality, buildings, grounds, and the everyday needs of the monastic community.",
    ),
    block("Giving Section", {
      Eyebrow: "Why your support matters",
      Title: "Help care for<br>this place of prayer.",
      Body: p(
        "The monastery supports its life through hospitality, the book and gift shop, teaching, spiritual direction, and the generosity of visitors and friends.",
        "Maintaining roads, water, buildings, and the grounds is part of making this contemplative life possible. Gifts of any size help sustain that work.",
      ),
      Button: a("Give your time & talents", "support", "volunteer"),
      "Panel Title": "Offer your support.",
      "One-time Body": p(
        "A one-time gift helps care for the monastery’s prayer, hospitality, and daily needs. Choose your amount on the monastery’s secure giving page.",
      ),
      "One-time Donation": ext(
        "Continue to secure giving",
        "https://donate.stripe.com/6oEeXscxP5JUa8E7st",
      ),
      "Monthly Body": p(
        "Offer steady support with a monthly gift. Choose an amount to continue to the monastery’s existing Stripe page.",
      ),
      "Giving Note":
        "You will continue to the monastery’s existing Stripe page. Monthly gifts are recurring; review the terms on Stripe before confirming your contribution.",
      Items: monthly.map(([amount, slug]) => ({
        Amount: amount,
        Button: ext(`$${amount} / month`, `https://buy.stripe.com/${slug}`),
      })),
    }),
    block(
      "Image",
      pic("chapel.webp", "The monastery chapel, a shared place of prayer"),
    ),
    block(
      "Card Grid",
      {
        Eyebrow: "What generosity sustains",
        Title: "Care, in practical ways.",
        Button: a("Ask about current needs", "contact"),
        Items: [
          {
            Eyebrow: "Everyday essentials",
            Title: "Roads & water.",
            Body: p(
              "Reliable access and water infrastructure are essential to life at the monastery. The published project list includes water-truck replacement; driveway repaving is marked complete.",
            ),
          },
          {
            Eyebrow: "Spaces of prayer",
            Title: "Chapel & grounds.",
            Body: p(
              "Care of the chapel and restoration of the Way of the Cross support places for prayer and reflection. Contact the monastery for active project details.",
            ),
          },
          {
            Eyebrow: "A continuing presence",
            Title: "Outreach & renewal.",
            Body: p(
              "Teaching, communications, and the ongoing care of community life help share the monastery’s contemplative gifts with others.",
            ),
          },
        ],
      },
      "Projects",
    ),
    block(
      "Image Text",
      {
        Eyebrow: "A shared achievement",
        Title: "A renewed place<br>to gather.",
        Body: p(
          "The monastery has shared photographs of the renovated chapel. Explore the community story, and contact the monastery about any remaining project needs.",
        ),
        ...pic("news-chapel.webp"),
        Button: a("See the chapel story", "news/renewed-chapel"),
      },
      "Image Left Tinted",
    ),
    textSection(
      "Time, talents & practical gifts",
      "There is more<br>than one way to give.",
      p(
        "Offer your experience, your practical skills, or your time. The monastery’s published invitation includes these opportunities.",
      ),
      a("Ask about volunteering", "contact"),
      "Default",
      {
        Anchor: "volunteer",
        Items: [
          {
            Title: "Events",
            Body: p(
              "Planning, coordination, and practical help with gatherings.",
            ),
          },
          {
            Title: "Community outreach",
            Body: p(
              "Helping connect people with the monastery’s life and ministry.",
            ),
          },
          {
            Title: "Retreat support",
            Body: p(
              "Hospitality support as the monastery’s circumstances allow.",
            ),
          },
          {
            Title: "Grounds & maintenance",
            Body: p("Care of the landscape, buildings, and shared spaces."),
          },
        ],
      },
    ),
    textSection(
      "Looking to the future",
      "The endowment<br>fund.",
      p(
        "The monastery’s endowment is intended to support its long-term presence and future capital needs. Contact the community to discuss a designated gift, endowment contribution, or other form of support.",
      ),
      a("Discuss a gift", "contact"),
      "Tinted",
    ),
  ],
  5,
);

addPage(
  "contact",
  "Contact & Directions",
  "Contact the monastery, Fr. Daniel Manger, and Fr. Stephen Coffey, and find directions to 2308 O’Connor Way.",
  [
    intro(
      "Contact & directions",
      "A conversation<br>can be a beginning.",
      "Get in touch about prayer, visiting, future retreat hospitality, workshops, or the Oblate community.",
    ),
    contactPanel([
      {
        Eyebrow: "Visit or call",
        Title: "Monastery of the Risen Christ",
        Body: p("2308 O’Connor Way<br>San Luis Obispo, CA 93405"),
        Button: ext("805 544 1810", "tel:+18055441810"),
      },
      {
        Eyebrow: "Prior · Workshops & spiritual renewal",
        Title: "Fr. Daniel Manger",
        Body: p(
          "For inquiries about published retreat and workshop ministries, spiritual renewal programs, or the monastery’s life.",
        ),
        Button: ext("Email Fr. Daniel", "mailto:dmangerj@gmail.com"),
        Anchor: "daniel",
      },
      {
        Eyebrow: "Oblate chaplain",
        Title: "Fr. Stephen Coffey",
        Body: p(
          "For inquiries about becoming part of the Camaldolese Oblate community.",
        ),
        Button: ext("Email Fr. Stephen", "mailto:sgcoffey@yahoo.com"),
        Anchor: "stephen",
      },
    ]),
  ],
);
addPage(
  "partners",
  "Restorative Partners",
  "Learn about Restorative Partners and the community work shared through the monastery.",
  [
    intro(
      "Contemplative outreach",
      "Restorative<br>Partners.",
      "Discover the community work shared through the monastery’s Restorative Partners page.",
    ),
    textSection(
      "In the wider San Luis Obispo community",
      "Care that reaches<br>beyond our walls.",
      p(
        "The monastery has shared material from Restorative Partners about Anna’s Home, a place of support for women and their children. The shared account describes help with work, parenting, and the transition toward permanent housing.",
        "It also describes practical needs for the home and celebrates the volunteers, staff, and supporters who contribute to its life.",
      ),
      null,
      "Centered",
    ),
    textSection(
      "A separate organization",
      "Know where your gift goes.",
      p(
        "The external giving link below supports Restorative Partners. To support the Monastery of the Risen Christ directly, use our Support Us page.",
      ),
      ext(
        "Explore Restorative Partners giving",
        "https://restorativepartners.networkforgood.com/projects/214282-restorative-partners",
      ),
      "Notice",
      { "Secondary Button": a("Ask MRC about this connection", "contact") },
    ),
  ],
);
addPage(
  "calendar",
  "Prayer Calendar",
  "The live public prayer calendar for the Monastery of the Risen Christ.",
  [
    intro(
      "Prayer & gatherings",
      "Share in<br>our rhythm.",
      "Explore the monastery’s published prayer calendar. Please confirm visiting arrangements before travelling.",
    ),
    block("Live Calendar"),
  ],
);

const storyImages = {
  "renewed-chapel": "news-chapel.webp",
  "paula-huston-book-launch": "book-forgotten-map.webp",
  "welcome-elizabeth-matthew": "oblate-welcome.webp",
  "labyrinth-peace-walk": "labyrinth-walk.webp",
};
for (const kind of ["reflections", "news"]) {
  for (const item of collection[kind]) {
    const original = originals[item.id];
    const originalBody = cleanHtml(
      original?.data?.["Body Text"]?.data?.text || "",
    );
    const originalButton =
      original?.data?.Button?.data?.["External URL"]?.data?.url || "";
    const video =
      item.videoUrl || (item.id === "dreamwork" ? originalButton : "");
    const resource =
      (item.id === "romuald-pastoral-letter"
        ? originalButton
        : item.externalUrl) || "";
    const image = storyImages[item.id];
    const header = {
      Title: item.title,
      Category: item.category || item.type || "Community",
      Collection: kind,
      Author: item.author || "Monastery of the Risen Christ",
      "Date Label": item.dateLabel || "From the monastery archive",
      Summary: item.excerpt,
      "Original Title": item.originalTitle || item.title,
      "Original ID": item.id,
      "Source Credit":
        item.externalUrl && !item.externalUrl.startsWith("https://mrcslo.com")
          ? "Shared by the Monastery of the Risen Christ. External resources retain their original attribution."
          : "From the Monastery of the Risen Christ archive.",
      ...(image ? pic(image) : {}),
      Video: video
        ? ext(
            item.id === "dreamwork"
              ? "Watch the seminar"
              : "Watch the recorded homily",
            video,
          )
        : undefined,
      Resource:
        resource && !resource.startsWith("https://mrcslo.com")
          ? ext(
              item.id === "romuald-pastoral-letter"
                ? "Read the pastoral letter"
                : item.id === "dilexit-nos"
                  ? "Read the encyclical (PDF)"
                  : item.id === "paula-huston-book-launch"
                    ? "Explore the book"
                    : "Read the original resource",
              resource,
            )
          : undefined,
    };
    const content = [
      block("Article Header", header),
      textSection("", "", p(...(item.paragraphs || [])), null, "Default"),
    ];
    // Keep third-party resources as attributed introductions and outgoing links.
    if (
      originalBody &&
      ![
        "vatican-artificial-intelligence",
        "body-and-indwelling-god",
        "dilexit-nos",
      ].includes(item.id)
    )
      content.push(
        textSection(
          "From the monastery archive",
          "",
          originalBody,
          null,
          "Default",
        ),
      );
    else if (item.readingList)
      content.push(
        textSection(
          "Recommended reading",
          "",
          `<ul>${item.readingList.map((title) => `<li>${title}</li>`).join("")}</ul>`,
          null,
          "Default",
        ),
      );
    const photos = (
      original?.data?.["Additional Images"]?.data?.fileUploads || []
    )
      .map((photo) => photo.data?.file)
      .filter(Boolean);
    if (photos.length)
      content.push(
        block("Image Gallery", { Title: "From the community", Images: photos }),
      );
    addPage(`${kind}/${item.id}`, item.title, item.excerpt, content, null, {
      ogImage: image ? img(image) : img("hero.webp"),
      structuredDataType: "Article",
    });
  }
}

const settings = {
  client: "mrc-web",
  cannotDelete: [
    "_home",
    "visit",
    "retreats",
    "community",
    "reflections",
    "news",
    "support",
    "contact",
    "partners",
    "calendar",
  ],
  cannotAddBlocks: [],
  seo: {
    siteName: "Monastery of the Risen Christ",
    titleSuffix: "Monastery of the Risen Christ",
    siteUrl: "https://mrcslo.com",
    defaultDescription:
      "A Camaldolese Benedictine community of prayer, hospitality, and contemplative life in San Luis Obispo, California.",
    defaultShareImage: img("hero.webp"),
    organizationName: "Monastery of the Risen Christ",
    organizationType: "Church",
    phone: "+1-805-544-1810",
    email: "dmangerj@gmail.com",
    streetAddress: "2308 O’Connor Way",
    addressLocality: "San Luis Obispo",
    addressRegion: "CA",
    postalCode: "93405",
    sameAs: [
      "https://www.facebook.com/SLOMonastery",
      "https://www.instagram.com/mrc.slo/",
      "https://www.youtube.com/@MonasteryoftheRisenChrist",
    ],
    defaultLanguage: "en",
  },
};
const assetMap = {};
for (const asset of sources.assets)
  if (!assetMap[asset.source_url])
    assetMap[asset.source_url] = `/assets/${asset.filename}`;
await output("public/pages.json", { settings, pages });
await output("public/block-schema.json", schema);
await output("public/claims.json", { claims: {} });
await output("public/asset-map.json", assetMap);
await output("src/app/lib/asset-map.json", assetMap);
await output(
  "routes.txt",
  Object.keys(pages)
    .map((key) => (key === "_home" ? "/" : `/${key}`))
    .sort()
    .join("\n") + "\n",
);
await output(
  "content/contract.json",
  Object.fromEntries(
    schema.blocks.map(({ label, kind, children }) => [
      label,
      {
        kind,
        fields: (children || []).map(({ label, kind, children }) => ({
          label,
          kind,
          ...(children
            ? { fields: children.map(({ label, kind }) => ({ label, kind })) }
            : {}),
        })),
      },
    ]),
  ),
);
console.log(
  `Generated ${Object.keys(pages).length} Eidos pages and ${schema.blocks.length} block definitions.`,
);
