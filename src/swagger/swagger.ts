import userRoute from "./userRoute.json";
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "User Management App API Documentation",
    version: "1.0.0",
    description: "API documentation for the todo app",
    contact: {
      email: "zeeshan.75way@gmail.com",
    },
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Development server",
    },
  ],
  paths: {
    ...userRoute,

  },
};

export default swaggerDocument;
