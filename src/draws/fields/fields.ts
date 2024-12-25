import { Utilities } from "../../utilities";

import updateVertex from "./update-vertex.glsl";
import updateFragment from "./update-fragment.glsl";
import renderVertex from "./render-vertex.glsl";
import renderFragment from "./render-fragment.glsl";

export class Fields {
  private readonly xCount = 200;
  private readonly yCount = 200;
  private readonly offset = 0.008;
  private readonly brightness = 3;
  private readonly speed = 0.03;
  private readonly minSize = 1.5;
  private readonly sizeScalar = 3.0;

  private initialized = false;
  private xPointer = 0;
  private yPointer = 0;
  private readonly particleCount = this.xCount * this.yCount;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  init() {
    if (this.initialized) throw "Already initialized";
    this.initialized = true;

    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    this.setupPointer();

    this.main(gl);
  }

  private setupPointer() {
    const canvasBounds = this.canvas.getBoundingClientRect();
    this.canvas.addEventListener("mousemove", (ev: MouseEvent) => {
      this.xPointer = ev.clientX - canvasBounds.left;
      this.yPointer = ev.clientY - canvasBounds.top;
    });
    this.canvas.addEventListener("pointerdown", () => {
      location.reload();
    });
  }

  private setupPrograms(gl: WebGL2RenderingContext) {
    const updateVS = Utilities.WebGL.Setup.compileShader(gl, "vertex", updateVertex);
    const updateFS = Utilities.WebGL.Setup.compileShader(gl, "fragment", updateFragment);
    const renderVS = Utilities.WebGL.Setup.compileShader(gl, "vertex", renderVertex);
    const renderFS = Utilities.WebGL.Setup.compileShader(gl, "fragment", renderFragment);

    return {
      update: Utilities.WebGL.Setup.linkTransformFeedbackProgram(gl, updateVS, updateFS, ["newPosition"], "separate"),
      render: Utilities.WebGL.Setup.linkProgram(gl, renderVS, renderFS),
    };
  }

  private generatePositions() {
    const positions: number[] = [];

    for (let x = 0; x < this.xCount; x++) {
      for (let y = 0; y < this.yCount; y++) {
        const xPosition = this.offset + (1 / this.xCount) * x;
        const yPosition = this.offset + (1 / this.yCount) * y;
        positions.push(xPosition);
        positions.push(yPosition);
      }
    }

    return positions;
  }

