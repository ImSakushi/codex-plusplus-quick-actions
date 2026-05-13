/**
 * Quick Actions
 *
 * Custom Codex workflow shortcuts.
 */

const ACTION_ATTR = "data-codexpp-quick-actions-action";
const THREAD_SUMMARY_PANEL_ATTR = "data-codexpp-quick-actions-thread-summary-panel";
const FALLBACK_PANEL_ATTR = "data-codexpp-quick-actions-fallback-panel";
const STYLE_ATTR = "data-codexpp-quick-actions-style";
const FOLLOWUP_PANEL_ATTR = "data-soren-radar-panel";
const ACTIONS_STORAGE_KEY = "actions";
const RUNNING_ACTIONS_KEY = "__codexppQuickActionsRunningActionIds";
const EXPORT_VERSION = 1;
const CREATE_PR_LABEL_MARKERS = [
  "create pull request",
  "create pr",
  "open pull request",
  "open pr",
  "créer une pull request",
  "creer une pull request",
  "créer une pr",
  "creer une pr",
  "ouvrir une pull request",
  "ouvrir une pr",
];
const BRANCH_DETAILS_MARKERS = [
  "branch details",
  "détails de branche",
  "details de branche",
  "détails de la branche",
  "details de la branche",
];
const CHANGES_MARKERS = ["changes", "modifications", "changements"];
const GIT_ACTION_MARKERS = ["git actions", "actions git"];
const MENU_MARKERS = ["branch details", "changes", "git actions"];
const NATIVE_SUMMARY_PANEL_CLASS_MARKER = "group/summary-panel";
const CONVERSATION_TARGET_OPTIONS = [
  { value: "new", label: "New conversation" },
  { value: "current", label: "Current conversation" },
];
const DEFAULT_ACTIONS = [
  {
    id: "git-pull",
    label: "Git pull",
    icon: "pull",
    mode: "confirm",
    conversationTarget: "new",
    prompt:
      "Pull the latest changes for this repo. If conflicts or merge issues appear, stop before resolving them, explain which local work conflicts with which incoming changes, and suggest a clean resolution plan.",
  },
  {
    id: "multi-commit-and-push",
    label: "Multi commit and push",
    icon: "commit",
    mode: "auto",
    conversationTarget: "new",
    prompt:
      "Review all local changes, split them into focused commits by feature or concern, write concise English commit messages with conventional prefixes, then push the branch.",
  },
  {
    id: "code-review",
    label: "Code review",
    icon: "review",
    mode: "auto",
    conversationTarget: "new",
    prompt: `## Code review guidelines:
# Review Guidelines

You are acting as a reviewer for a proposed code change made by another engineer.

Review the change and respond in normal Markdown. Do not return JSON, XML, a findings object, or any structured review schema.

When feedback should be attached directly to a changed line, emit one \`::code-comment{...}\` directive for that issue. The directive creates an inline code comment in the review UI; keep the visible response as normal Markdown. Emit no directives when there are no actionable inline comments.

Required \`code-comment\` attributes: \`title\`, \`body\`, and \`file\`. Optional attributes: \`start\`, \`end\`, and \`priority\`. Use the shortest useful line range. \`file\` should be an absolute path or include the workspace folder segment.

Focus on discrete, actionable issues the original author would likely fix if they knew about them. Prefer no issues over speculative or low-signal feedback.

General guidelines for whether to call out an issue:

1. It meaningfully impacts correctness, performance, security, or maintainability.
2. It is discrete and actionable.
3. It was introduced by the change under review.
4. The author would likely fix it once aware.
5. It does not rely on unstated assumptions about intent.
6. It identifies the affected behavior clearly rather than speculating broadly.

When you call out an issue, include the relevant file and line or function in prose, explain the scenario where it matters, and keep the explanation concise. Use priority labels such as \`[P1]\` or \`[P2]\` only when helpful to communicate severity.

If there are no actionable issues, say that directly and briefly.
Review the current code changes (staged, unstaged, and untracked files) and provide concise, actionable feedback in a normal Markdown response.
## My request for Codex:
Please review my uncommitted changes`,
  },
];
const ICON_OPTIONS = [
  { value: "pull", label: "Pull" },
  { value: "push", label: "Push" },
  { value: "commit", label: "Commit" },
  { value: "branch", label: "Branch" },
  { value: "merge", label: "Merge" },
  { value: "diff", label: "Diff" },
  { value: "pr", label: "Pull request" },
  { value: "github", label: "GitHub" },
  { value: "tag", label: "Tag" },
  { value: "review", label: "Review" },
  { value: "check", label: "Check" },
  { value: "terminal", label: "Terminal" },
  { value: "bug", label: "Bug" },
  { value: "test", label: "Test" },
  { value: "file", label: "File" },
  { value: "docs", label: "Docs" },
  { value: "search", label: "Search" },
  { value: "database", label: "Database" },
  { value: "wrench", label: "Fix" },
  { value: "broom", label: "Clean" },
  { value: "rocket", label: "Rocket" },
  { value: "shield", label: "Shield" },
  { value: "lock", label: "Lock" },
  { value: "undo", label: "Undo" },
  { value: "settings", label: "Settings" },
  { value: "package", label: "Package" },
  { value: "cloud", label: "Cloud" },
  { value: "sync", label: "Sync" },
  { value: "spark", label: "Spark" },
];
const ICON_SVG_PATHS = {
  pull:
    '<path d="M10 3.5v9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M6.75 9.25 10 12.5l3.25-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M4.5 15.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  push:
    '<path d="M10 16.5v-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M6.75 10.75 10 7.5l3.25 3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M4.5 4.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  commit:
    '<path d="M3.5 10h4M12.5 10h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>',
  branch:
    '<path d="M6.5 5.5v5a4 4 0 0 0 4 4h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M6.5 10.5h4a3 3 0 0 0 3-3v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<circle cx="6.5" cy="4.5" r="1.75" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="13.5" cy="4.5" r="1.75" stroke="currentColor" stroke-width="1.5"/>' +
    '<circle cx="14.5" cy="14.5" r="1.75" stroke="currentColor" stroke-width="1.5"/>',
  merge:
    '<path d="M6.5 4.5v4a5 5 0 0 0 5 5h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M11.25 10.75 14 13.5l-2.75 2.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="6.5" cy="4.5" r="1.75" stroke="currentColor" stroke-width="1.5"/>',
  diff:
    '<path d="M5 5h5M5 10h10M5 15h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M13.5 3.75v3.5M11.75 5.5h3.5M13.5 12.75v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  pr:
    '<path d="M6 5v8.5a2.5 2.5 0 0 0 2.5 2.5h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M11.25 13.25 14 16l-2.75 2.75M14 16V8.5A2.5 2.5 0 0 0 11.5 6H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="6" cy="4.5" r="1.75" stroke="currentColor" stroke-width="1.5"/>',
  github:
    '<path d="M10 2.75a7.25 7.25 0 0 0-2.3 14.13c.36.07.5-.16.5-.35v-1.25c-2.05.45-2.48-.88-2.48-.88-.33-.85-.82-1.08-.82-1.08-.68-.46.05-.45.05-.45.75.05 1.15.78 1.15.78.67 1.14 1.75.81 2.18.62.07-.48.26-.81.48-1-1.64-.18-3.36-.82-3.36-3.64 0-.8.29-1.46.77-1.98-.08-.19-.33-.94.07-1.95 0 0 .62-.2 2.05.75A7.05 7.05 0 0 1 10 4.93c.63 0 1.27.08 1.86.25 1.42-.95 2.05-.75 2.05-.75.4 1.01.15 1.76.07 1.95.48.52.77 1.18.77 1.98 0 2.83-1.72 3.45-3.36 3.64.27.23.51.68.51 1.37v2.16c0 .19.13.42.51.35A7.25 7.25 0 0 0 10 2.75Z" fill="currentColor"/>',
  tag:
    '<path d="M4 5.5a1.5 1.5 0 0 1 1.5-1.5h4.1c.4 0 .78.16 1.06.44l5.1 5.1a1.5 1.5 0 0 1 0 2.12l-3.6 3.6a1.5 1.5 0 0 1-2.12 0l-5.1-5.1A1.5 1.5 0 0 1 4.5 9.1V5.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<circle cx="7.25" cy="7.25" r=".75" fill="currentColor"/>',
  review:
    '<path d="M8.75 14.25a5.5 5.5 0 1 1 3.89-1.61L16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M6.5 8.75l1.5 1.5 3-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  check:
    '<path d="M4 10.25 8.25 14.5 16 5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  terminal:
    '<path d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-9Z" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="m6.5 8 2 2-2 2M10.5 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  bug:
    '<path d="M6.5 8.5h7v3.25a3.5 3.5 0 0 1-7 0V8.5Z" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M7.5 6.75a2.5 2.5 0 0 1 5 0M4.5 9.5h2M13.5 9.5h2M4.5 13h2.25M13.25 13h2.25M8 4.5 6.5 3M12 4.5 13.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  test:
    '<path d="M7.5 3.5v4.25l-3 5.5A2.2 2.2 0 0 0 6.45 16.5h7.1a2.2 2.2 0 0 0 1.95-3.25l-3-5.5V3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M7 10.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  file:
    '<path d="M5 3.5h5.5L15 8v6.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M10.5 3.5V8H15" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  docs:
    '<path d="M5 3.5h6l4 4v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M11 3.5V7.5H15M6 10.5h6M6 13.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  search:
    '<path d="M8.75 14.25a5.5 5.5 0 1 1 3.89-1.61L16 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  database:
    '<ellipse cx="10" cy="5" rx="5.5" ry="2.25" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M4.5 5v5c0 1.25 2.46 2.25 5.5 2.25s5.5-1 5.5-2.25V5M4.5 10v5c0 1.25 2.46 2.25 5.5 2.25s5.5-1 5.5-2.25v-5" stroke="currentColor" stroke-width="1.5"/>',
  wrench:
    '<path d="M12.25 3.75a4 4 0 0 0 4.1 4.1l-7.7 7.7a2.2 2.2 0 1 1-3.1-3.1l7.7-7.7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M5.75 14.25h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  broom:
    '<path d="M12.5 3.5 16 7l-7.5 7.5L5 11l7.5-7.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M4 12l4 4M3.5 16.5h6M5.5 14.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  rocket:
    '<path d="M11.5 4.25c1.6-.7 3.05-.78 4.25-.5.28 1.2.2 2.65-.5 4.25-.75 1.72-2.15 3.35-4.05 4.7l-3.9-3.9c1.35-1.9 2.98-3.3 4.2-4.55Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M7.25 9 5.5 9.25 4 12l2.75-.5M11 12.75 10.75 14.5 8 16l.5-2.75M12.75 6.75h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  shield:
    '<path d="M10 3.5 15 5.25v3.9c0 3.15-1.85 5.95-5 7.35-3.15-1.4-5-4.2-5-7.35v-3.9L10 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="m7.75 10 1.5 1.5 3-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  lock:
    '<path d="M6 8.5V6.75a4 4 0 0 1 8 0V8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<rect x="4" y="8.5" width="12" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M10 12v1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  undo:
    '<path d="M7.5 6H4v-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M4.25 6A6.5 6.5 0 1 1 3.5 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  settings:
    '<path d="M10 7.25a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5Z" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M10 3v2M10 15v2M4.25 6.25 5.7 7.7M14.3 12.3l1.45 1.45M3 10h2M15 10h2M4.25 13.75 5.7 12.3M14.3 7.7l1.45-1.45" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  package:
    '<path d="M10 3.5 15.5 6.5v6.5L10 16.5 4.5 13V6.5L10 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<path d="M4.75 6.75 10 9.75l5.25-3M10 9.75v6.25" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  cloud:
    '<path d="M6.75 14.5h6.75a3 3 0 0 0 .4-5.97 4.5 4.5 0 0 0-8.65 1.2A2.4 2.4 0 0 0 6.75 14.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  sync:
    '<path d="M15.5 7.25A5.75 5.75 0 0 0 5.2 5.2L4 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M4 3.5v3h3M4.5 12.75a5.75 5.75 0 0 0 10.3 2.05L16 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '<path d="M16 16.5v-3h-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  spark:
    '<path d="M10 3.5 11.4 8.6 16.5 10l-5.1 1.4L10 16.5l-1.4-5.1L3.5 10l5.1-1.4L10 3.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
};

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
      draggedActionId: null,
      importInput: null,
      runningActionIds: globalRunningActionIds(),
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
    .filter((node) => labelHasCreatePrAction(normalizeLabel(node)));

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
    .some((node) => isVisibleControl(node) && labelHasCreatePrAction(normalizeLabel(node)));
  const hasNativeThreadSummaryPanel = findNativeThreadSummaryPanel() != null;

  if (
    actions.length === 0 ||
    hasNativeMenuAction ||
    hasCreatePrEntry ||
    hasNativeThreadSummaryPanel ||
    !shouldShowFallbackThreadSummaryPanel(state)
  ) {
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

  const hasNativeBranchDetails = findNativeThreadSummaryPanel() != null;

  if (hasNativeBranchDetails) state.sawGitContext = true;
}

