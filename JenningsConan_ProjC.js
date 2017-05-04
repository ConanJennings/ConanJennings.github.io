//Conan Jennings Project C
//cej 379

var VSHADER_SOURCE =
  //-------------ATTRIBUTES of each vertex, read from our Vertex Buffer Object
  'attribute vec4 a_Position; \n' +   // vertex position (model coord sys)
  'attribute vec4 a_Normal; \n' +     // vertex normal vector (model coord sys)
  'uniform vec3 u_Kd; \n' +
  'uniform mat4 u_ModelMatrix; \n' +    // Model matrix
  'uniform mat4 u_NormalMatrix; \n' +   // Inverse Transpose of ModelMatrix;
  'uniform mat4 u_ProjMatrix; \n' +
  'uniform mat4 u_ViewMatrix; \n' +
  //-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
  'varying vec3 v_Kd; \n' +             // Phong Lighting: diffuse reflectance
  'varying vec4 v_Position; \n' +
  'varying vec3 v_Normal; \n' +         // Why Vec3? its not a point, hence w==0

  'void main() { \n' +
        // Compute CVV coordinate values from our given vertex. This 'built-in'
        // 'varying' value gets interpolated to set screen position for each pixel.
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
        // Calculate the vertex position & normal vec in the WORLD coordinate system
        // for use as a 'varying' variable: fragment shaders get per-pixel values
        // (interpolated between vertices for our drawing primitive (TRIANGLE)).
  '  v_Position = u_ModelMatrix * a_Position; \n' +
        // 3D surface normal of our vertex, in world coords.  ('varying'--its value
        // gets interpolated (in world coords) for each pixel's fragment shader.
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Kd = u_Kd; \n' +   // find per-pixel diffuse reflectance from per-vertex
                          // (no per-pixel Ke,Ka, or Ks, but you can do it...)
  '}\n';

//=============================================================================
// Fragment shader program
//=============================================================================
var FSHADER_SOURCE =
  //-------------Set precision.
  // GLSL-ES 2.0 defaults (from spec; '4.5.3 Default Precision Qualifiers'):
  // DEFAULT for Vertex Shaders:  precision highp float; precision highp int;
  //                  precision lowp sampler2D; precision lowp samplerCube;
  // DEFAULT for Fragment Shaders:  UNDEFINED for float; precision mediump int;
  //                  precision lowp sampler2D; precision lowp samplerCube;
  // MATCH the Vertex shader precision for float and int:
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  //-------------UNIFORMS: values set from JavaScript before a drawing command.
  // first light source:
  'uniform vec4 u_Lamp0Pos;\n' +
  'uniform vec3 u_Lamp0Amb;\n' +
  'uniform vec3 u_Lamp0Diff;\n' +
  'uniform vec3 u_Lamp0Spec;\n' +
  // second
  'uniform vec4 u_Lamp1Pos;\n' +
  'uniform vec3 u_Lamp1Amb;\n' +
  'uniform vec3 u_Lamp1Diff;\n' +
  'uniform vec3 u_Lamp1Spec;\n' +

  'uniform vec3 u_Ke;\n' +            // Phong Reflectance: emissive
  'uniform vec3 u_Ka;\n' +            // Phong Reflectance: ambient
  'uniform vec3 u_Ks;\n' +            // Phong Reflectance: specular
  'uniform vec4 u_eyePosWorld; \n' +

  //-------------VARYING:Vertex Shader values sent per-pix'''''''''''''''';el to Fragment shader:
  'varying vec3 v_Normal;\n' +        // Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +      // pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd; \n' +           // Find diffuse reflectance K_d per pix

  'uniform int currLightType;\n' +   //Holds current type of light

  'void main() { \n' +
  'if (currLightType == 0) {\n' +
      // Normalize! !!IMPORTANT!! TROUBLE if you don't! 
      // normals interpolated for each pixel aren't 1.0 in length any more!
  '  vec3 normal = normalize(v_Normal); \n' +
