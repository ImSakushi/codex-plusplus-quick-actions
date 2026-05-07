/**
 * Quick Actions
 *
 * Custom Codex workflow shortcuts.
 */

const ACTION_ATTR = "data-codexpp-quick-actions-action";
const THREAD_SUMMARY_PANEL_ATTR = "data-codexpp-quick-actions-thread-summary-panel";
const FALLBACK_PANEL_ATTR = "data-codexpp-quick-actions-fallback-panel";
const STYLE_ATTR = "data-codexpp-quick-actions-style";
const ACTIONS_STORAGE_KEY = "actions";
const CREATE_PR_LABEL = "create pull request";
const MENU_MARKERS = ["branch details", "changes", "git actions"];
const DEFAULT_ACTIONS = [
  {
    id: "git-pull",
    label: "Git pull",
    icon: "pull",
    prompt:
      "git pull le repo, s'il y a des conflits, arrête le pull et signale les moi et explique le moi en me disant exactement quelle feature bloque avec laquelle et propose une solution propre",
  },
  {
    id: "multi-commit-and-push",
    label: "Multi commit and push",
    icon: "commit",
    prompt:
      "commit and push all the files, create multiple commits to differenciate each features. commit in english with prefix",
  },
  {
    id: "code-review",
    label: "Code review",
    icon: "review",
    prompt:
      "[$review-uncommitted-json-fr](/Users/adriendevoe/.codex/skills/review-uncommitted-json-fr/SKILL.md) ",
  },
];
const ICON_OPTIONS = [
  { value: "pull", label: "Pull" },
  { value: "commit", label: "Commit" },
  { value: "review", label: "Review" },
  { value: "spark", label: "Spark" },
  { value: "terminal", label: "Terminal" },
  { value: "branch", label: "Branch" },
];

/** @type {import("@codex-plusplus/sdk").Tweak} */
module.exports = {
  start(api) {
    const state = {
      api,
      observer: null,
      scheduled: false,
      actions: new Set(),
      actionDefs: loadActionDefs(api),
      threadSummaryPanel: null,
      style: null,
      sawGitContext: false,
      pageHandle: null,
      pageRoot: null,
      editingActionId: null,
    };
    this._state = state;

    state.observer = new MutationObserver(() => scheduleInstall(state));
    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    scheduleInstall(state);
    installFallbackStyles(state);
    installSettingsPage(state);
    api.log.info("[quick-actions] renderer active");
  },

  stop() {
    const state = this._state;
    if (!state) return;

    state.observer?.disconnect();
    state.observer = null;

    for (const action of state.actions) {
      try {
        action.remove();
      } catch {
        /* element may already be detached */
      }
    }
    state.actions.clear();
    removeFallbackThreadSummaryPanel(state);
    removeFallbackStyles(state);
    state.pageHandle?.unregister();
    state.pageHandle = null;
    state.pageRoot = null;
    this._state = null;
  },
};

function scheduleInstall(state) {
  if (state.scheduled) return;
  state.scheduled = true;
  window.requestAnimationFrame(() => {
    state.scheduled = false;
    installGitMenuAction(state);
    ensureFallbackThreadSummaryPanel(state);
  });
}

function installGitMenuAction(state) {
  const anchors = Array.from(document.querySelectorAll("button, [role='menuitem'], [role='option'], a"))
    .filter((node) => node instanceof HTMLElement)
    .filter((node) => normalizeLabel(node).includes(CREATE_PR_LABEL));

  for (const anchor of anchors) {
    const menu = findMenuContainer(anchor);
    if (!menu) continue;

    let cursor = anchor;
    for (const def of runnableActionDefs(state)) {
      const existing = menu.querySelector(`[${ACTION_ATTR}="${def.id}"]`);
      if (existing instanceof HTMLElement) {
        cursor = existing;
        continue;
      }

      const action = createMenuAction(anchor, def, () => runPromptAction(state, def));
      state.actions.add(action);
      cursor.insertAdjacentElement("afterend", action);
      cursor = action;
    }
  }

  reconcileInjectedActions(state);
}

