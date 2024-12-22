import { Utilities } from "../../../utilities";

import vertexUpdate from "./vertex-update.glsl";
import vertexDraw from "./vertex-draw.glsl";
import fragmentUpdate from "./fragment-update.glsl";
import fragmentDraw from "./fragment-draw.glsl";

export class Particles {
  private readonly particlesCount = 1000;
  private readonly minVelocity = 0.001;
  private readonly maxVelocity = 0.5;

  private initialized = false;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  readonly setup = () => {
    if (this.initialized) throw new Error("Already initialized");
    this.initialized = true;

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
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this.main(gl, updateProgram, drawProgram);
  };

  private readonly generateVelocities = () => {
    const temp: number[] = [];
    for (let i = 0; i < this.particlesCount * 2; i++) {
      const velocity = Utilities.Random.range(this.minVelocity, this.maxVelocity);
      temp.push(Utilities.Random.bool() ? velocity : -velocity);
    }
    return temp;
  };

  private readonly generatePositions = () => {
    const temp: number[] = [];
    for (let i = 0; i < this.particlesCount * 2; i++) {
      temp.push(Utilities.Random.range(-1, 1));
    }
    return temp;
  };

  private readonly main = (gl: WebGL2RenderingContext, updateProgram: WebGLProgram, drawProgram: WebGLProgram) => {
    const locations = {
      update: {
        aOldPosition: gl.getAttribLocation(updateProgram, "a_oldPosition"),
        aVelocity: gl.getAttribLocation(updateProgram, "a_velocity"),
        uDeltaTime: gl.getUniformLocation(updateProgram, "u_deltaTime"),
      },
      draw: {
        position: gl.getAttribLocation(drawProgram, "position"), // todo: change later
      },
    };

    // --- Data ---

    const positions = new Float32Array(this.generatePositions());
    const velocities = new Float32Array(this.generateVelocities());

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
    gl.enableVertexAttribArray(locations.update.aOldPosition);
    gl.vertexAttribPointer(locations.update.aOldPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
    gl.enableVertexAttribArray(locations.update.aVelocity);
    gl.vertexAttribPointer(locations.update.aVelocity, 2, gl.FLOAT, false, 0, 0);

    // update position VAO 2
    const updateVA2 = gl.createVertexArray();
    gl.bindVertexArray(updateVA2);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2); // 2
    gl.enableVertexAttribArray(locations.update.aOldPosition);
    gl.vertexAttribPointer(locations.update.aOldPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffer);
    gl.enableVertexAttribArray(locations.update.aVelocity);
    gl.vertexAttribPointer(locations.update.aVelocity, 2, gl.FLOAT, false, 0, 0);

    // draw VAO 1
    const drawVA1 = gl.createVertexArray();
    gl.bindVertexArray(drawVA1);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer1); // 1
    gl.enableVertexAttribArray(locations.draw.position);
    gl.vertexAttribPointer(locations.draw.position, 2, gl.FLOAT, false, 0, 0);

    // draw VAO 2
    const drawVA2 = gl.createVertexArray();
    gl.bindVertexArray(drawVA2);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer2); // 2
    gl.enableVertexAttribArray(locations.draw.position);
    gl.vertexAttribPointer(locations.draw.position, 2, gl.FLOAT, false, 0, 0);

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

    // --- Loop ---

    const updateLoop = (deltaTime: number) => {
      // Compute the new positions.
      gl.useProgram(updateProgram);
      gl.bindVertexArray(current.updateVA);
      gl.uniform1f(locations.update.uDeltaTime, deltaTime);

      // Turn off the fragment shader.
      gl.enable(gl.RASTERIZER_DISCARD);

      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.tf);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, this.particlesCount);
      gl.endTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

      // Turn on using fragment shaders again.
      gl.disable(gl.RASTERIZER_DISCARD);
    };

    const drawLoop = () => {
      // Draw the particles.
      gl.useProgram(drawProgram);
      gl.bindVertexArray(current.drawVA);
      gl.drawArrays(gl.POINTS, 0, this.particlesCount);
    };

    let timeThen: number = 0;
    const mainLoop = (timeNow: number) => {
      timeNow *= 0.001;
      const deltaTime: number = timeNow - timeThen;
      timeThen = timeNow;

      Utilities.WebGL.Canvas.resizeCanvasToDisplaySize(this.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      updateLoop(deltaTime);

      drawLoop();

      // --- Swap ---
      const temp = current;
      current = next;
      next = temp;

      requestAnimationFrame(mainLoop);
    };

    mainLoop(0);
  };
}