//  '  vec3 normal = v_Normal; \n' +
      // Find the unit-length light dir vector 'L' (surface pt --> light):
  '  vec3 lightDirection = normalize(u_Lamp0Pos.xyz - v_Position.xyz);\n' +
  '  vec3 lightDirection1 = normalize(u_Lamp1Pos.xyz - v_Position.xyz);\n' +
          // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  '  float nDotL1 = max(dot(lightDirection1, normal), 0.0); \n' +

  '  vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position.xyz); \n' +
      // The dot product of (unit-length) light direction and the normal vector
      // (use max() to discard any negatives from lights below the surface) 
      // (look in GLSL manual: what other functions would help?)
      // gives us the cosine-falloff factor needed for the diffuse lighting term:
  '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
  '  vec3 H1 = normalize(lightDirection1 + eyeDirection); \n' +
      // The Blinn-Phong lighting model computes the specular term faster 
      // because it replaces the (V*R)^shiny weighting with (H*N)^shiny,
      // where 'halfway' vector H has a direction half-way between L and V
      // H = norm(norm(V) + norm(L)).  Note L & V already normalized above.
      // (see http://en.wikipedia.org/wiki/Blinn-Phong_shading_model)
  '  float nDotH = max(dot(H, normal), 0.0); \n' +
  '  float nDotH1 = max(dot(H1, normal), 0.0); \n' +
      // (use max() to discard any negatives from lights below the surface)
      // Apply the 'shininess' exponent K_e:
      // Try it two different ways:   The 'new hotness': pow() fcn in GLSL.
      // CAREFUL!  pow() won't accept integer exponents! Convert K_shiny!

  '  float e64 = pow(nDotH, 64.0); \n' +
  '  float e641 = pow(nDotH1, 64.0); \n' +
  // Calculate the final color from diffuse reflection and ambient reflection

  '  vec3 emissive = u_Ke;\n' +
  '  vec3 ambient = u_Lamp0Amb * u_Ka + u_Lamp1Amb * u_Ka;\n' +
  '  vec3 diffuse = u_Lamp0Diff * v_Kd * nDotL + u_Lamp1Diff * v_Kd * nDotL1;\n' +
  '  vec3 speculr = u_Lamp0Spec * u_Ks * e64 + u_Lamp1Spec * u_Ks * e641;\n' +
  '  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
  '  }\n' +
  'else {\n' +
  '  vec3 normal = normalize(v_Normal); \n' +

  '  vec3 lightDirection = normalize(u_Lamp0Pos.xyz - v_Position.xyz);\n' +
  '  vec3 lightDirection1 = normalize(u_Lamp1Pos.xyz - v_Position.xyz);\n' +

  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  '  float nDotL1 = max(dot(lightDirection1, normal), 0.0); \n' +

  '  vec3 ref = max(reflect(lightDirection, normal), 0.0); \n' +
  '  vec3 ref1 = max(reflect(lightDirection1, normal), 0.0); \n' +

  '  vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position.xyz); \n' +
  '  vec3 H = normalize(eyeDirection); \n' +
  '  float nDotH = max(dot(H, ref), 0.0); \n' +
  '  float nDotH1 = max(dot(H, ref1), 0.0); \n' +

  '  float e64 = pow(nDotH, 64.0); \n' +
  '  float e641 = pow(nDotH1, 64.0); \n' +

  '  vec3 emissive = u_Ke;\n' +
  '  vec3 ambient = u_Lamp0Amb * u_Ka + u_Lamp1Amb * u_Ka;\n' +
  '  vec3 diffuse = u_Lamp0Diff * v_Kd * nDotL + u_Lamp1Diff * v_Kd * nDotL1;\n' +
  '  vec3 speculr = u_Lamp0Spec * u_Ks * e64 + u_Lamp1Spec * u_Ks * e641;\n' +
  '  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
  '}\n' +
  '}\n';

//Global Variables
var gl;

var u_ViewMatrix, u_ProjMatrix, u_ModelMatrix, u_NormalMatrix;
var viewMatrix = new Matrix4();
var modelMatrix = new Matrix4();
var projMatrix = new Matrix4();
var normalMatrix = new Matrix4();

var u_Ke, u_Ks, u_Ka, u_Kd;
var LposX = 0, LposZ = 3, LposY = 0;
var ambiR = 0.0, ambiG = 2, ambiB = 0.0; 
var diffR = 1.0, diffG = 1.0, diffB = 1.0; 
var specR = 1.0, specG = 1.0, specB = 1.0;

var floatsPerVertex = 9;
var ANGLE_STEP = 25.0;
var currentAngle = 0.0;
var projMatrix = new Matrix4();

var seeX = 0,
  seeZ = 0,
  seeY = -6,
  eyeX = 0,
  eyeY = 0,
  eyeZ = -5;
