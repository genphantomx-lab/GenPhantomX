/**
 * GenPhantomX - 絶対支配の特異点
 * 会長GPXレーベル 絶対神殿システム
 * メッシュ歪み + 音声ビジュアライザー融合エンジン
 */

let scene, camera, renderer, mesh, analyser, audioContext, microphone;
let geometry, material;
let originalPositions = [];
let frequencyData = new Uint8Array(256);
let audioActive = false;
let time = 0;

// シーン初期化
function init() {
    // レンダラー設定
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(window.devicePixelRatio);

    // カメラ設定
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 30;

    // シーン設定
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // ブラックホール状メッシュ生成
    createBlackHoleMesh();

    // ライト設定
    const light1 = new THREE.PointLight(0x00ffff, 1.5, 100);
    light1.position.set(50, 50, 50);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xff00ff, 1, 100);
    light2.position.set(-50, -50, 50);
    scene.add(light2);

    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // マイク入力セットアップ
    setupAudioInput();

    // イベントリスナー
    window.addEventListener('click', startAudioInput);
    window.addEventListener('keypress', (e) => {
        if (e.code === 'Space') resetMesh();
    });
    window.addEventListener('resize', onWindowResize);

    // アニメーション開始
    animate();
}

// ブラックホール状メッシュ生成
function createBlackHoleMesh() {
    // 複雑なジオメトリ - イコサヘドロン分割
    geometry = new THREE.IcosahedronGeometry(15, 8);
    
    // オリジナル頂点位置保存
    originalPositions = geometry.attributes.position.array.slice();

    // マテリアル設定
    material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ff00,
        wireframe: false,
        shininess: 100,
        specular: 0x00ffff
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
}

// 音声入力セットアップ
function setupAudioInput() {
    if (audioContext) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
}

// マイク入力開始
async function startAudioInput() {
    if (audioActive) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphone = audioContext.createMediaStreamAudioProcessor(stream);
        microphone.connect(analyser);
        analyser.connect(audioContext.destination);
        audioActive = true;
        document.getElementById('status').innerHTML = '<div>Status: ACTIVE 🔴</div><div id="frequency-value">Frequency: 0 Hz</div>';
    } catch (error) {
        console.error('マイク入力エラー:', error);
        alert('マイク接続に失敗しました。ブラウザの権限設定を確認してください。');
    }
}

// メッシュリセット
function resetMesh() {
    const positions = geometry.attributes.position;
    for (let i = 0; i < originalPositions.length; i++) {
        positions.array[i] = originalPositions[i];
    }
    positions.needsUpdate = true;
    mesh.rotation.set(0, 0, 0);
}

// メッシュ歪み計算
function distortMesh(frequency, intensity) {
    const positions = geometry.attributes.position;
    const posArray = positions.array;

    for (let i = 0; i < posArray.length; i += 3) {
        const x = originalPositions[i];
        const y = originalPositions[i + 1];
        const z = originalPositions[i + 2];

        // ブラックホール歪み効果
        const distance = Math.sqrt(x * x + y * y + z * z);
        const angle = Math.atan2(y, x);
        const radialWarp = 1 + intensity * Math.sin(time * 0.005 + distance * 0.1);

        // 周波数に応じた歪み
        const freqWarp = (frequency / 255) * Math.sin(time * 0.01 + i * 0.001);

        // 新しい位置計算
        const distortionFactor = radialWarp + freqWarp * 0.3;
        posArray[i] = x * distortionFactor + Math.sin(time * 0.003 + i) * intensity * 0.5;
        posArray[i + 1] = y * distortionFactor + Math.cos(time * 0.003 + i) * intensity * 0.5;
        posArray[i + 2] = z * distortionFactor + Math.sin(time * 0.002 + distance) * intensity * 0.3;
    }

    positions.needsUpdate = true;
}

// 周波数ビジュアライザー
function updateFrequencyDisplay() {
    if (!audioActive) return;

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

    // 主周波数計算
    let maxFreq = 0;
    let maxIndex = 0;
    for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxFreq) {
            maxFreq = frequencyData[i];
            maxIndex = i;
        }
    }

    const frequency = (maxIndex / frequencyData.length) * (audioContext.sampleRate / 2);
    document.getElementById('frequency-value').innerText = `Frequency: ${Math.round(frequency)} Hz | Intensity: ${Math.round(maxFreq)}`;

    return maxFreq;
}

// ウィンドウリサイズ対応
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);

    time += 1;

    // 周波数取得
    const intensity = updateFrequencyDisplay();

    // メッシュ歪み適用
    distortMesh(intensity || 50, intensity || 20);

    // メッシュ回転
    if (audioActive) {
        mesh.rotation.x += 0.0002 * intensity;
        mesh.rotation.y += 0.0003 * intensity;
        mesh.rotation.z += 0.0001 * intensity;
    } else {
        mesh.rotation.x += 0.0001;
        mesh.rotation.y += 0.0002;
        mesh.rotation.z += 0.00005;
    }

    // カメラ震動（低周波数時）
    const lowFreq = frequencyData[0] || 0;
    camera.position.x = Math.sin(time * 0.01) * (lowFreq / 255) * 2;
    camera.position.y = Math.cos(time * 0.01) * (lowFreq / 255) * 2;

    renderer.render(scene, camera);
}

// 初期化実行
window.addEventListener('DOMContentLoaded', init);
