# Build stage
FROM golang:1.21-alpine AS builder

# Set working directory
WORKDIR /app

# Install git and wget (needed for go mod download and health check)
RUN apk add --no-cache git wget

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Create app directory
WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/main .

# Copy Swagger documentation
COPY --from=builder /app/docs /root/docs

# Create data directory for Genji database
RUN mkdir -p /root/data

# Expose port
EXPOSE 2544

# Set environment variables
ENV GIN_MODE=release
ENV PORT=2544

# Run the application
CMD ["./main"]