var rad90 = 1.5708; //90 in radians

var lightOn = true;
var currLightType;
var lightType = 0;

function main() {

  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel
  // unless the new Z value is closer to the eye than the old one..
  //  gl.depthFunc(gl.LESS);       // WebGL default setting:
  gl.enable(gl.DEPTH_TEST);

  var n = initVertexBuffers(gl);

  if (n < 0) {
    console.log('Failed to specify the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.4, 1.4, 1.0);

  // Get storage location of matrices
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get GPU storage location for u_ViewMatrix');
    return
  }

  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ViewMatrix || !u_ProjMatrix) {
    console.log('Failed to get u_ViewMatrix or u_ProjMatrix');
    return;
  }

  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get GPU storage location for u_ModelMatrix');
    return
  }

  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get GPU storage location for u_NormalMatrix');
    return
  }

  var u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  
  //  1st Light
  var u_Lamp0Pos = gl.getUniformLocation(gl.program, 'u_Lamp0Pos');
  var u_Lamp0Amb = gl.getUniformLocation(gl.program, 'u_Lamp0Amb');
  var u_Lamp0Diff = gl.getUniformLocation(gl.program, 'u_Lamp0Diff');
  var u_Lamp0Spec = gl.getUniformLocation(gl.program, 'u_Lamp0Spec');

  // 2nd Light
  var u_Lamp1Pos = gl.getUniformLocation(gl.program, 'u_Lamp1Pos');
  var u_Lamp1Amb = gl.getUniformLocation(gl.program, 'u_Lamp1Amb');
  var u_Lamp1Diff = gl.getUniformLocation(gl.program, 'u_Lamp1Diff');
  var u_Lamp1Spec = gl.getUniformLocation(gl.program, 'u_Lamp1Spec');

  currLightType = gl.getUniformLocation(gl.program, 'currLightType');

  // ... for Phong material/reflectance:
  u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
  u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
  u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
  u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');

  // Set light position
  gl.uniform4f(u_Lamp0Pos, LposX, LposZ, LposY, 1.0);
  // Set its light output:
  gl.uniform3f(u_Lamp0Amb, ambiR, ambiG, ambiB); // ambient
  gl.uniform3f(u_Lamp0Diff, diffR, diffG, diffB); // diffuse
  gl.uniform3f(u_Lamp0Spec, specR, specG, specB); // Specular'

  // Set its light output:
  gl.uniform3f(u_Lamp1Amb, 0.4, 0.4, 0.4); // ambient
  gl.uniform3f(u_Lamp1Diff, 1.0, 1.0, 1.0); // diffuse
  gl.uniform3f(u_Lamp1Spec, 1.0, 1.0, 1.0); // Specular

  var modelMatrix = new Matrix4();
  var mvpMatrix = new Matrix4();
  var normalMatrix = new Matrix4();

  document.onkeydown = function(ev) {
    keydown(ev, gl, u_ViewMatrix, viewMatrix, modelMatrix, u_ModelMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix);
  };

  draw(gl, u_ViewMatrix, viewMatrix, modelMatrix, u_ModelMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix);

  var tick = function() {
    currentAngle = animate(currentAngle);
    if (lightOn) {
      gl.uniform3f(u_Lamp0Amb, ambiR, ambiG, ambiB);
      gl.uniform3f(u_Lamp0Diff, diffR, diffG, diffB);
      gl.uniform3f(u_Lamp0Spec, specR, specG, specB);
    } else {
      gl.uniform3f(u_Lamp0Amb, 0, 0, 0);
      gl.uniform3f(u_Lamp0Diff, 0, 0, 0);
      gl.uniform3f(u_Lamp0Spec, 0, 0, 0);
    }
    gl.uniform4f(u_Lamp0Pos, LposX, LposZ, LposY, 1.0);
    gl.uniform4f(u_Lamp1Pos, seeX, seeZ, seeY, 1);
    draw(gl, u_ViewMatrix, viewMatrix, modelMatrix, u_ModelMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix); // Draw the triangles
    requestAnimationFrame(tick, canvas);
  };

  tick();
  winResize(u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix, u_ProjMatrix, u_NormalMatrix, normalMatrix);
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

  var xcount = 100;     // # of lines to draw in x,y to make the grid.
  var ycount = 100;   
  var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([.3, .3, .3]); // bright yellow
  var yColr = new Float32Array([.1, .1, .1]); // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = xColr[0];     // red
    gndVerts[j+4] = xColr[1];     // grn
    gndVerts[j+5] = xColr[2];     // blu
    gndVerts[j+6] = 0.0;
    gndVerts[j+7] = 0.0;
    gndVerts[j+8] = 1.0;
  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = yColr[0];     // red
    gndVerts[j+4] = yColr[1];     // grn
    gndVerts[j+5] = yColr[2];     // blu
    gndVerts[j+6] = 0.0;
    gndVerts[j+7] = 0.0;
    gndVerts[j+8] = 1.0;
  }
}

