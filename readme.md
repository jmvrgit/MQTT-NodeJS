# to build Docker image
docker build -t rjonmarco/mqtt-node .

# push to docker hub
docker push rjonmarco/mqtt-node:latest

# to bring up 
docker compose up -d

## its broken use:
npm start