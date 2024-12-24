import { Utilities } from "../../../utilities";

import updateVertex from "./update-vertex.glsl";
import updateFragment from "./update-fragment.glsl";
import renderVertex from "./render-vertex.glsl";
import renderFragment from "./render-fragment.glsl";

// TODO: clarity of this, since this is the way.

// TODO: normalize to [0, 1] instead of [-1, 1].

// TODO: normalize shaders as well.

// TODO: figure out how to reduce FPS to a constant.

export class Particles {
  private readonly particlesCount = 3000;

  private initialized = false;
  private image = new Image();

  constructor(private readonly canvas: HTMLCanvasElement) {}

  setup() {
    if (this.initialized) throw "Already initialized";
    this.initialized = true;

    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    this.image.src = "assets/tenthousand.png";
    this.image.onload = () => this.main(gl);
  }

  private createPrograms(gl: WebGL2RenderingContext) {
    const updateVS = Utilities.WebGL.Setup.compileShader(gl, "vertex", updateVertex);
    const updateFS = Utilities.WebGL.Setup.compileShader(gl, "fragment", updateFragment);
    const renderVS = Utilities.WebGL.Setup.compileShader(gl, "vertex", renderVertex);
    const renderFS = Utilities.WebGL.Setup.compileShader(gl, "fragment", renderFragment);

    return {
      update: Utilities.WebGL.Setup.linkTransformFeedbackProgram(gl, updateVS, updateFS, ["newPosition"], "separate"),
      render: Utilities.WebGL.Setup.linkProgram(gl, renderVS, renderFS),
    };
  }

  private generateVelocityData() {
    const velocities: number[] = [];
    for (let i = 0; i < this.particlesCount; i++) {
      const angle = Utilities.Random.rangeInt(0, 360);

      const sin = Utilities.TrigCache.sin(angle);
      const cos = Utilities.TrigCache.cos(angle);

      velocities.push(cos);
      velocities.push(sin);
    }
    return velocities;
  }

  private generatePositionData() {
    const positions: number[] = [];
    for (let i = 0; i < this.particlesCount; i++) {
      positions.push(Utilities.Random.range(-1, 1));
      positions.push(Utilities.Random.range(-1, 1));
    }
    return positions;
  }

  private createTexture(gl: WebGL2RenderingContext) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    Utilities.WebGL.Texture.applyClampAndNearest(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
  }

  private createState(gl: WebGL2RenderingContext, programs: { update: WebGLProgram; render: WebGLProgram }) {
    const locations = {
      update: {
        aOldPosition: gl.getAttribLocation(programs.update, "a_oldPosition"),
        aVelocity: gl.getAttribLocation(programs.update, "a_velocity"),
        uDeltaTime: gl.getUniformLocation(programs.update, "u_deltaTime"),
      },
      render: {
        aCanvasVertices: gl.getAttribLocation(programs.render, "a_canvasVertices"),
        uTextureIndex: gl.getUniformLocation(programs.render, "u_textureIndex"),
      },
    };

    const data = {
      positions: new Float32Array(this.generatePositionData()),
      velocities: new Float32Array(this.generateVelocityData()),
    };

    const buffers = {
      firstPosition: gl.createBuffer()!,
      nextPosition: gl.createBuffer()!,
      velocity: gl.createBuffer()!,
    };

    // -----------

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.firstPosition);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STREAM_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nextPosition);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STREAM_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.velocity);
    gl.bufferData(gl.ARRAY_BUFFER, data.velocities, gl.STATIC_DRAW);

    const vertexArrayObjects = {
      update1: gl.createVertexArray(),
      update2: gl.createVertexArray(),
      render1: gl.createVertexArray(),
      render2: gl.createVertexArray(),
    };

    // update position VAO 1
    gl.bindVertexArray(vertexArrayObjects.update1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.firstPosition); // 1
    gl.enableVertexAttribArray(locations.update.aOldPosition);
    gl.vertexAttribPointer(locations.update.aOldPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.velocity);
    gl.enableVertexAttribArray(locations.update.aVelocity);
    gl.vertexAttribPointer(locations.update.aVelocity, 2, gl.FLOAT, false, 0, 0);

    // update position VAO 2
    gl.bindVertexArray(vertexArrayObjects.update2);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nextPosition); // 2
    gl.enableVertexAttribArray(locations.update.aOldPosition);
    gl.vertexAttribPointer(locations.update.aOldPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.velocity);
    gl.enableVertexAttribArray(locations.update.aVelocity);
    gl.vertexAttribPointer(locations.update.aVelocity, 2, gl.FLOAT, false, 0, 0);

    // draw VAO 1
    gl.bindVertexArray(vertexArrayObjects.render1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.firstPosition); // 1
    gl.enableVertexAttribArray(locations.render.aCanvasVertices);
    gl.vertexAttribPointer(locations.render.aCanvasVertices, 2, gl.FLOAT, false, 0, 0);

    // draw VAO 2
    gl.bindVertexArray(vertexArrayObjects.render2);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nextPosition); // 2
    gl.enableVertexAttribArray(locations.render.aCanvasVertices);
    gl.vertexAttribPointer(locations.render.aCanvasVertices, 2, gl.FLOAT, false, 0, 0);

    const transformFeedbacks = {
      one: gl.createTransformFeedback(),
      two: gl.createTransformFeedback(),
    };

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedbacks.one); // 1
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffers.firstPosition); // 1

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedbacks.two); // 2
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffers.nextPosition); // 2

    // --- Unbind leftovers ---

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

    return { locations, vertexArrayObjects, transformFeedbacks };
  }

  private main(gl: WebGL2RenderingContext) {
    const programs = this.createPrograms(gl);

    const { locations, vertexArrayObjects, transformFeedbacks } = this.createState(gl, programs);

    this.createTexture(gl);

    let current = {
      updateVA: vertexArrayObjects.update1, // Read from position1.
      tf: transformFeedbacks.two, // Write to position2.
      drawVA: vertexArrayObjects.render2, // Draw with position2.
    };

    let next = {
      updateVA: vertexArrayObjects.update2, // Read from position2.
      tf: transformFeedbacks.one, // Write to position 1.
      drawVA: vertexArrayObjects.render1, // Draw with position 1.
    };

    Utilities.WebGL.Canvas.resizeToDisplaySize(this.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const updateLoop = (deltaTime: number) => {
      // Compute the new positions.
      gl.useProgram(programs.update);
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

    const renderLoop = () => {
      // Draw the particles.
      gl.useProgram(programs.render);
      gl.bindVertexArray(current.drawVA);
      gl.drawArrays(gl.POINTS, 0, this.particlesCount);
    };

    let timeThen: number = 0;
    const mainLoop = (timeNow: number) => {
      timeNow *= 0.001;
      const deltaTime = timeNow - timeThen;
      timeThen = timeNow;

      Utilities.WebGL.Canvas.resizeToDisplaySize(this.canvas);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      updateLoop(deltaTime);
      renderLoop();

      // --- Swap ---
      const temp = current;
      current = next;
      next = temp;

      requestAnimationFrame(mainLoop);
    };

    requestAnimationFrame(mainLoop);
  }
}
