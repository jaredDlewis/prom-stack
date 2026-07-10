import path from 'path';
// gRPC and Proto Loader modules
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

import metricsStore from './metricsStore.js';

const NESTED_CONTAINER_NAME = process.env.NESTED_CONTAINER_NAME;

// Load the protobuf definition file
const PROTO_ROOT = path.resolve(import.meta.dirname, './proto');
const PROTO_PATH =
  'opentelemetry/proto/collector/metrics/v1/metrics_service.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  includeDirs: [PROTO_ROOT],
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const MetricsService =
  protoDescriptor.opentelemetry.proto.collector.metrics.v1.MetricsService;

function extractIdAndMemoryUsage(call) {
  const request = call.request;

  // Find the metrics with associated with the nested container
  const nestedResourceMetrics = request.resource_metrics.find((rm) => {
    const containerNameAttr = rm.resource.attributes.find(
      (attr) => attr.key === 'container.name',
    );
    return containerNameAttr.value.string_value === NESTED_CONTAINER_NAME;
  });
  // Get container id
  const containerIdAttr = nestedResourceMetrics.resource.attributes.find(
    (attr) => attr.key === 'container.id',
  );
  const id = containerIdAttr.value.string_value;
  // Get container usage metric total
  const memoryUsageMetrics =
    nestedResourceMetrics?.scope_metrics[0].metrics.find(
      (metric) => metric.name === 'container.memory.usage.total',
    );
  const memoryUsage = memoryUsageMetrics.sum.data_points[0].as_int;

  return { id, memoryUsage };
}

// Function to start and configure the gRPC server
function getServer() {
  const server = new grpc.Server();

  // Add the MetricsService service with the Export method implementation
  server.addService(MetricsService.service, {
    // Implementation of the Export RPC method
    Export: (call, callback) => {
      console.log('Received request:');
      // get and store memory usage from sibling container
      const containerMemoryUsage = extractIdAndMemoryUsage(call);
      metricsStore.upsertContainerMemoryUsage(containerMemoryUsage);
      // get memory usage from nested container(s)
      console.log(metricsStore.getContainerMemoryUsages());
      console.log('\n');
      callback(null, {});
    },
  });

  return server;
}

// Create the server
const metricsServer = getServer();
metricsServer.bindAsync(
  '0.0.0.0:4317',
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log(`Server running on port ${port}`);
  },
);
