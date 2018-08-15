BIN = node_modules/.bin

.PHONY: bootstrap lint test

bootstrap:
	npm install

lint:
	$(BIN)/standard

test: lint
	npm test