function reconcileInjectedActions(state) {
  const validIds = new Set(runnableActionDefs(state).map((def) => def.id));
  for (const action of Array.from(state.actions)) {
    if (!document.documentElement.contains(action)) {
      state.actions.delete(action);
      continue;
    }

    const id = action.getAttribute(ACTION_ATTR);
    if (!validIds.has(id)) {
      action.remove();
      state.actions.delete(action);
    }
  }
}

function refreshActions(state, nextActions) {
  state.actionDefs = normalizeActionDefs(nextActions);
  state.api.storage.set(ACTIONS_STORAGE_KEY, state.actionDefs);
  clearInjectedActions(state);
  removeFallbackThreadSummaryPanel(state);
  rerenderSettingsPage(state);
  scheduleInstall(state);
}

function clearInjectedActions(state) {
  for (const action of Array.from(state.actions)) {
    try {
      action.remove();
    } catch {
      /* element may already be detached */
    }
  }
  state.actions.clear();
}

function ensureFallbackThreadSummaryPanel(state) {
  rememberGitContextFromNativeUi(state);
  const actions = runnableActionDefs(state);

  const hasNativeMenuAction = Array.from(document.querySelectorAll(`[${ACTION_ATTR}]`))
    .filter((node) => node instanceof HTMLElement)
    .some((node) => !node.closest(`[${FALLBACK_PANEL_ATTR}]`) && isVisibleControl(node));
  const hasCreatePrEntry = Array.from(document.querySelectorAll("button, [role='menuitem'], [role='option'], a"))
    .filter((node) => node instanceof HTMLElement)
    .filter((node) => !node.closest(`[${FALLBACK_PANEL_ATTR}]`) && !node.hasAttribute(THREAD_SUMMARY_PANEL_ATTR))
    .some((node) => isVisibleControl(node) && normalizeLabel(node).includes(CREATE_PR_LABEL));

  if (actions.length === 0 || hasNativeMenuAction || hasCreatePrEntry || !shouldShowFallbackThreadSummaryPanel(state)) {
    removeFallbackThreadSummaryPanel(state);
    return;
  }

  if (state.threadSummaryPanel && document.documentElement.contains(state.threadSummaryPanel)) return;

  const panel = document.createElement("div");
  panel.setAttribute(THREAD_SUMMARY_PANEL_ATTR, "true");
  panel.setAttribute(FALLBACK_PANEL_ATTR, "true");
  panel.setAttribute("aria-label", "Quick Actions");
  panel.className = "codexpp-quick-actions-edge-panel";

  const content = document.createElement("div");
  content.className = "codexpp-quick-actions-edge-content";

  const card = document.createElement("div");
  card.className = [
    "border-token-border",
    "text-token-text-primary",
    "flex",
    "h-fit",
    "max-h-full",
    "flex-col",
    "gap-3",
    "overflow-y-auto",
    "rounded-3xl",
    "border",
    "py-3",
    "shadow-md",
    "backdrop-blur-sm",
  ].join(" ");
  card.style.backgroundColor = "color-mix(in srgb, var(--color-token-dropdown-background) 50%, transparent)";

  const title = document.createElement("div");
  title.className = "px-4 text-base text-token-text-tertiary";
  title.textContent = "Branch details";
  card.appendChild(title);

  const rows = document.createElement("div");
  rows.className = "flex flex-col gap-px px-4";
  for (const def of actions) {
    rows.appendChild(createFallbackMenuRow(def, () => runPromptAction(state, def)));
  }
  card.appendChild(rows);
  content.appendChild(card);
  panel.appendChild(content);

  document.body.appendChild(panel);
  state.threadSummaryPanel = panel;
}

function rememberGitContextFromNativeUi(state) {
  if (state.sawGitContext) return;

  const hasNativeBranchDetails = Array.from(document.querySelectorAll("section, aside, div"))
    .filter((node) => node instanceof HTMLElement)
    .some((node) => {
      if (node.closest(`[${FALLBACK_PANEL_ATTR}]`) || !isVisibleControl(node)) return false;
      const label = normalizeLabel(node);
      return label.includes("branch details") &&
        (label.includes("git actions") || label.includes(CREATE_PR_LABEL));
    });

  if (hasNativeBranchDetails) state.sawGitContext = true;
}