function findNativeThreadSummaryPanel() {
  return findNativeSummaryPanelRoot() || findNativeGitActionsTrigger() || findNativeGitActionsSection();
}

function findNativeSummaryPanelRoot() {
  return Array.from(document.querySelectorAll("div"))
    .filter((node) => node instanceof HTMLElement)
    .find((node) => {
      if (node.closest(`[${FALLBACK_PANEL_ATTR}]`) || !isRenderedNode(node)) return false;
      const className = String(node.getAttribute("class") || "");
      return className.includes(NATIVE_SUMMARY_PANEL_CLASS_MARKER);
    }) || null;
}

function findNativeGitActionsTrigger() {
  return Array.from(document.querySelectorAll("button, [role='button'], [role='menuitem'], [role='option'], a"))
    .filter((node) => node instanceof HTMLElement)
    .find((node) => {
      if (node.closest(`[${FALLBACK_PANEL_ATTR}]`) || !isRenderedNode(node)) return false;
      return labelHasAny(normalizeControlLabel(node), GIT_ACTION_MARKERS);
    }) || null;
}

function findNativeGitActionsSection() {
  return Array.from(document.querySelectorAll("section"))
    .filter((node) => node instanceof HTMLElement)
    .find((node) => {
      if (node.closest(`[${FALLBACK_PANEL_ATTR}]`) || !isRenderedNode(node)) return false;
      const label = normalizePanelLabel(node);
      return label.length <= 1200 &&
        labelHasAny(label, BRANCH_DETAILS_MARKERS) &&
        labelHasAny(label, GIT_ACTION_MARKERS);
    }) || null;
}

