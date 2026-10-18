# Diesel character — Stage 1: pose and animation

**Date:** 18 October 2026  
**Scope:** in-world Diesel avatar and character creator animation entry point.

## Changed
- services/web-client/game-source/01b-character-and-avatar.js.part: rewrote attachDieselAnimator.
- services/web-client/index.html: bumped the generated character-script revision.
- services/web-client/public/sw.js: bumped the PWA shell cache name.

## Problem addressed
- The previous fallback inferred bone type from loose name fragments and rotated local Z, which can swing arms sideways on a Mixamo skeleton.
- The previous fallback posed both shoulder and upper-arm matches, potentially applying the arm correction twice.
- The knee direction produced a forward kick, and the procedural gait was based on wall-clock time rather than movement speed.

## Stage 1 behavior
- Finds common Mixamo bone names and converts target model-space pose rotations through each bone's parent/rest orientation.
- Applies the arm-down base pose to upper-arm bones only.
- Adds a relaxed idle posture with breathing, small head/weight movement and bent elbows.
- Blends into speed-driven walk/run animation with opposing arm/leg swings, knee and foot response, hip/spine movement and a run lean.
- Uses available GLB animation clips when the asset supplies them; procedural posing runs only when there are no clips.
- Exposes the same animator through window.NRS.attachDieselAnimator for the creator and local in-world model.

## Acceptance status
- [x] Source fragment contains the new named-bone pose solver.
- [x] Character asset URL and service-worker cache version are changed so clients can fetch the updated code.
- [ ] Railway release must reach a terminal successful state.
- [ ] Manually inspect the creator preview and in-world avatar on a real phone.
- [ ] Check arm angle and sleeve/body clipping, knee bend, walking/running transition and frame performance.
- [ ] Check remote-player appearance/animation separately; this stage does not alter the remote-player model-cloning path.

A successful build or HTTP response does not prove the avatar looks correct in-game. Do not mark visual acceptance complete until the phone check is performed.

## Stage 2 handoff
Stage 2 is not started in this change. It is reserved for the next package from the project owner and will cover asset preparation such as neutral textures, eye mapping, texture-size optimization and additional hairstyle assets.
