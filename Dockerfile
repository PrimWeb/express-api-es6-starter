# STAGE: Development
FROM node:18-alpine AS yarn

# Port to listen on
EXPOSE 8848
# Copy app and install packages
WORKDIR /app
RUN echo "nodeLinker: pnp" > .yarnrc.yml
# Set yarn >= 3.0.0
RUN yarn set version stable
RUN yarn plugin import workspace-tools

# STAGE: Development
FROM yarn AS dev
COPY . /app/
RUN yarn
# Default app commands
CMD ["yarn", "start:dev"]

# STAGE: Builder
FROM dev AS builder
RUN yarn build

# STAGE: Prod Builder
FROM yarn AS prod
COPY --from=builder /app/dist /app/dist
COPY public /app/public
COPY ["./package.json", "./yarn.lock", "./"]
RUN yarn cache clean --all
RUN yarn workspaces focus --all --production
CMD ["yarn", "start"]
