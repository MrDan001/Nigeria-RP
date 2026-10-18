# Diesel character — Stage 1: pose and animation (18 October 2026)

## Changed
- `services/web-client/game-source/01b-character-and-avatar.js.part`: `attachDieselAnimator` rewritten.
- `services/web-client/index.html` and `services/web-client/public/sw.js`: cache keys bumped.

## What was wrong
- Arm pose rotated local Z, which on the Mixamo rig swings arms sideways; it also rotated both `Shoulder` and `Arm`, so each arm was rotated twice.
- Knee bend had the wrong sign (foot kicked forward).
- Legs/arms used a fixed time-based cycle unrelated to speed.

## What it does now
- Bones are found by Mixamo name (`mixamorig:*`) and driven with rotations defined in model space (+Y up, +Z forward), converted to each bone's local axes, so it does not depend on bone orientation.
- Base pose lowers the arms from the T-pose (`ARM_DOWN`, radians, in the animator).
- Idle: breathing, slight head and weight shift, relaxed elbows.
- Walk/run: stride phase follows movement speed; legs, knees, feet, opposite-arm swing, hip/spine twist and run lean; smooth blend between idle and walk.
- If the GLB later contains animation clips, the clips are used and the procedural pose is skipped.
- Same function drives the creator preview and the in-world player.

## Verified
- Syntax check and game assembly pass.
- Ran the real function on Diesel's skeleton (three r128, Node): idle hands hang at the sides, knees bend backward, opposite arm/leg swing, reset returns to T-pose.

## Not verified (needs a real phone)
- Visual quality in the creator and in the live world.
- Mesh clipping (jacket sleeves against the body) at the lowered-arm angle; adjust `ARM_DOWN` if needed.
- Remote players still use `model.clone(true)` and are Stage 6 work.

## Next
Stage 2 — asset prep (neutral textures, eye mapping, smaller textures, new hairstyles). Requires user approval.