function shouldShowFallbackThreadSummaryPanel(state) {
  if (!findComposer()) return false;

  const pageText = normalizeLabel(document.body);
  const isProjectThread = /\b(project|workspace|branch|changes|git)\b/.test(pageText);
  const isNewThreadRoute = /\/new-thread\b|\/hotkey-window\/new-thread\b/.test(window.location.pathname);
  return state.sawGitContext || isProjectThread || isNewThreadRoute;
}

function removeFallbackThreadSummaryPanel(state) {
  if (!state.threadSummaryPanel) return;
  try {
    state.threadSummaryPanel.remove();
  } catch {
    /* element may already be detached */
  }
  state.threadSummaryPanel = null;
}

function createFallbackMenuRow(def, onClick) {
  const row = document.createElement("button");
  row.type = "button";
  row.setAttribute(ACTION_ATTR, def.id);
  row.setAttribute("role", "menuitem");
  row.className = menuItemFallbackClass();
  row.append(createActionIcon(def.icon), document.createTextNode(actionDisplayLabel(def)));
  attachMenuActionHandlers(row, onClick);
  return row;
}

function installFallbackStyles(state) {
  if (state.style && document.documentElement.contains(state.style)) return;
  const style = document.createElement("style");
  style.setAttribute(STYLE_ATTR, "true");
  style.textContent = `
    [${THREAD_SUMMARY_PANEL_ATTR}] {
      --codexpp-quick-actions-panel-width: 300px;
      position: fixed;
      top: 72px;
      right: 0;
      bottom: 16px;
      z-index: 50;
      width: 0;
      opacity: 0;
      pointer-events: none;
      overflow: visible;
      transition: opacity var(--transition-duration-basic, .15s) var(--transition-ease-basic, ease);
    }

    [${THREAD_SUMMARY_PANEL_ATTR}]::after {
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 10;
      width: 36px;
      pointer-events: auto;
    }

    [${THREAD_SUMMARY_PANEL_ATTR}]:hover,
    [${THREAD_SUMMARY_PANEL_ATTR}]:focus-within {
      opacity: 1;
      pointer-events: auto;
    }

    [${THREAD_SUMMARY_PANEL_ATTR}] .codexpp-quick-actions-edge-content {
      position: absolute;
      top: 0;
      right: 0;
      width: var(--codexpp-quick-actions-panel-width);
      height: 100%;
      padding-inline-end: 16px;
      transform: translateX(100%);
      transition: transform var(--transition-duration-basic, .15s) var(--transition-ease-basic, ease);
    }

    [${THREAD_SUMMARY_PANEL_ATTR}]:hover .codexpp-quick-actions-edge-content,
    [${THREAD_SUMMARY_PANEL_ATTR}]:focus-within .codexpp-quick-actions-edge-content {
      transform: translateX(0);
    }
  `;
  document.head.appendChild(style);
  state.style = style;
}

function removeFallbackStyles(state) {
  if (!state.style) return;
  try {
    state.style.remove();
  } catch {
    /* element may already be detached */
  }
  state.style = null;
}

function installSettingsPage(state) {
  if (typeof state.api.settings?.registerPage !== "function") {
    state.api.log.warn("[quick-actions] registerPage unavailable; settings UI not mounted");
    return;
  }

  state.pageHandle = state.api.settings.registerPage({
    id: "actions",
    title: "Quick Actions",
    description: "Customize the actions added to Codex's Git panel.",
    iconSvg:
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true">' +
      '<path d="M4 6.5h12M4 10h8M4 13.5h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="14.5" cy="10" r="1.75" fill="currentColor"/>' +
      "</svg>",
    render: (root) => renderSettingsPage(root, state),
  });
}

