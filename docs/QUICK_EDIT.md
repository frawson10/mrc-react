# Quick Edit: MRC pilot

The pilot organization is MRC2. Its client document must point to the mrc-react repository and contain the boolean quickEditEnabled: true. Eidos loads four task buttons and their destinations from this repository's public/block-schema.json: Add Announcement, Edit Announcements, Add Reflection, and Edit Reflections. Lists stay hidden until their edit flow is opened.

## Add Announcement

Use this for News & Events posts. Enter the title, Community/Event category, short introduction, main writing, author, displayed date, and optional image with alternative text.

The flow creates a page at news/<title-slug>, adds an Article Header and Text Section, and places its reference first in News & Events. It stays out of primary navigation.

You can add it as the first homepage announcement highlight, replace a selected highlight, or leave Home untouched. You can also replace the large News & Events feature. That replacement clears the feature's headline/eyebrow/body overrides so the article's own information is displayed.

## Add Reflection

Use this for Reflections & Resources. Choose Reflection, Homily, Reading list, or Resource. The remaining questions follow the announcement flow.

The flow creates reflections/<title-slug> and places its reference first in Reflections & Resources. Optional homepage placement uses the Journal section, keeping the two homepage destinations distinct.

## Saving and publishing

- Answers save privately as you work. They do not update the public website.
- Save Draft stores an ordinary Eidos draft. It can be resumed from Quick Edit or opened in Editor.
- Preview saves the draft and opens its testing-site page.
- Publish performs the reviewed draft/save/request/merge steps and then tracks the website deployment.
- A displayed date is editorial wording, not a publication schedule. Use the existing Editor release board for scheduling.
- A conflicting draft must be resolved first. The questionnaire preserves your answers and identifies the affected page and blocking draft.

## Existing articles

Choose **Edit Announcements** or **Edit Reflections** on the Quick Edit landing page. Only that collection's items and actions appear. Search the list, edit an item, reorder the collection, remove a highlight, or delete an article.

Use **Back to Edit Announcements/Reflections** to return from an operation to its list, or **All tasks** to return to the task buttons. Reordering always includes the entire collection, even when the list search was filtered.

Saved questionnaires and recently published updates also have their own buttons, keeping long work lists off the landing page.

Editing changes the mapped header fields and primary text block. Additional sections, galleries, and source credits remain unchanged. Changing a headline keeps its address.

Removing a highlight keeps the article and its listing. Deleting an article removes its page and configured references; other remaining links can block deletion until you update them in Editor.

## Configuration notes

- Stable block IDs distinguish the news/reflection indexes, the two homepage features, and the News lead feature.
- Existing article headers use article-header; their primary text blocks use article-body. These IDs are local to their page. Newly created ordinary-Editor articles can also be edited when their header and main text resolve uniquely; ambiguous multi-section layouts remain available in the full Editor.
- Listing and feature references have durable item IDs so replacement and reordering survive other edits.
- The one-time original content importer is disabled once Quick Edit is configured. Edit the current JSON files instead.
- Run npm run validate:quick-edit, npm run validate:content, and npm test after changing the schema or target IDs.
- The operational booking/calendar integrations remain managed website features; these editorial flows do not create Google Calendar events or change reservation availability.

The original manual posting workflow remains available in Editor. Deployment instructions are in the Eidos repository at docs/QUICK_EDIT_DEPLOYMENT.md.


Quick Edit setup checks are strict in validate:quick-edit. Ordinary website builds report setup problems as warnings, so removing a target in the full Editor or restoring older content cannot prevent the public website from building solely because this optional tool needs reconfiguration. Eidos disables affected configuration until its targets are fixed.
