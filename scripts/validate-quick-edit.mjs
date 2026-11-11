// Validate pilot wiring locally without depending on the Firebase repository.
export function validateQuickEdit(site, schema) {
  const errors = [];
  const config = schema.quickEdit;
  if (!config) return errors;
  if (config.version !== 1) return ["Unsupported Quick Edit configuration version"];
  const definitions = new Map(schema.blocks.map((block) => [block.id, block]));
  const byLabel = new Map(schema.blocks.map((block) => [block.label, block]));
  const field = (definition, path) => {
    for (const label of path || []) {
      definition = definition?.children?.find((child) => child.label === label);
      if (!definition) throw new Error("Missing field " + label);
    }
    return definition;
  };
  const checkIds = (items, location) => {
    const ids = new Set();
    for (const item of items) {
      if (!item.id || ids.has(item.id)) errors.push(location + ": missing or duplicate content instance ID");
      ids.add(item.id);
    }
  };
  for (const [key, target] of Object.entries(config.targets || {})) {
    try {
      const blocks = site.pages[target.page]?.content.filter((block) => block.id === target.blockId) || [];
      if (blocks.length !== 1) throw new Error("Expected one destination block");
      const block = blocks[0];
      const definition = field(byLabel.get(block.type), target.path);
      if (definition.kind !== "listOfObjects") throw new Error("Destination must be a list");
      if (target.referencePath && field(definition, target.referencePath).kind !== "internalNavAction") throw new Error("Destination reference must be a page link");
      let value = block;
      for (const label of target.path || []) value = value.data[label];
      checkIds(value.data.objects, key);
    } catch (error) { errors.push("Quick Edit target " + key + ": " + error.message); }
  }
  const flowIds = new Set();
  for (const flow of config.flows || []) {
    if (flowIds.has(flow.id) || !flow.id || !flow.revision) errors.push("Missing or duplicate Quick Edit flow identity");
    flowIds.add(flow.id);
    const questions = new Set((flow.questions || []).map((question) => question.id));
    const used = [];
    for (const screen of flow.screens || []) {
      if (screen.questions.length > 3) errors.push(flow.id + ": pilot screens should have at most three questions");
      for (const id of screen.questions) {
        if (!questions.has(id) || used.includes(id)) errors.push(flow.id + ": unknown or repeated screen question " + id);
        used.push(id);
      }
    }
    if (used.length !== questions.size) errors.push(flow.id + ": every question needs a screen");
    const template = config.templates?.[flow.template];
    if (!template) { errors.push(flow.id + ": missing template"); continue; }
    checkIds(template.blocks, flow.id + " template");
    for (const block of template.blocks) if (!definitions.has(block.schemaId)) errors.push(flow.id + ": unknown template block");
    for (const action of flow.actions) {
      if (action.target && !config.targets[action.target]) errors.push(flow.id + ": unknown action target");
      if (action.fields) {
        const target = action.target && config.targets[action.target];
        const definition = target
          ? byLabel.get(site.pages[target.page]?.content.find((block) => block.id === target.blockId)?.type)
          : definitions.get(template.blocks.find((block) => block.id === action.blockId)?.schemaId);
        try { for (const setting of action.fields) field(definition, setting.path); }
        catch (error) { errors.push(flow.id + ": " + error.message); }
      }
    }
  }
  const taskIds = new Set(flowIds);
  for (const collection of config.collections || []) {
    const management = collection.managementFlow;
    if (management) {
      if (!management.id || !management.title || taskIds.has(management.id)) errors.push(collection.id + ": missing or duplicate management flow identity");
      taskIds.add(management.id);
    }
    const definition = definitions.get(collection.schemaId);
    if (!flowIds.has(collection.flowId) || !config.targets[collection.indexTarget]) errors.push(collection.id + ": invalid collection wiring");
    for (const [pageId, page] of Object.entries(site.pages)) {
      const header = page.content.find((block) => block.type === definition?.label);
      if (!header) continue;
      let match = header;
      for (const label of collection.match.path) match = match?.data?.[label];
      if (match?.data?.text !== collection.match.value) continue;
      for (const binding of config.flows.find((flow) => flow.id === collection.flowId)?.questions.map((question) => question.bind).filter((binding) => binding?.blockId) || []) {
        const blocks = page.content.filter((block) => block.id === binding.blockId);
        const flow = config.flows.find((flow) => flow.id === collection.flowId);
        const spec = config.templates[flow.template].blocks.find((block) => block.id === binding.blockId);
        const uniqueFallback = !blocks.length && spec?.adoptIfUnique && page.content.filter((block) => block.type === definitions.get(spec.schemaId)?.label).length === 1;
        // More complex articles remain valid website content; Quick Edit safely
        // refuses their ambiguous binding and leaves them to the full Editor.
        if (blocks.length > 1) errors.push(pageId + ": duplicate editable block ID " + binding.blockId);
        if (blocks.length === 1 || uniqueFallback) continue;
      }
    }
  }
  return errors;
}
