import * as THREE from 'https://unpkg.com/three@0.161.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xdfeaff, 8, 28);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 5.3);

const ambient = new THREE.HemisphereLight(0xffffff, 0xc8d9ff, 0.8);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
keyLight.position.set(4, 6, 3);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 20;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xaac8ff, 0.55);
fillLight.position.set(-4, 3, -2);
scene.add(fillLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(5, 64),
  new THREE.ShadowMaterial({ color: 0x2f405f, opacity: 0.13 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.15;
ground.receiveShadow = true;
scene.add(ground);

const flightPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0.3, 2.3),
  new THREE.Vector3(-0.4, 0.55, 0.6),
  new THREE.Vector3(0.5, 0.8, -1.7),
  new THREE.Vector3(0.15, 0.45, -4.1)
]);

let scrollProgress = 0;
let targetProgress = 0;
let bee = null;
let mixer = null;
let wingL = null;
let wingR = null;
const clock = new THREE.Clock();

const loader = new GLTFLoader();
loader.load(
  './bee.glb',
  (gltf) => {
    bee = gltf.scene;
    bee.scale.setScalar(0.95);
    bee.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;

        const n = obj.name.toLowerCase();
        if (n.includes('wing_left')) wingL = obj;
        if (n.includes('wing_right')) wingR = obj;
      }
    });

    if (gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(bee);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
    }

    scene.add(bee);
  },
  undefined,
  (error) => {
    console.error('Erreur au chargement de bee.glb :', error);
  }
);

function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  targetProgress = THREE.MathUtils.clamp(targetProgress, 0, 1);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  const dpr = window.innerWidth < 900 ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onResize);
onResize();
onScroll();

function animate() {
  const dt = clock.getDelta();
  const elapsed = clock.elapsedTime;

  scrollProgress = THREE.MathUtils.lerp(scrollProgress, targetProgress, 0.075);

  if (bee) {
    const pathPos = flightPath.getPointAt(scrollProgress);
    const tangent = flightPath.getTangentAt(scrollProgress).normalize();
    const hover = Math.sin(elapsed * 1.7) * 0.09;

    bee.position.copy(pathPos);
    bee.position.y += hover;

    const yaw = Math.atan2(tangent.x, tangent.z);
    const tilt = Math.sin(elapsed * 2.2 + scrollProgress * Math.PI * 4) * 0.09;
    bee.rotation.set(tilt * 0.35, yaw, tilt);

    if (!mixer && wingL && wingR) {
      const flap = Math.sin(elapsed * 22) * 0.35;
      wingL.rotation.z = 0.35 + flap;
      wingR.rotation.z = -0.35 - flap;
    }
  }

  if (mixer) mixer.update(dt);

  const camTarget = flightPath.getPointAt(scrollProgress);
  const camHover = Math.sin(elapsed * 0.55) * 0.06;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTarget.x * 0.25, 0.04);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.5 + camHover, 0.03);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5.2 - scrollProgress * 1.2, 0.04);
  camera.lookAt(camTarget.x * 0.2, camTarget.y + 0.35, camTarget.z);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
