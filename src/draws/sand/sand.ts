import { Vector2, Vector3, WebGL } from "../../utilities/utilities";

import updateVertex from "./update-vertex.glsl";
import updateFragment from "./update-fragment.glsl";
import renderVertex from "./render-vertex.glsl";
import renderFragment from "./render-fragment.glsl";

export class Sand {
  //private readonly width = 10;
  //private readonly height = 10;
  private readonly width = 30;
  private readonly height = 30;

  private readonly pointerArea = 0.02;

  private readonly brightness = 0.6;
  private readonly colors = {
    error: new Vector3(1.0, 0.0, 1.0),
    empty: new Vector3(0.5, 0.5, 0.5),
    block: new Vector3(0.1, 0.1, 0.1),
    sand: new Vector3(0.75, 0.7, 0.5),
  };

  private readonly byteFloat = 1 / 255;
  private readonly texelSize = new Vector2(1 / this.width, 1 / this.height);

  private readonly types = {
    empty: this.byteFloat * 0,
    block: this.byteFloat * 1,
    sand: this.byteFloat * 2,
  };

  private readonly directions = {
    north: new Vector2(0.0, this.texelSize.y),
    northEast: new Vector2(this.texelSize.x, this.texelSize.y),
    east: new Vector2(this.texelSize.x, 0),
    southEast: new Vector2(this.texelSize.x, -this.texelSize.y),
    south: new Vector2(0.0, -this.texelSize.y),
    southWest: new Vector2(-this.texelSize.x, -this.texelSize.y),
    west: new Vector2(-this.texelSize.x, 0),
    northWest: new Vector2(-this.texelSize.x, this.texelSize.y),
  };

  private readonly totalCells = this.width * this.height;
  private readonly bytesPerCell = 3;

  private readonly pointer = { coordinates: Vector2.zero(), isDown: 0 };
  private initialized = false;

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
    this.canvas.addEventListener("pointermove", (ev: PointerEvent) => {
      const x = ev.clientX - canvasBounds.left;
      const y = ev.clientY - canvasBounds.top;
      this.pointer.coordinates.set(x / this.canvas.width, (this.canvas.height - y) / this.canvas.height);
    });

    window.addEventListener("pointerdown", () => {
      this.pointer.isDown = 1;
    });

    window.addEventListener("pointerup", () => {
      this.pointer.isDown = 0;
    });

