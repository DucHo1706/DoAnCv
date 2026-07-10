# --- BUILD STAGE ---
FROM node:20-slim AS build
WORKDIR /app

# Copy package.json và package-lock.json để cài đặt trước dependencies (tận dụng cache)
COPY package*.json ./
RUN npm ci

# Copy toàn bộ code và build dự án
COPY . .
ENV VITE_API_URL=/api
RUN npm run build

# --- RUN STAGE ---
FROM nginx:alpine

# Copy kết quả build sang thư mục phân phối của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx hỗ trợ SPA Routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
