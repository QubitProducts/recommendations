BIN = node_modules/.bin

.PHONY: bootstrap lint test

bootstrap:
	npm install

lint:
	$(BIN)/eslint --ignore-path .gitignore .

test: lint
	npm test
