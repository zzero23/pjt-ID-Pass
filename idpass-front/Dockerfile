FROM node:20-alpine as build-stage
WORKDIR /app

# 빌드 시점에 환경 변수를 받기 위한 ARG 설정
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_URL

# ARG 값을 환경 변수(ENV)로 전환 (Vite가 빌드할 때 읽을 수 있게 함)
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
RUN npm install axios
COPY . .

# 이제 이 과정에서 실제 ID 값이 주입된 채로 빌드됨
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]