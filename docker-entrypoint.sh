#!/bin/bash

set -e

# Function to check if SQL Server is ready
function wait_for_sql_server() {
  echo "Waiting for SQL Server to start..."
  
  until /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P $SA_PASSWORD -Q "SELECT 1" &> /dev/null; do
    echo "SQL Server is not ready yet - sleeping for 3 seconds"
    sleep 3
  done
  
  echo "SQL Server is up and running!"
}

# Wait for SQL Server to be ready
wait_for_sql_server

# Initialize and migrate the database
echo "Running database migrations..."
dotnet FurnitureDelivery.API.dll --migrate

# Start the application
echo "Starting the application..."
exec dotnet FurnitureDelivery.API.dll