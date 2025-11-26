const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../../protos/user.proto');
const USER_SERVICE_ADDRESS = 'localhost:50053'; // Main server address

// Load the protobuf
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Create gRPC client to connect to main server
let userServiceClient = null;

const getUserServiceClient = () => {
  if (!userServiceClient) {
    userServiceClient = new userProto.UserService(
      USER_SERVICE_ADDRESS,
      grpc.credentials.createInsecure()
    );
  }
  return userServiceClient;
};

// Helper function to promisify gRPC calls
const promisifyGrpcCall = (client, method) => {
  return (request) => {
    return new Promise((resolve, reject) => {
      client[method](request, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  };
};

// Close client connection
const closeClient = () => {
  if (userServiceClient) {
    grpc.closeClient(userServiceClient);
    userServiceClient = null;
  }
};

module.exports = {
  getUserServiceClient,
  promisifyGrpcCall,
  closeClient,
};