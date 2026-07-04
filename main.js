/**
 * GenPhantomX - 絶対支配の特異点 - ULTIMATE VERSION
 * 会長GPXレーベル 絶対神殿システム
 * 宇宙×サイバーパンク×仏教哲学 融合エンジン
 * マルチレイヤー ビジュアルサウンド完全体
 */

let scene, camera, renderer, mesh, analyser, audioContext, mediaSource;
let geometry, material;
let originalPositions = [];
let frequencyData = new Uint8Array(512);
let frequencyDataLow = new Uint8Array(256);
let frequencyDataMid = new Uint8Array(256);
let frequencyDataHigh = new Uint8Array(256);
let audioActive = false;
let time = 0;
let particleSystem, particleSystem2, particleSystem3;
let geometryRing, ringMesh;
let geometrySphere, sphereMesh;
let postProcessing = {};

// ===== MAIN INIT =====
function init() {
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000a15, 1);
    renderer.setPixelRatio(window.devicePixelRatio);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 40;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000a15);

    // ===== オブジェクト生成 =====
    createBlackHoleMesh();
    createRingSystem();
    createSphereBackdrop();
    createMultipleParticleSystems();

    // ===== ライトシステム（神化版） =====
    const light1 = new THREE.PointLight(0x00ffff, 2.5, 200);
    light1.position.set(80, 80, 80);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xff00ff, 2, 200);
    light2.position.set(-80, -80, 80);
    scene.add(light2);

    const light3 = new THREE.PointLight(0x9900ff, 1.8, 150);
    light3.position.set(0, 0, 120);
    scene.add(light3);

    const light4 = new THREE.PointLight(0x00ff88, 1.5, 150);
    light4.position.set(80, -80, 0);
    scene.add(light4);

    const ambientLight = new THREE.AmbientLight(0x1a1a3e, 0.8);
    scene.add(ambientLight);

    // ===== イベント =====
    document.getElementById('startButton').addEventListener('click', startAudioInput);
    window.addEventListener('keypress', (e) => {
        if (e.code === 'Space') resetMesh();
    });
    window.addEventListener('resize', onWindowResize);

    animate();
}

// ===== ブラックホールメッシュ =====
function createBlackHoleMesh() {
    geometry = new THREE.IcosahedronGeometry(15, 8);
    originalPositions = geometry.attributes.position.array.slice();

    material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00aa44,
        wireframe: false,
        shininess: 150,
        specular: 0x00ffff,
        flatShading: false,
        fog: false
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

// ===== リングシステム（追加オブジェクト） =====
function createRingSystem() {
    geometryRing = new THREE.TorusGeometry(25, 2, 16, 100);
    const materialRing = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        emissive: 0x6600ff,
        wireframe: false,
        shininess: 80,
        transparent: true,
        opacity: 0.7
    });

    ringMesh = new THREE.Mesh(geometryRing, materialRing);
    ringMesh.rotation.x = Math.PI * 0.3;
    ringMesh.rotation.z = Math.PI * 0.2;
    scene.add(ringMesh);
}

// ===== 背景球体 =====
function createSphereBackdrop() {
    geometrySphere = new THREE.OctahedronGeometry(50, 3);
    const materialSphere = new THREE.MeshPhongMaterial({
        color: 0x003366,
        emissive: 0x001133,
        wireframe: true,
        wireframeLinewidth: 1,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });

    sphereMesh = new THREE.Mesh(geometrySphere, materialSphere);
    scene.add(sphereMesh);
}

// ===== マルチレイヤー パーティクルシステム =====
function createMultipleParticleSystems() {
    // Layer 1: シアン系（高速回転）
    createParticleLayer(1500, 0.3, 0.5, 0.8);
    // Layer 2: マゼンタ系（中速）
    createParticleLayer(1200, 0.2, 0.2, 0.6);
    // Layer 3: 紫系（低速）
    createParticleLayer(1000, 0.15, 0.0, 0.3);
}

function createParticleLayer(count, opacity, hueOffset, sizeMulti) {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = Math.random() * 100 + 15;

        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = r * Math.cos(phi);

        const hue = (Math.random() * 0.4 + hueOffset) % 1;
        const color = new THREE.Color().setHSL(hue, 1, 0.6);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.6 * sizeMulti,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: opacity
    });

    const particles = new THREE.Points(geom, mat);
    scene.add(particles);

    if (!particleSystem) {
        particleSystem = particles;
    } else if (!particleSystem2) {
        particleSystem2 = particles;
    } else {
        particleSystem3 = particles;
    }
}