function isRenderedNode(node) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.hidden || node.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(node);
  return style.display !== "none" && style.visibility !== "hidden";
}

function labelHasCreatePrAction(label) {
  return labelHasAny(label, CREATE_PR_LABEL_MARKERS);
}

function labelHasAny(label, markers) {
  return markers.some((marker) => label.includes(marker));
}

function normalizeControlLabel(node) {
  return normalizeSearchText([
    node.getAttribute("aria-label") ||
      "",
    node.getAttribute("title") ||
      "",
    node.getAttribute("data-testid") ||
      "",
    node.textContent ||
      "",
  ].join(" "));
}

function normalizePanelLabel(node) {
  return normalizeSearchText([
    node.getAttribute("aria-label") ||
      "",
    node.getAttribute("title") ||
      "",
    node.getAttribute("data-testid") ||
      "",
    node.textContent ||
      "",
  ].join(" "));
}

function normalizeSearchText(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
    "Create the custom options shown in the Thread Summary Panel. Choose whether each action starts fresh or continues the current conversation.",
  ));

  const toolbar = el("div", "flex flex-wrap items-center gap-2");
  toolbar.append(
    settingsButton("Export JSON", "ghost", () => exportActions(state)),
    settingsButton("Import JSON", "ghost", () => openImportPicker(state)),
    settingsButton("Reset defaults", "danger", () => {
      state.editingActionId = null;
      refreshActions(state, DEFAULT_ACTIONS);
    }),
  );
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = "application/json,.json";
  importInput.hidden = true;
  importInput.addEventListener("change", () => importActionsFromFile(state, importInput));
  state.importInput = importInput;
  toolbar.appendChild(importInput);
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
  section.appendChild(bottomAddActionButton(state));
  root.appendChild(section);
}

