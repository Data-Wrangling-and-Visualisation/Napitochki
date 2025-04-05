# Stage 1: Chef
FROM lukemathwalker/cargo-chef:latest-rust-1.86 as chef
WORKDIR /app
RUN apt-get update && apt-get install -y musl-dev gcc libssl-dev pkg-config

# Stage 2: Planner
FROM chef as planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# Stage 3: Builder
FROM chef as builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

# Stage 4: Intermediate
FROM alpine:3.21.0 as intermediate
RUN apk add --no-cache openssl

# Stage 5: Runtime
FROM scratch as runtime
WORKDIR /usr/src/backend
COPY --from=intermediate /usr/lib /usr/lib
COPY --from=builder /app/target/release/backend /
COPY ./.env /
CMD [ "./backend" ]