function makeSphere(){
var phi = 1.618;
var pho = 1/phi;

SphereVerts = new Float32Array([ 
  0, -pho, phi,  1,0,0,0, -pho, phi, 
   1, -1, 1, 1,0,0, 1, -1, 1, 
  phi, 0, pho, 1,0,0,phi, 0, pho, 
  0, -pho, phi, 1,0,0,0, -pho, phi, 
  phi, 0, pho, 1,0,0,phi, 0, pho, 
  1,1, 1, 1,0,0, 1,1, 1, 
  0, -pho, phi, 1,0,0, 0, -pho, phi, 
  1,1, 1, 1,0,0, 1,1, 1, 
  0,pho, phi, 1,0,0, 0,pho, phi, 
  
  0,pho, phi, 1,0,0, 0,pho, phi, 
  1,1, 1, 1,0,0, 1,1, 1, 
  pho, phi, 0, 1,0,0,pho, phi, 0, 
  0,pho, phi, 1,0,0, 0,pho, phi, 
  pho, phi, 0, 1,0,0,pho, phi, 0, 
  -pho, phi, 0, 1,0,0, -pho, phi, 0, 
  0,pho, phi, 1,0,0, 0,pho, phi, 
  -1,1, 1, 1,0,0, -1,1, 1, 
  -pho, phi, 0, 1,0,0,-pho, phi, 0, 
  
  phi, 0, pho, 1,0,0, phi, 0, pho, 
  1,1, 1,1,0,0, 1,1, 1, 
  pho, phi, 0, 1,0,0,pho, phi, 0, 
  phi, 0, pho, 1,0,0, phi, 0, pho, 
  phi, 0, -pho, 1,0,0, phi, 0, -pho, 
  1,1, -1, 1,0,0, 1,1, -1, 
  phi, 0, pho, 1,0,0,phi, 0, pho, 
  1,1, -1, 1,0,0, 1,1, -1, 
  pho, phi, 0, 1,0,0,pho, phi, 0, 
  
  pho, phi, 0, 1,0,0, pho, phi, 0, 
  -pho, phi, 0, 1,0,0, -pho, phi, 0, 
  -1,1, -1, 1,0,0, -1,1, -1, 
  pho, phi, 0, 1,0,0,pho, phi, 0, 
  1,1, -1, 1,0,0, 1,1, -1, 
  -1,1, -1, 1,0,0, -1,1, -1, 
  1,1, -1, 1,0,0, 1,1, -1, 
  0,pho, -phi, 1,0,0, 0,pho, -phi, 
  -1,1, -1, 1,0,0, -1,1, -1,  
  phi, 0, -pho, 1,0,0, phi, 0, -pho, 
  1,1, -1, 1,0,0, 1,1, -1, 
  0,-pho, -phi, 1,0,0, 0,-pho, -phi, 
  phi, 0, -pho, 1,0,0,phi, 0, -pho, 
  0,-pho, -phi, 1,0,0, 0,-pho, -phi, 
  1,-1, -1, 1,0,0, 1,-1, -1, 
  0,-pho, -phi, 1,0,0, 0,-pho, -phi, 
  1,1, -1, 1,0,0, 1,1, -1, 
  0,pho, -phi, 1,0,0, 0,pho, -phi, 
  
   1, -1, 1, 1,0,0,  1, -1, 1, 
  pho, -phi, 0, 1,0,0,pho, -phi, 0, 
  phi, 0, pho, 1,0,0, phi, 0, pho, 
  pho, -phi, 0, 1,0,0, pho, -phi, 0, 
  phi, 0, pho, 1,0,0, phi, 0, pho, 
  1,-1, -1, 1,0,0, 1,-1, -1, 
  phi, 0, pho, 1,0,0,phi, 0, pho, 
  phi, 0, -pho, 1,0,0, phi, 0, -pho, 
  1,-1, -1, 1,0,0, 1,-1, -1, 

  0,pho, -phi, 1,0,0,   0,pho, -phi, 
  0,-pho, -phi, 1,0,0, 0,-pho, -phi, 
  -1,1, -1, 1,0,0, -1,1, -1, 
  0,-pho, -phi, 1,0,0, 0,-pho, -phi, 
  -1,1, -1, 1,0,0, -1,1, -1, 
  -phi, 0, -pho, 1,0,0,-phi, 0, -pho, 
  0,-pho, -phi, 1,0,0, 0,-pho, -phi, 
  -phi, 0, -pho, 1,0,0,-phi, 0, -pho, 
  -1,-1, -1, 1,0,0, -1,-1, -1, 
  
  -1,-1, -1, 1,0,0, -1,-1, -1, 
  -1,-1, 1, 1,0,0, -1,-1, 1, 
  -phi, 0, pho, 1,0,0,-phi, 0, pho, 
  -1,-1, 1, 1,0,0, -1,-1, 1, 
  -1,-1, -1, 1,0,0, -1,-1, -1, 
  -pho, -phi, 0,1,0,0,-pho, -phi, 0, 
  -1,-1, -1, 1,0,0, -1,-1, -1, 
  -phi, 0, pho, 1,0,0,-phi, 0, pho, 
  -phi, 0, -pho, 1,0,0, -phi, 0, -pho, 
  
  1,-1, -1, 1,0,0,   1,-1, -1, 
  pho, -phi, 0, 1,0,0, pho, -phi, 0, 
  0,-pho, -phi, 1,0,0, 0,-pho, -phi, 
  pho, -phi, 0, 1,0,0,pho, -phi, 0, 
  0,-pho, -phi, 1,0,0, 0,-pho, -phi, 
  -pho, -phi, 0, 1,0,0,-pho, -phi, 0, 
  -pho, -phi, 0, 1,0,0, -pho, -phi, 0, 
  0,-pho, -phi, 1,0,0, 0,-pho, -phi, 
  -1,-1, -1, 1,0,0, -1,-1, -1, 

  -pho, phi, 0, 1,0,0,   -pho, phi, 0, 
  -1,1, -1, 1,0,0, -1,1, -1, 
  -1,1, 1, 1,0,0, -1,1, 1, 
  -1,1, -1, 1,0,0, -1,1, -1, 
  -1,1, 1, 1,0,0, -1,1, 1, 
  -phi, 0, -pho, 1,0,0,-phi, 0, -pho, 
  -phi, 0, -pho, 1,0,0, -phi, 0, -pho, 
  -phi, 0, pho, 1,0,0, -phi, 0, pho, 
  -1,1, 1, 1,0,0, -1,1, 1, 
  
  0,pho, phi, 1,0,0, 0,pho, phi, 
  -1,1, 1, 1,0,0, -1,1, 1, 
  0, -pho, phi, 1,0,0, 0, -pho, phi, 
  -1,1, 1, 1,0,0, -1,1, 1, 
  0, -pho, phi, 1,0,0, 0, -pho, phi, 
  -phi, 0, pho, 1,0,0, -phi, 0, pho, 
  0, -pho, phi, 1,0,0, 0, -pho, phi, 
  -phi, 0, pho, 1,0,0,-phi, 0, pho, 
  -1,-1, 1, 1,0,0, -1,-1, 1, 

   1, -1, 1, 1,0,0,  1, -1, 1, 
  0, -pho, phi, 1,0,0, 0, -pho, phi, 
  pho, -phi, 0, 1,0,0,pho, -phi, 0, 
  0, -pho, phi, 1,0,0, 0, -pho, phi, 
  pho, -phi, 0, 1,0,0,pho, -phi, 0, 
  -pho, -phi, 0, 1,0,0, -pho, -phi, 0, 
  0, -pho, phi, 1,0,0, 0, -pho, phi, 
  -pho, -phi, 0, 1,0,0,-pho, -phi, 0, 
  -1,-1, 1, 1,0,0,-1,-1, 1,])
}

