# Stage 0: Base with Rust and Cargo Chef
FROM rust:1.86-alpine3.21 as chef
WORKDIR /usr/src/backend

# Install build dependencies
RUN apk add --no-cache \
    musl-dev gcc openssl-dev pkgconf \
    openssl-libs-static curl build-base

# Install cargo-chef
RUN cargo install cargo-chef

# Stage 1: Planner
FROM chef as planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Stage 2: Builder
FROM chef as builder
COPY --from=planner /usr/src/backend/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

# Stage 3: Runtime
FROM alpine:3.21.0 as runtime
RUN apk add --no-cache openssl
WORKDIR /usr/src/backend
COPY --from=builder /usr/src/backend/target/release/backend .
COPY .env .
CMD [ "./backend" ]
