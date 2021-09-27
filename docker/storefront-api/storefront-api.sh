#!/bin/sh
set -e

yarn install || exit $?

if [ ! -f "./config/custom-environment-variables.json" ]; then
  config-sync -r storefront-api -d ./
fi

if [ "$NODE_CONFIG_ENV" = 'development' ]; then
  yarn build:clean
  yarn dev
else
  yarn build
  node dist/src/index.js
fi
