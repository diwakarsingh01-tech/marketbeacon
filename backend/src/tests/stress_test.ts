
import axios from 'axios';

const BASE_URL = 'http://localhost:3001';
const CONCURRENCY = 500; // Simulated concurrent users
const TOTAL_REQUESTS = 10000; // Total request volume for the test

async function runStressTest() {
  console.log("====================================================");
  console.log("   🚀 MARKETBEACON 30K STRESS TEST SIMULATOR");
  console.log("====================================================\n");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Concurrency: ${CONCURRENCY} connections`);
  console.log(`Total Requests: ${TOTAL_REQUESTS}`);
  console.log("----------------------------------------------------\n");

  let completed = 0;
  let success = 0;
  let failed = 0;
  let rateLimited = 0;
  const latencies: number[] = [];

  const start = Date.now();

  const sendRequest = async () => {
    const requestStart = Date.now();
    try {
      // Simulate random endpoint hit (Audit or Public Analysis)
      const endpoint = Math.random() > 0.5 ? '/api/health' : '/api/public/analysis/RELAXO';
      await axios.get(`${BASE_URL}${endpoint}`);
      success++;
    } catch (e: any) {
      if (e.response?.status === 429) {
        rateLimited++;
      } else {
        failed++;
      }
    } finally {
      latencies.push(Date.now() - requestStart);
      completed++;
    }
  };

  // Run in batches to simulate concurrency
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
    const batch = Array(Math.min(CONCURRENCY, TOTAL_REQUESTS - i)).fill(null).map(() => sendRequest());
    await Promise.all(batch);
    
    // Status Update
    const mem = process.memoryUsage().heapUsed / 1024 / 1024;
    process.stdout.write(`\rProgress: ${completed}/${TOTAL_REQUESTS} | Success: ${success} | RateLimit: ${rateLimited} | Failed: ${failed} | Mem: ${mem.toFixed(1)}MB`);
  }

  const duration = (Date.now() - start) / 1000;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const rps = TOTAL_REQUESTS / duration;

  console.log("\n\n====================================================");
  console.log("   📈 STRESS TEST FINAL REPORT");
  console.log("====================================================");
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  console.log(`Requests Per Second: ${rps.toFixed(1)}`);
  console.log(`Avg Latency: ${avgLatency.toFixed(1)}ms`);
  console.log(`Rate Limited (429): ${rateLimited}`);
  console.log(`System Errors: ${failed}`);
  console.log(`Error Rate (System): ${((failed / TOTAL_REQUESTS) * 100).toFixed(2)}%`);
  console.log(`Final Heap: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB`);
  
  if (failed > 0) {
    console.log("❌ FAIL: System dropped connections under load.");
  } else if (avgLatency > 500) {
    console.log("⚠️ WARNING: High latency detected. Scaling recommended.");
  } else {
    console.log("✅ PASS: System stable for institutional load.");
  }
  console.log("====================================================\n");
}

runStressTest();