function initVertexBuffers(gl) {
  makeSphere();
  makeGroundGrid();

  // Length of space array
  mySiz = gndVerts.length + SphereVerts.length

  // Total Verticies
  var nn = mySiz / floatsPerVertex;

  var verticesColors = new Float32Array(mySiz);
  var V = 0;
  gndStart = V;
  for (i = 0; i < gndVerts.length; V++, i++) {
    verticesColors[V] = gndVerts[i];
  }
  sphereStart = V;
  for (i = 0; i < SphereVerts.length; V++, i++) {
    verticesColors[V] = SphereVerts[i];
  }

  var vertexColorbuffer = gl.createBuffer();
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 9, 0);
  gl.enableVertexAttribArray(a_Position);

  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }

  gl.vertexAttribPointer( a_Normal, 3, gl.FLOAT, false, FSIZE * 9, FSIZE * 6);

  gl.enableVertexAttribArray(a_Normal);

  return nn;
}

function keydown(ev, gl, u_ViewMatrix, viewMatrix, modelMatrix, u_ModelMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix) {
  var dist = Math.sqrt(Math.pow((seeX - eyeX), 2) + Math.pow((seeY - eyeZ), 2));
  var mov_dist = 0.1;
  if (ev.keyCode == 39) { // Right Arrow
    seeX -= mov_dist;
    eyeX -= mov_dist;
  } else
  if (ev.keyCode == 37) { // Left Arrow
    seeX += mov_dist;
    eyeX += mov_dist;
  } else
  if (ev.keyCode == 38) { // Up Arrow
    seeY += mov_dist;
    eyeZ += mov_dist;
  } else
  if (ev.keyCode == 40) { // Down Arrow
    seeY -= mov_dist;
    eyeZ -= mov_dist;
  } else
  if (ev.keyCode == 87) { // W
    eyeY += mov_dist;
  } else
  if (ev.keyCode == 83) { // S
    eyeY -= mov_dist;
  } else
  if (ev.keyCode == 68) { // D
    rad90 += 0.1;
    eyeX = seeX + Math.cos(rad90);
    eyeZ = seeY + Math.sin(rad90);
  } else
  if (ev.keyCode == 65) { // A
    rad90 -= 0.1;
    eyeX = seeX + Math.cos(rad90);
    eyeZ = seeY + Math.sin(rad90);
  } else
  if (ev.keyCode == 17) { // ctrl
    seeZ -= mov_dist;
    eyeY -= mov_dist;
  } else
  if (ev.keyCode == 16) { // shift
    seeZ += mov_dist;
    eyeY += mov_dist;
  } else {
    return;
  } // Prevent the unnecessary drawing
  draw(gl, u_ViewMatrix, viewMatrix, modelMatrix, u_ModelMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix);
}

