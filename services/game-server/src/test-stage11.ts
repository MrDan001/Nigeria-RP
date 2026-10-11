import assert from "node:assert/strict";
import {
  STAGE11_BUSINESSES,
  STAGE11_SERVICES,
  STAGE11_FUEL_PRICE_PER_LITRE,
  createStage11State,
  registerStage11Property,
  registerStage11Vehicle,
  buyStage11Fuel,
  openStage11ServiceOrder,
  assignStage11ServiceOrder,
  completeStage11ServiceOrder,
  openStage11RepairCall,
  assignStage11RepairCall,
  completeStage11RepairCall,
  payStage11UtilityBill,
  openStage11CourierDelivery,
  assignStage11CourierDelivery,
  pickupStage11CourierDelivery,
  completeStage11CourierDelivery,
  type Stage11Actor,
  type Stage11Property,
} from "./stage11";

const now = 1_790_000_000_000;
const business = (id: string) => STAGE11_BUSINESSES.find((item) => item.id === id)!;
const actor = (workplaceId: string, actorId: string, rank = 2, x?: number, z?: number): Stage11Actor => {
  const place = business(workplaceId);
  return { actorId, workplaceId, rank, onDuty: true, uniform: true, x: x ?? place.x, z: z ?? place.z };
};
const propertyFixture = (): Stage11Property => ({
  id: "home-101",
  ownerId: "owner-1",
  residentIds: ["tenant-1"],
  x: 20,
  z: 20,
  bills: {
    electricity: { amountDue: 8500, paidAt: null },
    water: { amountDue: 4200, paidAt: null },
    waste: { amountDue: 1000, paidAt: null },
  },
  issues: [],
});

{
  const state = createStage11State();
  assert.equal(STAGE11_BUSINESSES.length, 7);
  assert.equal(STAGE11_SERVICES.length, 4);
  const station = business("filling-station-main");
  assert.equal(registerStage11Vehicle(state, {
    id: "car-1", ownerId: "citizen-1", x: station.x, z: station.z,
    fuelLitres: 20, fuelCapacityLitres: 60, condition: 75, cleanliness: 40,
  }), true);
  const stockBefore = state.fuelStockLitres[station.id];
  const purchase = buyStage11Fuel({
    state, requestId: "fuel-001", customerId: "citizen-1", vehicleId: "car-1",
    litres: 10, customerCash: 20000, actor: actor(station.id, "attendant-1"), now,
  });
  assert.equal(purchase.ok, true);
  if (purchase.ok) {
    assert.equal(purchase.result.total, 10 * STAGE11_FUEL_PRICE_PER_LITRE);
    assert.equal(purchase.result.fuelRemaining, 30);
  }
  assert.equal(state.fuelStockLitres[station.id], stockBefore - 10);
  assert.equal(state.ledger[0].kind, "fuel");
  assert.equal(buyStage11Fuel({
    state, requestId: "fuel-001", customerId: "citizen-1", vehicleId: "car-1",
    litres: 1, customerCash: 20000, actor: actor(station.id, "attendant-1"), now: now + 1,
  }).ok, false);
  assert.equal(buyStage11Fuel({
    state, requestId: "fuel-wrong-owner", customerId: "citizen-2", vehicleId: "car-1",
    litres: 1, customerCash: 20000, actor: actor(station.id, "attendant-1"), now: now + 2,
  }).ok, false);
}

{
  const state = createStage11State();
  const workshop = business("mechanic-main");
  registerStage11Vehicle(state, {
    id: "car-repair", ownerId: "citizen-2", x: workshop.x, z: workshop.z,
    fuelLitres: 12, fuelCapacityLitres: 55, condition: 35, cleanliness: 20,
  });
  const opened = openStage11ServiceOrder({
    state, requestId: "repair-order-1", customerId: "citizen-2",
    serviceId: "engine-repair", targetVehicleId: "car-repair", now,
  });
  assert.equal(opened.ok, true);
  if (!opened.ok) throw new Error("Expected service order to open");
  const boss = actor(workshop.id, "workshop-boss", 6);
  const assigned = assignStage11ServiceOrder({
    state, orderId: opened.result.id, supervisor: boss,
    assignee: { actorId: "mechanic-1", workplaceId: workshop.id, rank: 2 },
  });
  assert.equal(assigned.ok, true);
  assert.equal(completeStage11ServiceOrder({
    state, orderId: opened.result.id, customerCash: 20000,
    actor: actor(workshop.id, "impostor", 2), now: now + 1,
  }).ok, false);
  const completed = completeStage11ServiceOrder({
    state, orderId: opened.result.id, customerCash: 20000,
    actor: actor(workshop.id, "mechanic-1", 2), now: now + 2,
  });
  assert.equal(completed.ok, true);
  assert.equal(state.vehicles["car-repair"].condition, 100);
  assert.equal(state.serviceOrders[0].status, "completed");
  assert.equal(state.ledger.length, 1);
  assert.equal(completeStage11ServiceOrder({
    state, orderId: opened.result.id, customerCash: 20000,
    actor: actor(workshop.id, "mechanic-1", 2), now: now + 3,
  }).ok, false);
}

