import assert from "node:assert/strict";
import { createStage10State, STAGE10_BUSINESSES, STAGE10_PRODUCTS, STAGE10_SERVICES, settleStage10Sale, completeStage10Service, type Stage10Actor } from "./stage10";

const now = 1_760_000_000_000;
const worker = (businessId: string, rank = 2, x?: number, z?: number): Stage10Actor => {
  const business = STAGE10_BUSINESSES.find(item => item.id === businessId)!;
  return { actorId: "worker-1", workplaceId: businessId, rank, onDuty: true, uniform: true, x: x ?? business.x, z: z ?? business.z };
};

{
  const state = createStage10State();
  const product = STAGE10_PRODUCTS.find(item => item.id === "mama-jollof")!;
  const before = state.products[product.id].stock;
  const result = settleStage10Sale({ state, requestId: "order-1", customerId: "customer-1", businessId: product.businessId, productId: product.id, quantity: 2, customerCash: 10000, actor: worker(product.businessId), now });
  assert.equal(result.ok, true);
  assert.equal(state.products[product.id].stock, before - 2);
  assert.equal(state.orders.length, 1);
  assert.equal(state.ledger[0].amount, 5000);
  const replay = settleStage10Sale({ state, requestId: "order-1", customerId: "customer-1", businessId: product.businessId, productId: product.id, quantity: 1, customerCash: 10000, actor: worker(product.businessId), now: now + 1 });
  assert.equal(replay.ok, false);
}

{
  const state = createStage10State();
  const product = STAGE10_PRODUCTS.find(item => item.id === "super-rice")!;
  const result = settleStage10Sale({ state, requestId: "bad-location", customerId: "c", businessId: product.businessId, productId: product.id, quantity: 1, customerCash: 50000, actor: worker(product.businessId, 2, 999, 999), now });
  assert.equal(result.ok, false);
  const offDuty = worker(product.businessId); offDuty.onDuty = false;
  const result2 = settleStage10Sale({ state, requestId: "off-duty", customerId: "c", businessId: product.businessId, productId: product.id, quantity: 1, customerCash: 50000, actor: offDuty, now });
  assert.equal(result2.ok, false);
  const result3 = settleStage10Sale({ state, requestId: "no-cash", customerId: "c", businessId: product.businessId, productId: product.id, quantity: 1, customerCash: 100, actor: worker(product.businessId), now });
  assert.equal(result3.ok, false);
}

{
  const state = createStage10State();
  const service = STAGE10_SERVICES.find(item => item.id === "phone-screen-repair")!;
  const result = completeStage10Service({ state, requestId: "repair-1", customerId: "customer-2", businessId: service.businessId, serviceId: service.id, customerCash: service.price, actor: worker(service.businessId, 2), now });
  assert.equal(result.ok, true);
  assert.equal(state.services.length, 1);
  const lowRank = completeStage10Service({ state, requestId: "repair-low", customerId: "customer-2", businessId: service.businessId, serviceId: service.id, customerCash: service.price, actor: worker(service.businessId, 1), now });
  assert.equal(lowRank.ok, false);
}

console.log(`Stage 10 tests passed: ${STAGE10_BUSINESSES.length} businesses, ${STAGE10_PRODUCTS.length} sale products, ${STAGE10_SERVICES.length} repair/tailor services.`);