function renderSettingsPage(root, state) {
  state.pageRoot = root;
  root.replaceChildren();

  const section = el("section", "flex flex-col gap-3");
  section.appendChild(settingsTitle(
    "Actions",
    "Create the custom options shown in the Thread Summary Panel. Each action opens a new conversation and sends its prompt.",
  ));

  const toolbar = el("div", "flex flex-wrap items-center gap-2");
  toolbar.append(
    settingsButton("Add action", "primary", () => {
      const action = createBlankAction();
      state.editingActionId = action.id;
      refreshActions(state, [...state.actionDefs, action]);
    }),
    settingsButton("Reset defaults", "danger", () => {
      state.editingActionId = null;
      refreshActions(state, DEFAULT_ACTIONS);
    }),
  );
  section.appendChild(toolbar);

  if (state.actionDefs.length === 0) {
    const empty = el("div", "text-token-text-secondary rounded-lg border border-dashed border-token-border p-6 text-center text-sm");
    empty.textContent = "No actions yet.";
    section.appendChild(empty);
    root.appendChild(section);
    return;
  }

  const card = roundedCard();
  state.actionDefs.forEach((action, index) => {
    card.appendChild(actionSettingsRow(state, action, index));
  });
  section.appendChild(card);
  root.appendChild(section);
}

function rerenderSettingsPage(state) {
  if (!state.pageRoot) return;
  renderSettingsPage(state.pageRoot, state);
}

function actionSettingsRow(state, action, index) {
  const isEditing = state.editingActionId === action.id;
  const row = el("div", "flex flex-col gap-3 p-3");

  const top = el("div", "flex items-center justify-between gap-4");
  const left = el("div", "flex min-w-0 items-center gap-3");
  const icon = createActionIcon(action.icon);
  icon.classList.add("shrink-0", "text-token-text-secondary");
  const text = el("div", "flex min-w-0 flex-col gap-1");
  const title = el("div", "min-w-0 truncate text-sm font-medium text-token-text-primary");
  title.textContent = actionDisplayLabel(action);
  const prompt = el("div", "text-token-text-secondary min-w-0 truncate text-xs");
  prompt.textContent = action.prompt || "No prompt configured.";
  text.append(title, prompt);
  left.append(icon, text);

  const controls = el("div", "flex shrink-0 items-center gap-1");
  controls.append(
    iconButton("Move up", "up", () => moveAction(state, index, -1), index === 0),
    iconButton("Move down", "down", () => moveAction(state, index, 1), index === state.actionDefs.length - 1),
    settingsButton(isEditing ? "Done" : "Edit", "ghost", () => {
      state.editingActionId = isEditing ? null : action.id;
      rerenderSettingsPage(state);
    }),
    settingsButton("Delete", "danger", () => deleteAction(state, action.id)),
  );
  top.append(left, controls);
  row.appendChild(top);

  if (isEditing) {
    row.appendChild(actionEditor(state, action));
  }

  return row;
}

function actionEditor(state, action) {
  const editor = el("div", "grid gap-3 rounded-lg bg-token-foreground/5 p-3");
  const titleInput = textInput(action.label, "Title");
  const iconSelect = iconSelectInput(action.icon);
  const promptInput = textareaInput(action.prompt, "Prompt");

  titleInput.addEventListener("input", () => {
    updateAction(state, action.id, { label: titleInput.value });
  });
  iconSelect.addEventListener("change", () => {
    updateAction(state, action.id, { icon: iconSelect.value });
  });
  promptInput.addEventListener("input", () => {
    updateAction(state, action.id, { prompt: promptInput.value });
  });

  const grid = el("div", "grid gap-3 md:grid-cols-[1fr_180px]");
  grid.append(settingsField("Title", titleInput), settingsField("Logo", iconSelect));
  editor.append(grid, settingsField("Prompt", promptInput));
  return editor;
}

function moveAction(state, index, direction) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= state.actionDefs.length) return;
  const next = [...state.actionDefs];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  refreshActions(state, next);
}

function deleteAction(state, id) {
  if (state.editingActionId === id) state.editingActionId = null;
  refreshActions(state, state.actionDefs.filter((action) => action.id !== id));
}

function updateAction(state, id, patch) {
  const next = state.actionDefs.map((action) =>
    action.id === id ? normalizeActionDef({ ...action, ...patch }) : action,
  );
  state.actionDefs = next;
  state.api.storage.set(ACTIONS_STORAGE_KEY, next);
  clearInjectedActions(state);
  removeFallbackThreadSummaryPanel(state);
  scheduleInstall(state);
}

function loadActionDefs(api) {
  return normalizeActionDefs(api.storage.get(ACTIONS_STORAGE_KEY, DEFAULT_ACTIONS));
}

