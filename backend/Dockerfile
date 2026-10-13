# ==========================================
# Stage 1: Build the Application with Maven
# ==========================================
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /build

# Copy Maven descriptor and download dependencies
COPY pom.xml ./
RUN apt-get update && apt-get install -y maven && mvn dependency:go-offline -B

# Copy application source code and compile package
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Production JRE Runtime
# ==========================================
FROM eclipse-temurin:21-jre-jammy

# Set security labels and environment
LABEL maintainer="Rishi Dubey <rd1699906@gmail.com>"
LABEL description="Hardware Shop Inventory, Sales, Billing and Customer Management System"

WORKDIR /app

# Create unprivileged application user
RUN groupadd -r spring && useradd -r -g spring spring && \
    mkdir -p /app/uploads/products && \
    chown -R spring:spring /app

# Copy executable jar from builder stage
COPY --from=builder --chown=spring:spring /build/target/hardware-shop-management-system-1.0.0.jar app.jar

# Expose HTTP port
EXPOSE 8080

# Configure volume for persistent file uploads
VOLUME ["/app/uploads"]

# Run as non-root user
USER spring:spring

# JVM performance tuning flags for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