    window.addEventListener("blur", () => {
      this.pointer.isDown = 0;
    });
  }

  private setupPrograms(gl: WebGL2RenderingContext) {
    const updateVS = WebGL.Setup.compileShader(gl, "vertex", updateVertex);
    const updateFS = WebGL.Setup.compileShader(gl, "fragment", updateFragment);
    const renderVS = WebGL.Setup.compileShader(gl, "vertex", renderVertex);
    const renderFS = WebGL.Setup.compileShader(gl, "fragment", renderFragment);

    return {
      update: WebGL.Setup.linkProgram(gl, updateVS, updateFS),
      render: WebGL.Setup.linkProgram(gl, renderVS, renderFS),
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

    // Blocks
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = (y * this.width + x) * this.bytesPerCell;

        if (y == 0) state[index + 1] = 1;
        else if (y == this.height - 1) state[index + 1] = 1;

        if (x == 0) state[index + 1] = 1;
        else if (x == this.width - 1) state[index + 1] = 1;
      }
    }

    // Sand
    const sandCells = [86, 76, 56, 52, 53];
    for (let i = 0; i < sandCells.length; i++) {
      state[sandCells[i] * this.bytesPerCell + 1] = 2;
    }

    return state;
  }

  private setupUniformBlock(gl: WebGL2RenderingContext, programs: { update: WebGLProgram; render: WebGLProgram }) {
    const blockIndices = {
      update: {
        types: gl.getUniformBlockIndex(programs.update, "TypesStaticData"),
        directions: gl.getUniformBlockIndex(programs.update, "DirectionsStaticData"),
        misc: gl.getUniformBlockIndex(programs.update, "MiscStaticData"),
      },

      render: {
        types: gl.getUniformBlockIndex(programs.render, "TypesStaticData"),
        dimensions: gl.getUniformBlockIndex(programs.render, "DimensionsStaticData"),
        colors: gl.getUniformBlockIndex(programs.render, "ColorsStaticData"),
        misc: gl.getUniformBlockIndex(programs.render, "MiscStaticData"),
      },
    };

    const buffers = {
      types: gl.createBuffer(),
      dimensions: gl.createBuffer(),
      directions: gl.createBuffer(),
      colors: gl.createBuffer(),
      misc: gl.createBuffer(),
    };

    const data = {
      //prettier-ignore
      types: new Float32Array([
        this.types.empty,
        this.types.block,
        this.types.sand,
        0,
      ]),

      //prettier-ignore
      dimensions: new Float32Array([
        this.width,
        this.height,
        this.canvas.width,
        this.canvas.height,
      ]),

      directions: new Float32Array([
        this.directions.north.x,
        this.directions.north.y,
        this.directions.northEast.x,
        this.directions.northEast.y,

        this.directions.east.x,
        this.directions.east.y,
        this.directions.southEast.x,
        this.directions.southEast.y,

        this.directions.south.x,
        this.directions.south.y,
        this.directions.southWest.x,
        this.directions.southWest.y,

        this.directions.west.x,
        this.directions.west.y,
        this.directions.northWest.x,
        this.directions.northWest.y,
      ]),

      colors: new Float32Array([
        this.colors.error.r,
        this.colors.error.g,
        this.colors.error.b,
        1.0,

        this.colors.empty.r,
        this.colors.empty.g,
        this.colors.empty.b,
        1.0,

        this.colors.block.r,
        this.colors.block.g,
        this.colors.block.b,
        1.0,

        this.colors.sand.r,
        this.colors.sand.g,
        this.colors.sand.b,
        1.0,
      ]),

      //prettier-ignore
      misc: new Float32Array([
        this.brightness,
        this.pointerArea,
        0,
        0,
      ]),
    };

    const typesIndex = 0;
    gl.uniformBlockBinding(programs.update, blockIndices.update.types, typesIndex);
    gl.uniformBlockBinding(programs.render, blockIndices.render.types, typesIndex);
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffers.types);
    gl.bufferData(gl.UNIFORM_BUFFER, data.types, gl.STATIC_DRAW);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, typesIndex, buffers.types);

    const dimensionsIndex = 1;
    gl.uniformBlockBinding(programs.render, blockIndices.render.dimensions, dimensionsIndex);
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffers.dimensions);
    gl.bufferData(gl.UNIFORM_BUFFER, data.dimensions, gl.STATIC_DRAW);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, dimensionsIndex, buffers.dimensions);

    const directionsIndex = 2;
    gl.uniformBlockBinding(programs.update, blockIndices.update.directions, directionsIndex);
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffers.directions);
    gl.bufferData(gl.UNIFORM_BUFFER, data.directions, gl.STATIC_DRAW);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, directionsIndex, buffers.directions);

    const colorsIndex = 3;
    gl.uniformBlockBinding(programs.render, blockIndices.render.colors, colorsIndex);
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffers.colors);
    gl.bufferData(gl.UNIFORM_BUFFER, data.colors, gl.STATIC_DRAW);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, colorsIndex, buffers.colors);

    const miscIndex = 4;
    gl.uniformBlockBinding(programs.update, blockIndices.update.misc, miscIndex);
    gl.uniformBlockBinding(programs.render, blockIndices.render.misc, miscIndex);
    gl.bindBuffer(gl.UNIFORM_BUFFER, buffers.misc);
    gl.bufferData(gl.UNIFORM_BUFFER, data.misc, gl.STATIC_DRAW);
    gl.bindBufferBase(gl.UNIFORM_BUFFER, miscIndex, buffers.misc);

    console.log(blockIndices)
  }

  private setupState(gl: WebGL2RenderingContext, programs: { update: WebGLProgram; render: WebGLProgram }) {
    const locations = {
      update: {
        aCanvasVertices: gl.getAttribLocation(programs.update, "a_canvasVertices"),
        uOldTextureIndex: gl.getUniformLocation(programs.update, "u_oldTextureIndex"),
        uPointerArea: gl.getUniformLocation(programs.update, "u_pointerArea"),
        uPointerPosition: gl.getUniformLocation(programs.update, "u_pointerPosition"),
        uIsPointerDown: gl.getUniformLocation(programs.update, "u_isPointerDown"),
      },
      render: {
        uNewTextureIndex: gl.getUniformLocation(programs.render, "u_newTextureIndex"),
      },
    };

    this.setupUniformBlock(gl, programs);

    const data = {
      state: new Uint8Array(this.generateStateData()),
      emptyState: new Uint8Array(this.totalCells * this.bytesPerCell),
      canvasVertices: new Float32Array(WebGL.Points.rectangle(0, 0, 1, 1)),
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

    gl.bindTexture(gl.TEXTURE_2D, textures.first);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, this.width, this.height, 0, gl.RGB, gl.UNSIGNED_BYTE, data.state);
    WebGL.Texture.applyClampAndNearest(gl);

    gl.bindTexture(gl.TEXTURE_2D, textures.next);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, this.width, this.height, 0, gl.RGB, gl.UNSIGNED_BYTE, data.emptyState);
    WebGL.Texture.applyClampAndNearest(gl);

    return { locations, vertexArrayObjects, textures, framebuffers };
  }

  private main(gl: WebGL2RenderingContext) {
    const programs = this.setupPrograms(gl);

    const { locations, vertexArrayObjects, textures, framebuffers } = this.setupState(gl, programs);

    WebGL.Canvas.resizeToDisplaySize(this.canvas);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.08, 0.08, 0.08, 1.0);

    const updateLoop = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers.update);
      gl.viewport(0, 0, this.width, this.height);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures.next, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures.first);

      gl.useProgram(programs.update);
      gl.bindVertexArray(vertexArrayObjects.update);

      gl.uniform1i(locations.update.uOldTextureIndex, 0);
      gl.uniform1i(locations.update.uIsPointerDown, this.pointer.isDown);
      gl.uniform2f(locations.update.uPointerPosition, this.pointer.coordinates.x, this.pointer.coordinates.y);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const renderLoop = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures.next);

      gl.useProgram(programs.render);
      gl.bindVertexArray(vertexArrayObjects.render);

      gl.uniform1i(locations.render.uNewTextureIndex, 0);

      gl.drawArrays(gl.POINTS, 0, this.totalCells);
    };

    const mainLoop = () => {
      updateLoop();
      renderLoop();

      const swap = textures.first;
      textures.first = textures.next;
      textures.next = swap;

      requestAnimationFrame(mainLoop);
    };

    mainLoop();
    //setInterval(mainLoop, 1000 / 2);
  }
}
