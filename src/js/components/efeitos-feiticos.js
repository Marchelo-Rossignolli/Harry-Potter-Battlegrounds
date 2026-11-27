/**
 * Componente A-Frame: efeitos-feiticos
 * Gerencia a carga luminosa e o badge diegético na ponta da varinha (#wand-tip / #aim-ray),
 * além do disparo de projéteis e feixes contínuos no espaço 3D (100% independentes de #head
 * e congelados na pose exata do disparo) e detecção de impacto contra #training-dummy.
 *
 * Feitiços da PoC:
 * - levioso (#8b3dff): projétil roxo rápido com rastro de partículas.
 * - bombarda (#ff3b1f + #ffe066 + #66f2ff): projétil ígneo com faíscas vermelho/amarelo/ciano na ponta.
 * - crucio (#2be84a): feixe verde contínuo (~2s) com espinhos e raios laterais verdes.
 * - expelliarmus (#e6192e): raio vermelho contínuo crepitante até o alvo.
 */
(function () {
  const DEFAULT_AIM_COLOR = '#fff1ac';
  const MAX_RAY_DISTANCE = 14.0;

  const SPELL_META = {
    levioso: {
      id: 'levioso',
      label: 'LEVIOSO',
      color: '#8b3dff',
      accent: '#d6b3ff',
      type: 'projectile',
      speed: 14.0,
      maxLifetime: 1.3
    },
    bombarda: {
      id: 'bombarda',
      label: 'BOMBARDA',
      color: '#ff3b1f',
      accent: '#ffe066',
      cyan: '#66f2ff',
      type: 'projectile',
      speed: 12.5,
      maxLifetime: 1.4
    },
    crucio: {
      id: 'crucio',
      label: 'CRUCIO',
      color: '#2be84a',
      accent: '#9effb0',
      type: 'beam',
      duration: 2.0
    },
    expelliarmus: {
      id: 'expelliarmus',
      label: 'EXPELLIARMUS',
      color: '#e6192e',
      accent: '#ff8592',
      type: 'beam',
      duration: 0.95
    }
  };

  function normalizeSpellKey(raw) {
    if (!raw) return null;
    const s = String(raw).trim().toLowerCase();
    if (s === 'ascendio') return 'levioso';
    return SPELL_META[s] ? s : null;
  }

  function toVector3(vecLike, fallback) {
    const out = new THREE.Vector3();
    if (!vecLike) {
      if (fallback) out.copy(fallback);
      return out;
    }
    if (typeof vecLike.x === 'number' && typeof vecLike.y === 'number' && typeof vecLike.z === 'number') {
      out.set(vecLike.x, vecLike.y, vecLike.z);
      return out;
    }
    if (Array.isArray(vecLike) && vecLike.length >= 3) {
      out.set(Number(vecLike[0]) || 0, Number(vecLike[1]) || 0, Number(vecLike[2]) || 0);
      return out;
    }
    if (fallback) out.copy(fallback);
    return out;
  }

  /**
   * Libera geometrias e materiais de um grupo Three.js descartado,
   * preservando apenas geometrias compartilhadas marcadas com userData.shared = true.
   */
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

  AFRAME.registerComponent('efeitos-feiticos', {
    schema: {
      wandTipSelector: { type: 'string', default: '#wand-tip' },
      aimRaySelector: { type: 'string', default: '#aim-ray' },
      dummySelector: { type: 'string', default: '#training-dummy' },
      // Elementos sólidos que interrompem feitiços que erram o boneco.
      obstacleSelector: { type: 'string', default: '#field-bounds, .obstaculo-feitico' }
    },

    init() {
      this.sceneEl = this.el.sceneEl || this.el;
      this.activeProjectiles = [];
      this.activeBeams = [];
      this.transientBursts = [];
      this.primedSpell = null;
      this.chargeTime = 0;

      this.effectsRoot = new THREE.Group();
      this.effectsRoot.name = 'spell-effects-root';
      this.sceneEl.object3D.add(this.effectsRoot);

      this.raycaster = new THREE.Raycaster();
      this._tmpOrigin = new THREE.Vector3();
      this._tmpDir = new THREE.Vector3();
      this._tmpQuat = new THREE.Quaternion();

      // Geometrias reutilizáveis (shared) para evitar alocação/descarte repetitivo na GPU do Quest
      this.sharedGeos = {
        muzzlePart: new THREE.OctahedronGeometry(0.012, 0),
        levCore: new THREE.SphereGeometry(0.055, 14, 14),
        levStreak: new THREE.CylinderGeometry(0.018, 0.062, 0.65, 12),
        levDot: new THREE.SphereGeometry(0.016, 8, 8),
        bomBody: new THREE.CylinderGeometry(0.032, 0.048, 0.58, 12),
        bomTip: new THREE.SphereGeometry(0.07, 14, 14),
        bomSpark: new THREE.ConeGeometry(0.018, 0.09, 6),
        cruThorn: new THREE.ConeGeometry(0.022, 0.24, 5),
        expJag: new THREE.OctahedronGeometry(0.042, 0),
        expRing1: new THREE.RingGeometry(0.11, 0.16, 24),
        expRing2: new THREE.RingGeometry(0.04, 0.08, 20),
        impactShock: new THREE.SphereGeometry(0.5, 18, 12)
      };
      this.sharedGeos.levStreak.rotateX(Math.PI / 2);
      this.sharedGeos.bomBody.rotateX(Math.PI / 2);
      Object.values(this.sharedGeos).forEach(g => {
        g.userData = { shared: true };
      });

      this.onSpellRecognized = this.onSpellRecognized.bind(this);
      this.onSpellCancelled = this.onSpellCancelled.bind(this);
      this.onSpellFailed = this.onSpellFailed.bind(this);
      this.onSpellFired = this.onSpellFired.bind(this);

      this.setupTipChargeVisuals();

      this.sceneEl.addEventListener('feitico-reconhecido', this.onSpellRecognized);
      this.sceneEl.addEventListener('feitico-cancelado', this.onSpellCancelled);
      this.sceneEl.addEventListener('feitico-falhou', this.onSpellFailed);
      this.sceneEl.addEventListener('feitico-disparado', this.onSpellFired);
    },

    remove() {
      this.sceneEl.removeEventListener('feitico-reconhecido', this.onSpellRecognized);
      this.sceneEl.removeEventListener('feitico-cancelado', this.onSpellCancelled);
      this.sceneEl.removeEventListener('feitico-falhou', this.onSpellFailed);
      this.sceneEl.removeEventListener('feitico-disparado', this.onSpellFired);

      this.clearTipCharge();
      if (this.tipChargeGroup) {
        if (this.tipChargeGroup.parent) this.tipChargeGroup.parent.remove(this.tipChargeGroup);
        disposeObject3D(this.tipChargeGroup);
      }
      if (this.badgeEl && this.badgeEl.parentNode) {
        this.badgeEl.parentNode.removeChild(this.badgeEl);
      }
      if (this.effectsRoot) {
        if (this.effectsRoot.parent) this.effectsRoot.parent.remove(this.effectsRoot);
        disposeObject3D(this.effectsRoot);
      }
      if (this.sharedGeos) {
        Object.values(this.sharedGeos).forEach(g => g.dispose());
      }
    },

    getWandTipEl() {
      if (!this.wandTipEl || !this.wandTipEl.isConnected) {
        this.wandTipEl = this.sceneEl.querySelector(this.data.wandTipSelector);
      }
      return this.wandTipEl;
    },

    getAimRayEl() {
      if (!this.aimRayEl || !this.aimRayEl.isConnected) {
        this.aimRayEl = this.sceneEl.querySelector(this.data.aimRaySelector);
      }
      return this.aimRayEl;
    },

    getDummyEl() {
      if (!this.dummyEl || !this.dummyEl.isConnected) {
        this.dummyEl = this.sceneEl.querySelector(this.data.dummySelector);
      }
      return this.dummyEl;
    },

    setupTipChargeVisuals() {
      const tipEl = this.getWandTipEl();
      this.tipChargeGroup = new THREE.Group();
      this.tipChargeGroup.name = 'wand-tip-charge';
      this.tipChargeGroup.visible = false;

      // Núcleo brilhante na ponta da varinha
      const coreGeo = new THREE.SphereGeometry(0.024, 16, 16);
      this.tipCoreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.92
      });
      this.tipCoreMesh = new THREE.Mesh(coreGeo, this.tipCoreMat);
      this.tipChargeGroup.add(this.tipCoreMesh);

      // Halo externo pulsante
      const haloGeo = new THREE.SphereGeometry(0.045, 16, 16);
      this.tipHaloMat = new THREE.MeshBasicMaterial({
        color: 0x8b3dff,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      this.tipHaloMesh = new THREE.Mesh(haloGeo, this.tipHaloMat);
      this.tipChargeGroup.add(this.tipHaloMesh);

      // Anel orbital na ponta
      const ringGeo = new THREE.TorusGeometry(0.048, 0.004, 8, 24);
      this.tipRingMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.75
      });
      this.tipRingMesh = new THREE.Mesh(ringGeo, this.tipRingMat);
      this.tipChargeGroup.add(this.tipRingMesh);

      // Partículas orbitando a ponta
      this.tipParticles = [];
      const partGeo = new THREE.OctahedronGeometry(0.009, 0);
      partGeo.userData = { shared: true };
      this.sharedGeos.tipPart = partGeo;
      for (let i = 0; i < 8; i++) {
        const pMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.85
        });
        const pMesh = new THREE.Mesh(partGeo, pMat);
        const angle = (i / 8) * Math.PI * 2;
        this.tipParticles.push({
          mesh: pMesh,
          mat: pMat,
          baseAngle: angle,
          radius: 0.038 + (i % 2) * 0.012,
          speed: 3.5 + (i % 3) * 0.8,
          zOffset: ((i % 3) - 1) * 0.015
        });
        this.tipChargeGroup.add(pMesh);
      }

      if (tipEl && tipEl.object3D) {
        tipEl.object3D.add(this.tipChargeGroup);
      }

      // Badge diegético sutil acima da ponta da varinha
      if (tipEl) {
        let badge = tipEl.querySelector('#wand-spell-badge');
        if (!badge) {
          badge = document.createElement('a-entity');
          badge.setAttribute('id', 'wand-spell-badge');
          badge.setAttribute('position', '0 0.075 0.04');
          badge.setAttribute('visible', 'false');

          const bg = document.createElement('a-plane');
          bg.setAttribute('width', '0.22');
          bg.setAttribute('height', '0.052');
          bg.setAttribute('material', 'shader: flat; color: #162423; opacity: 0.86; transparent: true; fog: false; side: double');
          badge.appendChild(bg);

          const border = document.createElement('a-plane');
          border.setAttribute('class', 'badge-border');
          border.setAttribute('width', '0.228');
          border.setAttribute('height', '0.058');
          border.setAttribute('position', '0 0 -0.002');
          border.setAttribute('material', 'shader: flat; color: #fff1ac; opacity: 0.7; transparent: true; fog: false; side: double');
          badge.appendChild(border);

          const txt = document.createElement('a-text');
          txt.setAttribute('class', 'badge-label');
          txt.setAttribute('value', '');
          txt.setAttribute('align', 'center');
          txt.setAttribute('color', '#f8f4e6');
          txt.setAttribute('width', '0.52');
          txt.setAttribute('position', '0 0 0.003');
          badge.appendChild(txt);

          tipEl.appendChild(badge);
        }
        this.badgeEl = badge;
        this.badgeLabelEl = badge.querySelector('.badge-label');
        this.badgeBorderEl = badge.querySelector('.badge-border');
      }
    },

    ensureTipAttached() {
      const tipEl = this.getWandTipEl();
      if (tipEl && tipEl.object3D && this.tipChargeGroup && this.tipChargeGroup.parent !== tipEl.object3D) {
        tipEl.object3D.add(this.tipChargeGroup);
      }
    },

    setAimRayColor(colorStr) {
      const aimRay = this.getAimRayEl();
      if (!aimRay) return;
      aimRay.setAttribute('line', 'color', colorStr || DEFAULT_AIM_COLOR);
    },

    onSpellRecognized(event) {
      const detail = event?.detail || {};
      const key = normalizeSpellKey(detail.feitico);
      const meta = key ? SPELL_META[key] : null;
      const color = detail.cor || (meta ? meta.color : '#8b3dff');
      const accent = meta ? meta.accent : '#ffffff';
      const label = meta ? meta.label : String(detail.feitico || 'FEITICO').toUpperCase();

      this.ensureTipAttached();
      this.primedSpell = {
        key: key || String(detail.feitico || 'levioso').toLowerCase(),
        color,
        accent,
        label,
        confianca: detail.confianca ?? 1
      };
      this.chargeTime = 0;

      // Configura cores da carga na ponta
      this.tipCoreMat.color.set(accent);
      this.tipHaloMat.color.set(color);
      this.tipRingMat.color.set(color);
      this.tipParticles.forEach((p, idx) => {
        if (key === 'bombarda') {
          const palette = [meta.color, meta.accent, meta.cyan];
          p.mat.color.set(palette[idx % palette.length]);
        } else {
          p.mat.color.set(idx % 2 === 0 ? color : accent);
        }
      });

      this.tipChargeGroup.visible = true;
      this.setAimRayColor(color);

      if (this.badgeEl) {
        if (this.badgeLabelEl) {
          this.badgeLabelEl.setAttribute('value', label);
          this.badgeLabelEl.setAttribute('color', accent);
        }
        if (this.badgeBorderEl) {
          this.badgeBorderEl.setAttribute('material', 'color', color);
        }
        this.badgeEl.setAttribute('visible', 'true');
        this.badgeEl.object3D.visible = true;
      }
    },

    onSpellCancelled() {
      this.clearTipCharge();
    },

    onSpellFailed() {
      this.clearTipCharge();
      const tipPose = this.getWandTipWorldRay();
      this.spawnMuzzleBurst(tipPose.origin, '#ff4d4d', '#ff9999', 6, 0.25);
    },

    clearTipCharge() {
      this.primedSpell = null;
      if (this.tipChargeGroup) {
        this.tipChargeGroup.visible = false;
      }
      if (this.badgeEl) {
        this.badgeEl.setAttribute('visible', 'false');
        if (this.badgeEl.object3D) this.badgeEl.object3D.visible = false;
      }
      this.setAimRayColor(DEFAULT_AIM_COLOR);
    },

    getWandTipWorldRay() {
      const tipEl = this.getWandTipEl();
      const origin = new THREE.Vector3(0, 1.15, -0.75);
      const direction = new THREE.Vector3(0, 0, -1);

      if (tipEl && tipEl.object3D) {
        tipEl.object3D.updateMatrixWorld(true);
        tipEl.object3D.getWorldPosition(origin);
        tipEl.object3D.getWorldQuaternion(this._tmpQuat);
        direction.set(0, 0, -1).applyQuaternion(this._tmpQuat).normalize();
      }
      return { origin, direction };
    },

    /**
     * Testa interseção do raio (origin, direction) contra o volume do boneco (#training-dummy).
     * Combina THREE.Raycaster nas malhas 3D do boneco com cilindro delimitador robusto
     * para garantir detecção confiável tanto no PC quanto no Quest.
     */
    testDummyHit(origin, direction, maxDistance = MAX_RAY_DISTANCE) {
      const dummyEl = this.getDummyEl();
      if (!dummyEl || !dummyEl.object3D) {
        return { hit: false, distance: maxDistance, point: origin.clone().addScaledVector(direction, maxDistance) };
      }

      dummyEl.object3D.updateMatrixWorld(true);
      const dummyPos = new THREE.Vector3();
      dummyEl.object3D.getWorldPosition(dummyPos);

      // 1. Tenta Raycaster direto nas meshes do boneco
      const meshes = [];
      dummyEl.object3D.traverse(node => {
        if (node.isMesh && node.name !== 'spell-ignore-raycast') {
          meshes.push(node);
        }
      });

      if (meshes.length > 0) {
        this.raycaster.set(origin, direction);
        this.raycaster.near = 0.01;
        this.raycaster.far = maxDistance;
        const hits = this.raycaster.intersectObjects(meshes, false);
        if (hits.length > 0) {
          return {
            hit: true,
            distance: hits[0].distance,
            point: hits[0].point.clone(),
            normal: hits[0].face ? hits[0].face.normal.clone() : direction.clone().negate()
          };
        }
      }

      // 2. Volume cilíndrico de colisão do boneco (raio 0.56m para braços/torso, altura 0.0..1.85m a partir da base atual do boneco)
      const cylRadius = 0.56;
      const minY = dummyPos.y - 0.05;
      const maxY = dummyPos.y + 1.85;

      const ox = origin.x - dummyPos.x;
      const oz = origin.z - dummyPos.z;
      const dx = direction.x;
      const dz = direction.z;

      const a = dx * dx + dz * dz;
      if (a > 1e-6) {
        const b = 2 * (ox * dx + oz * dz);
        const c = ox * ox + oz * oz - cylRadius * cylRadius;
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
          const sqrtDisc = Math.sqrt(disc);
          const t1 = (-b - sqrtDisc) / (2 * a);
          const t2 = (-b + sqrtDisc) / (2 * a);
          const tCandidate = t1 >= 0.05 ? t1 : (t2 >= 0.05 ? t2 : -1);
          if (tCandidate > 0 && tCandidate <= maxDistance) {
            const hitY = origin.y + direction.y * tCandidate;
            if (hitY >= minY && hitY <= maxY) {
              const hitPoint = origin.clone().addScaledVector(direction, tCandidate);
              return {
                hit: true,
                distance: tCandidate,
                point: hitPoint
              };
            }
          }
        }
      }

      return {
        hit: false,
        distance: maxDistance,
        point: origin.clone().addScaledVector(direction, maxDistance)
      };
    },

    /**
     * Primeiro obstáculo do cenário (pátio, muros, piso e balizas) atingido pelo raio.
     * Retorna null quando nada sólido cruza a trajetória até maxDistance.
     */
    testObstacleHit(origin, direction, maxDistance = MAX_RAY_DISTANCE) {
      const meshes = [];
      this.sceneEl.querySelectorAll(this.data.obstacleSelector).forEach(el => {
        el.object3D.updateMatrixWorld(true);
        el.object3D.traverseVisible(node => {
          if (node.isMesh && node.name !== 'spell-ignore-raycast') meshes.push(node);
        });
      });
      if (!meshes.length) return null;
      this.raycaster.set(origin, direction);
      this.raycaster.near = 0.01;
      this.raycaster.far = maxDistance;
      const hit = this.raycaster.intersectObjects(meshes, false)[0];
      if (!hit) return null;
      const normal = hit.face
        ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        : direction.clone().negate();
      return { distance: hit.distance, point: hit.point.clone(), normal };
    },

    /** Explosão no ponto de contato com o cenário; Bombarda tem onda de choque maior. */
    spawnImpact(spellKey, point, normal) {
      const meta = SPELL_META[spellKey] || SPELL_META.levioso;
      const bombarda = spellKey === 'bombarda';
      const group = new THREE.Group();
      group.name = 'spell-impact-' + spellKey;
      group.position.copy(point).addScaledVector(normal, 0.03);
      const palette = bombarda ? [meta.color, meta.accent, meta.cyan] : [meta.color, meta.accent];
      const particles = [];
      const count = bombarda ? 28 : 12;
      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: palette[i % palette.length], transparent: true, opacity: 0.95 });
        const mesh = new THREE.Mesh(bombarda ? this.sharedGeos.bomSpark : this.sharedGeos.muzzlePart, mat);
        if (!bombarda) mesh.scale.setScalar(2.2);
        const vel = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .normalize().addScaledVector(normal, 0.9).normalize()
          .multiplyScalar((bombarda ? 2.2 : 1.1) * (0.5 + Math.random()));
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vel.clone().normalize());
        group.add(mesh);
        particles.push({ mesh, mat, vel });
      }
      const shockMat = new THREE.MeshBasicMaterial({
        color: bombarda ? meta.accent : meta.color, transparent: true, opacity: 0.75, depthWrite: false
      });
      const shock = new THREE.Mesh(this.sharedGeos.impactShock, shockMat);
      shock.scale.setScalar(0.05);
      group.add(shock);
      this.effectsRoot.add(group);
      this.transientBursts.push({
        group, particles, elapsed: 0, duration: bombarda ? 0.7 : 0.4,
        shock: { mesh: shock, mat: shockMat, size: bombarda ? 1.3 : 0.35 }
      });
      this.sceneEl.emit('feitico-impacto', {
        feitico: spellKey, ponto: { x: point.x, y: point.y, z: point.z }
      }, false);
    },

    onSpellFired(event) {
      const detail = event?.detail || {};
      const key = normalizeSpellKey(detail.feitico || this.primedSpell?.key) || 'levioso';
      const meta = SPELL_META[key] || SPELL_META.levioso;
      const color = detail.cor || meta.color;

      const tipRay = this.getWandTipWorldRay();
      const origin = toVector3(detail.origem, tipRay.origin);
      const direction = toVector3(detail.direcao, tipRay.direction);
      if (direction.lengthSq() < 1e-6) {
        direction.copy(tipRay.direction);
      } else {
        direction.normalize();
      }

      // Limpa o estado armado na ponta
      this.clearTipCharge();

      // Flash inicial na ponta da varinha
      this.spawnMuzzleBurst(origin, color, meta.accent, 10, 0.32);

      // Avalia interseção na direção real apontada pela varinha no instante do disparo
      const hitResult = this.testDummyHit(origin, direction, MAX_RAY_DISTANCE);
      // Um obstáculo à frente do boneco (ou no caminho de um erro) interrompe o feitiço.
      const obstacle = this.testObstacleHit(origin, direction, hitResult.hit ? hitResult.distance : MAX_RAY_DISTANCE);
      if (obstacle) {
        hitResult.hit = false;
        hitResult.distance = obstacle.distance;
        hitResult.point = obstacle.point;
        hitResult.obstacle = obstacle;
      }

      if (meta.type === 'projectile') {
        this.launchProjectile(key, meta, color, origin, direction, hitResult);
      } else {
        this.launchContinuousBeam(key, meta, color, origin, direction, hitResult);
      }
    },

    notifyDummyHit(spellKey, color, point, direction) {
      const payload = {
        feitico: spellKey,
        cor: color,
        ponto: { x: point.x, y: point.y, z: point.z },
        direcao: { x: direction.x, y: direction.y, z: direction.z }
      };

      const dummyEl = this.getDummyEl();
      if (dummyEl) {
        dummyEl.emit('feitico-acerto', payload, true);
      } else {
        this.sceneEl.emit('feitico-acerto', payload, false);
      }
    },

    notifyDummyMiss(spellKey, color, origin, direction) {
      const payload = {
        feitico: spellKey,
        cor: color,
        origem: { x: origin.x, y: origin.y, z: origin.z },
        direcao: { x: direction.x, y: direction.y, z: direction.z }
      };
      this.sceneEl.emit('feitico-erro', payload, false);
    },

    spawnMuzzleBurst(position, color, accent, count = 8, duration = 0.3) {
      const group = new THREE.Group();
      group.position.copy(position);
      const particles = [];

      for (let i = 0; i < count; i++) {
        const mat = new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? color : (accent || color),
          transparent: true,
          opacity: 0.95
        });
        const mesh = new THREE.Mesh(this.sharedGeos.muzzlePart, mat);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = 0.4 + Math.random() * 0.9;
        const vel = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        );
        group.add(mesh);
        particles.push({ mesh, mat, vel });
      }

      this.effectsRoot.add(group);
      this.transientBursts.push({
        group,
        particles,
        elapsed: 0,
        duration
      });
    },

    /**
     * Lança projétil para Levioso (roxo rápido com cauda alongada)
     * ou Bombarda (projétil ígneo vermelho com faíscas vermelho/amarelo/ciano na ponta).
     */
    launchProjectile(spellKey, meta, color, origin, direction, hitResult) {
      const group = new THREE.Group();
      group.position.copy(origin);

      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
      group.quaternion.copy(quat);

      const sparks = [];

      if (spellKey === 'levioso') {
        // Conceito Marcelo (ascendio.tiff / Levioso): traço/projétil roxo rápido e alongado
        const coreMat = new THREE.MeshBasicMaterial({ color: '#e2c4ff', transparent: true, opacity: 0.96 });
        group.add(new THREE.Mesh(this.sharedGeos.levCore, coreMat));

        const streakMat = new THREE.MeshBasicMaterial({
          color: color || '#8b3dff',
          transparent: true,
          opacity: 0.85,
          depthWrite: false
        });
        const streakMesh = new THREE.Mesh(this.sharedGeos.levStreak, streakMat);
        streakMesh.position.z = 0.30;
        group.add(streakMesh);

        for (let i = 0; i < 12; i++) {
          const dMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? '#8b3dff' : '#b880ff',
            transparent: true,
            opacity: 0.88
          });
          const dMesh = new THREE.Mesh(this.sharedGeos.levDot, dMat);
          const angle = (i / 12) * Math.PI * 2;
          const r = 0.045 + (i % 3) * 0.018;
          dMesh.position.set(Math.cos(angle) * r, Math.sin(angle) * r, (i / 12) * 0.55);
          group.add(dMesh);
          sparks.push({ mesh: dMesh, baseAngle: angle, radius: r, z: dMesh.position.z, speed: 6 });
        }
      } else {
        // Conceito Marcelo (bombarda.tiff): bastão/jato vermelho incandescente com coroa explosiva de faíscas amarelo/ciano/vermelho na ponta
        const bodyMat = new THREE.MeshBasicMaterial({
          color: '#ff3b1f',
          transparent: true,
          opacity: 0.94
        });
        const bodyMesh = new THREE.Mesh(this.sharedGeos.bomBody, bodyMat);
        bodyMesh.position.z = 0.25;
        group.add(bodyMesh);

        const tipCoreMat = new THREE.MeshBasicMaterial({
          color: '#fff3b0',
          transparent: true,
          opacity: 0.98
        });
        group.add(new THREE.Mesh(this.sharedGeos.bomTip, tipCoreMat));

        const palette = ['#ff3b1f', '#ffe066', '#66f2ff'];
        for (let i = 0; i < 15; i++) {
          const sMat = new THREE.MeshBasicMaterial({
            color: palette[i % palette.length],
            transparent: true,
            opacity: 0.92
          });
          const sMesh = new THREE.Mesh(this.sharedGeos.bomSpark, sMat);
          const angle = (i / 15) * Math.PI * 2;
          const rad = 0.055 + (i % 3) * 0.025;
          sMesh.position.set(Math.cos(angle) * rad, Math.sin(angle) * rad, ((i % 3) - 1) * 0.03);
          sMesh.rotation.z = angle - Math.PI / 2;
          group.add(sMesh);
          sparks.push({ mesh: sMesh, baseAngle: angle, radius: rad, z: sMesh.position.z, speed: 9 });
        }
      }

      this.effectsRoot.add(group);

      const targetDistance = hitResult.hit || hitResult.obstacle ? hitResult.distance : MAX_RAY_DISTANCE;

      if (!hitResult.hit) {
        this.notifyDummyMiss(spellKey, color, origin, direction);
      }

      this.activeProjectiles.push({
        spellKey,
        color,
        group,
        origin: origin.clone(),
        direction: direction.clone(),
        speed: meta.speed,
        traveled: 0,
        targetDistance,
        hitResult,
        sparks,
        elapsed: 0,
        maxLifetime: meta.maxLifetime
      });
    },

    /**
     * Lança feixe contínuo para Crucio (verde #2be84a com espinhos/raios laterais verdes por ~2s)
     * ou Expelliarmus (raio vermelho contínuo crepitante #e6192e até o alvo).
     * O feixe preserva a pose exata (origem e direção) do momento do disparo, não seguindo
     * movimentos posteriores da mão.
     */
    launchContinuousBeam(spellKey, meta, color, origin, direction, hitResult) {
      const group = new THREE.Group();
      const beamLength = hitResult.hit ? Math.max(0.4, hitResult.distance)
        : hitResult.obstacle ? Math.max(0.05, hitResult.distance) : 9.5;
      const endPoint = origin.clone().addScaledVector(direction, beamLength);

      // Posiciona e orienta o grupo do feixe fixo a partir da origem e direção do disparo
      group.position.copy(origin);
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
      group.quaternion.copy(quat);

      // Cilindro central do feixe (ao longo de -Z local)
      const coreGeo = new THREE.CylinderGeometry(0.022, 0.028, beamLength, 10, 1, false);
      coreGeo.rotateX(Math.PI / 2);
      coreGeo.translate(0, 0, -beamLength / 2);
      const coreMat = new THREE.MeshBasicMaterial({
        color: meta.accent,
        transparent: true,
        opacity: 0.95
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      group.add(coreMesh);

      // Aura externa do feixe
      const auraRadius = spellKey === 'expelliarmus' ? 0.068 : 0.054;
      const auraGeo = new THREE.CylinderGeometry(auraRadius, auraRadius * 1.15, beamLength, 12, 1, true);
      auraGeo.rotateX(Math.PI / 2);
      auraGeo.translate(0, 0, -beamLength / 2);
      const auraMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      group.add(auraMesh);

      const thorns = [];

      if (spellKey === 'crucio') {
        // Conceito Marcelo (crucio.tiff): feixe verde contínuo com "efeitos de espinhos" e raios laterais ao longo do feixe
        const thornCount = Math.max(12, Math.floor(beamLength * 5));
        for (let i = 0; i < thornCount; i++) {
          const tMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? '#2be84a' : '#80ff98',
            transparent: true,
            opacity: 0.9
          });
          const tMesh = new THREE.Mesh(this.sharedGeos.cruThorn, tMat);
          const zPos = -0.25 - (i / thornCount) * (beamLength - 0.35);
          const angle = (i * 1.75) % (Math.PI * 2);
          const radialOffset = 0.065 + (i % 3) * 0.018;
          tMesh.position.set(Math.cos(angle) * radialOffset, Math.sin(angle) * radialOffset, zPos);
          tMesh.rotation.z = angle - Math.PI / 2;
          tMesh.rotation.x = -0.45;
          group.add(tMesh);
          thorns.push({ mesh: tMesh, mat: tMat, baseAngle: angle, zPos, radialOffset, phase: i * 0.6 });
        }
      } else if (spellKey === 'expelliarmus') {
        // Conceito Marcelo (expelliarmus.tiff): raio vermelho contínuo frisado/crepitante com anel de impacto no alvo
        const spikeCount = Math.max(18, Math.floor(beamLength * 7));
        for (let i = 0; i < spikeCount; i++) {
          const jMat = new THREE.MeshBasicMaterial({
            color: i % 3 === 0 ? '#ff7b89' : '#e6192e',
            transparent: true,
            opacity: 0.85
          });
          const jMesh = new THREE.Mesh(this.sharedGeos.expJag, jMat);
          jMesh.scale.set(1.6, 0.55, 0.55);
          const zPos = -0.15 - (i / spikeCount) * (beamLength - 0.2);
          const angle = i * 2.2;
          const radialOffset = 0.032 + (i % 2) * 0.025;
          jMesh.position.set(Math.cos(angle) * radialOffset, Math.sin(angle) * radialOffset, zPos);
          jMesh.rotation.z = angle;
          group.add(jMesh);
          thorns.push({ mesh: jMesh, mat: jMat, baseAngle: angle, zPos, radialOffset, phase: i * 0.9 });
        }

        // Alvo/cocar concêntrico vermelho no ponto de impacto (fiel ao desenho de expelliarmus.tiff)
        if (hitResult.hit) {
          const ring1 = new THREE.Mesh(
            this.sharedGeos.expRing1,
            new THREE.MeshBasicMaterial({ color: '#e6192e', side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
          );
          ring1.position.set(0, 0, -beamLength + 0.02);
          group.add(ring1);

          const ring2 = new THREE.Mesh(
            this.sharedGeos.expRing2,
            new THREE.MeshBasicMaterial({ color: '#ff9aa4', side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
          );
          ring2.position.set(0, 0, -beamLength + 0.025);
          group.add(ring2);
          thorns.push({ mesh: ring1, mat: ring1.material, isRing: true, phase: 0 });
          thorns.push({ mesh: ring2, mat: ring2.material, isRing: true, phase: 1.5 });
        }
      }

      this.effectsRoot.add(group);

      if (hitResult.hit) {
        this.notifyDummyHit(spellKey, color, endPoint, direction);
      } else {
        this.notifyDummyMiss(spellKey, color, origin, direction);
        if (hitResult.obstacle) this.spawnImpact(spellKey, endPoint, hitResult.obstacle.normal);
      }

      this.activeBeams.push({
        spellKey,
        group,
        coreMesh,
        coreMat,
        auraMesh,
        auraMat,
        thorns,
        beamLength,
        hit: hitResult.hit,
        hitPoint: endPoint.clone(),
        elapsed: 0,
        duration: meta.duration
      });
    },

    tick(time, delta) {
      const dt = Math.min(delta || 16, 100) / 1000;

      // 1. Anima carga na ponta da varinha quando um feitiço está armado (primed)
      if (this.primedSpell && this.tipChargeGroup && this.tipChargeGroup.visible) {
        this.chargeTime += dt;
        const pulse = 1 + 0.22 * Math.sin(this.chargeTime * 9);
        this.tipCoreMesh.scale.setScalar(pulse);
        this.tipHaloMesh.scale.setScalar(1 + 0.3 * Math.cos(this.chargeTime * 7));
        this.tipRingMesh.rotation.z += dt * 4.2;
        this.tipRingMesh.rotation.x = Math.sin(this.chargeTime * 3) * 0.5;

        for (let i = 0; i < this.tipParticles.length; i++) {
          const p = this.tipParticles[i];
          const a = p.baseAngle + this.chargeTime * p.speed;
          p.mesh.position.set(
            Math.cos(a) * p.radius,
            Math.sin(a) * p.radius,
            p.zOffset + Math.sin(this.chargeTime * 6 + i) * 0.008
          );
          p.mesh.rotation.y += dt * 5;
        }
      }

      // 2. Atualiza projéteis em voo (Levioso / Bombarda)
      for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
        const proj = this.activeProjectiles[i];
        proj.elapsed += dt;
        const step = proj.speed * dt;
        proj.traveled += step;
        proj.group.position.addScaledVector(proj.direction, step);

        // Anima faíscas do projétil
        for (let j = 0; j < proj.sparks.length; j++) {
          const s = proj.sparks[j];
          const a = s.baseAngle + proj.elapsed * s.speed;
          const r = s.radius * (0.85 + 0.25 * Math.sin(proj.elapsed * 14 + j));
          s.mesh.position.x = Math.cos(a) * r;
          s.mesh.position.y = Math.sin(a) * r;
        }

        // Chegou na distância do alvo ou expirou?
        if (proj.traveled >= proj.targetDistance || proj.elapsed >= proj.maxLifetime) {
          if (proj.hitResult.hit) {
            this.notifyDummyHit(proj.spellKey, proj.color, proj.hitResult.point, proj.direction);
          } else if (proj.hitResult.obstacle && proj.traveled >= proj.targetDistance) {
            this.spawnImpact(proj.spellKey, proj.hitResult.point, proj.hitResult.obstacle.normal);
          }
          if (proj.group.parent) proj.group.parent.remove(proj.group);
          disposeObject3D(proj.group);
          this.activeProjectiles.splice(i, 1);
        }
      }

      // 3. Atualiza feixes contínuos (Crucio / Expelliarmus) fixos na trajetória disparada
      for (let i = this.activeBeams.length - 1; i >= 0; i--) {
        const beam = this.activeBeams[i];
        beam.elapsed += dt;
        const progress = beam.elapsed / beam.duration;

        const fade = progress > 0.78 ? Math.max(0, 1 - (progress - 0.78) / 0.22) : 1;
        const flicker = 0.85 + 0.25 * Math.sin(beam.elapsed * 32);
        beam.coreMat.opacity = 0.95 * fade;
        beam.auraMat.opacity = 0.55 * fade * flicker;
        beam.auraMesh.scale.set(flicker, flicker, 1);

        for (let j = 0; j < beam.thorns.length; j++) {
          const t = beam.thorns[j];
          t.mat.opacity = 0.9 * fade;
          if (t.isRing) {
            const s = 1 + 0.2 * Math.sin(beam.elapsed * 18 + t.phase);
            t.mesh.scale.setScalar(s);
          } else {
            const jitter = 1 + 0.28 * Math.sin(beam.elapsed * 26 + t.phase);
            t.mesh.scale.y = jitter;
            const a = t.baseAngle + Math.sin(beam.elapsed * 14 + t.phase) * 0.25;
            t.mesh.position.x = Math.cos(a) * t.radialOffset;
            t.mesh.position.y = Math.sin(a) * t.radialOffset;
          }
        }

        if (beam.elapsed >= beam.duration) {
          if (beam.group.parent) beam.group.parent.remove(beam.group);
          disposeObject3D(beam.group);
          this.activeBeams.splice(i, 1);
        }
      }

      // 4. Atualiza bursts rápidos na ponta
      for (let i = this.transientBursts.length - 1; i >= 0; i--) {
        const b = this.transientBursts[i];
        b.elapsed += dt;
        const ratio = b.elapsed / b.duration;
        for (let j = 0; j < b.particles.length; j++) {
          const p = b.particles[j];
          p.mesh.position.addScaledVector(p.vel, dt);
          p.mat.opacity = Math.max(0, 1 - ratio);
        }
        if (b.shock) {
          b.shock.mesh.scale.setScalar(0.05 + b.shock.size * Math.sqrt(Math.min(1, ratio)));
          b.shock.mat.opacity = 0.75 * Math.max(0, 1 - ratio);
        }
        if (b.elapsed >= b.duration) {
          if (b.group.parent) b.group.parent.remove(b.group);
          disposeObject3D(b.group);
          this.transientBursts.splice(i, 1);
        }
      }
    }
  });
})();
