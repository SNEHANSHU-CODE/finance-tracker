/* now service for grpc to interact with user related operations*/

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const userService = require('../services/userService');
const PROTO_PATH = path.join(__dirname, '../../protos/user.proto');

// Load the protobuf
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const userProto = grpc.loadPackageDefinition(packageDefinition).user;
// Implement the User service methods
const userServiceImpl = {
    GetUser: async (call, callback) => {
    const userId = call.request.userId;
    try {
      const user = await userService.getUserById(userId);
        callback(null, { user });
    } catch (error) {
        callback({
        code: grpc.status.INTERNAL,
        message: error.message,
      });
    }
    }
};
// Create and start the gRPC server
const server = new grpc.Server();
server.addService(userProto.UserService.service, userServiceImpl);
const startServer = () => {
  const address = '0.0.0.0:50051';
    server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
    if (error) {
      console.error('Failed to start gRPC server:', error);
      return;
    }
    console.log(`gRPC server running at ${address}`);
    server.start();
  });
};

startServer();
