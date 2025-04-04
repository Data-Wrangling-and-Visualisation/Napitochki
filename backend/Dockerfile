FROM rust:1.86-alpine3.21 as builder

WORKDIR /usr/src/backend

RUN apk add --no-cache musl-dev gcc openssl-dev pkgconf openssl-libs-static

COPY . .
RUN cargo build --release

FROM alpine:3.21.0
RUN apk add --no-cache openssl
COPY --from=builder /usr/src/backend/target/release/backend /
COPY ./.env /
CMD [ "./backend" ]
