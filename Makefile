.PHONY: init lint test test-build build acceptance check actions-lock-extension lock-actions

# Pinned, so every clone generates the lockfile with the same version.
ACTIONS_LOCK_VERSION := v0.4.1

node_modules: package-lock.json
	npm ci
	touch node_modules

init: node_modules actions-lock-extension
	git config core.hooksPath .githooks
	npm run install:browsers

lint: node_modules
	npm run lint

test: node_modules
	npm test

test-build: node_modules
	npm run test:build

build: node_modules
	npm run build

acceptance: build
	npm run test:acceptance

check: lint test test-build acceptance

actions-lock-extension:
	gh extension list | grep -q github/gh-actions-lock || gh extension install github/gh-actions-lock --pin $(ACTIONS_LOCK_VERSION)

# Rerun after adding a workflow or changing any `uses:`, and review the actions.lock diff.
lock-actions: actions-lock-extension
	gh actions-lock
