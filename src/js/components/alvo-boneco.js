/**
 * Componente A-Frame: alvo-boneco
 * Controla as reações físicas cinemáticas e os efeitos visuais do boneco de palha (#training-dummy),
 * fiel aos 4 conceitos desenhados por Marcelo em src/assets/conceito-feitico/:
 *
 * 1. levioso (ascendio.tiff, roxo #8b3dff):
 *    - Aura e partículas pontilhadas roxas ao redor da base/alvo.
 *    - O boneco sobe suavemente na vertical até Y = +1.50 m, permanece suspenso (~1.8 s) com flutuação
 *      senoidal e retorna suavemente a Y = 0.
 * 2. bombarda (bombarda.tiff, #ff3b1f + #ffe066 + #66f2ff):
 *    - Explosão radial no ponto de impacto com anéis expansivos e raios em zigue-zague nas cores
 *      vermelho, amarelo e ciano, mais fragmentos de palha dispersos.
 *    - Forte recuo angular do torso na base com retorno elástico amortecido.
 * 3. crucio (crucio.tiff, verde #2be84a):
 *    - Durante o feixe (~2 s), o boneco sofre contrações/vibrações rápidas com pulsos e espinhos verdes.
 *    - Mantém a marca/malha esverdeada residual ao redor do alvo por mais ~2 s antes de limpar.
 * 4. expelliarmus (expelliarmus.tiff, vermelho #e6192e):
 *    - Anexa uma varinha de treino visual na mão do boneco.
 *    - Ao ser atingido, a varinha do boneco se desprende, gira em arco parabólico e cai no chão ao lado
 *      da base, retornando à mão do boneco após ~2.5 s para permitir repetição infinita.
 */