function normalizeActionDefs(value) {
  const source = Array.isArray(value) ? value : DEFAULT_ACTIONS;
  return source.map(normalizeActionDef);
}

function normalizeActionDef(value) {
  const fallback = createBlankAction();
  const iconValues = new Set(ICON_OPTIONS.map((option) => option.value));
  const id = typeof value?.id === "string" && value.id.trim()
    ? value.id.trim()
    : fallback.id;
  const label = typeof value?.label === "string" ? value.label : "";
  const prompt = typeof value?.prompt === "string" ? value.prompt : "";
  const icon = iconValues.has(value?.icon) ? value.icon : "spark";

  return { id, label, prompt, icon };
}

function runnableActionDefs(state) {
  return state.actionDefs.filter((action) => actionDisplayLabel(action) && action.prompt.trim());
}

function actionDisplayLabel(action) {
  return (action.label || "").trim() || "Untitled action";
}

function createBlankAction() {
  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    label: "New action",
    icon: "spark",
    prompt: "",
  };
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function settingsTitle(title, description) {
  const titleRow = el("div", "flex h-toolbar items-center justify-between gap-2 px-0 py-0");
  const inner = el("div", "flex min-w-0 flex-1 flex-col gap-1");
  const label = el("div", "text-base font-medium text-token-text-primary");
  label.textContent = title;
  inner.appendChild(label);
  if (description) {
    const sub = el("div", "text-token-text-secondary text-sm");
    sub.textContent = description;
    inner.appendChild(sub);
  }
  titleRow.appendChild(inner);
  return titleRow;
}

function roundedCard() {
  const card = el(
    "div",
    "border-token-border flex flex-col divide-y-[0.5px] divide-token-border rounded-lg border",
  );
  card.style.backgroundColor = "var(--color-background-panel, var(--color-token-bg-fog))";
  return card;
}

function settingsButton(label, tone, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = [
    "h-token-button-composer",
    "rounded-md",
    "px-3",
    "text-sm",
    "font-medium",
    "cursor-interaction",
    tone === "primary"
      ? "bg-token-charts-blue/10 text-token-charts-blue hover:bg-token-charts-blue/20"
      : tone === "danger"
        ? "bg-token-charts-red/10 text-token-charts-red hover:bg-token-charts-red/20"
        : "border-token-border bg-token-foreground/5 text-token-text-primary hover:bg-token-foreground/10 border",
  ].join(" ");
  button.addEventListener("click", onClick);
  return button;
}

function iconButton(label, direction, onClick, disabled) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.disabled = Boolean(disabled);
  button.className =
    "border-token-border bg-token-foreground/5 text-token-text-primary hover:bg-token-foreground/10 " +
    "inline-flex h-8 w-8 items-center justify-center rounded-md border cursor-interaction disabled:cursor-default disabled:opacity-40";
  button.innerHTML = direction === "up"
    ? '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 5.5v9M6.75 8.75 10 5.5l3.25 3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 14.5v-9M6.75 11.25 10 14.5l3.25-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  button.addEventListener("click", onClick);
  return button;
}

function settingsField(label, control) {
  const field = el("label", "flex min-w-0 flex-col gap-1");
  const text = el("span", "text-token-text-secondary text-xs");
  text.textContent = label;
  field.append(text, control);
  return field;
}

function textInput(value, placeholder) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value || "";
  input.placeholder = placeholder;
  input.className = inputClassName();
  return input;
}

function textareaInput(value, placeholder) {
  const input = document.createElement("textarea");
  input.value = value || "";
  input.placeholder = placeholder;
  input.rows = 5;
  input.className = inputClassName() + " min-h-[120px] resize-y py-2";
  return input;
}

function iconSelectInput(value) {
  const select = document.createElement("select");
  select.className = inputClassName();
  for (const option of ICON_OPTIONS) {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    select.appendChild(item);
  }
  select.value = ICON_OPTIONS.some((option) => option.value === value) ? value : "spark";
  return select;
}

function inputClassName() {
  return [
    "border-token-border",
    "bg-token-foreground/5",
    "text-token-text-primary",
    "h-token-button-composer",
    "rounded-md",
    "border",
    "px-3",
    "text-sm",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-token-focus-border",
  ].join(" ");
}

