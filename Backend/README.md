# Furniture Delivery - .NET Core API

This is the backend API for the Furniture Delivery application, a modern platform for furniture delivery management built with .NET Core.

## Features

- RESTful API with comprehensive endpoints
- WebSocket support for real-time updates
- JWT authentication and role-based authorization
- Notification services
- Data persistence with Entity Framework Core

## Technical Stack

- **.NET Core**: Backend framework
- **Entity Framework Core**: ORM for database operations
- **MS SQL Server**: Containerized database
- **WebSockets**: Real-time communication
- **JWT**: Authentication and security

## Prerequisites

- .NET SDK (6.0 or later)
- Docker and Docker Compose (for MS SQL Server)
- Visual Studio, VS Code, or other .NET-compatible IDE

## Getting Started

### Installation

1. Extract the zip file to your desired location
2. Navigate to the extracted directory

### Database Setup

The application uses a containerized MS SQL Server for easy deployment on any platform, including macOS.

1. Start the SQL Server container:

```bash
docker-compose up -d
```

2. Update database connection string in `appsettings.json` if needed:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost,1433;Database=FurnitureDelivery;User Id=sa;Password=yourStrongPassword123!;TrustServerCertificate=True;"
}
```

### Running the API

1. Navigate to the API project directory:

```bash
cd FurnitureDelivery.API
```

2. Run the application:

```bash
dotnet run
```

The API will be available at `https://localhost:5001/` and `http://localhost:5000/`.

### Publishing for Production

To publish the application for production:

```bash
dotnet publish -c Release -o ./publish
```

## Project Structure

- `Controllers`: API endpoints
- `Models`: Domain models
- `DTOs`: Data transfer objects
- `Services`: Business logic and services
- `Data`: Database context and migrations

## API Documentation

Once the API is running, Swagger documentation is available at:

```
https://localhost:5001/swagger
```

## WebSocket Support

The API includes a WebSocket server for real-time updates on:

- Delivery status changes
- Driver location updates
- Chat messages
- Notifications

Connect to the WebSocket server at:

```
ws://localhost:5000/ws
```

## Docker Support

The project includes Docker support for easy deployment. 

### Building the Docker Image

```bash
docker build -t furniture-delivery-api .
```

### Running with Docker Compose

```bash
docker-compose up
```

## License

This project is proprietary and confidential.