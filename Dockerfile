FROM node:16-alpine3.12 AS ui-builder

WORKDIR /app

COPY . .
RUN yarn && yarn build

FROM golang:1.19-alpine as server-builder

RUN apk add upx
COPY go.mod go.sum main.go /go/src/github.com/support-pl/nocloud-app/
WORKDIR /go/src/github.com/support-pl/nocloud-app

RUN CGO_ENABLED=0 go build -ldflags="-s -w" -buildvcs=false -o app
RUN upx app

FROM alpine

COPY --from=ui-builder /app/dist/ /dist
COPY --from=server-builder /go/src/github.com/support-pl/nocloud-app/app /app

LABEL org.opencontainers.image.source https://github.com/support-pl/nocloud-app
LABEL nocloud.update "true"

ENTRYPOINT ["/app" ]
