#version 300 es
precision highp float;

#define PI radians(180.0)
#define TAU radians(360.0)

in vec2 v_coordinates;

out vec4 outData;

uniform sampler2D u_oldTextureIndex;

void main() {
  vec3 firstData = texture(u_oldTextureIndex, v_coordinates).rgb;

  float xPosition = firstData.x;
  float yPosition = firstData.y;

  outData = vec4(
    xPosition,
    yPosition,
    firstData.z,
    1.0
  );
}
