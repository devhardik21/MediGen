#!/bin/bash
set -e

echo "Updating system..."
apt-get update

echo "Installing Google Chrome..."
wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt install -y ./google-chrome-stable_current_amd64.deb
rm google-chrome-stable_current_amd64.deb

echo "Installing Puppeteer Chrome..."
npx puppeteer browsers install chrome
