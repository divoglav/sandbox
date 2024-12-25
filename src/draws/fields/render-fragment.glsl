#version 300 es
precision highp float;

out vec4 outColor;

uniform GlobalStaticData {
  float u_originPullScalar;
  float u_repelScalar;
  float u_repelNearestScalar;
  float u_maxRepelDistance;
  float u_minPointSize;
  float u_pointSizeByOriginDistance;
};

void main() {
  vec3 color = vec3(1.0, 1.0, 1.0);

  outColor = vec4(color, 1.0);
}
