FROM node:18.20.3-bookworm-slim

RUN apt-get update && apt-get install -y procps && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY app /app
ENV NODE_ENV=production
RUN npm install --omit=dev --legacy-peer-deps

# Make entrypoint script linux and executable
RUN sed -i -e 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

ENTRYPOINT [ "./entrypoint.sh" ]