function draw(gl, u_ViewMatrix, viewMatrix, modelMatrix, u_ModelMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix) {

  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw in the FIRST of several 'viewports'
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Set the matrix to be used for to set the camera view
  viewMatrix.setLookAt(seeX, seeZ, seeY, // eye position
    eyeX, eyeY, eyeZ, // look-at point (origin)
    0, 1, 0); // up vector (+y)

  var vpAspect = canvas.width / canvas.height;

  // Pass the view projection matrix
  projMatrix.setPerspective(30, vpAspect, 0.1, 100);

  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // Draw the scene:
  drawMyScene(gl, u_ViewMatrix, viewMatrix, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix);
}

function drawMyScene(gl, myu_ViewMatrix, myViewMatrix, modelMatrix, u_ModelMatrix, normalMatrix, u_NormalMatrix) {

  //Draw 3 jointed "spheres"
  var myMat = new Material(MATL_GRN_PLASTIC);
  gl.uniform3fv(u_Ke, myMat.K_emit.slice(0, 3));
  gl.uniform3fv(u_Ka, myMat.K_ambi.slice(0, 3));
  gl.uniform3fv(u_Kd, myMat.K_diff.slice(0, 3));
  gl.uniform3fv(u_Ks, myMat.K_spec.slice(0, 3));

 
 pushMatrix(modelMatrix)
 pushMatrix(normalMatrix)
 modelMatrix.setTranslate(0,0,5)
 modelMatrix.setScale(.505,.505,.505)
 modelMatrix.rotate(currentAngle, 0, 1, 0);
 normalMatrix.setInverseOf(modelMatrix);
 normalMatrix.transpose();
 gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 gl.drawArrays(gl.TRIANGLES, sphereStart/floatsPerVertex, SphereVerts.length/floatsPerVertex);

 modelMatrix.translate(0,1.4,-2.5)
 modelMatrix.scale(.4,.4,.4)
 modelMatrix.rotate(currentAngle + 30, 0, 0, 1);
 normalMatrix.setInverseOf(modelMatrix);
 normalMatrix.transpose();
 gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 gl.drawArrays(gl.TRIANGLES, sphereStart/floatsPerVertex, SphereVerts.length/floatsPerVertex);

 modelMatrix.translate(0,3,-1)
 modelMatrix.scale(.5,.5,.5)
 modelMatrix.rotate(currentAngle + 45, 0, 0, 1);
 normalMatrix.setInverseOf(modelMatrix);
 normalMatrix.transpose();
 gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 gl.drawArrays(gl.TRIANGLES, sphereStart/floatsPerVertex, SphereVerts.length/floatsPerVertex);


// 2nd "sphere"s"
  var myMat = new Material(MATL_COPPER_DULL);
  gl.uniform3fv(u_Ke, myMat.K_emit.slice(0, 3));
  gl.uniform3fv(u_Ka, myMat.K_ambi.slice(0, 3));
  gl.uniform3fv(u_Kd, myMat.K_diff.slice(0, 3));
  gl.uniform3fv(u_Ks, myMat.K_spec.slice(0, 3));

 modelMatrix.setScale(.5,.2,.2)
 modelMatrix.setTranslate(5,0,0)
 modelMatrix.rotate(currentAngle, 0, 1, 0);
 normalMatrix.setInverseOf(modelMatrix);
 normalMatrix.transpose();
 gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 gl.drawArrays(gl.TRIANGLES, sphereStart/floatsPerVertex, SphereVerts.length/floatsPerVertex);

  modelMatrix.translate(-2,1,0)
 modelMatrix.scale(.4,.4,.4)
 modelMatrix.rotate(currentAngle + 30, 1, 0, 0);
 normalMatrix.setInverseOf(modelMatrix);
 normalMatrix.transpose();
 gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 gl.drawArrays(gl.TRIANGLES, sphereStart/floatsPerVertex, SphereVerts.length/floatsPerVertex);

 modelMatrix.translate(-2,2,0)
 modelMatrix.scale(.5,.5,.5)
 modelMatrix.rotate(currentAngle + 45, 1, 0, 0);
 normalMatrix.setInverseOf(modelMatrix);
 normalMatrix.transpose();
 gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 gl.drawArrays(gl.TRIANGLES, sphereStart/floatsPerVertex, SphereVerts.length/floatsPerVertex);


//3rd "sphere"
  var myMat = new Material(MATL_RUBY);
  gl.uniform3fv(u_Ke, myMat.K_emit.slice(0, 3));
  gl.uniform3fv(u_Ka, myMat.K_ambi.slice(0, 3));
  gl.uniform3fv(u_Kd, myMat.K_diff.slice(0, 3));
  gl.uniform3fv(u_Ks, myMat.K_spec.slice(0, 3));

 pushMatrix(modelMatrix)
 pushMatrix(normalMatrix)
 modelMatrix.setScale(.2,.2,.2)
 modelMatrix.setTranslate(-5,0,0)
 modelMatrix.rotate(currentAngle, 0, -1, 0);
 normalMatrix.setInverseOf(modelMatrix);
 normalMatrix.transpose();
 gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 gl.drawArrays(gl.TRIANGLES, sphereStart/floatsPerVertex, SphereVerts.length/floatsPerVertex);

  modelMatrix.translate(2,1,0)
 modelMatrix.scale(.4,.4,.4)
 modelMatrix.rotate(currentAngle + 30, 1, 0, 0);
 normalMatrix.setInverseOf(modelMatrix);
 normalMatrix.transpose();
 gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 gl.drawArrays(gl.TRIANGLES, sphereStart/floatsPerVertex, SphereVerts.length/floatsPerVertex);

 modelMatrix.translate(2,2,0)
 modelMatrix.scale(.5,.5,.5)
 modelMatrix.rotate(currentAngle + 45, 1, 0, 0);
 normalMatrix.setInverseOf(modelMatrix);
 normalMatrix.transpose();
 gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 gl.drawArrays(gl.TRIANGLES, sphereStart/floatsPerVertex, SphereVerts.length/floatsPerVertex);


// Reset
  normalMatrix.setIdentity();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  modelMatrix.setIdentity();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);


  myViewMatrix.rotate(-90.0, 1, 0, 0);
  pushMatrix(myViewMatrix);
  myViewMatrix.translate(0.0, 0.0, -0.6);
  myViewMatrix.scale(0.4, 0.4, 0.4);
  gl.uniformMatrix4fv(myu_ViewMatrix, false, myViewMatrix.elements);

  // Draw Ground Plane
  var myMat = new Material(MATL_COPPER_DULL);
  gl.uniform3fv(u_Ke, myMat.K_emit.slice(0, 3));
  gl.uniform3fv(u_Ka, myMat.K_ambi.slice(0, 3));
  gl.uniform3fv(u_Kd, myMat.K_diff.slice(0, 3));
  gl.uniform3fv(u_Ks, myMat.K_spec.slice(0, 3));

  gl.drawArrays(gl.TRIANGLE_STRIP,
    gndStart / floatsPerVertex,
    gndVerts.length / floatsPerVertex);
}