function rerenderSettingsPage(state) {
  if (!state.pageRoot) return;
  renderSettingsPage(state.pageRoot, state);
}

function actionSettingsRow(state, action, index) {
  const isEditing = state.editingActionId === action.id;
  const row = el("div", "flex flex-col gap-3 p-3");
  row.draggable = true;
  row.setAttribute("data-quick-action-id", action.id);
  row.addEventListener("dragstart", (event) => {
    state.draggedActionId = action.id;
    row.style.opacity = "0.55";
    event.dataTransfer?.setData("text/plain", action.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
  });
  row.addEventListener("dragend", () => {
    state.draggedActionId = null;
    row.style.opacity = "";
  });
  row.addEventListener("dragover", (event) => {
    if (!state.draggedActionId || state.draggedActionId === action.id) return;
    event.preventDefault();
    row.classList.add("bg-token-foreground/5");
  });
  row.addEventListener("dragleave", () => {
    row.classList.remove("bg-token-foreground/5");
  });
  row.addEventListener("drop", (event) => {
    event.preventDefault();
    row.classList.remove("bg-token-foreground/5");
    const draggedId = event.dataTransfer?.getData("text/plain") || state.draggedActionId;
    if (draggedId && draggedId !== action.id) reorderActionById(state, draggedId, action.id);
  });
  const toggleEditor = () => {
    state.editingActionId = isEditing ? null : action.id;
    rerenderSettingsPage(state);
  };

  const top = el("div", "flex items-center justify-between gap-4");
  const left = document.createElement("button");
  left.type = "button";
  left.setAttribute("aria-expanded", String(isEditing));
  left.className = [
    "flex",
    "min-w-0",
    "flex-1",
    "items-center",
    "gap-3",
    "rounded-md",
    "p-1",
    "text-left",
    "cursor-interaction",
    "hover:bg-token-foreground/5",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-token-focus-border",
  ].join(" ");
  left.addEventListener("click", toggleEditor);
  const icon = createActionIcon(action.icon);
  icon.classList.add("shrink-0", "text-token-text-secondary");
  const text = el("div", "flex min-w-0 flex-col gap-1");
  const title = el("div", "min-w-0 truncate text-sm font-medium text-token-text-primary");
  title.textContent = actionDisplayLabel(action);
  const prompt = el("div", "text-token-text-secondary min-w-0 truncate text-xs");
  prompt.textContent = action.prompt || "No prompt configured.";
  const meta = el("div", "flex min-w-0 items-center gap-2 text-xs text-token-text-secondary");
  const target = el("span", "shrink-0 rounded-full border border-token-border bg-token-foreground/5 px-2 py-0.5");
  target.textContent = conversationTargetLabel(action.conversationTarget);
  meta.append(target, prompt);
  text.append(title, meta);
  left.append(icon, text);

  const controls = el("div", "flex shrink-0 items-center gap-1");
  controls.append(
    iconButton("Move up", "up", () => moveAction(state, index, -1), index === 0),
    iconButton("Move down", "down", () => moveAction(state, index, 1), index === state.actionDefs.length - 1),
    settingsButton(isEditing ? "Done" : "Edit", "ghost", toggleEditor),
    settingsButton("Duplicate", "ghost", () => duplicateAction(state, action.id)),
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
  const iconPicker = iconPickerInput(action.icon, (icon) => {
    updateAction(state, action.id, { icon });
  });
  const promptInput = textareaInput(action.prompt, "Prompt");
  const conversationTarget = segmentedControl(
    CONVERSATION_TARGET_OPTIONS,
    action.conversationTarget,
    (value) => updateAction(state, action.id, { conversationTarget: value }),
  );
  const modeToggle = switchControl(action.mode === "confirm", (checked) => {
    updateAction(state, action.id, { mode: checked ? "confirm" : "auto" });
  });

  titleInput.addEventListener("input", () => {
    updateAction(state, action.id, { label: titleInput.value });
  });
  promptInput.addEventListener("input", () => {
    updateAction(state, action.id, { prompt: promptInput.value });
  });

  editor.append(
    settingsField("Title", titleInput),
    settingsField("Logo", iconPicker),
    settingRow(
      "Conversation",
      "Choose where this prompt should run.",
      conversationTarget,
    ),
    settingRow(
      "Confirmation before send",
      "When enabled, Quick Actions fills the prompt without submitting it.",
      modeToggle,
    ),
    variablesHint(),
    settingsField("Prompt", promptInput),
  );
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

function addAction(state) {
  const action = createBlankAction();
  state.editingActionId = action.id;
  refreshActions(state, [...state.actionDefs, action]);
}

function bottomAddActionButton(state) {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "border-token-border text-token-text-primary hover:bg-token-foreground/10 " +
    "flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed bg-token-foreground/5 text-sm cursor-interaction";
  button.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
    '<path d="M10 4.5v11M4.5 10h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
    '</svg><span>Add action</span>';
  button.addEventListener("click", () => addAction(state));
  return button;
}

async function exportActions(state) {
  const payload = JSON.stringify({
    quickActions: true,
    version: EXPORT_VERSION,
    actions: state.actionDefs,
  }, null, 2);

  try {
    await navigator.clipboard?.writeText?.(payload);
  } catch {
    /* clipboard may be unavailable */
  }

  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quick-actions.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openImportPicker(state) {
  state.importInput?.click();
}

async function importActionsFromFile(state, input) {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const actions = Array.isArray(parsed) ? parsed : parsed?.actions;
    if (!Array.isArray(actions)) throw new Error("No actions array found");
    state.editingActionId = null;
    refreshActions(state, mergeImportedActions(state.actionDefs, actions));
  } catch (error) {
    state.api.log.warn("[quick-actions] import failed", error);
    window.alert?.(`Quick Actions import failed: ${error?.message || String(error)}`);
  }
}

function mergeImportedActions(currentActions, importedActions) {
  const currentIds = new Set(currentActions.map((action) => action.id));
  const importedById = new Map();
  const newActionOrder = [];
  const newActionsById = new Map();

  for (const rawAction of normalizeActionDefs(importedActions)) {
    if (currentIds.has(rawAction.id)) {
      importedById.set(rawAction.id, rawAction);
      continue;
    }

    if (!newActionsById.has(rawAction.id)) newActionOrder.push(rawAction.id);
    newActionsById.set(rawAction.id, rawAction);
  }

  return [
    ...currentActions.map((action) => importedById.get(action.id) || action),
    ...newActionOrder.map((id) => newActionsById.get(id)),
  ];
}

function duplicateAction(state, id) {
  const index = state.actionDefs.findIndex((action) => action.id === id);
  if (index < 0) return;
  const source = state.actionDefs[index];
  const copy = normalizeActionDef({
    ...source,
    id: createActionId(),
    label: `${actionDisplayLabel(source)} copy`,
  });
  const next = [...state.actionDefs];
  next.splice(index + 1, 0, copy);
  state.editingActionId = copy.id;
  refreshActions(state, next);
}

function reorderActionById(state, draggedId, targetId) {
  const from = state.actionDefs.findIndex((action) => action.id === draggedId);
  const to = state.actionDefs.findIndex((action) => action.id === targetId);
  if (from < 0 || to < 0 || from === to) return;

  const next = [...state.actionDefs];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  refreshActions(state, next);
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
  const mode = value?.mode === "confirm" ? "confirm" : "auto";
  const conversationTarget = value?.conversationTarget === "current" ? "current" : "new";
  const id = typeof value?.id === "string" && value.id.trim()
    ? value.id.trim()
    : fallback.id;
  const label = typeof value?.label === "string" ? value.label : "";
  const prompt = typeof value?.prompt === "string" ? value.prompt : "";
  const icon = iconValues.has(value?.icon) ? value.icon : "spark";

  return { id, label, prompt, icon, mode, conversationTarget };
}

function runnableActionDefs(state) {
  return state.actionDefs.filter((action) => actionDisplayLabel(action) && action.prompt.trim());
}

function actionDisplayLabel(action) {
  return (action.label || "").trim() || "Untitled action";
}

function createBlankAction() {
  return {
    id: createActionId(),
    label: "New action",
    icon: "spark",
    mode: "auto",
    conversationTarget: "new",
    prompt: "",
  };
}

function createActionId() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
  const field = el("div", "flex min-w-0 flex-col gap-1");
  const text = el("span", "text-token-text-secondary text-xs");
  text.textContent = label;
  field.append(text, control);
  return field;
}

function settingRow(label, description, control) {
  const row = el("div", "flex flex-wrap items-center justify-between gap-4 rounded-md border border-token-border bg-token-foreground/5 p-3");
  const left = el("div", "flex min-w-0 flex-col gap-1");
  const title = el("div", "text-sm text-token-text-primary");
  title.textContent = label;
  const desc = el("div", "text-token-text-secondary text-xs");
  desc.textContent = description;
  left.append(title, desc);
  row.append(left, control);
  return row;
}

function variablesHint() {
  const hint = el("div", "text-token-text-secondary rounded-md border border-token-border bg-token-foreground/5 p-3 text-xs");
  hint.textContent = "Variables: {repo}, {branch}, {cwd}, {date}, {time}, {datetime}, {url}, {title}, {selectedText}";
  return hint;
}

function switchControl(initial, onChange) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("role", "switch");
  const pill = document.createElement("span");
  const knob = document.createElement("span");
  knob.className =
    "rounded-full border border-[color:var(--gray-0)] bg-[color:var(--gray-0)] " +
    "shadow-sm transition-transform duration-200 ease-out h-4 w-4";
  pill.appendChild(knob);

  const apply = (on) => {
    btn.setAttribute("aria-checked", String(on));
    btn.className =
      "inline-flex items-center text-sm focus-visible:outline-none focus-visible:ring-2 " +
      "focus-visible:ring-token-focus-border focus-visible:rounded-full cursor-interaction";
    pill.className =
      "relative inline-flex shrink-0 items-center rounded-full transition-colors " +
      "duration-200 ease-out h-5 w-8 " +
      (on ? "bg-token-charts-blue" : "bg-token-foreground/20");
    knob.style.transform = on ? "translateX(14px)" : "translateX(2px)";
  };

  apply(initial);
  btn.appendChild(pill);
  btn.addEventListener("click", () => {
    const next = btn.getAttribute("aria-checked") !== "true";
    apply(next);
    onChange?.(next);
  });
  return btn;
}

function segmentedControl(options, value, onChange) {
  const wrap = el(
    "div",
    "border-token-border bg-token-foreground/5 inline-grid shrink-0 grid-flow-col gap-0.5 rounded-md border p-0.5",
  );
  wrap.setAttribute("role", "radiogroup");

  const apply = (selectedValue) => {
    for (const button of wrap.querySelectorAll("button")) {
      const selected = button.dataset.value === selectedValue;
      button.setAttribute("aria-checked", String(selected));
      button.className = segmentedButtonClass(selected);
    }
  };

  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.value = option.value;
    button.setAttribute("role", "radio");
    button.textContent = option.label;
    button.addEventListener("click", () => {
      apply(option.value);
      onChange?.(option.value);
    });
    wrap.appendChild(button);
  }

  apply(options.some((option) => option.value === value) ? value : options[0]?.value);
  return wrap;
}

