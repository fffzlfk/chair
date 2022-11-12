<script setup>
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { onMounted } from "vue";
import PartOption from "./components/PartOption.vue";
import ColorSqure from "./components/ColorSqure.vue";
import * as THREE from "three";
import colors from "./composables/colors.js";

const MODEL_PATH = "/models/chair.glb";

const BACKGROUND_COLOR = 0xf1f1f1;

const scene = new THREE.Scene();
// Set background
function setScene() {
  scene.background = new THREE.Color(BACKGROUND_COLOR);
  scene.fog = new THREE.Fog(BACKGROUND_COLOR, 20, 100);
}

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Set camera
function setCamera() {
  camera.position.z = 5;
  camera.position.x = 0;
}

const el = document.getElementById("el");
const renderer = new THREE.WebGLRenderer({ canvas: el });
function setRenderer() {
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
}

const INITIAL_MTL = new THREE.MeshPhongMaterial({
  color: 0xf1f1f1,
  shininess: 10,
});

const INITIAL_MAP = [
  { childID: "back", mtl: INITIAL_MTL },
  { childID: "base", mtl: INITIAL_MTL },
  { childID: "cushions", mtl: INITIAL_MTL },
  { childID: "legs", mtl: INITIAL_MTL },
  { childID: "supports", mtl: INITIAL_MTL },
];

let theModel;
let loaded = false;
const loader = new GLTFLoader();

function load() {
  loader.load(
    MODEL_PATH,
    function (gltf) {
      theModel = gltf.scene;

      theModel.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      // Set the models initial scale
      theModel.scale.set(2, 2, 2);
      theModel.rotation.y = Math.PI;

      // Offset the y position a bit
      theModel.position.y = -1;

      // Set initial textures
      for (let object of INITIAL_MAP) {
        initColor(theModel, object.childID, object.mtl);
      }

      // Add the model to the scene
      scene.add(theModel);

      // Remove the loader
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );
}

// Function - Add the textures to the models
function initColor(parent, type, mtl) {
  parent.traverse((o) => {
    if (o.isMesh) {
      if (o.name.includes(type)) {
        o.material = mtl;
        o.nameID = type; // Set a new property to identify this object
      }
    }
  });
}

// Add lights
function addLights() {
  // 半球光
  const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.4);
  hemiLight.position.set(0, 50, 0);
  // Add hemisphere light to scene
  scene.add(hemiLight);

  // 平行光
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
  dirLight.position.set(-8, 12, 8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
  // Add directional Light to scene
  scene.add(dirLight);
}

// Floor
const floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
const floorMaterial = new THREE.MeshPhongMaterial({
  color: 0xfdfdfd,
  shininess: 0,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
function setFloor() {
  floor.rotation.x = -0.5 * Math.PI;
  floor.receiveShadow = true;
  floor.position.y = -1;
  scene.add(floor);
}

// Add controls
const controls = new OrbitControls(camera, renderer.domElement);
function setControls() {
  controls.maxPolarAngle = Math.PI / 2;
  controls.minPolarAngle = Math.PI / 3;
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.dampingFactor = 0.1;
  controls.autoRotate = false; // Toggle this if you'd like the chair to automatically rotate
  controls.autoRotateSpeed = 0.2; // 30
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  if (theModel != null && loaded == false) {
    initialRotation();
  }
}

// New resizing method
function resizeRendererToDisplaySize(renderer) {
  const canvas = renderer.domElement;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const canvasPixelWidth = canvas.width / window.devicePixelRatio;
  const canvasPixelHeight = canvas.height / window.devicePixelRatio;

  const needResize = canvasPixelWidth !== width || canvasPixelHeight !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

// Opening rotate
let initRotate = 0;
function initialRotation() {
  initRotate++;
  if (initRotate <= 120) {
    theModel.rotation.y += Math.PI / 60;
  } else {
    loaded = true;
  }
}

function init() {
  setScene();
  setCamera();
  setRenderer();
  document.body.appendChild(renderer.domElement);
  load();
  animate();
  addLights();
  setFloor();
  setControls();
}

onMounted(() => {
  init();
});

const parts = ["legs", "cushions", "base", "supports", "back"];
let activePart = "legs";

function selectPart(part) {
  activePart = part;
}

function getStyle(color) {
  if (color.texture) {
    return { backgroundImage: `url(${color.texture})` };
  } else {
    return { background: `#${color.color}` };
  }
}

function selectColor(color) {
  let new_mtl;
  if (color.texture) {
    const txt = new THREE.TextureLoader().load(color.texture);

    txt.repeat.set(color.size[0], color.size[1], color.size[2]);
    txt.wrapS = THREE.RepeatWrapping;
    txt.wrapT = THREE.RepeatWrapping;

    new_mtl = new THREE.MeshPhongMaterial({
      map: txt,
      shininess: color.shininess ? color.shininess : 10,
    });
  } else {
    new_mtl = new THREE.MeshPhongMaterial({
      color: parseInt("0x" + color.color),
      shininess: color.shininess ? color.shininess : 10,
    });
  }
  setMaterial(theModel, activePart, new_mtl);
}

function setMaterial(parent, type, mtl) {
  parent.traverse((o) => {
    if (o.isMesh && o.nameID != null) {
      if (o.nameID == type) {
        o.material = mtl;
      }
    }
  });
}
</script>

<template>
  <div class="options">
    <PartOption
      v-for="part in parts"
      :key="part"
      :dataOption="part"
      :imgUrl="`https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/${part}.svg`"
      @click="selectPart(part)"
    />
  </div>
  <div class="controls">
    <el-scrollbar>
      <div class="scrollbar-flex-content">
        <ColorSqure
          v-for="(color, idx) in colors"
          :key="idx"
          :style="getStyle(color)"
          @click="selectColor(color)"
        />
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.controls {
  position: absolute;
  width: 100%;
  bottom: 0px;
  z-index: 1000;
}
.options {
  position: absolute;
  left: 0;
  z-index: 10;
}

.scrollbar-flex-content {
  display: flex;
}
</style>
