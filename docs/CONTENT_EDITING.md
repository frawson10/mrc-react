# Editing the redesigned monastery site

All main-page sections are independent horizontal blocks. Cards, columns, calendars, and other internal arrangements stay inside their section. Eidos can reorder the sections without reconstructing page columns.

## Main pages

Home, Visit & Prayer, Retreats, Our Community, Reflections & Resources, News & Events, Support Us, Contact & Directions, Restorative Partners, and Calendar are prefilled. Core pages are protected from page deletion in `settings.cannotDelete`; their editorial blocks can still be edited and reordered.

The header/footer are shared React components. Main links match the mockup. Additional ordinary pages created through Eidos join navigation using the existing generic `showMenu` setting. Article pages are identified by their Article Header and stay out of primary navigation, including articles created through the generic Add Page form.

## Articles

Each of the 13 selected reflection/resource entries and eight news stories is a real Eidos page. Its Article Header owns its title, category, collection, author, date label, card summary, image, attribution, and resource/video destinations. Text Section and optional Image Gallery blocks contain the introduction and selected original MRC content.

To add an article:

1. Create a page with a title and description using the current Add Page dialog.
2. Add an Article Header. Set Collection to `reflections` or `news`, give it a category (for example Reflection, Homily, Reading list, Resource, Community, or Event), and fill the visible title and summary.
3. Add Text Section blocks for its writing, and an Image Gallery if appropriate. Images have separate alternative-text fields where the block provides them.
4. The matching Article Index automatically includes new matching articles after its explicitly ordered references. Add a Page reference to that index's Items list to choose its exact position.
5. Add its Page reference to a Featured Articles block to feature it on Home or News. Optional Label sets the card's call-to-action text. Edit its page SEO in Eidos's existing SEO view.

Changing an article updates its listing cards because those cards read the referenced page's Article Header. Rich-text titles and summaries are converted to readable card text, while detail pages retain permitted formatting. Do not invent years for notices that supply only month/day or feast labels.

## Shared schedule and links

The Prayer Schedule on Visit owns the published prayer rows. Home's Prayer Schedule references Visit through Source Page. An empty Note uses the source schedule's note; a filled Note is a local override. The managed live calendar is a separate current Google feed.

Buttons support Internal Page or External Link, plus an optional Anchor without `#`. An anchor can target a section on the selected internal page or the current page. Section Anchor fields create the matching destinations. Keep anchors stable when other pages link to them.

## Images and giving

Initial images use absolute existing source URLs for Eidos editor previews. `asset-map.json` substitutes bundled optimized copies on the website. Newly uploaded or selected media URLs/v2 objects work without adding a mapping. Local font files and licenses are bundled.

The Giving Section preserves the existing one-time Stripe destination and all seven monthly Stripe destinations. Monthly donation labels and destinations live together in the button fields. The Restorative Partners giving destination is separate and retains its explanatory notice.

## Managed features

Suite Reservations and Live Calendar have no editable content fields. Eidos can place, move, or remove their marker blocks using its existing managed-block semantics; their behavior is maintained in the React application. Payment configuration, availability, administrator access, and public booking pause cannot be changed by CMS text.

The hospitality status banner and original startup animation are application features. Public booking remains paused until the owner deliberately changes the operational build setting. Updating editorial wording alone never opens booking.
