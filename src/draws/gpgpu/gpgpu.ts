import { Utilities } from "../../utilities";
import vertexUpdate from "./vertex-update.glsl";
import vertexDraw from "./vertex-draw.glsl";
import fragmentDraw from "./fragment-draw.glsl";
import fragmentUpdate from "./fragment-update.glsl";

export class GpGPU {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  readonly setup = () => {
    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    const vertexUpdateShader = Utilities.WebGL.Setup.compileShader(gl, "vertex", vertexUpdate);
    const vertexDrawShader = Utilities.WebGL.Setup.compileShader(gl, "vertex", vertexDraw);
    const fragmentUpdateShader = Utilities.WebGL.Setup.compileShader(gl, "fragment", fragmentUpdate);
    const fragmentDrawShader = Utilities.WebGL.Setup.compileShader(gl, "fragment", fragmentDraw);

    const updateProgram = Utilities.WebGL.Setup.linkTransformFeedbackProgram(
      gl,
      vertexUpdateShader,
      fragmentUpdateShader,
      ["newPosition"],
      "separate",
    );

    const drawProgram = Utilities.WebGL.Setup.linkProgram(gl, vertexDrawShader, fragmentDrawShader);

    Utilities.WebGL.Canvas.resizeCanvasToDisplaySize(this.canvas);

    this.main(gl, updateProgram, drawProgram);
  };

  private readonly main = (gl: WebGL2RenderingContext, updateProgram: WebGLProgram, drawProgram: WebGLProgram) => {
    // --- Locations ---

    const updateProgramLocations = {
      oldPosition: gl.getAttribLocation(updateProgram, "oldPosition"),
      velocity: gl.getAttribLocation(updateProgram, "velocity"),
      deltaTime: gl.getUniformLocation(updateProgram, "deltaTime"),
      canvasDimensions: gl.getUniformLocation(updateProgram, "canvasDimensions"),
    };

    const drawProgramLocations = {
      position: gl.getAttribLocation(drawProgram, "position"),
    };

    // --- Data ---

    const particlesCount = 10000;
    const positions = new Float32Array(new Array(particlesCount * 2).fill(0).map(() => Utilities.Random.range(-1, 1)));
    const velocities = new Float32Array(
      new Array(particlesCount * 2).fill(0).map(() => Utilities.Random.range(0, 0.1)),
    );

    // --- Buffers ---

    const positionBuffer1 = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer1);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

    const positionBuffer2 = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

    const velocityBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.DYNAMIC_DRAW);

    // --- Vertex Array Objects ---

    // update position VAO 1
    const updateVA1 = gl.createVertexArray();
    gl.bindVertexArray(updateVA1);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer1); // 1
    gl.enableVertexAttribArray(updateProgramLocations.oldPosition);
    gl.vertexAttribPointer(updateProgramLocations.oldPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
    gl.enableVertexAttribArray(updateProgramLocations.velocity);
    gl.vertexAttribPointer(updateProgramLocations.velocity, 2, gl.FLOAT, false, 0, 0);

    // update position VAO 2
    const updateVA2 = gl.createVertexArray();
    gl.bindVertexArray(updateVA2);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2); // 2
    gl.enableVertexAttribArray(updateProgramLocations.oldPosition);
    gl.vertexAttribPointer(updateProgramLocations.oldPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
    gl.enableVertexAttribArray(updateProgramLocations.velocity);
    gl.vertexAttribPointer(updateProgramLocations.velocity, 2, gl.FLOAT, false, 0, 0);

    // draw VAO 1
    const drawVA1 = gl.createVertexArray();
    gl.bindVertexArray(drawVA1);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer1); // 1
    gl.enableVertexAttribArray(drawProgramLocations.position);
    gl.vertexAttribPointer(drawProgramLocations.position, 2, gl.FLOAT, false, 0, 0);

    // draw VAO 2
    const drawVA2 = gl.createVertexArray();
    gl.bindVertexArray(drawVA2);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2); // 2
    gl.enableVertexAttribArray(drawProgramLocations.position);
    gl.vertexAttribPointer(drawProgramLocations.position, 2, gl.FLOAT, false, 0, 0);

    // --- Transform Feedback ---

    const tf1 = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf1); // 1
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, positionBuffer1); // 1

    const tf2 = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf2); // 2
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, positionBuffer2); // 2

    // --- Unbind leftovers ---

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

    // --- Swaps ---

    let current = {
      updateVA: updateVA1, // Read from position1.
      tf: tf2, // Write to position2.
      drawVA: drawVA2, // Draw with position2.
    };

    let next = {
      updateVA: updateVA2, // Read from position2.
      tf: tf1, // Write to position 1.
      drawVA: drawVA1, // Draw with position 1.
    };

    // --- Render ---

    let timeThen: number = 0;

    const render = (timeNow: number) => {
      timeNow *= 0.001;
      const deltaTime: number = timeNow - timeThen;
      timeThen = timeNow;

      // --- Compute ---

      // Compute the new positions.
      gl.useProgram(updateProgram);
      gl.bindVertexArray(current.updateVA);
      gl.uniform2f(updateProgramLocations.canvasDimensions, gl.canvas.width, gl.canvas.height); // out of render?
      gl.uniform1f(updateProgramLocations.deltaTime, deltaTime);

      // Turn off the fragment shader.
      gl.enable(gl.RASTERIZER_DISCARD);

      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.tf);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, particlesCount);
      gl.endTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

      // Turn on using fragment shaders again.
      gl.disable(gl.RASTERIZER_DISCARD);

      // Draw the particles.
      gl.useProgram(drawProgram);
      gl.bindVertexArray(current.drawVA);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.drawArrays(gl.POINTS, 0, particlesCount);

      // --- Swap ---
      {
        const temp = current;
        current = next;
        next = temp;
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  };
}
