#version 300 es

flat out vec2 v_coordinates;

// TODO: uniform block
const float width = 15.0;
const float height = 15.0;
const float pointSize = 51.0;

vec2 getCoordinates(float id) {
  float xIndex = mod(id, width);
  float yIndex = floor(id / width);
  return vec2((xIndex + 0.5) / width, (yIndex + 0.5) / height);
}

void main() {
  vec2 point = getCoordinates(float(gl_VertexID));

  vec2 clipSpace = point * 2.0 - 1.0;

  gl_Position = vec4(clipSpace, 0.0, 1.0);
  gl_PointSize = pointSize;

  v_coordinates = point;
}
