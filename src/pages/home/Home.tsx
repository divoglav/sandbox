import { onMount } from "solid-js";
import { GpGPU } from "../../draws/gpgpu/gpgpu";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new GpGPU(canvasRef).setup();
  });


  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
