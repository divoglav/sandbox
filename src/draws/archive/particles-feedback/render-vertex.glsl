#version 300 es

in vec2 a_newPosition;

flat out vec3 v_texel;

uniform sampler2D u_textureIndex;

void main() {
  // vec2 textureCoordinates = a_canvasVertices * 0.5 + 0.5;
  vec2 textureCoordinates = a_newPosition;
  vec3 texel = texture(u_textureIndex, textureCoordinates).rgb;

  gl_Position = vec4(a_newPosition * 2.0 - 1.0, 0, 1);
  gl_PointSize = (texel.x + texel.y + texel.z) * 5.0;
  // gl_PointSize = 3.0;

  v_texel = texel;
}
