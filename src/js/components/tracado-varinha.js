/* global AFRAME, THREE */
(() => {
  const TAP_MS = 220;
  const TAP_METERS = 0.10;
  const MAX_POINTS = 640;
  const SAMPLES = 40;
  const UP = new THREE.Vector3(0, 1, 0);

  // Linhas centrais dos desenhos de Marcelo, na ordem do gesto, com Y para cima.
  // As pontas de seta dos conceitos indicam o sentido e não são parte do gesto.
  const spells = [
    ['levioso', '#8b3dff', [[0, 0], [0.9, 0], [0.9, 0.32], [0.48, 0.31],
      [0.26, 0.34], [0.12, 0.43], [0.09, 0.58], [0.12, 0.73], [0.24, 0.89], [0.44, 1]]],
    ['bombarda', '#ff3b1f', [[0.91, 1], [0.55, 0.55], [0.98, 0.34],
      [0.05, 0.05], [0.38, 0.44]]],
    ['crucio', '#2be84a', [[0.91, 1], [0.10, 0.47], [0.96, 0.66],
      [0.09, 0.04], [1, 0.23]]],
    ['expelliarmus', '#e6192e', [[0, 1], [0.93, 1], [0.95, 0]]]
  ].map(([feitico, cor, coordinates]) => ({
    feitico, cor, samples: normalize(coordinates.map(([x, y]) => new THREE.Vector2(x, y)))
  }));

  // A distância percorrida determina a amostragem, para aceitar velocidades e
  // taxas de quadros diferentes. A escala uniforme preserva as proporções.
  function normalize(points) {
    const lengths = [0];
    const box = new THREE.Box2();
    box.expandByPoint(points[0]);
    for (let i = 1; i < points.length; i++) {
      box.expandByPoint(points[i]);
      lengths.push(lengths[i - 1] + points[i].distanceTo(points[i - 1]));
    }
    const size = box.getSize(new THREE.Vector2());
    const extent = Math.max(size.x, size.y);
    if (extent < 0.06) return null;
    const samples = [];
    const center = new THREE.Vector2();
    let end = 1;
    for (let i = 0; i < SAMPLES; i++) {
      const at = lengths[lengths.length - 1] * i / (SAMPLES - 1);
      while (end < lengths.length - 1 && lengths[end] < at) end++;
      const span = lengths[end] - lengths[end - 1];
      const point = points[end - 1].clone().lerp(points[end], span ? (at - lengths[end - 1]) / span : 0);
      samples.push(point);
      center.add(point);
    }
    center.divideScalar(SAMPLES);
    return samples.map(point => point.sub(center).divideScalar(extent));
  }

  function recognize(points, right) {
    const projected = points.map(point => new THREE.Vector2(point.dot(right), point.y));
    const samples = normalize(projected);
    if (!samples) return null;
    let best = null;
    let lowest = Infinity;
    let second = Infinity;
    for (const spell of spells) {
      let distance = 0;
      let angleError = 0;
      for (let i = 0; i < SAMPLES; i++) {
        distance += samples[i].distanceTo(spell.samples[i]);
        if (i < 3) continue;
        const actual = samples[i].clone().sub(samples[i - 3]).normalize();
        const expected = spell.samples[i].clone().sub(spell.samples[i - 3]).normalize();
        angleError += 1 - actual.dot(expected);
      }
      const score = distance / SAMPLES + 0.30 * angleError / (SAMPLES - 3);
      if (score < lowest) {
        second = lowest;
        lowest = score;
        best = spell;
      } else {
        second = Math.min(second, score);
      }
    }
    if (lowest > 0.24 || second - lowest < 0.045) return null;
    return {feitico: best.feitico, cor: best.cor, confianca: Math.max(0, 1 - lowest)};
  }

  AFRAME.registerComponent('tracado-varinha', {
    init() {
      this.tip = this.el.querySelector('#wand-tip');
      this.position = new THREE.Vector3();
      this.lastPosition = new THREE.Vector3();
      this.right = new THREE.Vector3();
      this.startLocal = new THREE.Vector3();
      this.endLocal = new THREE.Vector3();
      this.segment = new THREE.Object3D();
      this.axis = new THREE.Vector3();
      this.points = [];
      this.geometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
      this.trails = [false, true].map(halo => {
        const material = new THREE.MeshBasicMaterial({
          color: halo ? '#ffcd64' : '#fff4cf', toneMapped: false,
          transparent: halo, opacity: halo ? 0.22 : 1, depthWrite: !halo,
          blending: halo ? THREE.AdditiveBlending : THREE.NormalBlending
        });
        const mesh = new THREE.InstancedMesh(this.geometry, material, MAX_POINTS - 1);
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.count = 0;
        mesh.frustumCulled = false;
        mesh.visible = false;
        this.el.object3D.add(mesh);
        return mesh;
      });
      this.suspender();
    },

    clearStroke() {
      this.drawing = false;
      this.points.length = 0;
      this.trails.forEach(mesh => { mesh.count = 0; mesh.visible = false; });
    },

    suspender() {
      const canceled = this.drawing || this.armed;
      this.clearStroke();
      this.armed = null;
      this.source = null;
      this.waitRelease = true;
      this.trigger = false;
      this.grip = false;
      if (canceled) this.el.emit('feitico-cancelado', {}, false);
    },

    beginStroke(time) {
      this.drawing = true;
      this.started = time;
      this.distance = 0;
      this.overflow = false;
      this.lastPosition.copy(this.position);
      this.points.push(this.position.clone());
      // O plano vertical fica fixo no mundo até soltar, mesmo virando a cabeça.
      const camera = this.el.camera;
      const view = this.el.renderer?.xr.isPresenting ? this.el.renderer.xr.getCamera() : camera;
      const eye = view?.cameras?.[0] || view;
      if (eye) {
        eye.updateWorldMatrix(true, false);
        this.right.setFromMatrixColumn(eye.matrixWorld, 0);
        this.right.y = 0;
        this.right.normalize();
      }
      if (!eye || this.right.lengthSq() < 0.5) this.right.set(1, 0, 0);
    },

    sampleStroke() {
      this.distance += this.lastPosition.distanceTo(this.position);
      this.lastPosition.copy(this.position);
      const previous = this.points[this.points.length - 1];
      if (previous.distanceToSquared(this.position) < 0.003 ** 2) return;
      if (this.points.length >= MAX_POINTS) {
        this.overflow = true;
        return;
      }
      this.points.push(this.position.clone());
      const parent = this.el.object3D;
      this.startLocal.copy(previous);
      this.endLocal.copy(this.position);
      parent.worldToLocal(this.startLocal);
      parent.worldToLocal(this.endLocal);
      this.axis.subVectors(this.endLocal, this.startLocal);
      const length = this.axis.length();
      this.segment.position.copy(this.startLocal).lerp(this.endLocal, 0.5);
      this.segment.quaternion.setFromUnitVectors(UP, this.axis.normalize());
      this.trails.forEach((mesh, i) => {
        const radius = i ? 0.008 : 0.003;
        this.segment.scale.set(radius, length, radius);
        this.segment.updateMatrix();
        mesh.setMatrixAt(mesh.count++, this.segment.matrix);
        mesh.instanceMatrix.needsUpdate = true;
        mesh.visible = true;
      });
    },

    fire() {
      const {feitico, cor} = this.armed;
      this.armed = null;
      this.clearStroke();
      // A origem é sempre a ponta da varinha, inclusive quando o traço veio do mouse.
      this.tip.object3D.updateWorldMatrix(true, false);
      this.tip.object3D.getWorldPosition(this.position);
      const direction = new THREE.Vector3(0, 0, -1).transformDirection(this.tip.object3D.matrixWorld);
      const {x, y, z} = this.position;
      this.el.emit('feitico-disparado', {
        feitico, cor, origem: {x, y, z}, direcao: {x: direction.x, y: direction.y, z: direction.z}
      }, false);
    },

    // Etapa comum ao controle e ao mouse: this.position já contém o ponto atual.
    // Retorna true quando a soltura consumiu o quadro (disparo ou reconhecimento).
    updateStroke(pressed, pressedNow, time) {
      if (pressedNow) this.beginStroke(time);
      if (!this.drawing) return false;
      this.sampleStroke();
      // Enquanto ainda puder ser toque de disparo, preserve a magia armada.
      const tap = time - this.started < TAP_MS && this.distance < TAP_METERS;
      if (this.armed && !tap) {
        this.armed = null;
        this.el.emit('feitico-cancelado', {}, false);
      }
      if (pressed) return false;
      if (tap && this.armed) {
        this.fire();
        return true;
      }
      const result = !this.overflow && this.distance >= TAP_METERS && recognize(this.points, this.right);
      this.clearStroke();
      if (result) {
        this.armed = result;
        this.el.emit('feitico-reconhecido', {...result}, false);
      } else {
        this.el.emit('feitico-falhou', {motivo: 'Traçado não reconhecido.'}, false);
      }
      return true;
    },

    // Modo de mesa: o mouse projeta o traço num plano diante do jogador.
    tracarMesa(point, pressed, time) {
      if (!this.tip) return;
      const pressedNow = pressed && !this.drawing;
      if (!pressed && !this.drawing) return;
      this.position.copy(point);
      this.updateStroke(pressed, pressedNow, time);
    },

    dispararMesa() {
      if (!this.armed || this.drawing || !this.tip) return false;
      this.fire();
      return true;
    },

    estaArmado() { return Boolean(this.armed); },

    atualizarControle(source, time) {
      const buttons = source?.gamepad?.buttons;
      if (!buttons?.[0] || !this.tip) {
        this.suspender();
        return;
      }
      if (source !== this.source) {
        this.suspender();
        this.source = source;
      }
      const trigger = buttons[0].pressed;
      const grip = Boolean(buttons[1]?.pressed);
      const triggerDown = trigger && !this.trigger;
      const gripDown = grip && !this.grip;
      this.trigger = trigger;
      this.grip = grip;
      if (this.waitRelease) {
        this.waitRelease = trigger || grip;
        return;
      }
      this.tip.object3D.getWorldPosition(this.position);
      if (this.updateStroke(trigger, triggerDown, time)) return;
      if (gripDown && this.armed) this.fire();
    },

    pause() { this.suspender(); },

    remove() {
      this.suspender();
      this.trails.forEach(mesh => {
        mesh.removeFromParent();
        mesh.dispose();
        mesh.material.dispose();
      });
      this.geometry.dispose();
    }
  });
})();
