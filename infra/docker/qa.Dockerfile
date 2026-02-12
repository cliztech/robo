FROM python:3.12.8-slim-bookworm

ARG SHELLCHECK_VERSION="0.9.0-*"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        shellcheck=${SHELLCHECK_VERSION} \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    yamllint==1.35.1 \
    markdownlint-cli2==0.14.0

WORKDIR /workspace

COPY infra/docker/scripts/qa-entrypoint.sh /usr/local/bin/qa-entrypoint.sh
RUN chmod +x /usr/local/bin/qa-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/qa-entrypoint.sh"]
CMD ["make", "qa"]
