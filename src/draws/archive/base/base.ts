import { Utilities } from "../../../utils/utilities";
import vertex from "./vertex.glsl";
import fragment from "./fragment.glsl";

export class Base {
  private readonly timeIncrement = 0.001;

  private pointerX: number = 0;
  private pointerY: number = 0;
  private time: number = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  readonly setup = () => {
    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    const vertexShader = Utilities.WebGL.setup.compileShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = Utilities.WebGL.setup.compileShader(gl, gl.FRAGMENT_SHADER, fragment);
    const program = Utilities.WebGL.setup.linkProgram(gl, vertexShader, fragmentShader);

    Utilities.WebGL.utils.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const canvasBounds = this.canvas.getBoundingClientRect();
    this.canvas.addEventListener("mousemove", (ev: MouseEvent) => {
      this.pointerX = ev.clientX - canvasBounds.left;
      this.pointerY = ev.clientY - canvasBounds.top;
    });

    this.main(gl, program);
  };

  private readonly main = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
    const aPositionLocation = gl.getAttribLocation(program, "a_position");

    const uResolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const uPointerLocation = gl.getUniformLocation(program, "u_pointer");
    const uTimeLocation = gl.getUniformLocation(program, "u_time");

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(Utilities.WebGL.points.rectangle(10, 10, gl.canvas.width - 20, gl.canvas.height - 20)),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(aPositionLocation);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    const render = () => {
      this.time += this.timeIncrement;

      gl.uniform2f(uResolutionLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(uPointerLocation, this.pointerX, this.pointerY);
      gl.uniform1f(uTimeLocation, this.time);

      Utilities.WebGL.utils.clear(gl, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    };

    render();
  };
}
