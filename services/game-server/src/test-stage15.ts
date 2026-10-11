import assert from "node:assert/strict";
import {
  calculateStage15Fare,
  findStage15City,
  findStage15Route,
  stage15Cities,
  stage15Routes,
  validateStage15Travel,
  createStage15State,
  normalizeStage15State,
  recordStage15Travel,
} from "./stage15";

assert.ok(stage15Cities().length >= 7, "Stage 15 must expose additional cities");
assert.ok(findStage15City("port-harcourt"), "Port Harcourt must remain a travel hub");
assert.ok(findStage15City("aba"), "Aba must be available");
assert.ok(findStage15City("uyo"), "Uyo must be available");
assert.ok(stage15Routes().length >= 20, "Every city must have return routes, not one-way dead ends");
assert.ok(stage15Routes().every((route) => route.distanceKm > 0 && route.durationMinutes > 0));
assert.ok(stage15Routes().every((route) => findStage15City(route.fromCityId) && findStage15City(route.toCityId)));

const route = findStage15Route("ph-aba");
assert.ok(route);
assert.equal(calculateStage15Fare("ph-aba", 2), route.baseFareNaira * 2);
assert.equal(calculateStage15Fare("ph-aba", 2, "night-bus"), Math.round(route.baseFareNaira * 1.2) * 2);
assert.equal(calculateStage15Fare("ph-aba", 2, "flight"), Math.round(route.baseFareNaira * 2.5) * 2);
assert.equal(calculateStage15Fare("ph-aba", 2, "invalid" as any), 0);
assert.equal(calculateStage15Fare("ph-aba", 0), 0);
assert.equal(calculateStage15Fare("ph-aba", route.capacity + 1), 0);

const request = validateStage15Travel({
  routeId: "ph-aba",
  passengers: 2,
  requestId: "travel-test-1",
  balanceNaira: 20_000,
});
assert.ok(request);
assert.equal(request?.travelMode, "day-bus");
assert.equal(request?.fareNaira, route.baseFareNaira * 2);
const nightRequest = validateStage15Travel({
  routeId: "ph-aba", passengers: 2, requestId: "travel-night-bus", balanceNaira: 20_000, travelMode: "night-bus",
});
assert.equal(nightRequest?.fareNaira, Math.round(route.baseFareNaira * 1.2) * 2);
assert.equal(nightRequest?.travelMode, "night-bus");
const flightRequest = validateStage15Travel({
  routeId: "ph-aba", passengers: 2, requestId: "travel-flight", balanceNaira: 50_000, travelMode: "flight",
});
assert.equal(flightRequest?.fareNaira, Math.round(route.baseFareNaira * 2.5) * 2);
assert.equal(flightRequest?.durationMinutes, Math.max(30, Math.round(route.durationMinutes / 4)));
assert.equal(validateStage15Travel({ routeId: "ph-aba", passengers: 1, requestId: "bad-mode", balanceNaira: 100_000, travelMode: "train" as any }), null);
assert.equal(validateStage15Travel({ ...request!, balanceNaira: 0 }, new Set()), null);
assert.equal(validateStage15Travel({ routeId: "ph-aba", passengers: route.capacity + 1, requestId: "travel-test-2", balanceNaira: 100_000 }), null);
assert.equal(validateStage15Travel({ routeId: "ph-aba", passengers: 1, requestId: "travel-test-1", balanceNaira: 100_000 }, new Set(["travel-test-1"])), null);
assert.equal(validateStage15Travel({ routeId: "missing", passengers: 1, requestId: "travel-test-3", balanceNaira: 100_000 }), null);

console.log(`Stage 15 tests passed: ${stage15Cities().length} cities, ${stage15Routes().length} routes.`);

const committedState = recordStage15Travel(createStage15State(), request!, "account-1", 1_800_000_000_000, 11_000);
assert.ok(committedState.usedRequestIds.includes("travel-test-1"));
assert.equal(committedState.ledger[0]?.accountId, "account-1");
assert.equal(committedState.ledger[0]?.cashAfter, 11_000);
assert.equal(validateStage15Travel({ ...request!, balanceNaira: 20_000 }, new Set(committedState.usedRequestIds)), null);
assert.deepEqual(normalizeStage15State(committedState), committedState);
const oldLedger = { ...committedState.ledger[0], travelMode: undefined };
assert.equal(normalizeStage15State({ usedRequestIds: [], ledger: [oldLedger] }).ledger[0]?.travelMode, "day-bus");
assert.equal(normalizeStage15State({ usedRequestIds: ["ok", 7, ""], ledger: [{ nope: true }] }).usedRequestIds.length, 1);
