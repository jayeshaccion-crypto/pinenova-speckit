import http from "k6/http";
import { check, sleep } from "k6";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export const options = {
  stages: [
    { duration: "10s", target: 5 },
    { duration: "20s", target: 20 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<5000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const sessionId = randomString(32);
  const headers = { "Content-Type": "application/json", "x-session-id": sessionId };

  // Add product to cart
  const addRes = http.post(`${BASE_URL}/api/cart`, JSON.stringify({ productId: "prod-last-item", quantity: 1 }), { headers });
  check(addRes, { "cart add succeeded": (r) => r.status === 200 || r.status === 201 });

  // Attempt checkout
  const checkoutRes = http.post(`${BASE_URL}/api/checkout`, JSON.stringify({
    shippingAddress: { name: "Test User", line1: "123 Main St", city: "New York", state: "NY", zip: "10001" },
  }), { headers });

  check(checkoutRes, {
    "checkout accepted or rejected gracefully": (r) => r.status === 200 || r.status === 409 || r.status === 503,
  });

  sleep(1);
}
