import { Utilities } from "../../../utilities";
import vertex from "./vertex.glsl";
import fragment from "./fragment.glsl";

export class TextureCustom2 {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  readonly setup = () => {
    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    const vertexShader = Utilities.WebGL.Setup.compileShader(gl, "vertex", vertex);
    const fragmentShader = Utilities.WebGL.Setup.compileShader(gl, "fragment", fragment);
    const program = Utilities.WebGL.Setup.linkProgram(gl, vertexShader, fragmentShader);

    Utilities.WebGL.Canvas.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    Utilities.WebGL.Canvas.clear(gl, 1);

    this.main(gl, program);
  };

  private readonly main = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
    const aPositionLocation = gl.getAttribLocation(program, "a_position");
    const aTextureCoordinatesLocation = gl.getAttribLocation(program, "a_textureCoordinates");
    const uResolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const uImageLocation = gl.getUniformLocation(program, "u_image");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // aPosition
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(Utilities.WebGL.Points.rectangle(0, 0, gl.canvas.width, gl.canvas.height)),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

    // aTextureCoordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Utilities.WebGL.Points.rectangle(0, 0, 1, 1)), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aTextureCoordinatesLocation);
    gl.vertexAttribPointer(aTextureCoordinatesLocation, 2, gl.FLOAT, false, 0, 0);

    // Custom texture.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

    // Fill texture with 100x100 pixels
    const level = 0;
    const internalFormat = gl.RGB8;
    const width = 100;
    const height = 100;
    const border = 0;
    const format = gl.RGB;
    const type = gl.UNSIGNED_BYTE;

    const bytesPerPixel = 3;
    const totalBytes = width * height * bytesPerPixel;

    const colors: number[] = [];
    for (let i = 0; i < totalBytes; i++) {
      colors.push(Math.random() * 256);
    }

    const data = new Uint8Array(colors);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Draw.
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform2f(uResolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(uImageLocation, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
}
