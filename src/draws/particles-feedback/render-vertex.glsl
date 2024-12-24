#version 300 es

in vec2 a_newPosition;

flat out vec3 v_texelColor;

uniform sampler2D u_textureIndex;

void main() {
  vec3 texelColor = texture(u_textureIndex, a_newPosition).rgb;

  vec2 clipSpace = a_newPosition * 2.0 - 1.0;

  gl_Position = vec4(clipSpace, 0.0, 1.0);
  gl_PointSize = (texelColor.x + texelColor.y + texelColor.z) * 5.0;

  v_texelColor = texelColor;
}