function createMenuAction(anchor, def, onClick) {
  const action = anchor.cloneNode(true);

  if (action instanceof HTMLButtonElement) action.type = "button";
  action.setAttribute(ACTION_ATTR, def.id);
  action.setAttribute("role", anchor.getAttribute("role") || "menuitem");
  action.tabIndex = 0;
  action.removeAttribute("id");
  action.removeAttribute("aria-label");
  action.removeAttribute("title");
  action.removeAttribute("disabled");
  action.removeAttribute("aria-disabled");

  replaceMenuIcon(action, def.icon);
  replaceMenuLabel(action, actionDisplayLabel(def));
  attachMenuActionHandlers(action, onClick);

  return action;
}

function attachMenuActionHandlers(action, onClick) {
  action.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });

  action.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
}

function replaceMenuIcon(action, iconName) {
  const icon = createActionIcon(iconName);
  const oldSvg = action.querySelector("svg");
  if (oldSvg) {
    icon.setAttribute("class", oldSvg.getAttribute("class") || "");
    icon.setAttribute("width", oldSvg.getAttribute("width") || "20");
    icon.setAttribute("height", oldSvg.getAttribute("height") || "20");
    oldSvg.replaceWith(icon);
    return;
  }

  action.prepend(icon);
}

function replaceMenuLabel(action, label) {
  const walker = document.createTreeWalker(action, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest("svg")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let textNode = null;
  while (walker.nextNode()) textNode = walker.currentNode;

  if (textNode) {
    textNode.nodeValue = label;
    return;
  }

  const text = document.createElement("span");
  text.textContent = label;
  action.appendChild(text);
}

function createActionIcon(iconName) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 20 20");
  svg.setAttribute("fill", "none");
  svg.setAttribute("aria-hidden", "true");
  if (iconName === "review") {
    svg.innerHTML =
      '<path d="M8.75 14.25a5.5 5.5 0 1 1 3.89-1.61L16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M6.5 8.75l1.5 1.5 3-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
    return svg;
  }

  if (iconName === "pull") {
    svg.innerHTML =
      '<path d="M10 3.5v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M6.75 9.25 10 12.5l3.25-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M4.5 15.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>';
    return svg;
  }

  if (iconName === "terminal") {
    svg.innerHTML =
      '<path d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9Z" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="m6.5 8 2 2-2 2M10.5 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
    return svg;
  }

  if (iconName === "branch") {
    svg.innerHTML =
      '<path d="M6.5 5.5v5a4 4 0 0 0 4 4h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M6.5 10.5h4a3 3 0 0 0 3-3v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<circle cx="6.5" cy="4.5" r="1.75" stroke="currentColor" stroke-width="1.5"/>' +
      '<circle cx="13.5" cy="4.5" r="1.75" stroke="currentColor" stroke-width="1.5"/>' +
      '<circle cx="14.5" cy="14.5" r="1.75" stroke="currentColor" stroke-width="1.5"/>';
    return svg;
  }

  if (iconName === "spark") {
    svg.innerHTML =
      '<path d="M10 3.5 11.4 8.6 16.5 10l-5.1 1.4L10 16.5l-1.4-5.1L3.5 10l5.1-1.4L10 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>';
    return svg;
  }

  svg.innerHTML =
    '<path d="M3.5 10h4M12.5 10h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>';
  return svg;
}

function menuItemFallbackClass() {
  return [
    "text-token-text-primary",
    "hover:bg-token-foreground/10",
    "flex",
    "w-full",
    "items-center",
    "gap-2",
    "rounded-md",
    "px-3",
    "py-2",
    "text-left",
    "text-sm",
    "cursor-interaction",
  ].join(" ");
}

function findMenuContainer(anchor) {
  let node = anchor.parentElement;
  for (let depth = 0; node && depth < 8; depth += 1, node = node.parentElement) {
    if (!(node instanceof HTMLElement)) continue;

    const role = node.getAttribute("role") || "";
    const radix = node.hasAttribute("data-radix-menu-content") ||
      node.hasAttribute("data-radix-popper-content-wrapper");
    const text = normalizeLabel(node);
    const hasMenuMarkers = MENU_MARKERS.every((marker) => text.includes(marker));

    if ((role === "menu" || radix || hasMenuMarkers) && hasMenuMarkers) {
      return node;
    }
  }
  return null;
}

