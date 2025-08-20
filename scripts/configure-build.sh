#!/bin/bash

set -e
echo 'configure-build.sh: start'

if [ "$BUILD_ENV" ]; then
  echo '>' cp .env.${BUILD_ENV} .env.local
  cp .env.${BUILD_ENV} .env.local
else
  echo 'no BUILD_ENV, skipping...'
fi
