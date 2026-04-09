# Sử dụng image Node.js gốc (Nên dùng phiên bản Alpine cho nhẹ)
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ src vào container
COPY . .

# Expose HTTP port
EXPOSE 3000

# Cấu hình lệnh khởi chạy (Chạy migrate xong rồi bật server)
CMD /bin/sh -c "npm run migrate && npm start"