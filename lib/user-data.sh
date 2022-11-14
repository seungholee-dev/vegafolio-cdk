#!/bin/bash
sudo apt update
sudo apt upgrade

# Install nginx
sudo apt --yes install nginx

# Install Node, (NPM -> Included in nodejs)
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# NGINX Settings
cat > /etc/nginx/sites-available/default <<EOF
server {
    listen 80 default;
    listen [::]:80 default;

    server_name app.vegafolio.com;

    location / {
        proxy_pass http://localhost:3000;
    }
}

EOF

# Install Let's Encrypt client & Obtain SSL certficiate
sudo apt install -y certbot
sudo apt install -y python3-certbot-nginx
sudo nginx -t && sudo nginx -s reload
sudo certbot run -n --nginx --agree-tos -d app.vegafolio.com -m seungholee@vegafolio.com --redirect


# Install pm2 
sudo npm install -g pm2

# Install Code Deploy Agent
sudo apt -y install ruby-full
sudo apt -y install wget
cd /home/ubuntu
sudo wget https://aws-codedeploy-us-west-1.s3.us-west-1.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto