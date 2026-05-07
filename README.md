# Quick Actions

Quick Actions is a Codex++ tweak that adds customizable workflow actions to Codex's Git panel.

Each action opens a new Codex conversation and sends the prompt you configured. It also keeps a right-edge fallback for Codex's Thread Summary Panel when Codex does not render the native panel on fresh project threads.

## Features

- Add custom actions to the Git panel
- Configure each action's title, prompt, and icon
- Reorder, edit, delete, and reset actions from Codex++ settings
- Persist actions through Codex++ tweak storage
- Built-in defaults for Git pull, multi-commit push, and code review

## Install

Clone this repository into your Codex++ tweaks directory:

```sh
cd "$HOME/Library/Application Support/codex-plusplus/tweaks"
git clone https://github.com/ImSakushi/codex-plusplus-quick-actions.git quick-actions
```

Then enable **Quick Actions** from Codex++ Tweaks.

## Configure

Open Codex settings, go to **Quick Actions**, then add or edit actions. Actions without a prompt stay in settings but are not shown in the Git panel.
