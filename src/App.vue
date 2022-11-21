<script setup>
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { onMounted } from "vue";
import PartOption from "./components/PartOption.vue";
import ColorSqure from "./components/ColorSqure.vue";
import * as THREE from "three";
import colors from "./composables/colors.js";
import { ref } from "vue";
import floorTxt from "/img/floor_.jpg";

const ModelPath = "/chair/models/chair.glb";

const scene = new THREE.Scene();
// init scence
function initScene() {
  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
    "/chair/img/pos-x.jpg",
    "/chair/img/neg-x.jpg",
    "/chair/img/pos-y.jpg",
    "/chair/img/neg-y.jpg",
    "/chair/img/pos-z.jpg",
    "/chair/img/neg-z.jpg",
  ]);
  scene.background = texture;
}

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// init camera
function initCamera() {
  camera.position.set(0, 7, 5);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
}

const el = document.getElementById("el");
const renderer = new THREE.WebGLRenderer({ canvas: el });
// init Renderer
function initRenderer() {
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
}

let theModel;
let loaded = false;
const loader = new GLTFLoader();

const parts = ["legs", "cushions", "base", "supports", "back"];
let loading = ref(0);

function load() {
  loader.load(
    ModelPath,
    function (gltf) {
      theModel = gltf.scene;

      theModel.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      // Set the models initial scale
      theModel.scale.set(3, 3, 3);
      theModel.rotation.y = Math.PI;

      // Offset the y position a bit
      theModel.position.set(0, -2, 0);

      const initialMtl = new THREE.MeshPhongMaterial({
        color: 0xf1f1f1,
        shininess: 10,
      });

      // Set initial textures
      for (const part of parts) {
        initColor(theModel, part, initialMtl);
      }

      // Add the model to the scene
      scene.add(theModel);
    },
    function (xhr) {
      loading.value += (xhr.loaded / xhr.total) * 100;
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.error(error);
    }
  );
}

// Add the textures to the models
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
const lightColor = ref("#ffffff");
// 平行光
const dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
function addLights() {
  // 半球光，用来提亮场景
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.4);
  hemiLight.position.set(0, 50, 0);
  // Add hemisphere light to scene
  scene.add(hemiLight);

  dirLight.color.set(lightColor.value);
  dirLight.position.set(-8, 12, 8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
  // Add directional Light to scene
  scene.add(dirLight);
}

function onLightColorChange() {
  dirLight.color.set(lightColor.value);
}

// Floor
function initFloor() {
  const floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
  const txt = new THREE.TextureLoader().load(floorTxt);
  txt.repeat.set(800, 800, 800);
  txt.wrapS = THREE.RepeatWrapping;
  txt.wrapT = THREE.RepeatWrapping;
  const floorMaterial = new THREE.MeshPhongMaterial({
    // color: 0xfdfdfd,
    map: txt,
    shininess: 10,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -0.5 * Math.PI; // 绕x轴旋转90度
  floor.receiveShadow = true;
  floor.position.y = -2; // 和模型位置一致
  scene.add(floor);
}

// Add controls
const controls = new OrbitControls(camera, renderer.domElement);
function initControls() {
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
  requestAnimationFrame(animate); // 让浏览器定时调用antimate()进行刷新

  // 窗口大小调整时，更新canvas画布大小
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  // 加载模型后旋转
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
  initScene();
  initCamera();
  initRenderer();
  document.body.appendChild(renderer.domElement);
  load();
  animate();
  addLights();
  initFloor();
  initControls();
}

onMounted(() => {
  init();
});

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
  let newMtl;
  if (color.texture) {
    const txt = new THREE.TextureLoader().load(color.texture);

    txt.repeat.set(color.size[0], color.size[1], color.size[2]);
    txt.wrapS = THREE.RepeatWrapping;
    txt.wrapT = THREE.RepeatWrapping;

    newMtl = new THREE.MeshPhongMaterial({
      map: txt,
      shininess: color.shininess ? color.shininess : 10,
    });
  } else {
    newMtl = new THREE.MeshPhongMaterial({
      color: parseInt("0x" + color.color),
      shininess: color.shininess ? color.shininess : 10,
    });
  }
  setMaterial(theModel, activePart, newMtl);
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
      :imgUrl="`/img/parts/${part}.svg`"
      @click="selectPart(part)"
    />
  </div>
  <div class="color-block">
    <span class="demonstration">调节灯光颜色</span>
    <el-color-picker v-model="lightColor" @change="onLightColorChange" />
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
.color-block {
  position: absolute;
  right: 0;
  z-index: 10;
}

.controls {
  position: absolute;
  width: 100%;
  top: 90vh;
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