function normalizeLabel(node) {
  return String(node.getAttribute("aria-label") || node.textContent || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function runPromptAction(state, def) {
  closeOpenMenu();
  await sleep(80);

  const startedUrl = window.location.href;
  const newChat = findNewChatButton();
  if (newChat) {
    newChat.click();
    await waitForNewChatSurface(startedUrl, 2500);
  } else {
    state.api.log.warn("[quick-actions] new chat button not found; using active composer");
  }

  const composer = await waitForComposer(5000);
  if (!composer) {
    state.api.log.warn("[quick-actions] no active composer found");
    await copyPromptFallback(def.prompt);
    return;
  }

  fillComposer(composer, def.prompt);
  await submitComposerPrompt(composer);
}

function findNewChatButton() {
  const controls = Array.from(document.querySelectorAll("button, a"))
    .filter((node) => node instanceof HTMLElement)
    .filter(isVisibleControl);

  return controls.find((node) => {
    const label = normalizeControlLabel(node);
    return label === "new chat" || label === "quick chat" || label === "new conversation";
  }) || null;
}

function normalizeControlLabel(node) {
  return String(node.getAttribute("aria-label") || node.textContent || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s*[⌘⇧⌥⌃^].*$/, "");
}

function isVisibleControl(node) {
  const rect = node.getBoundingClientRect();
  const style = window.getComputedStyle(node);
  return rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    node.getAttribute("aria-disabled") !== "true";
}

function waitForNewChatSurface(startedUrl, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const elapsed = Date.now() - started;
      const composer = findComposer();
      const changedUrl = window.location.href !== startedUrl;
      const emptyComposer = elapsed > 350 && composer && !composerValue(composer).trim();

      if (changedUrl || emptyComposer || elapsed > timeoutMs) {
        return resolve({ changedUrl, emptyComposer: Boolean(emptyComposer) });
      }

      window.setTimeout(tick, 100);
    };
    tick();
  });
}

function closeOpenMenu() {
  document.dispatchEvent(new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key: "Escape",
    code: "Escape",
  }));
}

function waitForComposer(timeoutMs) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const composer = findComposer();
      if (composer) return resolve(composer);
      if (Date.now() - started > timeoutMs) return resolve(null);
      window.setTimeout(tick, 100);
    };
    tick();
  });
}

function findComposer() {
  const selectors = [
    "textarea",
    "[contenteditable='true'][role='textbox']",
    "[contenteditable='true']",
    "[role='textbox']",
  ];

  for (const selector of selectors) {
    const candidates = Array.from(document.querySelectorAll(selector))
      .filter((node) => node instanceof HTMLElement)
      .filter(isUsableComposer)
      .sort((a, b) => scoreComposer(b) - scoreComposer(a));

    if (candidates[0]) return candidates[0];
  }

  return null;
}

function isUsableComposer(node) {
  if (node instanceof HTMLTextAreaElement && (node.disabled || node.readOnly)) return false;

  const rect = node.getBoundingClientRect();
  const style = window.getComputedStyle(node);
  return rect.width > 180 &&
    rect.height > 20 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    !node.closest("[data-codexpp-app-pages='panel']");
}

function scoreComposer(node) {
  const rect = node.getBoundingClientRect();
  const haystack = [
    node.id,
    node.className,
    node.getAttribute("aria-label"),
    node.getAttribute("placeholder"),
    node.getAttribute("data-testid"),
    node.closest("form")?.className,
    node.closest("footer")?.className,
  ].join(" ");

  let score = 0;
  if (/composer|prompt|message|chat|ask|reply/i.test(haystack)) score += 30;
  if (node.closest("form")) score += 20;
  if (node.closest("footer")) score += 12;
  if (rect.bottom > window.innerHeight * 0.5) score += 10;
  score += Math.min(10, Math.max(0, rect.bottom / 100));
  return score;
}

