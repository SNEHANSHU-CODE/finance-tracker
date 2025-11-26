const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const grpcService = require('./grpcService');

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

// Create and start the gRPC server
const server = new grpc.Server();

// Add the UserService with all implementations from grpcService
server.addService(userProto.UserService.service, grpcService);

const startServer = () => {
  const address = '0.0.0.0:50053';
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error('gRPC User Service binding error:', err);
      return;
    }
    console.log(`gRPC User Service running at ${address}`);
    server.start();
  });
};

module.exports = {
  startServer,
  server,
};