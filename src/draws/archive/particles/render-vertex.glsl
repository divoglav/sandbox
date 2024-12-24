#version 300 es

in vec2 a_canvasVertices;

out vec2 v_canvasVertices;
flat out vec3 v_texel;

uniform sampler2D u_textureIndex;

void main() {
  vec2 textureCoordinates = a_canvasVertices * 0.5 + 0.5;
  vec3 texel = texture(u_textureIndex, textureCoordinates).rgb;

  gl_Position = vec4(a_canvasVertices, 0, 1);
  gl_PointSize = (texel.x + texel.y + texel.z) * 5.0;

  v_texel = texel;
}
