#!/bin/bash

# Variables
PROJECT_DIR="/Users/praveenkumarsingh/Codes/myPrivate/stamper-backend"  # Replace with the path to your project directory
TAR_FILE="project.tar.gz"
REMOTE_USER="ubuntu"  # Replace with your remote server's username
REMOTE_HOST="ec2-15-207-98-129.ap-south-1.compute.amazonaws.com"  # Replace with your AWS server's IP address or hostname
REMOTE_PATH="/home/ubuntu/stamperBackend"  # Replace with the desired path on the server
PEM_FILE="/Users/praveenkumarsingh/Codes/myPrivate/stamper-backend/stamper.pem"  # Replace with the path to your .pem file

# Create a tar.gz archive of the dist, package.json, and .env files
echo "Compressing dist, package.json, and .env..."
tar -czf $TAR_FILE -C "$PROJECT_DIR" dist package.json .env

# Transfer the tar.gz archive to the remote server using scp
echo "Transferring project to server..."
scp -i $PEM_FILE $TAR_FILE $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH

# Connect to the server, decompress the archive, and clean up
echo "Connecting to server and decompressing project..."
ssh -i $PEM_FILE $REMOTE_USER@$REMOTE_HOST << EOF
  cd $REMOTE_PATH
  tar -xzf $TAR_FILE
  rm $TAR_FILE
EOF

# Clean up local tar.gz file
echo "Cleaning up..."
rm $TAR_FILE

echo "Transfer complete"
