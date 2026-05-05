.PHONY: help build test test-cover test-race lint fmt docs tools watch migrate-new

help:
	@echo "Trello Backend - Available commands:"
	@echo "  make build         - Build Go binary"
	@echo "  make test          - Run all tests"
	@echo "  make test-cover    - Run tests with coverage"
	@echo "  make lint          - Run linter"
	@echo "  make fmt           - Format code"
	@echo "  make docs          - Generate swagger docs"
	@echo "  make watch         - Hot reload (requires air)"
	@echo "  make migrate-new NAME=<name> - Create new migration"
	@echo "  make tools         - Install dev tools"

build:
	go build -o bin/server ./cmd/server

test:
	go test -v ./...

test-cover:
	go test -cover -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

test-race:
	go test -race ./...

lint:
	golangci-lint run ./...

fmt:
	go fmt ./...
	goimports -w .

docs:
	swag init -g cmd/server/main.go -o docs/swagger

watch:
	air -c .air.toml

migrate-new:
	@if [ -z "$(NAME)" ]; then echo "Usage: make migrate-new NAME=migration_name"; exit 1; fi
	goose -dir migrations create $(NAME) sql

tools:
	go install github.com/swaggo/swag/cmd/swag@latest
	go install github.com/pressly/goose/v3/cmd/goose@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install golang.org/x/tools/cmd/goimports@latest
