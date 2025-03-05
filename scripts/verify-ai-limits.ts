import { aiMonitoring } from '../src/lib/monitoring';
import { HfInference } from '@huggingface/inference';
import { setTimeout } from 'timers/promises';

const MAX_TEST_DURATION = 60000; // 1 minute
const REQUEST_INTERVAL = 7000;  // 7 seconds between requests
const MAX_REQUESTS = 8; // Maximum requests per minute
const TOTAL_TEST_REQUESTS = 12; // Try to make 12 requests to test rate limiting

async function runRateLimitTest() {
  console.log('Starting AI rate limit verification...');
  console.log(`Test parameters:
  - Max duration: ${MAX_TEST_DURATION}ms
  - Request interval: ${REQUEST_INTERVAL}ms
  - Max requests per minute: ${MAX_REQUESTS}
  - Total test requests: ${TOTAL_TEST_REQUESTS}
  `);

  const hf = new HfInference(process.env.VITE_HUGGINGFACE_API_KEY);
  const startTime = Date.now();
  let successfulRequests = 0;
  let throttledRequests = 0;
  let failedRequests = 0;

  const makeTestRequest = async (index: number) => {
    const requestStartTime = Date.now();
    try {
      if (aiMonitoring.shouldThrottleRequest()) {
        console.log(`Request ${index + 1} throttled (self-imposed rate limit)`);
        throttledRequests++;
        return;
      }

      // Make a minimal test request
      const response = await hf.textGeneration({
        model: 'mistralai/Mistral-7B-Instruct-v0.1',
        inputs: 'Test request',
        parameters: {
          max_new_tokens: 10,
          temperature: 0.7,
          do_sample: true
        }
      });

      const requestDuration = Date.now() - requestStartTime;
      console.log(`Request ${index + 1} successful (${requestDuration}ms)`);
      successfulRequests++;

      // Track metrics
      await aiMonitoring.trackRequest({
        requestType: 'challenge',
        tokensUsed: 10, // Minimal token usage for test
        responseTime: requestDuration,
        success: true
      });

    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;
      console.error(`Request ${index + 1} failed (${requestDuration}ms):`, error.message);
      failedRequests++;

      // Track failed request
      await aiMonitoring.trackRequest({
        requestType: 'challenge',
        tokensUsed: 0,
        responseTime: requestDuration,
        success: false,
        errorType: error.message
      });
    }
  };

  // Make requests with interval
  for (let i = 0; i < TOTAL_TEST_REQUESTS; i++) {
    if (Date.now() - startTime >= MAX_TEST_DURATION) {
      console.log('Test duration exceeded, stopping...');
      break;
    }

    await makeTestRequest(i);
    
    if (i < TOTAL_TEST_REQUESTS - 1) {
      await setTimeout(REQUEST_INTERVAL);
    }
  }

  // Get final metrics
  const metrics = await aiMonitoring.getPerformanceMetrics();
  const rateLimitInfo = aiMonitoring.getRateLimitMetrics();
  const tokenUsage = await aiMonitoring.getCurrentTokenUsage();

  console.log('\nTest Results:');
  console.log('=============');
  console.log(`Successful requests: ${successfulRequests}`);
  console.log(`Throttled requests: ${throttledRequests}`);
  console.log(`Failed requests: ${failedRequests}`);
  console.log(`Average response time: ${metrics.averageResponseTime}ms`);
  console.log(`Success rate: ${metrics.successRate}%`);
  console.log(`Current request count: ${rateLimitInfo.currentRequests}/${MAX_REQUESTS}`);
  console.log(`Token usage - Daily: ${tokenUsage.daily}, Monthly: ${tokenUsage.monthly}`);

  // Determine test success
  const testPassed = successfulRequests <= MAX_REQUESTS &&
                    throttledRequests > 0 &&
                    failedRequests === 0;

  if (testPassed) {
    console.log('\n✅ Rate limit verification passed!');
    process.exit(0);
  } else {
    console.error('\n❌ Rate limit verification failed!');
    console.error('Reasons:');
    if (successfulRequests > MAX_REQUESTS) {
      console.error('- Too many successful requests allowed');
    }
    if (throttledRequests === 0) {
      console.error('- No requests were throttled');
    }
    if (failedRequests > 0) {
      console.error('- Some requests failed unexpectedly');
    }
    process.exit(1);
  }
}

runRateLimitTest().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