function segmentedButtonClass(selected) {
  return [
    "h-token-button-composer",
    "rounded-[calc(var(--radius-md,0.375rem)-2px)]",
    "px-3",
    "text-sm",
    "font-medium",
    "transition-colors",
    "cursor-interaction",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-token-focus-border",
    selected
      ? "bg-token-foreground/10 text-token-text-primary shadow-sm ring-1 ring-token-border"
      : "text-token-text-secondary hover:bg-token-foreground/10 hover:text-token-text-primary",
  ].join(" ");
}

function conversationTargetLabel(value) {
  return CONVERSATION_TARGET_OPTIONS.find((option) => option.value === value)?.label ||
    CONVERSATION_TARGET_OPTIONS[0].label;
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

function iconPickerInput(value, onSelect) {
  const selected = ICON_OPTIONS.some((option) => option.value === value) ? value : "spark";
  const wrap = el("div", "flex flex-col gap-2");
  const summary = el("div", "text-token-text-secondary text-xs");
  summary.textContent = `Selected: ${iconLabel(selected)}`;
  const grid = el("div", "grid gap-1.5");
  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(40px, 40px))";

  for (const option of ICON_OPTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = option.label;
    button.setAttribute("aria-label", option.label);
    button.setAttribute("aria-pressed", String(option.value === selected));
    button.className = iconChoiceClass(option.value === selected);

    const icon = createActionIcon(option.value);
    icon.classList.add("shrink-0");
    button.appendChild(icon);

    button.addEventListener("click", () => {
      for (const item of grid.querySelectorAll("button")) {
        const isSelected = item === button;
        item.setAttribute("aria-pressed", String(isSelected));
        item.className = iconChoiceClass(isSelected);
      }
      summary.textContent = `Selected: ${option.label}`;
      onSelect?.(option.value);
    });

    grid.appendChild(button);
  }

  wrap.append(summary, grid);
  return wrap;
}

