import { Utilities } from "../../../utils/utilities";
import vertex from "./vertex.glsl";
import fragment from "./fragment.glsl";

export class Kernel {
  private image = new Image();

  constructor(private readonly canvas: HTMLCanvasElement) { }

  readonly setup = () => {
    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    const vertexShader = Utilities.WebGL.setup.compileShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = Utilities.WebGL.setup.compileShader(gl, gl.FRAGMENT_SHADER, fragment);
    const program = Utilities.WebGL.setup.linkProgram(gl, vertexShader, fragmentShader);

    Utilities.WebGL.utils.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    Utilities.WebGL.utils.clear(gl, 1);

    this.image.src = "assets/lateralus.png";
    this.image.onload = () => this.main(gl, program);
  };

  private readonly main = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
    const aPositionLocation = gl.getAttribLocation(program, "a_position");
    const aTextureCoordinatesLocation = gl.getAttribLocation(program, "a_textureCoordinates");

    const uResolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const uImageLocation = gl.getUniformLocation(program, "u_image");
    const uKernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
    const uKernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // aPosition
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(Utilities.WebGL.points.rectangle(0, 0, gl.canvas.width, gl.canvas.height)),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

    // aTextureCoordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Utilities.WebGL.points.rectangle(0, 0, 1, 1)), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aTextureCoordinatesLocation);
    gl.vertexAttribPointer(aTextureCoordinatesLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

    // Kernel.
    const kernel = Utilities.WebGL.kernels.identity;

    const kernelWeight = Utilities.WebGL.kernels.computeKernelWeight(kernel);

    // Draw.
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    gl.uniform2f(uResolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(uImageLocation, 0);
    gl.uniform1fv(uKernelLocation, kernel);
    gl.uniform1f(uKernelWeightLocation, kernelWeight);

    Utilities.WebGL.utils.clear(gl);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
}