{
  const state = createStage11State();
  const property = propertyFixture();
  registerStage11Property(state, property);
  const opened = openStage11RepairCall({
    state, requestId: "repair-call-1", customerId: "tenant-1", propertyId: property.id,
    kind: "electrical", description: "Power socket is not working", now,
  });
  assert.equal(opened.ok, true);
  if (!opened.ok) throw new Error("Expected repair call to open");
  const electrical = business("electrician-services-main");
  assert.equal(assignStage11RepairCall({
    state, callId: opened.result.id, supervisor: actor(electrical.id, "dispatcher", 6),
    assignee: { actorId: "electrician-1", workplaceId: electrical.id, rank: 2 },
  }).ok, true);
  assert.equal(completeStage11RepairCall({
    state, callId: opened.result.id, customerCash: 30000,
    actor: actor(electrical.id, "electrician-1", 2, property.x + 90, property.z + 90), now: now + 1,
  }).ok, false);
  const finished = completeStage11RepairCall({
    state, callId: opened.result.id, customerCash: 30000,
    actor: actor(electrical.id, "electrician-1", 2, property.x, property.z), now: now + 2,
  });
  assert.equal(finished.ok, true);
  assert.equal(state.properties[property.id].issues[0].status, "resolved");
  assert.equal(state.repairCalls[0].status, "completed");
  assert.equal(state.ledger[0].kind, "repair");
  assert.equal(openStage11RepairCall({
    state, requestId: "unauthorized-call", customerId: "stranger", propertyId: property.id,
    kind: "plumbing", description: "Leaking sink", now: now + 3,
  }).ok, false);
}

{
  const state = createStage11State();
  const property = propertyFixture();
  registerStage11Property(state, property);
  const payment = payStage11UtilityBill({
    state, requestId: "water-bill-1", customerId: "tenant-1", propertyId: property.id,
    utility: "water", customerCash: 4200, now,
  });
  assert.equal(payment.ok, true);
  assert.equal(state.properties[property.id].bills.water.amountDue, 0);
  assert.equal(state.properties[property.id].bills.water.paidAt, now);
  assert.equal(state.utilityPayments[0].amount, 4200);
  assert.equal(payStage11UtilityBill({
    state, requestId: "water-bill-1", customerId: "tenant-1", propertyId: property.id,
    utility: "water", customerCash: 4200, now: now + 1,
  }).ok, false);
  assert.equal(payStage11UtilityBill({
    state, requestId: "stranger-payment", customerId: "stranger", propertyId: property.id,
    utility: "electricity", customerCash: 10000, now: now + 2,
  }).ok, false);
}

{
  const state = createStage11State();
  const hub = business("courier-hub-main");
  const dropoffX = hub.x + 30;
  const dropoffZ = hub.z + 20;
  const opened = openStage11CourierDelivery({
    state, requestId: "parcel-001", customerId: "citizen-3",
    recipientName: "Ada", parcelDescription: "Sealed document",
    dropoffX, dropoffZ, now,
  });
  assert.equal(opened.ok, true);
  if (!opened.ok) throw new Error("Expected courier delivery to open");
  assert.equal(assignStage11CourierDelivery({
    state, deliveryId: opened.result.id, supervisor: actor(hub.id, "dispatch-boss", 6),
    assignee: { actorId: "courier-1", workplaceId: hub.id, rank: 2 },
  }).ok, true);
  const courier = actor(hub.id, "courier-1", 2);
  assert.equal(pickupStage11CourierDelivery({
    state, deliveryId: opened.result.id, actor: courier, now: now + 1,
  }).ok, true);
  assert.equal(completeStage11CourierDelivery({
    state, deliveryId: opened.result.id, customerCash: 20000, actor: courier, now: now + 2,
  }).ok, false);
  courier.x = dropoffX;
  courier.z = dropoffZ;
  const delivered = completeStage11CourierDelivery({
    state, deliveryId: opened.result.id, customerCash: 20000, actor: courier, now: now + 3,
  });
  assert.equal(delivered.ok, true);
  assert.equal(state.deliveries[0].status, "delivered");
  assert.equal(state.ledger[0].kind, "courier");
}

console.log("Stage 11 tests passed: fuel, assigned vehicle service, property repairs, utility payment and courier delivery.");
