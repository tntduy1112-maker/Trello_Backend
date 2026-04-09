#!/bin/bash
set -e

IMAGE="tntduy1112/trello_backend"
VERSION=$(node -p "require('./package.json').version")

echo "Building $IMAGE:$VERSION ..."
docker build -t "$IMAGE:$VERSION" -t "$IMAGE:latest" .

echo "Pushing $IMAGE:$VERSION ..."
docker push "$IMAGE:$VERSION"

echo "Pushing $IMAGE:latest ..."
docker push "$IMAGE:latest"

echo "Done! Released $IMAGE:$VERSION and updated :latest"
