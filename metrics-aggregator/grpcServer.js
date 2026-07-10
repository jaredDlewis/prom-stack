import path from 'path';
import { argv } from 'process';
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
function getGrpcServer() {
  const server = new grpc.Server();

  // Add the MetricsService service with the Export method implementation
  server.addService(MetricsService.service, {
    // Implementation of the Export RPC method
    Export: async (call, callback) => {
      console.log('gRPC server received MetricsService/Export call');
      try {
        // get and store memory usage from sibling container
        const containerMemoryUsage = extractIdAndMemoryUsage(call);
        metricsStore.upsertContainerMemoryUsage(containerMemoryUsage);
        console.log(
          'Successfully set data from sibling container',
          containerMemoryUsage,
        );
      } catch (error) {
        console.log(`Didn't get sibling container memory usage data: `, error);
      }
      // try to get and store memory usage from nested container(s)
      try {
        const nestedContainerResponse = await fetch(
          `http://${NESTED_CONTAINER_NAME}:3000/memory`,
        );
        const nestedContainerBody = await nestedContainerResponse.json();
        const nestedContainerMemoryUsages = nestedContainerBody.data;
        metricsStore.upsertContainerMemoryUsages(nestedContainerMemoryUsages);
        console.log(
          'Successfully set data from nested container:',
          nestedContainerMemoryUsages,
        );
      } catch (error) {
        console.log("Didn't get nested memory usage data: ", error);
      }
      console.log(
        'Store after update:',
        metricsStore.getContainerMemoryUsages(),
      );
      callback(null, {});
    },
  });

  return server;
}

export function startGrpcServer() {
  const metricsServer = getGrpcServer();
  metricsServer.bindAsync(
    '0.0.0.0:4317',
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error(error);
        return;
      }

      console.log(`gRPC server running on port ${port}`);
    },
  );
}

if (import.meta.filename === argv[1]) {
  startGrpcServer();
}
