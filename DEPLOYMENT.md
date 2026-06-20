# CVAI AWS EC2 Deployment Guide

This guide covers deploying the CVAI v2 application to a production AWS EC2 instance using Docker Compose and Nginx.

## 1. Provision EC2 Instance
1. Launch an **Ubuntu Server 22.04 LTS** instance.
2. Select a `t3.small` or `t3.medium` instance type (Docker and React builds require some RAM).
3. **Security Groups**: Ensure the following inbound rules are open:
   - Port `22` (SSH)
   - Port `80` (HTTP)
   - Port `443` (HTTPS)

## 2. Install Dependencies
SSH into your instance and run:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git

# Start and enable Docker
sudo systemctl enable docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

## 3. Clone Repository
```bash
sudo mkdir -p /opt/cvai
sudo chown -R $USER:$USER /opt/cvai
git clone https://github.com/your-username/cvai.git /opt/cvai
cd /opt/cvai
```

## 4. Environment Variables
Create a `.env` file in `/opt/cvai`:
```bash
cp .env.example .env
nano .env
```
Fill in your `GEMINI_API_KEY`, `DB_PASSWORD`, and `SECRET_KEY`.

## 5. Run the Application
Start the application using Docker Compose. This will build the frontend React app, the backend FastAPI app, and start MySQL and Nginx.

```bash
docker-compose up -d --build
```

Verify everything is running:
```bash
docker-compose ps
```

## 6. Accessing the App
You can now access your application via the public IP of your EC2 instance:
`http://<YOUR-EC2-PUBLIC-IP>`

The Nginx container handles routing:
- `/` -> Serves the compiled React Frontend.
- `/api/`, `/auth/`, `/resume/` -> Reverse proxies to the FastAPI Backend container.

## 7. Automated CI/CD Deployment
We have provided a GitHub Actions workflow `.github/workflows/deploy.yml`.
To use it, add the following Repository Secrets to your GitHub repository:
- `EC2_HOST`: The public IP or DNS of your EC2 instance.
- `EC2_USER`: Usually `ubuntu`.
- `EC2_SSH_KEY`: The contents of your `.pem` private key file.
- `GEMINI_API_KEY`: Your Gemini API Key.
- `DB_PASSWORD`: Your MySQL root password.
- `SECRET_KEY`: A secure random string.

Every push to the `main` branch will now automatically pull the code and rebuild the containers on your server.
