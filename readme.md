# to build Docker image and push to docker hub
docker build -t rjonmarco/mqtt-node . && docker push rjonmarco/mqtt-node:latest

# to pull and bring up
docker compose pull && docker compose up -d

# to test current code base
npm run start