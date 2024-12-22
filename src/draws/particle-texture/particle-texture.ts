import { Utilities } from "../../utilities";

import simulationVertex from "./simulation-vertex.glsl";
import simulationFragment from "./simulation-fragment.glsl";
import renderVertex from "./render-vertex.glsl";
import renderFragment from "./render-fragment.glsl";

export class ParticleTexture {
  private initialized = false;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  readonly setup = () => {
    if (this.initialized) throw new Error("Already initialized");
    this.initialized = true;

    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    const simulationVS = Utilities.WebGL.Setup.compileShader(gl, "vertex", simulationVertex);
    const simulationFS = Utilities.WebGL.Setup.compileShader(gl, "fragment", simulationFragment);
    const renderVS = Utilities.WebGL.Setup.compileShader(gl, "vertex", renderVertex);
    const renderFS = Utilities.WebGL.Setup.compileShader(gl, "fragment", renderFragment);

    const simulationProgram = Utilities.WebGL.Setup.linkProgram(gl, simulationVS, simulationFS);
    const renderProgram = Utilities.WebGL.Setup.linkProgram(gl, renderVS, renderFS);

    Utilities.WebGL.Canvas.resizeCanvasToDisplaySize(this.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this.main(gl, simulationProgram, renderProgram);
  };

  private readonly createTextureData = (count: number) => {
    const textureData: number[] = [];

    for (let i = 0; i < count; i++) {
      const xPosition = Utilities.Random.rangeInt(0, 255);
      const yPosition = Utilities.Random.rangeInt(0, 255);
      const angle = Utilities.Random.rangeInt(0, 255);

      textureData.push(xPosition);
      textureData.push(yPosition);
      textureData.push(angle);
    }

    return textureData;
  };

  private readonly disableTextureFiltering = (gl: WebGL2RenderingContext) => {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };

  private readonly main = (
    gl: WebGL2RenderingContext,
    simulationProgram: WebGLProgram,
    renderProgram: WebGLProgram,
  ) => {
    const locations = {
      simulation: {
        aCanvasVertices: gl.getAttribLocation(simulationProgram, "a_canvasVertices"),
        uOldTextureIndex: gl.getUniformLocation(simulationProgram, "u_oldTextureIndex"),
      },
      render: {
        //aCanvasVertices: gl.getAttribLocation(renderProgram, "a_canvasVertices"),
        uNewTextureIndex: gl.getUniformLocation(renderProgram, "u_newTextureIndex"),
      },
    };

    // --- Attribute ---

    const canvasVertices = Utilities.WebGL.Points.rectangle(0, 0, 1, 1);

    const simulationVAO = gl.createVertexArray();
    gl.bindVertexArray(simulationVAO);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(canvasVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(locations.simulation.aCanvasVertices);
    gl.vertexAttribPointer(locations.simulation.aCanvasVertices, 2, gl.FLOAT, false, 0, 0);

    const renderVAO = gl.createVertexArray();
    gl.bindVertexArray(renderVAO);

    //gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(canvasVertices), gl.STATIC_DRAW);
    //gl.enableVertexAttribArray(locations.render.aCanvasVertices);
    //gl.vertexAttribPointer(locations.render.aCanvasVertices, 2, gl.FLOAT, false, 0, 0);

    // --- Textures ---

    const target = gl.TEXTURE_2D;
    const level = 0;
    const internalFormat = gl.RGB8;
    const width = 12;
    const height = 12;
    const border = 0;
    const format = gl.RGB;
    const type = gl.UNSIGNED_BYTE;

    // First

    let firstTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, firstTexture);

    const data = new Uint8Array(this.createTextureData(width * height));
    gl.texImage2D(target, level, internalFormat, width, height, border, format, type, data);

    this.disableTextureFiltering(gl);

    // Next

    let nextTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, nextTexture);

    const emptyData = new Uint8Array(data.map(() => 0));
    gl.texImage2D(target, level, internalFormat, width, height, border, format, type, emptyData);

    this.disableTextureFiltering(gl);

    const loop = () => {
      // --- Simulation ---

      gl.bindFramebuffer(gl.FRAMEBUFFER, gl.createFramebuffer());
      gl.viewport(0, 0, width, height);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, nextTexture, 0);

      gl.useProgram(simulationProgram);
      gl.bindVertexArray(simulationVAO);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, firstTexture);

      gl.uniform1i(locations.simulation.uOldTextureIndex, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // --- Render ---

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

      gl.useProgram(renderProgram);
      gl.bindVertexArray(renderVAO);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, nextTexture);

      gl.uniform1i(locations.render.uNewTextureIndex, 0);

      gl.drawArrays(gl.POINTS, 0, width * height);

      // --- Swap ---

      let temp = firstTexture;
      firstTexture = nextTexture;
      nextTexture = temp;

      requestAnimationFrame(loop);
    };

    loop();
  };
}