function iconChoiceClass(selected) {
  return [
    "border-token-border",
    "inline-flex",
    "h-9",
    "w-10",
    "items-center",
    "justify-center",
    "rounded-md",
    "border",
    "text-token-text-primary",
    "cursor-interaction",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-token-focus-border",
    selected
      ? "bg-token-charts-blue/10 text-token-charts-blue ring-1 ring-token-charts-blue/40"
      : "bg-token-foreground/5 hover:bg-token-foreground/10",
  ].join(" ");
}

function iconLabel(value) {
  return ICON_OPTIONS.find((option) => option.value === value)?.label || "Spark";
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
    onClick(action);
  });

  action.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    onClick(action);
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
  svg.innerHTML = ICON_SVG_PATHS[iconName] || ICON_SVG_PATHS.commit ||
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
    const hasCurrentMenuMarkers = labelHasAny(text, BRANCH_DETAILS_MARKERS) &&
      labelHasAny(text, CHANGES_MARKERS) &&
      labelHasCreatePrAction(text);

    if (
      (role === "menu" || radix || hasMenuMarkers || hasCurrentMenuMarkers) &&
      (hasMenuMarkers || hasCurrentMenuMarkers)
    ) {
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

function globalRunningActionIds() {
  if (!window[RUNNING_ACTIONS_KEY]) window[RUNNING_ACTIONS_KEY] = new Set();
  return window[RUNNING_ACTIONS_KEY];
}

async function runPromptAction(state, def) {
  const runKey = String(def.id || actionDisplayLabel(def));
  if (state.runningActionIds.has(runKey)) {
    state.api.log.warn("[quick-actions] action already running; ignoring duplicate activation", { id: def.id });
    return;
  }

  state.runningActionIds.add(runKey);
  try {
    closeOpenMenu();
    await sleep(80);

    if (def.conversationTarget !== "current") {
      const startedUrl = window.location.href;
      const newChat = findNewChatButton();
      if (newChat) {
        newChat.click();
        await waitForNewChatSurface(startedUrl, 2500);
      } else {
        state.api.log.warn("[quick-actions] new chat button not found; using active composer");
      }
    }

    const composer = await waitForComposer(5000);
    if (!composer) {
      state.api.log.warn("[quick-actions] no active composer found");
      await copyPromptFallback(resolvePromptVariables(def.prompt));
      return;
    }

    const prompt = resolvePromptVariables(def.prompt);
    fillComposer(composer, prompt);
    if (def.mode === "confirm") return;
    await submitComposerPrompt(composer);
  } finally {
    state.runningActionIds.delete(runKey);
  }
}

function findNewChatButton() {
  const controls = Array.from(document.querySelectorAll("button, a"))
    .filter((node) => node instanceof HTMLElement)
    .filter(isEnabledControl)
    .filter((node) => {
      const label = normalizeControlLabel(node);
      return label === "new chat" || label === "quick chat" || label === "new conversation";
    });

  const visibleNative = controls.find((node) => isVisibleControl(node) && !isSidebarActionGridProxy(node));
  if (visibleNative) return visibleNative;

  const hiddenNative = controls.find((node) => !isSidebarActionGridProxy(node));
  if (hiddenNative) return hiddenNative;

  return controls.find(isVisibleControl) || null;
}

function normalizeControlLabel(node) {
  return String(node.getAttribute("aria-label") || node.textContent || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s*[⌘⇧⌥⌃^].*$/, "");
}

function isVisibleControl(node) {
  if (!isEnabledControl(node)) return false;
  const rect = node.getBoundingClientRect();
  const style = window.getComputedStyle(node);
  return rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden";
}

function isEnabledControl(node) {
  return !node.disabled && node.getAttribute("aria-disabled") !== "true";
}

function isSidebarActionGridProxy(node) {
  return node.getAttribute("data-codexpp-sidebar-action-grid") === "button" ||
    node.closest('[data-codexpp-sidebar-action-grid="button"]') != null;
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

function resolvePromptVariables(prompt) {
  const values = promptVariableValues();
  return String(prompt || "").replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
  });
}

