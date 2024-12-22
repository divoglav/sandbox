#version 300 es

in vec2 position;

uniform mat4 matrix; 

out vec2 v_position;

void main() {
  gl_Position = vec4(position, 0, 1);
  gl_PointSize = 2.5;

  v_position = position * vec2(1.0, -1.0);
}
