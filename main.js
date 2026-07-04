/**
 * GenPhantomX - 絶対支配の特異点
 * 会長GPXレーベル 絶対神殿システム
 * メッシュ歪み + 音声ビジュアライザー融合エンジン
 * iOS/Android 完全対応版 - マイク完全修正
 */

let scene, camera, renderer, mesh, analyser, audioContext, mediaSource;
let geometry, material;
let originalPositions = [];
let frequencyData = new Uint8Array(512);
let audioActive = false;
let time = 0;
let particleSystem;

// シーン初期化
function init() {
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(window.devicePixelRatio);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 30;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    createBlackHoleMesh();
    createParticleSystem();

    const light1 = new THREE.PointLight(0x00ffff, 2, 150);
    light1.position.set(50, 50, 50);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xff00ff, 1.5, 150);
    light2.position.set(-50, -50, 50);
    scene.add(light2);

    const light3 = new THREE.PointLight(0x9900ff, 1, 100);
    light3.position.set(0, 0, 100);
    scene.add(light3);

    const ambientLight = new THREE.AmbientLight(0x222244, 1);
    scene.add(ambientLight);

    document.getElementById('startButton').addEventListener('click', startAudioInput);
    window.addEventListener('keypress', (e) => {
        if (e.code === 'Space') resetMesh();
    });
    window.addEventListener('resize', onWindowResize);

    animate();
}

function createBlackHoleMesh() {
    geometry = new THREE.IcosahedronGeometry(15, 8);
    originalPositions = geometry.attributes.position.array.slice();

    material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00aa44,
        wireframe: false,
        shininess: 100,
        specular: 0x00ffff,
        flatShading: false
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

function createParticleSystem() {
    const particleCount = 3000;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = Math.random() * 80 + 10;

        positions[i] = r * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = r * Math.cos(phi);

        const hue = Math.random() * 0.3 + 0.5;
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.6
    });

    particleSystem = new THREE.Points(geom, mat);
    scene.add(particleSystem);
}

async function startAudioInput() {
    if (audioActive) return;

    const startButton = document.getElementById('startButton');
    const errorMessage = document.getElementById('errorMessage');

    try {
        // Step 1: AudioContext 作成
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Step 2: resume
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // Step 3: analyser 作成
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85;

        // Step 4: マイク取得
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        // Step 5: MediaStreamSource 作成して接続
        mediaSource = audioContext.createMediaStreamSource(stream);
        mediaSource.connect(analyser);

        // 完了
        audioActive = true;
        startButton.classList.add('hidden');
        document.getElementById('status').innerHTML = '<div>Status: 🔴 ACTIVE</div><div id="frequency-value">Frequency: 0 Hz</div>';
        errorMessage.classList.remove('show');

        console.log('Microphone connected successfully');

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
}

function distortMesh(frequency, intensity) {
    const positions = geometry.attributes.position;
    const posArray = positions.array;

    for (let i = 0; i < posArray.length; i += 3) {
        const x = originalPositions[i];
        const y = originalPositions[i + 1];
        const z = originalPositions[i + 2];

        const distance = Math.sqrt(x * x + y * y + z * z);
        const gravitationalWarp = 1 + (intensity / 255) * 0.8 * Math.sin(time * 0.008 + distance * 0.15);
        const pulseWarp = (frequency / 255) * Math.sin(time * 0.015 + i * 0.002) * 1.5;

        const distortionFactor = gravitationalWarp + pulseWarp * 0.4;
        const waveX = Math.sin(time * 0.004 + i * 0.0001) * intensity * 0.8;
        const waveY = Math.cos(time * 0.004 + i * 0.0001) * intensity * 0.8;
        const waveZ = Math.sin(time * 0.003 + distance * 0.02) * intensity * 0.6;

        posArray[i] = x * distortionFactor + waveX;
        posArray[i + 1] = y * distortionFactor + waveY;
        posArray[i + 2] = z * distortionFactor + waveZ;
    }

    positions.needsUpdate = true;
}

function updateParticles(frequency, intensity) {
    if (!particleSystem) return;

    const posAttribute = particleSystem.geometry.attributes.position;
    const positions = posAttribute.array;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];
        const distance = Math.sqrt(x * x + y * y + z * z);

        if (distance > 0.1) {
            const pullSpeed = (intensity / 255) * 0.3;
            positions[i] -= (x / distance) * pullSpeed;
            positions[i + 1] -= (y / distance) * pullSpeed;
            positions[i + 2] -= (z / distance) * pullSpeed;
        }

        if (distance < 5) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = Math.random() * 80 + 20;
            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = r * Math.cos(phi);
        }

        const angle = Math.atan2(y, x);
        const rotSpeed = (frequency / 255) * 0.02;
        const newAngle = angle + rotSpeed;
        const newDist = distance * 0.98;
        positions[i] = newDist * Math.cos(newAngle);
        positions[i + 1] = newDist * Math.sin(newAngle);
    }

    posAttribute.needsUpdate = true;
}

function updateFrequencyDisplay() {
    if (!audioActive || !analyser) return 0;

    analyser.getByteFrequencyData(frequencyData);

    const container = document.getElementById('frequency-bars');
    if (container.children.length === 0) {
        for (let i = 0; i < 32; i++) {
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
        bar.style.backgroundColor = `hsl(${(index / bars.length) * 360}, 100%, 50%)`;
    });

    let maxFreq = 0;
    let maxIndex = 0;
    for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxFreq) {
            maxFreq = frequencyData[i];
            maxIndex = i;
        }
    }

    const frequency = (maxIndex / frequencyData.length) * (audioContext.sampleRate / 2);
    document.getElementById('frequency-value').innerText = `Frequency: ${Math.round(frequency)} Hz | Power: ${Math.round(maxFreq)}`;

    return maxFreq;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    time += 1;

    const intensity = updateFrequencyDisplay() || 20;

    distortMesh(intensity, intensity);
    updateParticles(intensity, intensity);

    if (audioActive) {
        const rotSpeed = intensity / 255;
        mesh.rotation.x += 0.0003 * rotSpeed;
        mesh.rotation.y += 0.0004 * rotSpeed;
        mesh.rotation.z += 0.0002 * rotSpeed;

        if (particleSystem) {
            particleSystem.rotation.x += 0.0001 * rotSpeed;
            particleSystem.rotation.y += 0.0002 * rotSpeed;
        }
    } else {
        mesh.rotation.x += 0.0001;
        mesh.rotation.y += 0.0002;
        mesh.rotation.z += 0.00005;

        if (particleSystem) {
            particleSystem.rotation.x += 0.00005;
            particleSystem.rotation.y += 0.0001;
        }
    }

    const lowFreq = frequencyData[0] || 0;
    camera.position.x = Math.sin(time * 0.015) * (lowFreq / 255) * 3;
    camera.position.y = Math.cos(time * 0.015) * (lowFreq / 255) * 3;

    renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);
