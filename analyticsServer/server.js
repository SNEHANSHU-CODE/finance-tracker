const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { json } = require('body-parser');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { authenticateGraphQL } = require('./middleware/auth');
const pdfRoutes = require('./routes/pdfRoutes');

// Environment variables
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`📊 Analytics Server starting in ${NODE_ENV} mode...`);

// Connect to MongoDB
connectDB();

async function startServer() {
  await connectDB();

  const app = express();
  
  // CORS Configuration
  const corsOptions = {
    origin: [
      process.env.CLIENT_URL,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'x-timezone', 'x-request-timestamp', 'x-locale'],
  };

  // Middleware
  app.use(cors(corsOptions));
  app.use(json());

  // Health check endpoint (before Apollo middleware)
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'analytics-server',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  });

  // PDF Routes
  app.use('/api/pdf', pdfRoutes);

  // Initialize Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      console.error('❌ GraphQL Error:', error.message);
      return error;
    }
  });

  await server.start();

  // Apply Apollo Middleware with authentication
  app.use(
    '/graphql',
    cors(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        try {
          // Authenticate using JWT token from Authorization header
          const { user, token } = authenticateGraphQL(req);
          
          return {
            user,
            token,
            req
          };
        } catch (error) {
          console.error('❌ Auth Error:', error.message);
          throw new Error(error.message);
        }
      },
    }),
  );

  // Start server
  const httpServer = app.listen(PORT, () => {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`🚀 Analytics Server Ready`);
    console.log(`${'═'.repeat(50)}`);
    console.log(`📊 GraphQL Endpoint: http://localhost:${PORT}/graphql`);
    console.log(`📄 PDF Service: http://localhost:${PORT}/api/pdf`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    console.log(`🗄️  Database: ${process.env.MONGO_URI}`);
    console.log(`${'═'.repeat(50)}\n`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\n⚠️  SIGTERM received. Shutting down gracefully...');
    httpServer.close(async () => {
      await mongoose.disconnect();
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});