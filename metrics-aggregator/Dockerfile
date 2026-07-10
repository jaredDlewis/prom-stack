FROM node:24.18.0
ARG WORKDIR
WORKDIR ${WORKDIR}

# Install dependencies as a separate step to take advantage of Docker's
# caching. Leverage a cache mount to /root/.npm to speed up subsequent
# builds. Leverage a bind mount to package.json to avoid having to copy
# it into this layer.
# Once you create a package-lock.json by running npm install locally, switch to npm ci and bind both files:
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    npm ci

COPY . .

EXPOSE 4317 3000

CMD ["npm", "run", "start"]