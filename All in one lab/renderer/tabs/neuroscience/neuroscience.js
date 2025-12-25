/**
 * QAGI Lab - Neuroscience Tab
 * Interactive neuroscience simulations and calculators
 */

const NeuroscienceTab = {
    hhChart: null,
    waveAnimationId: null,
    currentWaveType: 'delta',
    synapseType: 'excitatory',
    selectedRegion: null,

    // Brain region data
    brainRegions: {
        frontal: {
            name: 'Frontal Lobe',
            function: 'Executive functions, decision making, planning, personality, motor control, speech production (Broca\'s area). The prefrontal cortex handles complex cognitive behavior and working memory.',
            connections: ['parietal', 'temporal', 'hippocampus', 'brainstem']
        },
        parietal: {
            name: 'Parietal Lobe',
            function: 'Sensory processing, spatial awareness, proprioception, integration of sensory information. The somatosensory cortex processes touch, temperature, and pain.',
            connections: ['frontal', 'occipital', 'temporal']
        },
        temporal: {
            name: 'Temporal Lobe',
            function: 'Auditory processing, language comprehension (Wernicke\'s area), memory formation, emotional processing (amygdala). Critical for recognizing faces and objects.',
            connections: ['frontal', 'parietal', 'hippocampus']
        },
        occipital: {
            name: 'Occipital Lobe',
            function: 'Visual processing center containing the primary visual cortex (V1). Processes color, shape, motion, and spatial orientation of visual stimuli.',
            connections: ['parietal', 'temporal']
        },
        cerebellum: {
            name: 'Cerebellum',
            function: 'Motor coordination, balance, posture, motor learning, fine-tuning of movements. Contains ~50% of all neurons in the brain despite being only 10% of volume.',
            connections: ['brainstem', 'parietal', 'frontal']
        },
        brainstem: {
            name: 'Brainstem',
            function: 'Vital autonomic functions: breathing, heart rate, blood pressure, sleep-wake cycles. Contains nuclei for cranial nerves and relay stations.',
            connections: ['cerebellum', 'frontal', 'hippocampus']
        },
        hippocampus: {
            name: 'Hippocampus',
            function: 'Memory consolidation, spatial navigation, learning. Essential for converting short-term memories to long-term. Named for its seahorse-like shape.',
            connections: ['frontal', 'temporal', 'brainstem']
        }
    },

    // EEG wave data
    waveData: {
        delta: {
            name: 'Delta Waves (δ)',
            frequency: '0.5 - 4 Hz',
            state: 'Deep Sleep',
            description: 'Associated with deep, dreamless sleep and regeneration. High amplitude, low frequency waves indicate the brain is in its most restorative state. Important for immune function and memory consolidation.',
            color: '#8B00FF',
            amplitude: 50,
            freq: 2
        },
        theta: {
            name: 'Theta Waves (θ)',
            frequency: '4 - 8 Hz',
            state: 'Drowsiness / Light Sleep',
            description: 'Present during light sleep, drowsiness, and meditation. Associated with creativity, intuition, and memory encoding. Often observed during hypnagogic states.',
            color: '#0088FF',
            amplitude: 35,
            freq: 6
        },
        alpha: {
            name: 'Alpha Waves (α)',
            frequency: '8 - 13 Hz',
            state: 'Relaxed Wakefulness',
            description: 'Dominant during calm, relaxed states with closed eyes. Indicates a state of restful alertness. Blocked by eye opening or mental effort (alpha blocking).',
            color: '#00FF88',
            amplitude: 25,
            freq: 10
        },
        beta: {
            name: 'Beta Waves (β)',
            frequency: '13 - 30 Hz',
            state: 'Active Thinking',
            description: 'Associated with active concentration, problem-solving, and alertness. Increased during cognitive tasks. High beta activity linked to anxiety and stress.',
            color: '#FFCC00',
            amplitude: 15,
            freq: 20
        },
        gamma: {
            name: 'Gamma Waves (γ)',
            frequency: '30 - 100+ Hz',
            state: 'High-Level Processing',
            description: 'Fastest brain waves, associated with peak concentration, cognitive functioning, and consciousness. Involved in sensory binding and higher-level information processing.',
            color: '#FF4444',
            amplitude: 8,
            freq: 40
        }
    },

    // Ion data for Nernst calculator
    ionData: {
        K: { z: 1, inside: 140, outside: 5, name: 'Potassium' },
        Na: { z: 1, inside: 15, outside: 145, name: 'Sodium' },
        Ca: { z: 2, inside: 0.0001, outside: 2, name: 'Calcium' },
        Cl: { z: -1, inside: 10, outside: 110, name: 'Chloride' }
    },

    init() {
        this.setupEventListeners();
        this.updateNeuronState(-70);
        this.calculateNernst();
        this.startWaveAnimation();
        this.setupBrainTopology();
    },

    setupEventListeners() {
        // Neuron Simulator
        const membraneSlider = document.getElementById('membrane-slider');
        if (membraneSlider) {
            membraneSlider.addEventListener('input', (e) => {
                this.updateNeuronState(parseFloat(e.target.value));
            });
        }

        const fireBtn = document.getElementById('btn-fire-neuron');
        if (fireBtn) {
            fireBtn.addEventListener('click', () => this.fireActionPotential());
        }

        const neuronReset = document.getElementById('btn-neuron-reset');
        if (neuronReset) {
            neuronReset.addEventListener('click', () => this.resetNeuron());
        }

        // Nernst Calculator
        const nernstBtn = document.getElementById('btn-nernst-calculate');
        if (nernstBtn) {
            nernstBtn.addEventListener('click', () => this.calculateNernst());
        }

        const ionSelect = document.getElementById('nernst-ion');
        if (ionSelect) {
            ionSelect.addEventListener('change', (e) => {
                const ion = this.ionData[e.target.value];
                document.getElementById('nernst-inside').value = ion.inside;
                document.getElementById('nernst-outside').value = ion.outside;
                this.calculateNernst();
            });
        }

        // Hodgkin-Huxley
        const hhBtn = document.getElementById('btn-hh-simulate');
        if (hhBtn) {
            hhBtn.addEventListener('click', () => this.simulateHodgkinHuxley());
        }

        // Synaptic Transmission
        const releaseBtn = document.getElementById('btn-release-nt');
        if (releaseBtn) {
            releaseBtn.addEventListener('click', () => this.triggerSynapticRelease());
        }

        const synapseReset = document.getElementById('btn-synapse-reset');
        if (synapseReset) {
            synapseReset.addEventListener('click', () => this.resetSynapse());
        }

        const synapseBtns = document.querySelectorAll('[data-synapse]');
        synapseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                synapseBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.synapseType = btn.dataset.synapse;
                this.updateSynapseInfo();
            });
        });

        // Brain Waves
        const waveBtns = document.querySelectorAll('.wave-btn');
        waveBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                waveBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentWaveType = btn.dataset.wave;
                this.updateWaveInfo();
            });
        });
    },

    // ==================== NEURON SIMULATOR ====================

    updateNeuronState(voltage) {
        const soma = document.getElementById('soma');
        const voltageLabel = document.getElementById('membrane-voltage');
        const stateElem = document.getElementById('neuron-state');
        const descElem = document.getElementById('state-description');

        if (voltageLabel) voltageLabel.textContent = `${voltage.toFixed(0)} mV`;

        if (soma) {
            soma.classList.remove('depolarizing', 'firing');

            if (voltage >= -55) {
                soma.classList.add('firing');
                if (stateElem) stateElem.textContent = 'ACTION POTENTIAL! 🔥';
                if (descElem) descElem.textContent = 'Threshold reached! Voltage-gated Na⁺ channels open rapidly, causing massive depolarization to +40mV.';
            } else if (voltage >= -70) {
                soma.classList.add('depolarizing');
                if (stateElem) stateElem.textContent = 'Depolarizing';
                if (descElem) descElem.textContent = `Membrane depolarizing (${(voltage + 70).toFixed(0)}mV above resting). Approaching threshold at -55mV.`;
            } else if (voltage >= -80) {
                if (stateElem) stateElem.textContent = 'Resting';
                if (descElem) descElem.textContent = 'The neuron is at resting potential. Na⁺/K⁺ pumps maintain the -70mV gradient.';
            } else {
                if (stateElem) stateElem.textContent = 'Hyperpolarized';
                if (descElem) descElem.textContent = 'Membrane hyperpolarized below resting potential. Reduced excitability (refractory period or inhibition).';
            }
        }
    },

    fireActionPotential() {
        const soma = document.getElementById('soma');
        const ap = document.getElementById('action-potential');
        const slider = document.getElementById('membrane-slider');

        if (soma) soma.classList.add('firing');
        if (ap) {
            ap.classList.remove('firing');
            void ap.offsetWidth; // Force reflow
            ap.classList.add('firing');
        }

        // Animate through action potential phases
        if (slider) {
            const phases = [
                { voltage: -70, delay: 0 },      // Resting
                { voltage: -55, delay: 50 },     // Threshold
                { voltage: 30, delay: 100 },     // Peak
                { voltage: -80, delay: 200 },    // Hyperpolarization
                { voltage: -70, delay: 400 }     // Return to rest
            ];

            phases.forEach(phase => {
                setTimeout(() => {
                    slider.value = phase.voltage;
                    this.updateNeuronState(phase.voltage);
                }, phase.delay);
            });
        }
    },

    resetNeuron() {
        const slider = document.getElementById('membrane-slider');
        if (slider) {
            slider.value = -70;
            this.updateNeuronState(-70);
        }
    },

    // ==================== NERNST CALCULATOR ====================

    calculateNernst() {
        const ion = document.getElementById('nernst-ion')?.value || 'K';
        const inside = parseFloat(document.getElementById('nernst-inside')?.value) || 140;
        const outside = parseFloat(document.getElementById('nernst-outside')?.value) || 5;
        const tempC = parseFloat(document.getElementById('nernst-temp')?.value) || 37;

        const ionInfo = this.ionData[ion];
        const z = ionInfo.z;
        const T = tempC + 273.15; // Convert to Kelvin
        const R = 8.314; // J/(mol·K)
        const F = 96485; // C/mol

        // Nernst equation: E = (RT/zF) * ln([X]out/[X]in)
        // Convert to mV: multiply by 1000
        const E = (R * T / (z * F)) * Math.log(outside / inside) * 1000;

        const resultElem = document.getElementById('nernst-result');
        if (resultElem) {
            resultElem.textContent = `${E.toFixed(1)} mV`;
            resultElem.style.color = E >= 0 ? 'var(--accent-green)' : 'var(--accent-cyan)';
        }
    },

    // ==================== HODGKIN-HUXLEY MODEL ====================

    simulateHodgkinHuxley() {
        const gNa = parseFloat(document.getElementById('hh-gna')?.value) || 120;
        const gK = parseFloat(document.getElementById('hh-gk')?.value) || 36;
        const gL = parseFloat(document.getElementById('hh-gl')?.value) || 0.3;
        const Iext = parseFloat(document.getElementById('hh-current')?.value) || 10;

        // Constants
        const Cm = 1.0;  // Membrane capacitance (μF/cm²)
        const ENa = 50;  // Na⁺ equilibrium potential (mV)
        const EK = -77;  // K⁺ equilibrium potential (mV)
        const EL = -54.4; // Leak equilibrium potential (mV)

        // Time parameters
        const dt = 0.01; // Time step (ms)
        const tMax = 50; // Max time (ms)
        const steps = Math.floor(tMax / dt);

        // Initial conditions
        let V = -65;
        let m = 0.05;
        let h = 0.6;
        let n = 0.32;

        const time = [];
        const voltage = [];
        const mGate = [];
        const hGate = [];
        const nGate = [];

        // Rate functions
        const alphaM = (V) => 0.1 * (V + 40) / (1 - Math.exp(-(V + 40) / 10));
        const betaM = (V) => 4 * Math.exp(-(V + 65) / 18);
        const alphaH = (V) => 0.07 * Math.exp(-(V + 65) / 20);
        const betaH = (V) => 1 / (1 + Math.exp(-(V + 35) / 10));
        const alphaN = (V) => 0.01 * (V + 55) / (1 - Math.exp(-(V + 55) / 10));
        const betaN = (V) => 0.125 * Math.exp(-(V + 65) / 80);

        // Simulation loop
        for (let i = 0; i < steps; i++) {
            const t = i * dt;

            // Apply current stimulus (pulse from 5-45ms)
            const I = (t >= 5 && t <= 45) ? Iext : 0;

            // Ionic currents
            const INa = gNa * Math.pow(m, 3) * h * (V - ENa);
            const IK = gK * Math.pow(n, 4) * (V - EK);
            const IL = gL * (V - EL);

            // Update voltage
            const dV = (I - INa - IK - IL) / Cm;
            V += dV * dt;

            // Update gate variables
            const aM = alphaM(V), bM = betaM(V);
            const aH = alphaH(V), bH = betaH(V);
            const aN = alphaN(V), bN = betaN(V);

            m += (aM * (1 - m) - bM * m) * dt;
            h += (aH * (1 - h) - bH * h) * dt;
            n += (aN * (1 - n) - bN * n) * dt;

            // Clamp gates to [0, 1]
            m = Math.max(0, Math.min(1, m));
            h = Math.max(0, Math.min(1, h));
            n = Math.max(0, Math.min(1, n));

            // Store every 10th point
            if (i % 10 === 0) {
                time.push(t);
                voltage.push(V);
                mGate.push(m);
                hGate.push(h);
                nGate.push(n);
            }
        }

        // Plot results
        this.plotHodgkinHuxley(time, voltage, mGate, hGate, nGate);

        // Update gate displays
        const peakV = Math.max(...voltage);
        const peakM = Math.max(...mGate);
        const minH = Math.min(...hGate);
        const peakN = Math.max(...nGate);

        document.getElementById('hh-peak').textContent = `${peakV.toFixed(1)} mV`;
        document.getElementById('hh-m').textContent = peakM.toFixed(3);
        document.getElementById('hh-h').textContent = minH.toFixed(3);
        document.getElementById('hh-n').textContent = peakN.toFixed(3);
    },

    plotHodgkinHuxley(time, voltage, m, h, n) {
        const container = document.getElementById('hh-graph');
        if (!container || typeof Plotly === 'undefined') return;

        const traces = [
            {
                x: time,
                y: voltage,
                name: 'Vm (mV)',
                line: { color: '#00d4ff', width: 2 },
                yaxis: 'y'
            },
            {
                x: time,
                y: m,
                name: 'm (Na⁺ act)',
                line: { color: '#00ff88', width: 1.5, dash: 'dot' },
                yaxis: 'y2'
            },
            {
                x: time,
                y: h,
                name: 'h (Na⁺ inact)',
                line: { color: '#ff0088', width: 1.5, dash: 'dot' },
                yaxis: 'y2'
            },
            {
                x: time,
                y: n,
                name: 'n (K⁺ act)',
                line: { color: '#ffcc00', width: 1.5, dash: 'dot' },
                yaxis: 'y2'
            }
        ];

        const layout = {
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'rgba(0,0,0,0.2)',
            font: { color: '#e0e0e0', family: 'Inter' },
            margin: { t: 20, b: 40, l: 50, r: 50 },
            xaxis: {
                title: 'Time (ms)',
                gridcolor: 'rgba(255,255,255,0.1)',
                zerolinecolor: 'rgba(255,255,255,0.2)'
            },
            yaxis: {
                title: 'Membrane Potential (mV)',
                gridcolor: 'rgba(255,255,255,0.1)',
                zerolinecolor: 'rgba(255,255,255,0.2)',
                range: [-100, 60]
            },
            yaxis2: {
                title: 'Gate Variable',
                overlaying: 'y',
                side: 'right',
                range: [0, 1],
                showgrid: false
            },
            legend: {
                orientation: 'h',
                y: 1.1
            },
            showlegend: true
        };

        Plotly.newPlot(container, traces, layout, { responsive: true });
    },

    // ==================== SYNAPTIC TRANSMISSION ====================

    triggerSynapticRelease() {
        const vesicles = document.querySelectorAll('.vesicle');
        const ntZone = document.getElementById('nt-zone');
        const receptors = document.querySelectorAll('.receptor');
        const pspElem = document.getElementById('synapse-psp');

        // Animate vesicles
        vesicles.forEach((v, i) => {
            setTimeout(() => {
                v.classList.add('releasing');
            }, i * 100);
        });

        // Create neurotransmitter particles
        if (ntZone) {
            ntZone.innerHTML = '';
            for (let i = 0; i < 8; i++) {
                const nt = document.createElement('div');
                nt.className = 'neurotransmitter';
                nt.style.left = `${20 + Math.random() * 60}px`;
                nt.style.animationDelay = `${Math.random() * 0.3}s`;
                ntZone.appendChild(nt);
            }
        }

        // Activate receptors
        setTimeout(() => {
            receptors.forEach((r, i) => {
                setTimeout(() => r.classList.add('activated'), i * 50);
            });

            // Show PSP
            if (pspElem) {
                const psp = this.synapseType === 'excitatory' ? '+15' : '-10';
                pspElem.textContent = `${psp} mV`;
                pspElem.style.color = this.synapseType === 'excitatory'
                    ? 'var(--accent-green)'
                    : '#ff4444';
            }
        }, 600);
    },

    resetSynapse() {
        const vesicles = document.querySelectorAll('.vesicle');
        const ntZone = document.getElementById('nt-zone');
        const receptors = document.querySelectorAll('.receptor');
        const pspElem = document.getElementById('synapse-psp');

        vesicles.forEach(v => v.classList.remove('releasing'));
        receptors.forEach(r => r.classList.remove('activated'));
        if (ntZone) ntZone.innerHTML = '';
        if (pspElem) {
            pspElem.textContent = '0 mV';
            pspElem.style.color = 'var(--text-primary)';
        }
    },

    updateSynapseInfo() {
        const infoElem = document.getElementById('synapse-type-info');
        if (infoElem) {
            if (this.synapseType === 'excitatory') {
                infoElem.textContent = 'Glutamate → AMPA/NMDA receptors → Na⁺ influx → Depolarization';
            } else {
                infoElem.textContent = 'GABA → GABA-A receptors → Cl⁻ influx → Hyperpolarization';
            }
        }
        this.resetSynapse();
    },

    // ==================== BRAIN WAVES ====================

    startWaveAnimation() {
        const canvas = document.getElementById('wave-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let time = 0;

        const animate = () => {
            const wave = this.waveData[this.currentWaveType];
            ctx.fillStyle = 'rgba(20, 20, 30, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = wave.color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let x = 0; x < canvas.width; x++) {
                const y = canvas.height / 2 +
                    wave.amplitude * Math.sin((x / canvas.width) * wave.freq * Math.PI * 2 + time);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();

            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = wave.color;

            time += 0.05;
            this.waveAnimationId = requestAnimationFrame(animate);
        };

        // Clear existing animation
        if (this.waveAnimationId) {
            cancelAnimationFrame(this.waveAnimationId);
        }

        animate();
        this.updateWaveInfo();
    },

    updateWaveInfo() {
        const wave = this.waveData[this.currentWaveType];

        document.getElementById('wave-frequency').textContent = wave.frequency;
        document.getElementById('wave-state').textContent = wave.state;

        const infoElem = document.getElementById('wave-info');
        if (infoElem) {
            infoElem.innerHTML = `
                <h4 style="color: ${wave.color};">${wave.name}</h4>
                <p>${wave.description}</p>
            `;
        }
    },

    // ==================== BRAIN TOPOLOGY ====================

    setupBrainTopology() {
        const regions = document.querySelectorAll('.region');

        regions.forEach(region => {
            region.addEventListener('click', () => {
                regions.forEach(r => r.classList.remove('selected'));
                region.classList.add('selected');
                this.showRegionInfo(region.dataset.region);
            });

            region.addEventListener('mouseenter', () => {
                this.drawConnections(region.dataset.region);
            });

            region.addEventListener('mouseleave', () => {
                this.clearConnections();
            });
        });
    },

    showRegionInfo(regionId) {
        const info = this.brainRegions[regionId];
        if (!info) return;

        document.getElementById('region-name').textContent = info.name;
        document.getElementById('region-function').textContent = info.function;

        const connectionsElem = document.getElementById('region-connections');
        if (connectionsElem) {
            connectionsElem.innerHTML = '<div style="margin-top: 12px; color: var(--text-muted); font-size: 12px;">Connected to:</div>' +
                info.connections.map(c =>
                    `<span class="connection-tag">${this.brainRegions[c]?.name || c}</span>`
                ).join('');
        }

        this.selectedRegion = regionId;
    },

    drawConnections(regionId) {
        const info = this.brainRegions[regionId];
        if (!info) return;

        const connectionsGroup = document.getElementById('brain-connections');
        if (!connectionsGroup) return;

        connectionsGroup.innerHTML = '';

        const sourceElem = document.getElementById(`region-${regionId}`);
        if (!sourceElem) return;

        const sourceX = parseFloat(sourceElem.getAttribute('cx'));
        const sourceY = parseFloat(sourceElem.getAttribute('cy'));

        info.connections.forEach(targetId => {
            const targetElem = document.getElementById(`region-${targetId}`);
            if (!targetElem) return;

            const targetX = parseFloat(targetElem.getAttribute('cx'));
            const targetY = parseFloat(targetElem.getAttribute('cy'));

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sourceX);
            line.setAttribute('y1', sourceY);
            line.setAttribute('x2', targetX);
            line.setAttribute('y2', targetY);
            line.setAttribute('class', 'connection');

            connectionsGroup.appendChild(line);
        });
    },

    clearConnections() {
        const connectionsGroup = document.getElementById('brain-connections');
        if (connectionsGroup) {
            connectionsGroup.innerHTML = '';
        }
    },

    cleanup() {
        if (this.waveAnimationId) {
            cancelAnimationFrame(this.waveAnimationId);
        }
        if (this.hhChart) {
            this.hhChart.destroy();
            this.hhChart = null;
        }
    }
};

window.NeuroscienceTab = NeuroscienceTab;
