FROM python:3.12.8-slim-bookworm

ARG MAKE_VERSION="4.3-*"
ARG BASH_VERSION="5.2.*"
ARG COREUTILS_VERSION="9.1-*"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        make=${MAKE_VERSION} \
        bash=${BASH_VERSION} \
        coreutils=${COREUTILS_VERSION} \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY infra/docker/scripts/builder-entrypoint.sh /usr/local/bin/builder-entrypoint.sh
RUN chmod +x /usr/local/bin/builder-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/builder-entrypoint.sh"]
CMD ["make", "build"]
