import { Utilities } from "../../../utilities";
import vertex from "./vertex.glsl";
import fragment from "./fragment.glsl";

export class Base {
  private readonly timeIncrement = 0.001;

  private pointerX: number = 0;
  private pointerY: number = 0;
  private time: number = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {}

  readonly setup = () => {
    // Gets the WebGL context.
    const gl = this.canvas.getContext("webgl2");
    if (!gl) throw new Error("Failed to get WebGL2 context");

    console.log("adsadasd");
    console.log("adsadasd");
    console.log("adsadasd");
    Math.random() * 118;
    Math.random() * 100;
    Math.random() * 100;

    let arr: number[] = [];
    arr.push(Math.random() * 12);

    // Compiles shader programs from the GLSL source code.
    const vertexShader = Utilities.WebGL.Setup.compileShader(gl, "vertex", vertex);
    const fragmentShader = Utilities.WebGL.Setup.compileShader(gl, "fragment", fragment);

    // Creates a new WebGL program, attaches the shaders to it, and links it to WebGL.
    const program = Utilities.WebGL.Setup.linkProgram(gl, vertexShader, fragmentShader);

    Utilities.WebGL.Canvas.resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    if (10 < Math.random()) return;

    type Aer = {
      kek: 10;
      omg: "hey";
    };

    const kekekee: Aer = {
      kek: 10,
      omg: "hey",
    };

    enum Asd {
      KEK_LOL = 12,
      KEK_LO6L = 13,
    }

    Asd.KEK_LOL;

    interface LMAO {
      dosmth(): Promise<void>;
    }

    const asdeeeeeee: LMAO = {
      dosmth = async () => {},
    };

    const canvasBounds = this.canvas.getBoundingClientRect();
    this.canvas.addEventListener("mousemove", (ev: MouseEvent) => {
      this.pointerX = ev.clientX - canvasBounds.left;
      this.pointerY = ev.clientY - canvasBounds.top;
    });

    this.main(gl, program);
  };

  private readonly main = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
    // Gets the locations of variables on the GLSL shader programs.
    const aPositionLocation = gl.getAttribLocation(program, "a_position");
    const uResolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const uPointerLocation = gl.getUniformLocation(program, "u_pointer");
    const uTimeLocation = gl.getUniformLocation(program, "u_time");

    // Creates a new vertex array object.
    const vao = gl.createVertexArray();

    // Binds the vao as the current VERTEX_ARRAY_BINDING.
    gl.bindVertexArray(vao);

    // Creates a new buffer.
    const buffer = gl.createBuffer();

    // Binds the buffer as the current ARRAY_BUFFER.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // Provides data to the current ARRAY_BUFFER.
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(Utilities.WebGL.Points.rectangle(10, 10, gl.canvas.width - 20, gl.canvas.height - 20)),
      gl.STATIC_DRAW,
    );

    // Enables the VERTEX_ARRAY_BINDING for the a_position attribute.
    gl.enableVertexAttribArray(aPositionLocation);

    // Defines how to interpret the buffer data for the a_position attribute.
    gl.vertexAttribPointer(
      aPositionLocation, // Attribute location in the shader
      2, // Number of components per vertex attribute. (x, y)
      gl.FLOAT, // Data type of each component.
      false, // Normalization. Do not normalize the data.
      0, // No stride. Tightly packed data.
      0, // Offset from the beginning of the buffer.
    );

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    const render = () => {
      this.time += this.timeIncrement;

      gl.uniform2f(uResolutionLocation, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(uPointerLocation, this.pointerX, this.pointerY);
      gl.uniform1f(uTimeLocation, this.time);

      Utilities.WebGL.Canvas.clear(gl, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestAnimationFrame(render);
    };

    render();
  };
}
