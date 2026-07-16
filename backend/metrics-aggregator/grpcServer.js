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

function extractIdAndMetrics(call) {
  const request = call.request;

  // Find the metrics associated with the nested container
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

  // Get all container metrics
  const consolidatedMetrics = {};
  for (const metric of nestedResourceMetrics?.scope_metrics[0].metrics) {
    consolidatedMetrics[metric.name] = metric[metric.data].data_points
  }

  return { id, metrics: consolidatedMetrics };
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
        // get and store metrics from sibling container
        const containerMetrics = extractIdAndMetrics(call);
        metricsStore.upsertOneContainerMetrics(containerMetrics);
        console.log(
          'Successfully set data from sibling container'
        );
      } catch (error) {
        console.log(`Didn't get sibling container metrics: `, error);
      }
      // try to get and store metrics from nested container(s)
      try {
        const nestedContainerResponse = await fetch(
          `http://${NESTED_CONTAINER_NAME}:3000/api/metrics`,
        );
        const nestedContainerBody = await nestedContainerResponse.json();
        const nestedContainerMetrics = nestedContainerBody.data;
        metricsStore.upsertAllContainerMetrics(nestedContainerMetrics);
        console.log(
          'Successfully set data from nested container'
        );
      } catch (error) {
        console.log("Didn't get nested container(s) metrics: ", error);
      }
      fetch('http://localhost:3000/webhooks/metrics', {
        method: 'POST'
      })
      console.log(
        'Store after update:',
        metricsStore.getAllContainerMetrics(),
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
