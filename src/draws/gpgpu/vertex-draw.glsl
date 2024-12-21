#version 300 es

in vec2 position;

uniform mat4 matrix; 

void main() {
  gl_Position = vec4(position, 0, 1);
  gl_PointSize = 5.0;
}