function fillComposer(composer, prompt) {
  composer.focus();

  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    const proto = composer instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter ? setter.call(composer, prompt) : (composer.value = prompt);
    composer.setSelectionRange(prompt.length, prompt.length);
  } else {
    placeCaretAtEnd(composer);
    if (!document.execCommand("insertText", false, prompt)) {
      composer.textContent = prompt;
    }
  }

  composer.dispatchEvent(new InputEvent("input", {
    bubbles: true,
    inputType: "insertText",
    data: prompt,
  }));
  composer.dispatchEvent(new Event("change", { bubbles: true }));
}

function composerValue(composer) {
  return composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement
    ? composer.value || ""
    : composer.textContent || "";
}

function placeCaretAtEnd(node) {
  if (!(node instanceof HTMLElement) || node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
    return;
  }

  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function submitComposerPrompt(target) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const button = findBestSubmitButton(target);
    if (button) {
      clickControl(button);
      await sleep(350);
      if (!document.documentElement.contains(target) || !composerValue(target).trim()) {
        return true;
      }
      break;
    }
    await sleep(120);
  }

  const form = target.closest("form");
  if (form instanceof HTMLFormElement) {
    form.requestSubmit?.();
    await sleep(220);
    if (!document.documentElement.contains(target) || !composerValue(target).trim()) {
      return true;
    }
  }

  sendComposerShortcut(target, { metaKey: true });
  await sleep(220);

  if (composerValue(target).trim()) {
    sendComposerShortcut(target, {});
  }

  return true;
}

function findBestSubmitButton(target) {
  const form = target.closest("form");
  const formSubmit = findSubmitButton(form ? [form] : [], target);
  if (formSubmit) return formSubmit;

  const globalSubmit = findSubmitButton([document], target);
  if (globalSubmit) return globalSubmit;

  return null;
}

function clickControl(control) {
  control.focus?.();
  for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
    control.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0,
    }));
  }
}

function sendComposerShortcut(target, options) {
  target.focus();
  for (const type of ["keydown", "keyup"]) {
    target.dispatchEvent(new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      key: "Enter",
      code: "Enter",
      metaKey: Boolean(options.metaKey),
      ctrlKey: Boolean(options.ctrlKey),
    }));
  }
}

function findSubmitButton(roots, target) {
  const ranked = roots
    .flatMap((root) => Array.from(root.querySelectorAll("button")))
    .filter((button) => button instanceof HTMLButtonElement && isUsableSubmitButton(button))
    .map((button) => ({ button, score: scoreSubmitButton(button, target) }))
    .filter((entry) => entry.score > 20);

  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.button || null;
}

function isUsableSubmitButton(button) {
  if (button.disabled || button.closest("[data-codexpp-app-pages='panel']")) return false;

  const rect = button.getBoundingClientRect();
  const style = window.getComputedStyle(button);
  return rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    button.getAttribute("aria-disabled") !== "true";
}

function scoreSubmitButton(button, target) {
  const rect = button.getBoundingClientRect();
  const targetRect = target?.getBoundingClientRect?.();
  const haystack = [
    button.type,
    button.id,
    button.className,
    button.textContent,
    button.getAttribute("aria-label"),
    button.getAttribute("title"),
    button.getAttribute("data-testid"),
  ].join(" ");

  let score = 0;
  if (button.type === "submit") score += 35;
  if (/send|submit|envoyer|arrow-up|paper-airplane/i.test(haystack)) score += 35;
  if (/stop|cancel|abort|attach|microphone|settings|reset|apply/i.test(haystack)) score -= 50;
  if (button.closest("form")) score += 12;
  if (button.closest("footer")) score += 8;
  if (rect.bottom > window.innerHeight * 0.5) score += 8;

  if (targetRect) {
    const verticalDistance = Math.abs(rect.top - targetRect.top);
    if (verticalDistance < 120) score += 20;
    else if (verticalDistance > 300) score -= 20;
  }

  score += Math.min(10, Math.max(0, rect.bottom / 100));
  return score;
}

async function copyPromptFallback(prompt) {
  try {
    await navigator.clipboard?.writeText?.(prompt);
  } catch {
    /* clipboard may be unavailable */
  }
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
