---
status: approved
---

# Design brief: KINETIX TWIN

## The one spatial moment
A mechanical engineering student sits at a desk. On the tabletop in front of them, two identical pucks wait in parallel lanes. The learner grabs a handle on the experimental puck and drags it from center toward the edge, choosing where the impulse will strike. They pinch Launch — both pucks fire at once with the same force. The reference puck slides straight; the experimental puck slides *and* spins. A yellow impulse arrow, a white moment-arm line, and a magenta angular-impulse vector hang in the air right on the apparatus. The learner walks around the table and sees, from any angle, exactly how the point of impact created the rotation.

## Why it belongs on glasses
- Uses: **draws in the world** (vectors and pucks sit on the table at real scale), **leaves your body free** (walk around the experiment, inspect from any side, hands free between launches)
- Why it's better than the phone or laptop version: A laptop physics sim shows the same math, but the vectors are trapped on a flat screen. On glasses the experiment lives in the learner's space — the 3D cross product (ΔL = r × J) is a real spatial arrow perpendicular to the table, not a diagram. Walking around it and seeing the relationship change perspective is the thing a screen can't do.

## Product or overlay
- Type: **product** — the virtual tabletop, pucks, and vectors are the entire experience
- What the real version would sense: nothing
- Stand-in for the preview: none needed — a virtual tabletop at real size replaces a real desk

## Where things live
- Where the user is looking during the main task: down at the tabletop, roughly arm's length away
- **Virtual tabletop:** flat surface anchored in front of the user at about (0, -18, -85) cm (default), slightly below eye level, roughly 80 cm wide × 50 cm deep (default)
- **Two pucks:** sitting on the tabletop in parallel lanes, spaced ~25 cm apart (default), ~8 cm diameter each (default). The left lane is the reference puck; the right lane is the experimental puck
- **Impact-point handle:** a bright marker on the top face of the experimental puck, constrained to slide along one radius from center to edge. MVP uses four discrete snap positions (center, ¼-radius, ½-radius, edge) as large pinchable markers
- **Experimental puck asymmetric marking:** the experimental puck must have a high-contrast asymmetric visual marking (stripe, arrow, or half-and-half color split) that makes rotation unambiguous in a single video frame
- **3D vectors:** rendered directly on/near the experimental puck — **J** (yellow, impulse direction), **r** (white, center-to-handle offset), **ΔL = r × J** (magenta, perpendicular to both). Vectors update in real time as the handle moves, before launch
- **Trajectory markers:** small dots or discs left behind both pucks at equal time intervals after launch, showing divergence
- **Angular velocity readout (ω):** one small text pill anchored near the experimental puck on the table after it stops
- **Control buttons (Launch / Reset):** on or near the front edge of the tabletop, angled toward the user (default ~−35°), big pinch targets. Not a floating screen — they sit on the furniture

## Hands and input
- **Select the impact point:** four discrete snap positions are marked on the experimental puck's top face along one radius — **center**, **¼-radius**, **½-radius**, and **edge**. Pinch any marker to select it as the impulse application point. The impulse direction is fixed and perpendicular to the radius so the angular impulse stays clear and controllable. Attempt continuous constrained dragging only after discrete selection works in Preview
- **Launch:** pinch a large Launch button on the table edge. Fires both pucks simultaneously
- **Reset:** pinch a large Reset button on the table edge. Restores both pucks to start positions, clears vectors and trajectory markers, returns the handle to center
- Targets are big and highlight when aimed at
- Voice: none

