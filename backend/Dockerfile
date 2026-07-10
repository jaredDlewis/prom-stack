FROM docker:latest
ARG WORKDIR
WORKDIR ${WORKDIR}

COPY . .

RUN chmod +x ./run-docker-compose.sh

CMD ["sh", "./run-docker-compose.sh"]