(function () {
  function normalizeSpellKey(raw) {
    if (!raw) return 'levioso';
    const s = String(raw).trim().toLowerCase();
    if (s === 'ascendio') return 'levioso';
    return s;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function disposeObject3D(root) {
    if (!root) return;
    root.traverse(node => {
      if (node.geometry && !node.geometry.userData?.shared) {
        node.geometry.dispose();
      }
      if (node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach(m => {
            if (m && !m.userData?.shared) m.dispose();
          });
        } else if (!node.material.userData?.shared) {
          node.material.dispose();
        }
      }
    });
  }

  AFRAME.registerComponent('alvo-boneco', {
    schema: {
      dummySelector: { type: 'string', default: '#training-dummy' },
      levitateHeight: { type: 'number', default: 1.5 },
      levitateRiseTime: { type: 'number', default: 0.55 },
      levitateHoldTime: { type: 'number', default: 1.8 },
      levitateDropTime: { type: 'number', default: 0.5 }
    },

    init() {
      this.sceneEl = this.el.sceneEl || this.el;
      this.dummyEl = this.el.id === 'training-dummy'
        ? this.el
        : (this.sceneEl.querySelector(this.data.dummySelector) || this.el);

      this.basePos = new THREE.Vector3(0, 0, -4);
      this.baseRot = new THREE.Euler(0, 0, 0, 'YXZ');
      if (this.dummyEl && this.dummyEl.object3D) {
        this.basePos.copy(this.dummyEl.object3D.position);
        this.baseRot.copy(this.dummyEl.object3D.rotation);
      }

      // Estados independentes e combináveis
      this.leviosoState = null;
      this.bombardaState = null;
      this.crucioState = null;
      this.expelliarmusState = null;
      this.activeBursts = [];

      // Geometrias compartilhadas para as explosões do Bombarda
      this.sharedBurstGeos = {
        ring0: new THREE.RingGeometry(0.08, 0.15, 24),
        ring1: new THREE.RingGeometry(0.12, 0.20, 24),
        ring2: new THREE.RingGeometry(0.16, 0.25, 24),
        bolt: new THREE.ConeGeometry(0.032, 0.36, 4),
        straw: new THREE.BoxGeometry(0.016, 0.14, 0.016)
      };
      Object.values(this.sharedBurstGeos).forEach(g => {
        g.userData = { shared: true };
      });

      // Grupo fixo no mundo na base do boneco (para partículas no chão e varinha ejetada)
      this.worldFxGroup = new THREE.Group();
      this.worldFxGroup.name = 'dummy-world-fx';
      this.worldFxGroup.position.copy(this.basePos);
      this.sceneEl.object3D.add(this.worldFxGroup);

      // Grupo acoplado ao boneco (acompanha subida e inclinação do boneco)
      this.attachedFxGroup = new THREE.Group();
      this.attachedFxGroup.name = 'dummy-attached-fx';
      if (this.dummyEl && this.dummyEl.object3D) {
        this.dummyEl.object3D.add(this.attachedFxGroup);
      }

      this.setupDummyPropWand();
      this.setupLeviosoAura();
      this.setupCrucioResidualMark();

      this.onSpellHit = this.onSpellHit.bind(this);
      this.el.addEventListener('feitico-acerto', this.onSpellHit);
    },

    remove() {
      this.el.removeEventListener('feitico-acerto', this.onSpellHit);
      this.resetDummyImmediate();
      if (this.worldFxGroup) {
        if (this.worldFxGroup.parent) this.worldFxGroup.parent.remove(this.worldFxGroup);
        disposeObject3D(this.worldFxGroup);
      }
      if (this.attachedFxGroup) {
        if (this.attachedFxGroup.parent) this.attachedFxGroup.parent.remove(this.attachedFxGroup);
        disposeObject3D(this.attachedFxGroup);
      }
      if (this.sharedBurstGeos) {
        Object.values(this.sharedBurstGeos).forEach(g => g.dispose());
      }
    },

    /**
     * Cria a varinha de treino presa à mão direita do boneco de palha para o Expelliarmus.
     */
    setupDummyPropWand() {
      this.propWandRestPos = new THREE.Vector3(0.46, 1.16, 0.14);
      this.propWandRestRot = new THREE.Euler(-0.35, 0.15, -0.25, 'YXZ');

      this.propWandGroup = new THREE.Group();
      this.propWandGroup.name = 'dummy-training-wand';
      this.propWandGroup.position.copy(this.propWandRestPos);
      this.propWandGroup.rotation.copy(this.propWandRestRot);

      // Cabo da varinha de treino
      const handleGeo = new THREE.CylinderGeometry(0.014, 0.018, 0.11, 10);
      const handleMat = new THREE.MeshStandardMaterial({
        color: '#4a2e1b',
        roughness: 0.7,
        metalness: 0.1
      });
      const handleMesh = new THREE.Mesh(handleGeo, handleMat);
      handleMesh.name = 'spell-ignore-raycast';
      this.propWandGroup.add(handleMesh);

      // Haste da varinha de treino
      const shaftGeo = new THREE.CylinderGeometry(0.006, 0.013, 0.28, 10);
      const shaftMat = new THREE.MeshStandardMaterial({
        color: '#7a5033',
        roughness: 0.6,
        metalness: 0.1
      });
      const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
      shaftMesh.name = 'spell-ignore-raycast';
      shaftMesh.position.y = 0.18;
      this.propWandGroup.add(shaftMesh);

      // Ponta dourada sutil para facilitar a leitura visual a 4 metros no Quest
      const tipGeo = new THREE.SphereGeometry(0.014, 10, 10);
      const tipMat = new THREE.MeshBasicMaterial({
        color: '#ffd97d'
      });
      const tipMesh = new THREE.Mesh(tipGeo, tipMat);
      tipMesh.name = 'spell-ignore-raycast';
      tipMesh.position.y = 0.32;
      this.propWandGroup.add(tipMesh);

      this.attachedFxGroup.add(this.propWandGroup);
    },

    /**
     * Cria a nuvem/aura pontilhada roxa ao redor da base do boneco (conforme desenho em ascendio.tiff / Levioso).
     */
    setupLeviosoAura() {
      this.leviosoAuraGroup = new THREE.Group();
      this.leviosoAuraGroup.name = 'levioso-aura';
      this.leviosoAuraGroup.visible = false;

      this.leviosoDots = [];
      const dotGeo = new THREE.SphereGeometry(0.026, 8, 8);
      dotGeo.userData = { shared: true };
      this.sharedBurstGeos.levDot = dotGeo;

      // Duas asas/arcos laterais pontilhados roxos ao redor da base do espantalho, idênticos ao esboço
      for (let i = 0; i < 36; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: i % 3 === 0 ? '#b77bff' : '#8b3dff',
          transparent: true,
          opacity: 0.88
        });
        const mesh = new THREE.Mesh(dotGeo, mat);
        mesh.name = 'spell-ignore-raycast';

        const side = i < 18 ? -1 : 1;
        const idx = i % 18;
        const t = idx / 17;
        const x = side * (0.18 + t * 0.55);
        const y = 0.16 + Math.pow(t, 1.4) * 0.42 + ((idx % 3) - 1) * 0.045;
        const z = ((idx % 5) - 2) * 0.08;

        mesh.position.set(x, y, z);
        this.leviosoAuraGroup.add(mesh);
        this.leviosoDots.push({
          mesh,
          mat,
          basePos: new THREE.Vector3(x, y, z),
          phase: i * 0.45
        });
      }

      // Anel roxo brilhante sob a base suspensa
      const ringGeo = new THREE.RingGeometry(0.28, 0.48, 28);
      ringGeo.rotateX(-Math.PI / 2);
      this.leviosoRingMat = new THREE.MeshBasicMaterial({
        color: '#8b3dff',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });
      this.leviosoRingMesh = new THREE.Mesh(ringGeo, this.leviosoRingMat);
      this.leviosoRingMesh.name = 'spell-ignore-raycast';
      this.leviosoRingMesh.position.y = 0.08;
      this.leviosoAuraGroup.add(this.leviosoRingMesh);

      this.attachedFxGroup.add(this.leviosoAuraGroup);
    },

    /**
     * Cria a malha/marca verde e os espinhos de agonia ao redor do torso do boneco (conforme crucio.tiff).
     */
    setupCrucioResidualMark() {
      this.crucioAuraGroup = new THREE.Group();
      this.crucioAuraGroup.name = 'crucio-mark';
      this.crucioAuraGroup.visible = false;
      this.crucioAuraGroup.position.set(0, 1.18, 0);

      // Esfera em wireframe (grade esverdeada que envolve o torso/cabeça como no desenho de crucio.tiff)
      const cageGeo = new THREE.IcosahedronGeometry(0.62, 2);
      this.crucioCageMat = new THREE.MeshBasicMaterial({
        color: '#2be84a',
        wireframe: true,
        transparent: true,
        opacity: 0.65
      });
      this.crucioCageMesh = new THREE.Mesh(cageGeo, this.crucioCageMat);
      this.crucioCageMesh.name = 'spell-ignore-raycast';
      this.crucioAuraGroup.add(this.crucioCageMesh);

      // Espinhos e raios verdes saindo do torso durante o efeito ativo
      this.crucioSpikes = [];
      const spikeGeo = new THREE.ConeGeometry(0.025, 0.32, 5);
      spikeGeo.userData = { shared: true };
      this.sharedBurstGeos.cruSpike = spikeGeo;

      for (let i = 0; i < 14; i++) {
        const sMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? '#2be84a' : '#a6ffba',
          transparent: true,
          opacity: 0.9
        });
        const sMesh = new THREE.Mesh(spikeGeo, sMat);
        sMesh.name = 'spell-ignore-raycast';
        const angle = (i / 14) * Math.PI * 2;
        const yOff = ((i % 5) - 2) * 0.14;
        sMesh.position.set(Math.cos(angle) * 0.42, yOff, Math.sin(angle) * 0.32);
        sMesh.rotation.z = angle - Math.PI / 2;
        this.crucioAuraGroup.add(sMesh);
        this.crucioSpikes.push({ mesh: sMesh, mat: sMat, baseAngle: angle, phase: i * 0.7 });
      }

      this.attachedFxGroup.add(this.crucioAuraGroup);
    },

    onSpellHit(event) {
      const detail = event?.detail || {};
      const key = normalizeSpellKey(detail.feitico);
      const p = detail.ponto
        ? new THREE.Vector3(detail.ponto.x, detail.ponto.y, detail.ponto.z)
        : new THREE.Vector3(this.basePos.x, this.basePos.y + 1.2, this.basePos.z);
      const d = detail.direcao
        ? new THREE.Vector3(detail.direcao.x, detail.direcao.y, detail.direcao.z)
        : new THREE.Vector3(0, 0, -1);

      this.aplicarFeitico(key, p, d, detail.cor);
    },

    aplicarFeitico(feitico, pontoImpacto, direcao, cor) {
      const key = normalizeSpellKey(feitico);

      const hitPoint = pontoImpacto instanceof THREE.Vector3
        ? pontoImpacto.clone()
        : new THREE.Vector3(
            pontoImpacto?.x ?? this.basePos.x,
            pontoImpacto?.y ?? (this.basePos.y + 1.2),
            pontoImpacto?.z ?? this.basePos.z
          );

      if (key === 'levioso') {
        this.triggerLevioso();
      } else if (key === 'bombarda') {
        this.triggerBombarda(hitPoint);
      } else if (key === 'crucio') {
        this.triggerCrucio();
      } else if (key === 'expelliarmus') {
        this.triggerExpelliarmus();
      }

      this.el.emit('boneco-reagiu', {
        feitico: key,
        cor: cor || null,
        ponto: { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z }
      }, true);
    },

    /**
     * 1. LEVIOSO: Sobe até Y = +1.50 m, flutua por ~1.8 s com aura roxa e desce suavemente a Y = 0.
     */
    triggerLevioso() {
      const currentY = this.dummyEl ? this.dummyEl.object3D.position.y - this.basePos.y : 0;
      this.leviosoState = {
        elapsed: 0,
        startY: Math.max(0, currentY),
        targetY: this.data.levitateHeight,
        riseTime: this.data.levitateRiseTime,
        holdTime: this.data.levitateHoldTime,
        dropTime: this.data.levitateDropTime
      };
      this.leviosoAuraGroup.visible = true;
    },

    /**
     * 2. BOMBARDA: Explosão multicolorida (vermelho #ff3b1f, amarelo #ffe066, ciano #66f2ff),
     * palha espalhada e recuo angular forte do torso na base.
     */
    triggerBombarda(worldHitPoint) {
      this.bombardaState = {
        elapsed: 0,
        duration: 1.35,
        maxPitch: -0.46, // Recuo forte para trás (~26 graus)
        maxRoll: (Math.random() - 0.5) * 0.18
      };

      // Ponto real de contato no espaço do grupo de efeitos; os limites acompanham a levitação.
      this.worldFxGroup.updateWorldMatrix(true, false);
      const localImpact = this.worldFxGroup.worldToLocal(worldHitPoint.clone());
      const lift = this.dummyEl ? this.dummyEl.object3D.position.y - this.basePos.y : 0;
      localImpact.y = THREE.MathUtils.clamp(localImpact.y, 0.5 + lift, 1.65 + lift);
      localImpact.z = THREE.MathUtils.clamp(localImpact.z, -0.35, 0.45);

      const explosionGroup = new THREE.Group();
      explosionGroup.position.copy(localImpact);

      const ringColors = ['#ff3b1f', '#ffe066', '#66f2ff'];
      const ringGeos = [this.sharedBurstGeos.ring0, this.sharedBurstGeos.ring1, this.sharedBurstGeos.ring2];
      const rings = [];
      for (let i = 0; i < 3; i++) {
        const rMat = new THREE.MeshBasicMaterial({
          color: ringColors[i],
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.95,
          depthWrite: false
        });
        const rMesh = new THREE.Mesh(ringGeos[i], rMat);
        rMesh.name = 'spell-ignore-raycast';
        rMesh.rotation.x = (i - 1) * 0.28;
        rMesh.rotation.y = (i - 1) * 0.22;
        explosionGroup.add(rMesh);
        rings.push({ mesh: rMesh, mat: rMat, speed: 2.6 + i * 0.65 });
      }

      const bolts = [];
      for (let i = 0; i < 18; i++) {
        const bMat = new THREE.MeshBasicMaterial({
          color: ringColors[i % 3],
          transparent: true,
          opacity: 0.95
        });
        const bMesh = new THREE.Mesh(this.sharedBurstGeos.bolt, bMat);
        bMesh.name = 'spell-ignore-raycast';
        const angle = (i / 18) * Math.PI * 2;
        const speed = 2.0 + (i % 3) * 0.85;
        const vel = new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          ((i % 3) - 1) * 0.7
        );
        bMesh.rotation.z = angle - Math.PI / 2;
        explosionGroup.add(bMesh);
        bolts.push({ mesh: bMesh, mat: bMat, vel });
      }

      const straws = [];
      for (let i = 0; i < 24; i++) {
        const sMat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? '#e6c26e' : '#c99e46',
          transparent: true,
          opacity: 0.95
        });
        const sMesh = new THREE.Mesh(this.sharedBurstGeos.straw, sMat);
        sMesh.name = 'spell-ignore-raycast';
        const theta = Math.random() * Math.PI * 2;
        const speed = 1.4 + Math.random() * 2.2;
        const vel = new THREE.Vector3(
          Math.cos(theta) * speed,
          1.0 + Math.random() * 2.0,
          Math.sin(theta) * speed + 0.6
        );
        const rotVel = new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        );
        explosionGroup.add(sMesh);
        straws.push({ mesh: sMesh, mat: sMat, vel, rotVel });
      }

      this.worldFxGroup.add(explosionGroup);
      this.activeBursts.push({
        group: explosionGroup,
        rings,
        bolts,
        straws,
        elapsed: 0,
        duration: 0.95
      });
    },

    /**
     * 3. CRUCIO: ~2 s de agonia/contração com pulsos e espinhos verdes + ~2 s de marca esverdeada residual.
     */
    triggerCrucio() {
      this.crucioState = {
        elapsed: 0,
        activeDuration: 2.0,
        residualDuration: 2.0
      };
      this.crucioAuraGroup.visible = true;
    },

    /**
     * 4. EXPELLIARMUS: A varinha de treino se desprende da mão do boneco, gira em arco parabólico,
     * quica ao lado da base e retorna à mão do boneco após ~2.5 s.
     */
    triggerExpelliarmus() {
      const currentLiftY = this.dummyEl ? (this.dummyEl.object3D.position.y - this.basePos.y) : 0;
      const startPos = this.propWandRestPos.clone();
      startPos.y += currentLiftY;

      if (this.propWandGroup.parent !== this.worldFxGroup) {
        this.worldFxGroup.add(this.propWandGroup);
      }
      this.propWandGroup.position.copy(startPos);
      this.propWandGroup.rotation.copy(this.propWandRestRot);
      this.propWandGroup.visible = true;

      this.expelliarmusState = {
        elapsed: 0,
        flightTime: 0.95,
        groundHoldTime: 1.55,
        totalDuration: 2.5,
        startPos,
        vel: new THREE.Vector3(1.15, 2.35, 0.45),
        gravity: -7.8,
        spin: new THREE.Vector3(11.5, 6.0, -14.0),
        landed: false
      };

      if (!this.bombardaState) {
        this.bombardaState = {
          elapsed: 0,
          duration: 0.65,
          maxPitch: -0.18,
          maxRoll: 0.12
        };
      }
    },

    resetDummyImmediate() {
      this.leviosoState = null;
      this.bombardaState = null;
      this.crucioState = null;
      this.expelliarmusState = null;

      if (this.dummyEl && this.dummyEl.object3D) {
        this.dummyEl.object3D.position.copy(this.basePos);
        this.dummyEl.object3D.rotation.copy(this.baseRot);
        this.dummyEl.object3D.scale.set(1, 1, 1);
      }
      if (this.leviosoAuraGroup) this.leviosoAuraGroup.visible = false;
      if (this.crucioAuraGroup) this.crucioAuraGroup.visible = false;
      if (this.propWandGroup) {
        if (this.propWandGroup.parent !== this.attachedFxGroup) {
          this.attachedFxGroup.add(this.propWandGroup);
        }
        this.propWandGroup.position.copy(this.propWandRestPos);
        this.propWandGroup.rotation.copy(this.propWandRestRot);
        this.propWandGroup.visible = true;
      }
    },

    tick(time, delta) {
      if (!this.dummyEl || !this.dummyEl.object3D) return;
      const dt = Math.min(delta || 16, 100) / 1000;
      const dummyObj = this.dummyEl.object3D;

      let offsetY = 0;
      let offsetX = 0;
      let rotX = this.baseRot.x;
      let rotY = this.baseRot.y;
      let rotZ = this.baseRot.z;
      let scaleX = 1;
      let scaleY = 1;
      let scaleZ = 1;

      // 1. Máquina de estados: LEVIOSO (Subida -> Suspensão em +1.50 m -> Descida)
      if (this.leviosoState) {
        const st = this.leviosoState;
        st.elapsed += dt;
        const t1 = st.riseTime;
        const t2 = st.riseTime + st.holdTime;
        const t3 = t2 + st.dropTime;

        let auraAlpha = 1;
        if (st.elapsed <= t1) {
          const p = easeOutCubic(st.elapsed / t1);
          offsetY = THREE.MathUtils.lerp(st.startY, st.targetY, p);
          rotZ += Math.sin(p * Math.PI) * 0.05;
          auraAlpha = p;
        } else if (st.elapsed <= t2) {
          const hoverT = st.elapsed - t1;
          offsetY = st.targetY + Math.sin(hoverT * 3.6) * 0.06;
          rotZ += Math.sin(hoverT * 2.4) * 0.045;
          rotX += Math.cos(hoverT * 2.0) * 0.03;
          auraAlpha = 1;
        } else if (st.elapsed <= t3) {
          const p = easeInOutQuad((st.elapsed - t2) / st.dropTime);
          offsetY = THREE.MathUtils.lerp(st.targetY, 0, p);
          auraAlpha = 1 - p;
        } else {
          offsetY = 0;
          this.leviosoAuraGroup.visible = false;
          this.leviosoState = null;
          this.el.emit('boneco-reset', { feitico: 'levioso' }, true);
        }

        if (this.leviosoState) {
          this.leviosoRingMesh.rotation.z += dt * 2.4;
          this.leviosoRingMat.opacity = 0.7 * auraAlpha;
          for (let i = 0; i < this.leviosoDots.length; i++) {
            const d = this.leviosoDots[i];
            d.mat.opacity = 0.88 * auraAlpha;
            d.mesh.position.y = d.basePos.y + Math.sin(st.elapsed * 5 + d.phase) * 0.035;
          }
        }
      }

      // 2. Máquina de estados: BOMBARDA (Recuo elástico amortecido na base)
      if (this.bombardaState) {
        const st = this.bombardaState;
        st.elapsed += dt;
        if (st.elapsed >= st.duration) {
          const isBombarda = st.maxPitch <= -0.3;
          this.bombardaState = null;
          if (isBombarda) {
            this.el.emit('boneco-reset', { feitico: 'bombarda' }, true);
          }
        } else {
          const p = st.elapsed / st.duration;
          const damp = Math.exp(-3.6 * p);
          const wave = Math.sin(p * Math.PI * 2.5);
          rotX += st.maxPitch * damp * wave;
          rotZ += st.maxRoll * damp * Math.cos(p * Math.PI * 3);
        }
      }

      // 3. Máquina de estados: CRUCIO (2s de contração/agonia com espinhos + 2s de marca verde residual)
      if (this.crucioState) {
        const st = this.crucioState;
        st.elapsed += dt;
        const total = st.activeDuration + st.residualDuration;

        if (st.elapsed <= st.activeDuration) {
          const tremor = Math.sin(st.elapsed * 48) * 0.045;
          const twitch = Math.cos(st.elapsed * 34) * 0.035;
          rotZ += tremor;
          rotY += twitch;
          rotX += 0.1 + Math.sin(st.elapsed * 22) * 0.05;
          offsetX += Math.sin(st.elapsed * 55) * 0.018;

          const squeeze = 1 - 0.06 * (0.5 + 0.5 * Math.sin(st.elapsed * 16));
          scaleX = squeeze;
          scaleZ = squeeze;
          scaleY = 1 + (1 - squeeze) * 0.5;

          this.crucioCageMat.opacity = 0.55 + 0.35 * Math.sin(st.elapsed * 20);
          this.crucioCageMesh.rotation.y += dt * 2.5;
          for (let i = 0; i < this.crucioSpikes.length; i++) {
            const sp = this.crucioSpikes[i];
            sp.mesh.visible = true;
            sp.mat.opacity = 0.9;
            sp.mesh.scale.y = 0.8 + 0.5 * Math.sin(st.elapsed * 28 + sp.phase);
          }
        } else if (st.elapsed <= total) {
          const resP = (st.elapsed - st.activeDuration) / st.residualDuration;
          const fade = Math.max(0, 1 - resP);
          this.crucioCageMat.opacity = 0.55 * fade;
          this.crucioCageMesh.rotation.y += dt * 0.6;
          for (let i = 0; i < this.crucioSpikes.length; i++) {
            const sp = this.crucioSpikes[i];
            sp.mat.opacity = 0.35 * fade;
            sp.mesh.scale.y = Math.max(0.1, 1 - resP);
          }
        } else {
          this.crucioAuraGroup.visible = false;
          this.crucioState = null;
          this.el.emit('boneco-reset', { feitico: 'crucio' }, true);
        }
      }

      // 4. Máquina de estados: EXPELLIARMUS (Voo parabólico da varinha do boneco + queda + reposição)
      if (this.expelliarmusState) {
        const st = this.expelliarmusState;
        st.elapsed += dt;

        if (!st.landed) {
          const t = Math.min(st.elapsed, st.flightTime);
          const x = st.startPos.x + st.vel.x * t;
          const y = st.startPos.y + st.vel.y * t + 0.5 * st.gravity * t * t;
          const z = st.startPos.z + st.vel.z * t;

          if (y <= 0.03 || st.elapsed >= st.flightTime) {
            st.landed = true;
            this.propWandGroup.position.set(x, 0.025, z);
            this.propWandGroup.rotation.set(Math.PI / 2, 0.4, 1.1);
          } else {
            this.propWandGroup.position.set(x, y, z);
            this.propWandGroup.rotation.x += st.spin.x * dt;
            this.propWandGroup.rotation.y += st.spin.y * dt;
            this.propWandGroup.rotation.z += st.spin.z * dt;
          }
        }

        if (st.elapsed >= st.totalDuration) {
          if (this.propWandGroup.parent !== this.attachedFxGroup) {
            this.attachedFxGroup.add(this.propWandGroup);
          }
          this.propWandGroup.position.copy(this.propWandRestPos);
          this.propWandGroup.rotation.copy(this.propWandRestRot);
          this.expelliarmusState = null;
          this.el.emit('boneco-reset', { feitico: 'expelliarmus' }, true);
        }
      }

      // 5. Atualiza explosões do Bombarda (anéis, raios e palha) e faz dispose de materiais ao encerrar
      for (let i = this.activeBursts.length - 1; i >= 0; i--) {
        const b = this.activeBursts[i];
        b.elapsed += dt;
        const p = b.elapsed / b.duration;
        const fade = Math.max(0, 1 - p);

        for (let j = 0; j < b.rings.length; j++) {
          const r = b.rings[j];
          const s = 1 + b.elapsed * r.speed * 2.5;
          r.mesh.scale.setScalar(s);
          r.mat.opacity = 0.95 * fade;
        }
        for (let j = 0; j < b.bolts.length; j++) {
          const bolt = b.bolts[j];
          bolt.mesh.position.addScaledVector(bolt.vel, dt);
          bolt.mat.opacity = 0.95 * fade;
        }
        for (let j = 0; j < b.straws.length; j++) {
          const st = b.straws[j];
          st.vel.y -= 5.8 * dt;
          st.mesh.position.addScaledVector(st.vel, dt);
          st.mesh.rotation.x += st.rotVel.x * dt;
          st.mesh.rotation.y += st.rotVel.y * dt;
          st.mesh.rotation.z += st.rotVel.z * dt;
          st.mat.opacity = 0.95 * fade;
        }

        if (b.elapsed >= b.duration) {
          if (b.group.parent) b.group.parent.remove(b.group);
          disposeObject3D(b.group);
          this.activeBursts.splice(i, 1);
        }
      }

      dummyObj.position.set(this.basePos.x + offsetX, this.basePos.y + offsetY, this.basePos.z);
      dummyObj.rotation.set(rotX, rotY, rotZ);
      dummyObj.scale.set(scaleX, scaleY, scaleZ);
    }
  });
})();
