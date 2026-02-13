FROM alpine:3.20.3

ARG CURL_VERSION="8.10.1-r0"
ARG BASH_VERSION="5.2.26-r0"

RUN apk add --no-cache \
    curl=${CURL_VERSION} \
    bash=${BASH_VERSION}

WORKDIR /workspace

COPY infra/docker/scripts/runtime-smoke.sh /usr/local/bin/runtime-smoke.sh
RUN chmod +x /usr/local/bin/runtime-smoke.sh

ENTRYPOINT ["/usr/local/bin/runtime-smoke.sh"]
