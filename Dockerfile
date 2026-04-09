# Sử dụng image Node.js gốc (Nên dùng phiên bản Alpine cho nhẹ)
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

COPY package*.json ./

# Cài đặt dependencies (cả dev vì chạy "npm run dev")
RUN npm install

# Copy toàn bộ src vào container
COPY . .

# Expose HTTP port
EXPOSE 3000

# Lệnh khởi chạy được định nghĩa bên Docker Compose
