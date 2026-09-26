# GPU pipelines and reactive graphics

Use this for compute, multi-pass effects or audio-reactive scenes. For concrete
materials start with the [demo recipes](recipes.md). Keep the incumbent renderer
when it can express the result; migrating WebGL to WebGPU is not itself a visual
or performance improvement.

## A render path that can be inspected

Describe each pass by input, output, dimensions and color meaning. For example:
scene/depth → optional depth effect → low-resolution bloom → scene composite →
display conversion. Noise or grain belongs before or after that conversion
according to whether it represents scene energy or a display-space treatment.
Do not silently convert output twice.

Keep an A/B bypass for expensive effects. Reuse render targets, discard obsolete
ones after resize and avoid several full-resolution blurs when one smaller pass
would have the same visible contribution. Inspect the unprocessed frame first;
an overexposed white canvas is not fixed by more post-processing.

## Host and WGSL bytes must agree

A storage particle can use this exact layout:

```wgsl
struct Particle {
  position: vec3<f32>,
  life: f32,
  velocity: vec3<f32>,
  seed: u32,
}
```

Offsets are 0, 12, 16 and 28 bytes; the struct and array stride are 32 bytes.
`vec3<f32>` has 16-byte alignment but 12-byte size. Do not extrapolate this
storage example to arbitrary uniform arrays or nested structs; calculate their
actual layout. [WGSL alignment and size](https://www.w3.org/TR/WGSL/#alignment-and-size).

```javascript
function packParticle(position, life, velocity, seed) {
  const buffer = new ArrayBuffer(32);
  const view = new DataView(buffer);
  position.forEach((value, i) => view.setFloat32(i * 4, value, true));
  view.setFloat32(12, life, true);
  velocity.forEach((value, i) => view.setFloat32(16 + i * 4, value, true));
  view.setUint32(28, seed, true);
  return buffer;
}

function dispatchGroups(count, workgroupSize) {
  return Math.ceil(count / workgroupSize);
}

function audioEnvelope(current, target, dt, attack = 0.035, release = 0.24) {
  const bounded = Math.max(0, Math.min(1, target));
  const tau = bounded > current ? attack : release;
  return bounded + (current - bounded) * Math.exp(-dt / tau);
}
```

The packer expects exactly three finite position and velocity components.
Use one preallocated buffer for a large collection; this small function is a
byte-layout example, not a per-particle-per-frame allocation strategy.

## Ping-pong simulation recipe

1. Allocate two equally sized storage buffers A and B; initialize A and create
   two bind groups representing A→B and B→A. B does not need initial data only
   if the first pass writes every logical element completely.
2. Dispatch `ceil(count / workgroupSize)` groups. Guard `id.x >= count` before
   accessing an element. Start with a modest supported group size and measure;
   a bigger group is not automatically faster.
3. Each invocation reads only the previous state for dependencies and writes
   its own complete next state. Neighbors must not read partly updated values.
4. After each completed simulation step swap read/write roles. Render the
   latest output; on a frame with no step, continue rendering the current buffer.
5. Use a fixed timestep such as 1/60 second as a starting point, a bounded
   catch-up count and a deliberate pause policy. Discard or account for excess
   wall time according to whether this is decorative or scientific work.
6. Keep state on the GPU when the renderer can consume it there. Avoid reading
   the full simulation back to the CPU simply to upload it again.

The count guard is sufficient for a kernel without group collectives. When
barriers or collective operations are present, all required invocations must
participate; mask loads/writes instead of returning divergent invocations
before a barrier. Never use a barrier as a cross-workgroup synchronization tool.

For a grid simulation, use the same ownership with two textures and explicit
edge conditions. Choose wrap, reflect, clamp or absorbing boundaries according
to the intended behavior, not merely whichever avoids an indexing error.

## Shader construction and temporal stability

Establish coordinates/camera → one readable field → normals/light → interaction
→ secondary detail. Derivative-based edge smoothing needs an appropriate stage
and control flow. Bound ray steps, noise octaves and volume samples; clamp
singular divisions. Keep seeds deterministic for comparison and rebase time
when long-running phase precision matters.

Do not add domain warping, fluid-like advection, feedback or particles solely
because the pipeline supports them. If feedback is selected, cap injected
energy and define reset behavior. If ray marching is selected, distinguish a
hit, a missed surface and exhaustion of the step budget.

## Audio as an authored input

Start playback or analysis through the platform's permitted activation path.
Use a small number of features (band energy, transient envelope, centroid or
track progress), each assigned to one deliberate visual role. The example
envelope uses fast attack and slower release in seconds, so frame subdivision
does not change the constant-target response.

Begin with emission as an affine mapping of a bounded envelope. Keep a base
light level for silence. Add displacement only after stable emission reads
well. Do not map every bin to camera motion or create microphone capture for a
visual that only needs existing playback data. Release owned audio nodes,
streams and listeners with the scene; do not close a shared application context.

## Quality and failure path

Treat drawing-buffer size as a quadratic cost. Halving width and height reduces
pixel count to one quarter, not one half; total frame cost will change less if
other work dominates. Measure CPU submission and GPU work separately where
available, then scale the expensive pass, samples, density or update rate.

Request only required adapter features and check shader/pipeline diagnostics.
Handle denied capability and resource creation failure with usable content or
a deliberate static image. On device loss, stop the obsolete loop and discard
invalid resources; recreate the device and resources only while the scene is
still owned. An intentionally destroyed scene must not resurrect itself.
[GPUDevice.lost](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost).

Test a non-multiple dispatch size, resize/DPR, pause/resume, reduced motion and
repeated entry/exit. Inspect image quality over time and report hardware and
resolution with performance figures. The examples here are construction
contracts, not a claim that this package benchmarks every GPU or native stack.
