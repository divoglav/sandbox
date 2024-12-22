#version 300 es

in vec2 a_canvasVertices;

out vec2 v_coordinates;

uniform sampler2D u_newTextureIndex;

const float total = 144.0;
const float width = 12.0;
const float height = 12.0;

vec2 getCoordinates(float id) {
  float xIndex = mod(id, width);
  float yIndex = floor(id / width);

  return vec2(
    (xIndex + 0.5) / width,
    (yIndex + 0.5) / height
  );
}

void main() {
  vec2 point = getCoordinates(float(gl_VertexID));

  vec3 nextData = texture(u_newTextureIndex, point).rgb;

  gl_PointSize = 5.0;

  vec2 position = nextData.xy * 2.0 - 1.0;

  gl_Position = vec4(position, 0.0, 1.0);
}
