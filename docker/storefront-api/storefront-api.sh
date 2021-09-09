#!/bin/sh
set -e

yarn install || exit $?

if [ "$NODE_CONFIG_ENV" = 'development' ]; then
  yarn build:clean
  yarn dev
else
  yarn build
  node dist/src/index.js
fi