function promptVariableValues() {
  const now = new Date();
  const cwd = detectCwd();
  const branch = detectBranch();
  const repo = detectRepo(cwd);
  return {
    repo,
    branch,
    cwd,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    datetime: now.toLocaleString(),
    url: window.location.href,
    title: document.title || "",
    selectedText: window.getSelection?.()?.toString?.() || "",
  };
}

function detectCwd() {
  const text = document.body.textContent || "";
  const cwdMatch = text.match(/(?:cwd|workspace|project|repo|repository|root)[:\s]+((?:~|\/)[^\n\r,;]+)/i);
  if (cwdMatch?.[1]) return cwdMatch[1].trim();

  const pathMatch = document.body.textContent?.match(/(?:~|\/Users\/|\/home\/|\/workspace\/)[^\n\r\t"]+/);
  return pathMatch?.[0]?.trim() || "";
}

function detectRepo(cwd) {
  if (cwd) {
    const parts = cwd.split("/").filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }

  const title = document.title || "";
  const titleMatch = title.match(/^([^|—-]+)/);
  return titleMatch?.[1]?.trim() || "";
}

function detectBranch() {
  const candidates = Array.from(document.querySelectorAll("button, [role='button'], [aria-label], span, div"))
    .filter((node) => node instanceof HTMLElement)
    .map((node) => String(node.getAttribute("aria-label") || node.textContent || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const label of candidates) {
    const branchMatch = label.match(/\bbranch[:\s]+([a-z0-9._/-]+)/i);
    if (branchMatch?.[1]) return branchMatch[1];
  }

  const pageText = normalizeLabel(document.body);
  const gitMatch = pageText.match(/\b(?:on|current)\s+branch\s+([a-z0-9._/-]+)/i);
  return gitMatch?.[1] || "";
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
      await waitForComposerSubmission(target, 2500);
      return true;
    }
    await sleep(120);
  }

  const form = target.closest("form");
  if (form instanceof HTMLFormElement) {
    form.requestSubmit?.();
    await waitForComposerSubmission(target, 2500);
    return true;
  }

  sendComposerShortcut(target, { metaKey: true });
  await waitForComposerSubmission(target, 2500);

  return true;
}

function waitForComposerSubmission(target, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (!document.documentElement.contains(target) || !composerValue(target).trim()) return resolve(true);
      if (Date.now() - started > timeoutMs) return resolve(false);
      window.setTimeout(tick, 100);
    };
    tick();
  });
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
    .filter((entry) => entry.score > 20 && isLikelySubmitButton(entry.button));

  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.button || null;
}

function isUsableSubmitButton(button) {
  if (
    button.disabled ||
    button.closest("[data-codexpp-app-pages='panel']") ||
    button.closest(`[${FOLLOWUP_PANEL_ATTR}]`) ||
    button.closest(`[${THREAD_SUMMARY_PANEL_ATTR}]`) ||
    button.hasAttribute(ACTION_ATTR)
  ) {
    return false;
  }

  const rect = button.getBoundingClientRect();
  const style = window.getComputedStyle(button);
  return rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    button.getAttribute("aria-disabled") !== "true";
}

function isLikelySubmitButton(button) {
  if (button.type === "submit") return true;
  return /send|submit|envoyer|arrow-up|paper-airplane/i.test(buttonLabel(button));
}

function scoreSubmitButton(button, target) {
  const rect = button.getBoundingClientRect();
  const targetRect = target?.getBoundingClientRect?.();
  const haystack = buttonLabel(button);

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

function buttonLabel(button) {
  return [
    button.type,
    button.id,
    button.className,
    button.textContent,
    button.getAttribute("aria-label"),
    button.getAttribute("title"),
    button.getAttribute("data-testid"),
  ].join(" ");
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
