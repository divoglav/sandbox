#version 300 es

#define PI radians(180.0)
#define TAU radians(360.0)

precision highp float;

uniform sampler2D u_textureIndex;

in vec2 v_textureCoordinates;

out vec4 outColor;

void main() {
  vec3 data = texture(u_textureIndex, v_textureCoordinates).rgb;

  vec3 colors = vec3(
    data.x * 0.5 + 0.5,
    data.y * 0.5 + 0.5,
    data.z / TAU
  );

  outColor = vec4(colors, 1.0);
}
