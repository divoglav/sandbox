#version 300 es

in vec2 a_textureCoordinates;

out vec2 v_textureCoordinates;

void main() {
  gl_Position = vec4(a_textureCoordinates, 0.0, 1.0);

  v_textureCoordinates = a_textureCoordinates;
}
