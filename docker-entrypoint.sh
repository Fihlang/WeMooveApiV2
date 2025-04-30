#!/bin/sh
set -e

# Start the .NET Core API in the background
echo "Starting .NET Core WebAPI..."
dotnet Backend/FurnitureDelivery.API/out/FurnitureDelivery.API.dll --urls "http://0.0.0.0:5001" &

# Start the Express server
echo "Starting Node.js Express server..."
node dist/index.js

# Keep the container running
# The Express server will be the main process keeping the container alive
# If it exits, the container will stop