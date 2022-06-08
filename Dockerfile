FROM node:16   AS console-builder

WORKDIR /app

COPY package.json .

COPY command.sh .


RUN yarn

COPY .   .

RUN  yarn build

FROM alpine:3.13.2 AS builder

RUN apk add thttpd

RUN adduser -D static

WORKDIR /home/static

COPY --from=console-builder  /app/dist/  .
COPY --from=console-builder  /app/command.sh .

RUN chmod +x command.sh
RUN chmod ugo+w apiurl.js

USER static

ENTRYPOINT ["sh", "command.sh" ]
# Run thttpd
# CMD ["thttpd", "-D", "-h", "0.0.0.0", "-p", "8080", "-d", "/home/static", "-u", "static", "-l", "-", "-M", "60"]

# FROM node:16-alpine3.12  AS console-builder

# WORKDIR /app

# COPY package.json .

# RUN npm install

# COPY . . 

# RUN npm run build
# # Many thanks to @lipanski for his work on the original script

# FROM alpine:3.13.2 AS builder

# ARG THTTPD_VERSION=2.29

# # Install all dependencies required for compiling thttpd
# RUN apk add gcc musl-dev make

# # Download thttpd sources
# RUN wget http://www.acme.com/software/thttpd/thttpd-${THTTPD_VERSION}.tar.gz \
#     && tar xzf thttpd-${THTTPD_VERSION}.tar.gz \
#     && mv /thttpd-${THTTPD_VERSION} /thttpd

# # Compile thttpd to a static binary which we can copy around
# RUN cd /thttpd \
#     && ./configure \
#     && make CCOPT='-O2 -s -static' thttpd

# # Create a non-root user to own the files and run our server
# RUN adduser -D static

# # Switch to the scratch image
# FROM scratch


# # Copy over the user
# COPY --from=builder /etc/passwd /etc/passwd

# # Copy the thttpd static binary
# COPY --from=builder /thttpd/thttpd /

# # Use our non-root user
# USER static
# WORKDIR /home/static

# # Copy the static website
# # Use the .dockerignore file to control what ends up inside the image!
# COPY --from=console-builder /app/dist/ ./

# LABEL org.opencontainers.image.source https://github.com/infinimesh/infinimesh

# # Run thttpd
# ENTRYPOINT ["/thttpd", "-D", "-h", "0.0.0.0", "-p", "80", "-d", "/home/static", "-u", "static", "-l", "-", "-M", "60"]