// ===== マイク入力開始 =====
async function startAudioInput() {
    if (audioActive) return;

    const startButton = document.getElementById('startButton');
    const errorMessage = document.getElementById('errorMessage');

    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.85;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        mediaSource = audioContext.createMediaStreamSource(stream);
        mediaSource.connect(analyser);

        audioActive = true;
        startButton.classList.add('hidden');
        document.getElementById('status').innerHTML = '<div style="font-size: 18px;">🔴 ACTIVE</div><div id="frequency-value" style="margin-top: 8px;">Frequency: 0 Hz</div><div id="bass-value">Bass: 0</div><div id="mid-value">Mid: 0</div><div id="treble-value">Treble: 0</div>';
        errorMessage.classList.remove('show');

        console.log('Microphone connected - ULTIMATE MODE ACTIVATED');

    } catch (error) {
        console.error('Error:', error.name, error.message);
        showError(`エラー: ${error.name}\n${error.message}`);
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

function resetMesh() {
    const positions = geometry.attributes.position;
    for (let i = 0; i < originalPositions.length; i++) {
        positions.array[i] = originalPositions[i];
    }
    positions.needsUpdate = true;
    mesh.rotation.set(0, 0, 0);
    ringMesh.rotation.set(Math.PI * 0.3, Math.PI * 0.2, 0);
}

// ===== 周波数分析（3層分割） =====
function analyzeFrequencies() {
    if (!audioActive || !analyser) return { bass: 0, mid: 0, treble: 0, overall: 0 };

    analyser.getByteFrequencyData(frequencyData);

    // 低周波（Bass）
    let bass = 0;
    for (let i = 0; i < 10; i++) {
        bass += frequencyData[i];
    }
    bass = Math.floor(bass / 10);

    // 中周波（Mid）
    let mid = 0;
    for (let i = 80; i < 150; i++) {
        mid += frequencyData[i];
    }
    mid = Math.floor(mid / 70);

    // 高周波（Treble）
    let treble = 0;
    for (let i = 200; i < 256; i++) {
        treble += frequencyData[i];
    }
    treble = Math.floor(treble / 56);

    // 全体
    let overall = 0;
    for (let i = 0; i < frequencyData.length; i++) {
        overall += frequencyData[i];
    }
    overall = Math.floor(overall / frequencyData.length);

    return { bass, mid, treble, overall };
}

// ===== メッシュ歪み（高度化） =====
function distortMesh(freqData) {
    const positions = geometry.attributes.position;
    const posArray = positions.array;

    for (let i = 0; i < posArray.length; i += 3) {
        const x = originalPositions[i];
        const y = originalPositions[i + 1];
        const z = originalPositions[i + 2];

        const distance = Math.sqrt(x * x + y * y + z * z);

        // 3層周波数同時反応
        const bassWarp = (freqData.bass / 255) * 0.6;
        const midWarp = (freqData.mid / 255) * 0.4;
        const trebleWarp = (freqData.treble / 255) * 0.3;

        const gravitationalWarp = 1 + (bassWarp + midWarp * 0.5) * Math.sin(time * 0.008 + distance * 0.15);
        const pulseWarp = trebleWarp * Math.sin(time * 0.02 + i * 0.003) * 2;

        const distortionFactor = gravitationalWarp + pulseWarp * 0.5;
        const waveX = Math.sin(time * 0.005 + i * 0.0001) * (freqData.overall / 255) * 1.2;
        const waveY = Math.cos(time * 0.005 + i * 0.0001) * (freqData.overall / 255) * 1.2;
        const waveZ = Math.sin(time * 0.003 + distance * 0.02) * (freqData.bass / 255) * 0.8;

        posArray[i] = x * distortionFactor + waveX;
        posArray[i + 1] = y * distortionFactor + waveY;
        posArray[i + 2] = z * distortionFactor + waveZ;
    }

    positions.needsUpdate = true;
}

// ===== パーティクル更新（マルチレイヤー） =====
function updateParticles(freqData) {
    updateParticleLayer(particleSystem, freqData, 0.3);
    updateParticleLayer(particleSystem2, freqData, 0.2);
    updateParticleLayer(particleSystem3, freqData, 0.15);
}

function updateParticleLayer(particles, freqData, speedMulti) {
    if (!particles) return;

    const posAttribute = particles.geometry.attributes.position;
    const positions = posAttribute.array;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        const distance = Math.sqrt(x * x + y * y + z * z);

        if (distance > 0.1) {
            const pullSpeed = (freqData.bass / 255) * 0.4 * speedMulti;
            positions[i] -= (x / distance) * pullSpeed;
            positions[i + 1] -= (y / distance) * pullSpeed;
            positions[i + 2] -= (z / distance) * pullSpeed;
        }

        if (distance < 5) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * 100 + 20;
            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = r * Math.cos(phi);
        }

        const angle = Math.atan2(y, x);
        const rotSpeed = (freqData.mid / 255) * 0.025;
        const newAngle = angle + rotSpeed;
        const newDist = distance * 0.97;
        positions[i] = newDist * Math.cos(newAngle);
        positions[i + 1] = newDist * Math.sin(newAngle);
    }

    posAttribute.needsUpdate = true;
}

