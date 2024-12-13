import { onMount } from "solid-js";
//import { Base } from "../../draws/archive/base/base";
//import { Kernel } from "../../draws/archive/kernel/kernel";
//import { Texture } from "../../draws/archive/texture/texture";
//import { TextureCustom } from "../../draws/archive/texture-custom/texture-custom";
//import { TextureCustom2 } from "../../draws/archive/texture-custom-2/texture-custom-2";
import { TextureMultiple } from "../../draws/archive/texture-multiple/texture-multiple";

export const Home = () => {
  let canvasRef!: HTMLCanvasElement;

  onMount(() => {
    new TextureMultiple(canvasRef).setup();
  });

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};
