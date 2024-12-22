import { Utilities } from "../../utilities";
import vertex from "./vertex.glsl";
import fragment from "./fragment.glsl";

export class ParticleTexture {
  private initialized = false;

  constructor(private readonly canvas: HTMLCanvasElement) {}
  readonly setup = () => {
    if (this.initialized) throw new Error("Already initialized");
    this.initialized = true;

    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    const vertexShader = Utilities.WebGL.Setup.compileShader(gl, "vertex", vertex);
    const fragmentShader = Utilities.WebGL.Setup.compileShader(gl, "fragment", fragment);

    const program = Utilities.WebGL.Setup.linkProgram(gl, vertexShader, fragmentShader);

    Utilities.WebGL.Canvas.resizeCanvasToDisplaySize(this.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this.main(gl, program);
  };

  private readonly main = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
    const locations = {
      aCanvasVertices: gl.getAttribLocation(program, "a_canvasVertices"),
      uTextureIndex: gl.getUniformLocation(program, "u_textureIndex"),
    };

    const vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);

    // --- Attribute ---

    const canvasVertices = Utilities.WebGL.Points.rectangle(0, 0, 1, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(canvasVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(locations.aCanvasVertices);
    gl.vertexAttribPointer(locations.aCanvasVertices, 2, gl.FLOAT, false, 0, 0);

    // --- Texture ---

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

    const target = gl.TEXTURE_2D;
    const level = 0;
    const internalFormat = gl.RGB32F;
    const width = 100;
    const height = 100;
    const border = 0;
    const format = gl.RGB;
    const type = gl.FLOAT;

    const textureData: number[] = [];
    for (let i = 0; i < width * height; i++) {
      const xPosition = Utilities.Random.range(0, 1);
      const yPosition = Utilities.Random.range(0, 1);
      const angle = Math.random() * Utilities.Mathematics.TAU;

      textureData.push(xPosition);
      textureData.push(yPosition);
      textureData.push(angle);
    }

    const data = new Float32Array(textureData);
    gl.texImage2D(target, level, internalFormat, width, height, border, format, type, data);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // --- Main ---

    gl.useProgram(program);
    gl.bindVertexArray(vertexArray);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1i(locations.uTextureIndex, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
}