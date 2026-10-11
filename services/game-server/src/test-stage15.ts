import assert from "node:assert/strict";
import {
  calculateStage15Fare,
  findStage15City,
  findStage15Route,
  stage15Cities,
  stage15Routes,
  validateStage15Travel,
} from "./stage15";

assert.ok(stage15Cities().length >= 7, "Stage 15 must expose additional cities");
assert.ok(findStage15City("port-harcourt"), "Port Harcourt must remain a travel hub");
assert.ok(findStage15City("aba"), "Aba must be available");
assert.ok(findStage15City("uyo"), "Uyo must be available");
assert.ok(stage15Routes().every((route) => route.distanceKm > 0 && route.durationMinutes > 0));
assert.ok(stage15Routes().every((route) => findStage15City(route.fromCityId) && findStage15City(route.toCityId)));

const route = findStage15Route("ph-aba");
assert.ok(route);
assert.equal(calculateStage15Fare("ph-aba", 2), route.baseFareNaira * 2);
assert.equal(calculateStage15Fare("ph-aba", 0), 0);
assert.equal(calculateStage15Fare("ph-aba", route.capacity + 1), 0);

const request = validateStage15Travel({
  routeId: "ph-aba",
  passengers: 2,
  requestId: "travel-test-1",
  balanceNaira: 20_000,
});
assert.ok(request);
assert.equal(request?.fareNaira, route.baseFareNaira * 2);
assert.equal(validateStage15Travel({ ...request!, balanceNaira: 0 }, new Set()), null);
assert.equal(validateStage15Travel({ routeId: "ph-aba", passengers: route.capacity + 1, requestId: "travel-test-2", balanceNaira: 100_000 }), null);
assert.equal(validateStage15Travel({ routeId: "ph-aba", passengers: 1, requestId: "travel-test-1", balanceNaira: 100_000 }, new Set(["travel-test-1"])), null);
assert.equal(validateStage15Travel({ routeId: "missing", passengers: 1, requestId: "travel-test-3", balanceNaira: 100_000 }), null);

console.log(`Stage 15 tests passed: ${stage15Cities().length} cities, ${stage15Routes().length} routes.`);