  private setupUniformBlock(gl: WebGL2RenderingContext, programs: { update: WebGLProgram; render: WebGLProgram }) {
    const blockIndexInUpdate = gl.getUniformBlockIndex(programs.update, "GlobalStaticData");
    const blockIndexInRender = gl.getUniformBlockIndex(programs.render, "GlobalStaticData");

    gl.uniformBlockBinding(programs.update, blockIndexInUpdate, 0);
    gl.uniformBlockBinding(programs.render, blockIndexInRender, 0);

    const data = [this.brightness, this.speed, this.minSize, this.sizeScalar];

    const uniformBuffer = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, uniformBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, data.length * 16, gl.STATIC_DRAW);

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, uniformBuffer);

    const globalStaticData = new Float32Array(data);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, globalStaticData);
  }

  private setupState(gl: WebGL2RenderingContext, programs: { update: WebGLProgram; render: WebGLProgram }) {
    const locations = {
      update: {
        aCurrentPosition: gl.getAttribLocation(programs.update, "a_currentPosition"),
        aOriginalPosition: gl.getAttribLocation(programs.update, "a_originalPosition"),
        aVelocity: gl.getAttribLocation(programs.update, "a_velocity"),
        uPointerPosition: gl.getUniformLocation(programs.update, "u_pointerPosition"),
        uDeltaTime: gl.getUniformLocation(programs.update, "u_deltaTime"),
      },
      render: {
        aNewPosition: gl.getAttribLocation(programs.render, "a_newPosition"),
        uTextureIndex: gl.getUniformLocation(programs.render, "u_textureIndex"),
      },
    };

    this.setupUniformBlock(gl, programs);

    const data = {
      positions: new Float32Array(this.generatePositions()),
    };

    const buffers = {
      firstPosition: gl.createBuffer()!,
      nextPosition: gl.createBuffer()!,
      originalPosition: gl.createBuffer()!,
    };

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.firstPosition);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STREAM_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nextPosition);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STREAM_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.originalPosition);
    gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STREAM_DRAW);

    const vertexArrayObjects = {
      updateFirst: gl.createVertexArray(),
      updateNext: gl.createVertexArray(),
      renderFirst: gl.createVertexArray(),
      renderNext: gl.createVertexArray(),
    };

    // update VAO first data
    gl.bindVertexArray(vertexArrayObjects.updateFirst);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.firstPosition);
    gl.enableVertexAttribArray(locations.update.aCurrentPosition);
    gl.vertexAttribPointer(locations.update.aCurrentPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.originalPosition);
    gl.enableVertexAttribArray(locations.update.aOriginalPosition);
    gl.vertexAttribPointer(locations.update.aOriginalPosition, 2, gl.FLOAT, false, 0, 0);

    // update VAO next data
    gl.bindVertexArray(vertexArrayObjects.updateNext);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nextPosition);
    gl.enableVertexAttribArray(locations.update.aCurrentPosition);
    gl.vertexAttribPointer(locations.update.aCurrentPosition, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.originalPosition);
    gl.enableVertexAttribArray(locations.update.aOriginalPosition);
    gl.vertexAttribPointer(locations.update.aOriginalPosition, 2, gl.FLOAT, false, 0, 0);

    // render VAO first data
    gl.bindVertexArray(vertexArrayObjects.renderFirst);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.firstPosition);
    gl.enableVertexAttribArray(locations.render.aNewPosition);
    gl.vertexAttribPointer(locations.render.aNewPosition, 2, gl.FLOAT, false, 0, 0);

    // render VAO next data
    gl.bindVertexArray(vertexArrayObjects.renderNext);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nextPosition);
    gl.enableVertexAttribArray(locations.render.aNewPosition);
    gl.vertexAttribPointer(locations.render.aNewPosition, 2, gl.FLOAT, false, 0, 0);

    const transformFeedbacks = {
      firstPosition: gl.createTransformFeedback(),
      nextPosition: gl.createTransformFeedback(),
    };

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedbacks.firstPosition);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffers.firstPosition);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedbacks.nextPosition);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, buffers.nextPosition);

    // --- Unbind leftovers ---

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER, null);

    return { locations, vertexArrayObjects, transformFeedbacks };
  }

  private main(gl: WebGL2RenderingContext) {
    const programs = this.setupPrograms(gl);

    const { locations, vertexArrayObjects, transformFeedbacks } = this.setupState(gl, programs);

    let current = {
      updateVAO: vertexArrayObjects.updateFirst,
      renderVAO: vertexArrayObjects.renderNext,
      TF: transformFeedbacks.nextPosition,
    };

    let swap = {
      updateVAO: vertexArrayObjects.updateNext,
      renderVAO: vertexArrayObjects.renderFirst,
      TF: transformFeedbacks.firstPosition,
    };

    Utilities.WebGL.Canvas.resizeToDisplaySize(this.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.08, 0.08, 0.08, 1.0);

    const updateLoop = (deltaTime: number) => {
      gl.useProgram(programs.update);
      gl.bindVertexArray(current.updateVAO);
      gl.uniform1f(locations.update.uDeltaTime, deltaTime);
      // TODO: function
      gl.uniform2f(
        locations.update.uPointerPosition,
        this.xPointer / this.canvas.width,
        (this.canvas.height - this.yPointer) / this.canvas.height,
      );

      gl.enable(gl.RASTERIZER_DISCARD);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.TF);
      gl.beginTransformFeedback(gl.POINTS);
      gl.drawArrays(gl.POINTS, 0, this.particleCount);
      gl.endTransformFeedback();
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      gl.disable(gl.RASTERIZER_DISCARD);
    };

    const renderLoop = () => {
      gl.useProgram(programs.render);
      gl.bindVertexArray(current.renderVAO);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, this.particleCount);
    };

    let timeThen: number = 0;
    const mainLoop = (timeNow: number) => {
      timeNow *= 0.001;
      const deltaTime = timeNow - timeThen;
      timeThen = timeNow;

      updateLoop(deltaTime);
      renderLoop();

      // --- Swap ---
      const temp = current;
      current = swap;
      swap = temp;

      requestAnimationFrame(mainLoop);
    };

    requestAnimationFrame(mainLoop);
  }
}
