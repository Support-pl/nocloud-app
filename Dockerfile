FROM node:16 AS builder

WORKDIR /app

COPY . .
RUN yarn && yarn build

FROM alpine:3.13.2

RUN apk add thttpd

RUN adduser -D static

WORKDIR /home/static

COPY --from=builder  /app/dist/  .
COPY --from=builder  /app/command.sh .

RUN chmod +x command.sh
RUN chmod ugo+w apiurl.js

USER static

ENTRYPOINT ["sh", "command.sh" ]