## When things show
- **Pucks and tabletop:** always visible once the Lens starts
- **Impact-point handle:** always visible on the experimental puck; draggable before launch, locked during flight
- **r and ΔL vectors:** visible in real time as the handle moves, before launch. Persist after launch until Reset
- **J vector:** appears at launch, persists until Reset
- **Trajectory markers:** appear during puck flight, persist until Reset
- **ω readout:** appears after the experimental puck stops, persists until Reset
- **Launch button:** enabled before launch, disabled during flight
- **Reset button:** enabled after both pucks stop (or after a timeout), disabled during flight (default)
- If something needs attention out of view: none — the entire experiment fits on one tabletop within the field of view

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Drag the impact-point handle from center to edge on the experimental puck, and see the **r** vector and **ΔL** arrow update in real time before launch.
2. Pinch the Launch button: both pucks fire simultaneously. The reference puck slides straight without impulse-induced spin; the experimental puck slides and visibly rotates. Both leave trajectory markers.
3. Walk around the table (WASD in preview) and inspect the persistent vectors and trails from different angles after the pucks stop. *(Manual preview check only — do not write a LEAF scenario for this criterion.)*
4. Pinch Reset: both pucks return to start, vectors and trails clear, handle returns to center. Repeat with a different offset and get a consistent result.

## Out of scope
- Extra laboratories (Lab 2, Lab 3 from the original concept)
- Friction/restitution material presets and Mode A surface-dissipation experiments
- Energy accounting, energy bar charts, or dissipation telemetry
- Dual physics worlds (use one WorldComponent unless validation proves otherwise)
- Camera-based surface recognition or ML material classification
- Custom shader graphs, waveguide optical effects, or procedural MeshBuilder ribbons
- Voice input, AI responses, or remote service calls
- Audio synthesis beyond basic launch/impact sounds (default)
- Connected Lenses or multiplayer

## Risks and open questions
- **`addForceAt` coordinate frame:** The offset parameter's coordinate space (local vs. world, center-of-mass vs. object origin) must be validated against the Lens Studio BodyComponent API before implementation. Incorrect assumptions will produce wrong spin axes.
- **Angular velocity readout:** Whether `BodyComponent.angularVelocity` is exposed and readable per-frame in the Lens scripting API needs verification. If unavailable, the ω readout is cut and the visual rotation alone carries the lesson.
- **Single-world puck isolation:** Two pucks in one WorldComponent must not collide with each other. Verify that collision filtering (layers or intangible flags) keeps the lanes independent.
- **Rotation visibility:** A uniform puck may not show rotation clearly. Visible surface markings (a stripe, a dot pattern, or an asymmetric color split) are needed so spin is obvious. The specific visual treatment is a build-time decision.
- **Mouse-as-pinch drag fidelity:** Dragging the handle along a constrained radius with the mouse-as-one-hand pinch in preview needs to feel reliable. If the interaction is too fiddly, fall back to discrete preset positions (center, ¼, ½, ¾, edge).

## Fallback behaviors
If a primary approach fails during build, use these fallbacks without asking:
- **`addForceAt` unavailable or offset coordinates wrong:** Apply a linear impulse at the center of mass for translation, then separately apply an angular velocity (`BodyComponent.angularVelocity = ...`) scaled by the chosen offset. Document the workaround.
- **`BodyComponent.angularVelocity` not readable:** Cut the ω readout entirely. The visual rotation alone carries the lesson.
- **Discrete snap positions don't register pinch reliably:** Reduce to two positions (center and edge) with oversized colliders. If that also fails, use a single toggle button that cycles through positions.
- **Collision filtering unavailable:** Offset the lanes far enough apart (50+ cm) that the pucks physically cannot reach each other. Document the workaround.
- **Trajectory marker performance issues:** Reduce marker count (every 3rd frame instead of every frame) or switch to a line renderer if available.
- **Impulse magnitude tuning:** The impulse must be strong enough to produce visible motion and spin on the flat tabletop but not launch the pucks off the table. Tuning is a build-time task.
- **Angular impulse vs. torque:** All labels and readouts must use angular impulse (ΔL = r × J) since the impulse is instantaneous (ForceMode.Impulse), not torque (τ = r × F). This is a correctness constraint, not a preference.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.
- Validate `addForceAt` offset coordinates and `BodyComponent.angularVelocity` availability before building vector rendering or the ω readout.
- Prefer pre-allocated transform-scaled primitives (cylinder + cone) for vector arrows over per-frame MeshBuilder regeneration.
- Use one Physics.WorldComponent for both pucks. Add collision filtering so the two pucks and their lanes are independent.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
