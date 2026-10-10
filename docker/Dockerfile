# NarraReel: web app + CLI in one image.
#   docker build -f docker/Dockerfile -t narrareel .
#   docker run -p 8765:8765 -v narrareel-data:/data narrareel
# The log prints a link with an access token; open it in your browser.

# --- 1. build the web app -------------------------------------------------------------------
FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- 2. the Python app ----------------------------------------------------------------------
FROM python:3.12-slim AS app

# ffmpeg (with libass) renders the video; espeak-ng is needed by the offline voices.
# Both are GPL-licensed and stay separate programs (see THIRD_PARTY_LICENSES.md).
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg espeak-ng libsndfile1 \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml README.md LICENSE THIRD_PARTY_LICENSES.md ./
COPY narrareel ./narrareel
COPY --from=web /web/dist ./narrareel/server/static
RUN pip install --no-cache-dir ".[server,offline,align]"

# Licence texts and sources for the GPL components bundled in this image.
RUN mkdir -p /usr/share/doc/narrareel-licenses \
 && cp /usr/share/doc/espeak-ng/copyright /usr/share/doc/narrareel-licenses/espeak-ng.copyright \
 && cp /usr/share/doc/ffmpeg/copyright /usr/share/doc/narrareel-licenses/ffmpeg.copyright \
 && echo "Sources: https://github.com/espeak-ng/espeak-ng , https://ffmpeg.org/download.html , https://github.com/bootphon/phonemizer" \
    > /usr/share/doc/narrareel-licenses/SOURCES.txt

ENV NARRAREEL_HOME=/data \
    NARRAREEL_PORT=8765 \
    PYTHONUNBUFFERED=1
VOLUME /data
EXPOSE 8765

# The server refuses to listen beyond localhost without a token, so make one if none is given.
CMD ["sh", "-c", "export NARRAREEL_TOKEN=${NARRAREEL_TOKEN:-$(python -c 'import secrets; print(secrets.token_urlsafe(12))')}; echo \"NarraReel: open http://localhost:${NARRAREEL_PORT}/?token=${NARRAREEL_TOKEN}\"; exec narrareel serve --host 0.0.0.0"]