//make the screen always fill the window
function winResize(u_ViewMatrix, viewMatrix, u_ModelMatrix, modelMatrix, u_ProjMatrix, u_NormalMatrix, normalMatrix) {
  var nuCanvas = document.getElementById('webgl');
  var nuGL = getWebGLContext(nuCanvas);

  nuCanvas.width = innerWidth;
  nuCanvas.height = innerHeight * .8;

  draw(nuGL, u_ViewMatrix, viewMatrix, modelMatrix, u_ModelMatrix, u_ProjMatrix, normalMatrix, u_NormalMatrix);
}

var g_last = Date.now();

function animate(angle) {
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}
 

function onOff(gl) {
  lightOn = !lightOn;
}

function Switch(gl){   
    //lamp0.isLit.elements.set([0.0, 0.0, 0.0]);
    if(!lamp0.isLit.elements[0] > 0){
      lamp0.isLit.elements.set([1.0, 1.0, 1.0]);
      document.getElementById("b1").innerHTML = "Headlight (on)";
      }
      else{
      lamp0.isLit.elements.set([0.0, 0.0, 0.0]);
      document.getElementById("b1").innerHTML = "Headlight (off)";
      }
  draw();
}


function switchLighting(gl) {
  lightType = (lightType + 1) % 2;
  gl.uniform1i(currLightType, lightType);
}

