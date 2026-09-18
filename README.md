# Vue tools and extensions for pi

This repo contains pi extensions and skills for Vue / Nuxt development. It uses [pi](https://pi.dev/) which is a minimal agentic coding tool and terminal coding harness. Why use pi? It is minimal, has a very small footprint and initial context that it sends to an LLM, hence is fast and lightweight.

This project provides a number of tools to build a Vue/Nuxt application - and is a **mini software factory** that will build a complete application from a spec!

This project is currently **BETA** so use with care! It has a minimal permissions gate (the default one built into pi itself).

## Tech Stack

The skills and workflow target the latest stable releases:

- **Vue**: 3.5.43 (Composition API, `<script setup>`)
- **Nuxt**: 4.5.2 (`app/` directory structure)
- **Nuxt UI**: 4.11.1
- **Testing**: Vitest + @nuxt/test-utils
- **State**: Pinia / `useState`

## Getting started

The extension **nuxt-workflow** will take a spec and:

analyze → architect → develop → test → review → fix → verify

Here's how to get started and build a full Nuxt application in **a few mins**

* Go to https://pi.dev/ and install pi using the instructions at the top.
* Select a model to use:
  * You'll get asked on installation to setup an env variable for major providers
  * You can get the config by going to https://pi.dev/models and selecting/searching for provider & model (note that this lists the same model multiple times by provider!)
  * You can also ask pi itself to help configure this! But be warned, it may overwrite your existing ~/.pi/agent/models.json file if you're not careful!
  * use /model within pi to select a model
* Let's build an app! Open a new terminal window and run:

```bash
mkdir tmp && cd tmp
git clone https://github.com/prpatel/pi-vue-nuxt-tools
mkdir nuxt-todo && cd nuxt-todo
pi -e ../pi-tools-vue-nuxt
```

Then in the pi session, run:

```
/nuxt-workflow "Build a todo app with a Nuxt UI dashboard, CRUD over a server API, and Pinia state"
```

or point it at a spec file:

```
/nuxt-workflow /path/to/spec.md
```

The pi agent will now start building out the Nuxt application!

The `pi -e` flag loads the extension only for this specific run of pi. You can install it as a permanent extension using the instructions below.

## Next steps

If you're a Vue developer, you already know how to start this Nuxt application, but you can just tell pi to do it! Just type this in and hit enter:

```
run the application and open a browser so I can test it
```

You can have a look at the spec while it's running to see the requirements, structure, and standards. Here's the tech stack the skills enforce:

- **Framework**: Nuxt 4.5.2 (app/ directory structure, server routes in `server/api/`)
- **Vue**: 3.5.43, Composition API only (`<script setup lang="ts">`, no Options API)
- **UI**: Nuxt UI 4.11.1 (`UButton`, `UCard`, `UModal`, ...)
- **State**: `useState` for SSR-friendly shared state, Pinia for complex global state
- **Data Fetching**: `useFetch` / `useAsyncData` (no raw client `fetch`)
- **Testing**: Vitest, @nuxt/test-utils, @vue/test-utils

Depending on the model you used, the application may need some bug fixes. You can tell pi to fix them:

```
When I click the button nothing happens. Fix it.
```

Check out the pi docs https://pi.dev/docs/latest, they are quite good... or just ask pi to help you!

If you have questions or suggestions, msg me on LinkedIn: https://www.linkedin.com/in/prpatel/

## What's included

### Extensions (2)

| Extension | Tools |
|---|---|
| **nuxt-tools** | `vue_test_runner` (run Vitest, returns exit code + output) |
| **nuxt-workflow** | `nuxt_workflow_next`, `nuxt_workflow_test_result`, `nuxt_workflow_review_result`, `nuxt_workflow_complete` + the `/nuxt-workflow` command — automated lifecycle: analyze → architect → develop → test → review → fix → verify |

### Skills (5)

| Skill | Role |
|---|---|
| **spec-analyst** | Breaks down specs into requirements, data models, and API contracts |
| **nuxt-architect** | Scaffolds Nuxt 4 projects with the `app/` directory structure, Nuxt UI, and Vitest |
| **vue-developer** | Writes idiomatic Vue 3.5 Composition API components with Nuxt UI |
| **vue-qa-engineer** | Writes Vitest / @nuxt/test-utils component and API tests |
| **vue-reviewer** | Strict code review: reactivity loss, SSR leaks, performance, security |

### MCP (1)

| Server | Purpose |
|---|---|
| **context** | Version-specific docs for installed libraries (see `mcp.json`) |

## Install

### Via git

```bash
pi install git:github.com/prpatel/pi-vue-nuxt-tools@main
```

### Try without installing

```bash
pi -e /path/to/pi-tools-vue-nuxt
```

## Usage

Once installed, the tools and skills are auto-discovered in every pi session.

### Run the automated workflow

```
/nuxt-workflow "Create a blog with markdown posts, tags, and a Nuxt UI reading view"
```

This orchestrates the full lifecycle: spec analysis → scaffolding → implementation → testing → code review → fixes → verification.

### Use individual tools

The LLM automatically uses the appropriate tools based on your requests:

- "Run the tests" → `vue_test_runner`
- "Scaffold a Nuxt project" → handled by the `nuxt-architect` skill
- "Fix the failing test" → the workflow loops back through test → fix

## Specs

Add your own spec files to `specs/` (or anywhere on disk) and pass them to the workflow:

```
/nuxt-workflow specs/my-feature.md
```

A good spec covers: functional requirements, data models, routes/pages, API contracts, and any UI standards.

## License

MIT
