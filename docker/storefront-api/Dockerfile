FROM node:16-alpine

WORKDIR /var/www
EXPOSE 8080

COPY package.json ./
COPY yarn.lock ./

COPY docker/storefront-api/storefront-api.sh /usr/local/bin/storefront-api
RUN chmod +x /usr/local/bin/storefront-api

RUN apk add --no-cache \
    python3 make g++ ca-certificates \
    gcc libgcc libstdc++ linux-headers \
    vips-dev fftw-dev gcc g++ make libc6-compat \
    bash curl wget git rsync github-cli

RUN yarn global add @icmaa/config-sync

CMD ["storefront-api"]