function plusX() {
  LposX += 2;
}
function subX() {
  LposX -= 2;
}
function plusZ() {
  LposZ += 2;
}
function subZ() {
  LposZ -= 2;
}
function plusY() {
  LposY += 2;
}
function subY() {
  LposY -= 2;
}
function plusAmbiR() {
  ambiR = Math.min(1.0, ambiR + 0.1);
}
function plusAmbiG() {
  ambiG = Math.min(1.0, ambiG + 0.1);
}
function plusAmbiB() {
  ambiB = Math.min(1.0, ambiB + 0.1);
}
function subAmbiR() {
  ambiR = Math.max(0.0, ambiR - 0.1);
}
function subAmbiG() {
  ambiG = Math.max(0.0, ambiG - 0.1);
}
function subAmbiB() {
  ambiB = Math.max(0.0, ambiB - 0.1);
}
function plusDiffR() {
  diffR = Math.min(1.0, diffR + 0.1);
}
function plusDiffG() {
  diffG = Math.min(1.0, diffG + 0.1);
}
function plusDiffB() {
  diffB = Math.min(1.0, diffB + 0.1);
}
function subDiffR() {
  diffR = Math.max(0.0, diffR - 0.1);
}
function subDiffG() {
  diffG = Math.max(0.0, diffG - 0.1);
}
function subDiffB() {
  diffB = Math.max(0.0, diffB - 0.1);
}
function plusSpecR() {
  specR = Math.min(1.0, specR + 0.1);
}
function plusSpecG() {
  specG = Math.min(1.0, specG + 0.1);
}
function plusSpecB() {
  specB = Math.min(1.0, specB + 0.1);
}
function subSpecR() {
  specR = Math.max(0.0, specR - 0.1);
}
function subSpecG() {
  specG = Math.max(0.0, specG - 0.1);
}
function subSpecB() {
  specB = Math.max(0.0, specB - 0.1);
}
