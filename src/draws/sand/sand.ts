import { Utilities } from "../../utilities";

import updateVertex from "./update-vertex.glsl";
import updateFragment from "./update-fragment.glsl";
import renderVertex from "./render-vertex.glsl";
import renderFragment from "./render-fragment.glsl";

export class Sand {
  private readonly xCount = 10;
  private readonly yCount = 10;

  private initialized = false;
  //private xPointer = 100;
  //private yPointer = 100;
  //private isPointerDown = false;
  private readonly totalCells = this.xCount * this.yCount;
  //private readonly xTexelSize = 1 / this.xCount;
  //private readonly yTexelSize = 1 / this.yCount;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  init() {
    if (this.initialized) throw "Already initialized";
    this.initialized = true;

    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    //this.setupPointer();

    this.main(gl);
  }

  //private setupPointer() {
  //const canvasBounds = this.canvas.getBoundingClientRect();
  //this.canvas.addEventListener("pointermove", (ev: PointerEvent) => {
  //  this.xPointer = ev.clientX - canvasBounds.left;
  //  this.yPointer = ev.clientY - canvasBounds.top;
  //
  //  this.xPointer = this.xPointer / this.canvas.width;
  //  this.yPointer = (this.canvas.height - this.yPointer) / this.canvas.height;
  //});
  //window.addEventListener("pointerdown", () => {
  //  this.isPointerDown = true;
  //});
  //
  //window.addEventListener("pointerup", () => {
  //  this.isPointerDown = false;
  //});
  //
  //window.addEventListener("blur", () => {
  //  this.isPointerDown = false;
  //});
  //}

  private setupPrograms(gl: WebGL2RenderingContext) {
    const updateVS = Utilities.WebGL.Setup.compileShader(gl, "vertex", updateVertex);
    const updateFS = Utilities.WebGL.Setup.compileShader(gl, "fragment", updateFragment);
    const renderVS = Utilities.WebGL.Setup.compileShader(gl, "vertex", renderVertex);
    const renderFS = Utilities.WebGL.Setup.compileShader(gl, "fragment", renderFragment);

    return {
      update: Utilities.WebGL.Setup.linkProgram(gl, updateVS, updateFS),
      render: Utilities.WebGL.Setup.linkProgram(gl, renderVS, renderFS),
    };
  }

  private generateStateData() {
    const state: number[] = [];

    for (let i = 0; i < this.totalCells; i++) {
      const isUpdated = 0;
      const type = 0;
      const time = 0;

      state.push(isUpdated);
      state.push(type);
      state.push(time);
    }

    const bytes = 3;

    // Blocks
    for (let y = 0; y < this.yCount; y++) {
      for (let x = 0; x < this.xCount; x++) {
        const index = y * this.xCount + x;

        if (y == 0) state[index * bytes + 1] = 1;
        else if (y == this.yCount - 1) state[index * bytes + 1] = 1;

        if (x == 0) state[index * bytes + 1] = 1;
        else if (x == this.xCount - 1) state[index * bytes + 1] = 1;
      }
    }

    // Sand
    const sandCells = [86, 76, 56, 52, 53];
    for (let i = 0; i < sandCells.length; i++) {
      state[sandCells[i] * bytes + 1] = 2;
    }

    return state;
  }

  private setupState(gl: WebGL2RenderingContext, programs: { update: WebGLProgram; render: WebGLProgram }) {
    const locations = {
      update: {
        aCanvasVertices: gl.getAttribLocation(programs.update, "a_canvasVertices"), // TODO: needed?
        uOldTextureIndex: gl.getUniformLocation(programs.update, "u_oldTextureIndex"),
        //uTexelSize: gl.getUniformLocation(programs.update, "u_texelSize;"), // TODO: ?
        //uPointerPosition: gl.getUniformLocation(programs.update, "u_pointerPosition"),
        //uPointerDown: gl.getUniformLocation(programs.update, "u_pointerDown"),
      },
      render: {
        uNewTextureIndex: gl.getUniformLocation(programs.render, "u_newTextureIndex"),
      },
    };

    const data = {
      state: new Uint8Array(this.generateStateData()),
      emptyState: new Uint8Array(this.totalCells * 3),
      canvasVertices: new Float32Array(Utilities.WebGL.Points.rectangle(0, 0, 1, 1)),
    };

    const vertexArrayObjects = {
      update: gl.createVertexArray(),
      render: gl.createVertexArray(),
    };

    const textures = {
      first: gl.createTexture(),
      next: gl.createTexture(),
    };

    const framebuffers = {
      update: gl.createFramebuffer(),
    };

    gl.bindVertexArray(vertexArrayObjects.update);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data.canvasVertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(locations.update.aCanvasVertices);
    gl.vertexAttribPointer(locations.update.aCanvasVertices, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(vertexArrayObjects.render); // needed..?

    gl.bindTexture(gl.TEXTURE_2D, textures.first);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, this.xCount, this.yCount, 0, gl.RGB, gl.UNSIGNED_BYTE, data.state);
    Utilities.WebGL.Texture.applyClampAndNearest(gl);

    gl.bindTexture(gl.TEXTURE_2D, textures.next);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, this.xCount, this.yCount, 0, gl.RGB, gl.UNSIGNED_BYTE, data.emptyState);
    Utilities.WebGL.Texture.applyClampAndNearest(gl);

    return { locations, vertexArrayObjects, textures, framebuffers };
  }

  private main(gl: WebGL2RenderingContext) {
    const programs = this.setupPrograms(gl);

    const { locations, vertexArrayObjects, textures, framebuffers } = this.setupState(gl, programs);

    Utilities.WebGL.Canvas.resizeToDisplaySize(this.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.08, 0.08, 0.08, 1.0);

    const updateLoop = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.update);
      gl.viewport(0, 0, this.xCount, this.yCount);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures.next, 0);

      gl.useProgram(programs.update);
      gl.bindVertexArray(vertexArrayObjects.update);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures.first);

      gl.uniform1i(locations.update.uOldTextureIndex, 0);
      //gl.uniform2f(locations.update.uTexelSize, this.xTexelSize, this.yTexelSize);
      //gl.uniform1i(locations.update.uPointerDown, this.isPointerDown ? 1 : 0);
      //gl.uniform2f(locations.update.uPointerPosition, this.xPointer, this.yPointer);

      // rast discard?

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      //gl.useProgram(programs.update);
      //gl.bindVertexArray(current.updateVAO);
      //gl.uniform1i(locations.update.uPointerDown, this.isPointerDown ? 1 : 0);
      //gl.uniform2f(locations.update.uPointerPosition, this.xPointer, this.yPointer);
      //
      //gl.enable(gl.RASTERIZER_DISCARD);
      //gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, current.TF);
      //gl.beginTransformFeedback(gl.POINTS);
      //gl.drawArrays(gl.POINTS, 0, this.totalCells);
      //gl.endTransformFeedback();
      //gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      //gl.disable(gl.RASTERIZER_DISCARD);
    };

    const renderLoop = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);

      gl.useProgram(programs.render);
      gl.bindVertexArray(vertexArrayObjects.render);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures.next);

      gl.uniform1i(locations.render.uNewTextureIndex, 0);

      gl.drawArrays(gl.POINTS, 0, this.totalCells);

      //gl.useProgram(programs.render);
      //gl.bindVertexArray(current.renderVAO);
      //gl.clear(gl.COLOR_BUFFER_BIT);
      //gl.drawArrays(gl.POINTS, 0, this.totalCells);
    };

    const mainLoop = () => {
      updateLoop();
      renderLoop();

      // --- Swap ---
      const swap = textures.first;
      textures.first = textures.next;
      textures.next = swap;

      //requestAnimationFrame(mainLoop);
    };

    //mainLoop();
    setInterval(mainLoop, 1000 / 2);
  }
}