// ===== 周波数ビジュアライザー更新 =====
function updateFrequencyDisplay(freqData) {
    const container = document.getElementById('frequency-bars');
    if (container.children.length === 0) {
        for (let i = 0; i < 64; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            container.appendChild(bar);
        }
    }

    const bars = container.querySelectorAll('.bar');
    const step = Math.floor(frequencyData.length / bars.length);

    bars.forEach((bar, index) => {
        const value = frequencyData[index * step];
        bar.style.height = (value / 255) * 100 + '%';
        const hue = (index / bars.length) * 360;
        bar.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
        bar.style.boxShadow = `0 0 ${value / 10}px hsl(${hue}, 100%, 50%)`;
    });

    // ステータス更新
    const frequency = (freqData.mid / 255) * (audioContext.sampleRate / 2);
    document.getElementById('frequency-value').innerText = `Frequency: ${Math.round(frequency)} Hz`;
    document.getElementById('bass-value').innerText = `Bass: ${freqData.bass}`;
    document.getElementById('mid-value').innerText = `Mid: ${freqData.mid}`;
    document.getElementById('treble-value').innerText = `Treble: ${freqData.treble}`;
}

// ===== リング回転 =====
function updateRing(freqData) {
    if (ringMesh) {
        ringMesh.rotation.x += 0.0002 * (freqData.bass / 255);
        ringMesh.rotation.y += 0.0003 * (freqData.mid / 255);
        ringMesh.rotation.z += 0.0001 * (freqData.treble / 255);

        const scale = 1 + (freqData.overall / 255) * 0.3;
        ringMesh.scale.set(scale, scale, scale);
    }
}

// ===== 背景球体更新 =====
function updateSphere(freqData) {
    if (sphereMesh) {
        sphereMesh.rotation.x += 0.0001 * (freqData.mid / 255);
        sphereMesh.rotation.y += 0.00015 * (freqData.bass / 255);
        sphereMesh.rotation.z += 0.00005 * (freqData.treble / 255);
    }
}

// ===== カメラエフェクト（進化版） =====
function updateCamera(freqData) {
    const bassInfluence = (freqData.bass / 255) * 4;
    const midInfluence = (freqData.mid / 255) * 2;

    camera.position.x = Math.sin(time * 0.015) * bassInfluence + Math.cos(time * 0.008) * midInfluence;
    camera.position.y = Math.cos(time * 0.015) * bassInfluence + Math.sin(time * 0.008) * midInfluence;
    camera.position.z = 40 + (freqData.treble / 255) * 15;

    camera.lookAt(0, 0, 0);
}

// ===== ウィンドウリサイズ =====
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===== メインアニメーションループ =====
function animate() {
    requestAnimationFrame(animate);

    time += 1;

    const freqData = analyzeFrequencies();
    updateFrequencyDisplay(freqData);

    if (audioActive) {
        distortMesh(freqData);
        updateParticles(freqData);
        updateRing(freqData);
        updateSphere(freqData);
        updateCamera(freqData);

        // メッシュ回転（音圧同期）
        const rotSpeed = freqData.overall / 255;
        mesh.rotation.x += 0.0004 * rotSpeed;
        mesh.rotation.y += 0.0005 * rotSpeed;
        mesh.rotation.z += 0.0003 * rotSpeed;

        // パーティクルシステム回転
        if (particleSystem) {
            particleSystem.rotation.x += 0.0002 * (freqData.mid / 255);
            particleSystem.rotation.y += 0.0003 * (freqData.bass / 255);
        }
        if (particleSystem2) {
            particleSystem2.rotation.x -= 0.0001 * (freqData.treble / 255);
            particleSystem2.rotation.y -= 0.0002 * (freqData.bass / 255);
        }
        if (particleSystem3) {
            particleSystem3.rotation.x += 0.00015 * (freqData.mid / 255);
            particleSystem3.rotation.y += 0.00025 * (freqData.overall / 255);
        }
    } else {
        mesh.rotation.x += 0.0001;
        mesh.rotation.y += 0.0002;
        mesh.rotation.z += 0.00005;

        if (particleSystem) {
            particleSystem.rotation.x += 0.00005;
            particleSystem.rotation.y += 0.0001;
        }
        if (particleSystem2) {
            particleSystem2.rotation.x -= 0.00003;
            particleSystem2.rotation.y -= 0.00008;
        }
        if (particleSystem3) {
            particleSystem3.rotation.x += 0.00004;
            particleSystem3.rotation.y += 0.00006;
        }

        ringMesh.rotation.x += 0.0001;
        ringMesh.rotation.y += 0.00015;

        camera.position.x = Math.sin(time * 0.01) * 5;
        camera.position.y = Math.cos(time * 0.01) * 5;
        camera.position.z = 40;
    }

    renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
