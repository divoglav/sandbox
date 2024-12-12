import vertex from "./vertex.glsl";
import fragment from "./fragment.glsl";

export class GpGPU {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  private readonly createShader = (gl: WebGL2RenderingContext, type: GLenum, source: string) => {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) as string);
    return shader;
  };

  readonly setup = () => {
    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    // Setup.
    const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    if (!program) throw new Error("program error");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.transformFeedbackVaryings(program, ["sum", "difference", "product"], gl.SEPARATE_ATTRIBS);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link program error");

    this.main(gl, program);
  };

  private readonly main = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
    const aLoc = gl.getAttribLocation(program, "a");
    const bLoc = gl.getAttribLocation(program, "b");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const makeBuffer = (gl: WebGL2RenderingContext, sizeOrData: number) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, gl.STATIC_DRAW);
      return buffer;
    };

    const makeBufferAndSetAttribute = (gl: WebGL2RenderingContext, data: any, location: any) => {
      makeBuffer(gl, data);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 1, gl.FLOAT, false, 0, 0);
    };

    const a = [1, 2, 3, 4, 5, 6];
    const b = [3, 6, 9, 12, 15, 18];

    makeBufferAndSetAttribute(gl, new Float32Array(a), aLoc);
    makeBufferAndSetAttribute(gl, new Float32Array(b), bLoc);

    // ------------------------------

    const transformFeedback = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

    const sumBuffer = makeBuffer(gl, a.length * 4);
    const differenceBuffer = makeBuffer(gl, a.length * 4);
    const productBuffer = makeBuffer(gl, a.length * 4);

    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, sumBuffer);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, differenceBuffer);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, productBuffer);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // ------------------------------

    gl.useProgram(program);

    gl.bindVertexArray(vao);

    gl.enable(gl.RASTERIZER_DISCARD);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, a.length);
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.disable(gl.RASTERIZER_DISCARD);

    const printResults = (buffer: WebGLBuffer, label: string) => {
      const results = new Float32Array(a.length);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.getBufferSubData(gl.ARRAY_BUFFER, 0, results);

      console.log(`${label}: ${results}`);
    };

    console.log(`a: ${a}`);
    console.log(`b: ${b}`);

    printResults(sumBuffer!, "sums");
    printResults(differenceBuffer!, "difference");
    printResults(productBuffer!, "product");
  };
}
