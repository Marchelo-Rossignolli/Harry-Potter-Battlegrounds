/* global AFRAME, THREE */
// Modo de mesa (fora de VR): o mouse alimenta o mesmo traço de tracado-varinha.
// Botão direito + arrastar ou Shift + botão esquerdo desenham num plano vertical
// diante do jogador; Espaço, o botão Disparar ou um clique direito sem arrasto
// disparam a magia armada pela ponta de #wand-tip.
(() => {
  const PLANE_METERS = 1.0;
  const DRAG_PIXELS = 6;

  AFRAME.registerComponent('tracado-mesa', {
    init() {
      this.raycaster = new THREE.Raycaster();
      this.ndc = new THREE.Vector2();
      this.plane = new THREE.Plane();
      this.forward = new THREE.Vector3();
      this.origin = new THREE.Vector3();
      this.point = new THREE.Vector3();
      this.pointer = null;
      this.fireButton = document.getElementById('fire-spell');
      this.status = document.getElementById('spell-status');
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onContextMenu = event => {
        if (this.isCanvas(event.target)) event.preventDefault();
      };
      this.onFireClick = () => this.fire();
      this.onBlur = () => {
        // Sem a soltura do botão, o traço é descartado em vez de confirmado.
        const drawing = this.pointer?.dragging;
        this.cancel();
        if (drawing) this.tracado()?.cancelarMesa();
      };
      this.cancel = () => {
        this.pointer = null;
        this.el.classList.remove('desenhando');
      };
      this.setStatus = (text, armed) => {
        if (this.status) this.status.textContent = text;
        if (this.fireButton) this.fireButton.disabled = !armed;
      };
      this.onRecognized = ({detail}) => this.setStatus(
        `${detail.feitico[0].toUpperCase()}${detail.feitico.slice(1)} armado. Mire e aperte Espaço.`, true);
      this.onFired = () => this.setStatus('Disparado. Desenhe outro feitiço.', false);
      this.onFailed = () => this.setStatus('Traçado não reconhecido. Tente de novo.', false);
      this.onCancelled = () => this.setStatus('Desenhe um feitiço.', false);
    },

    play() {
      // Captura na janela para chegar antes do look-controls do canvas.
      window.addEventListener('mousedown', this.onMouseDown, true);
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('blur', this.onBlur);
      window.addEventListener('contextmenu', this.onContextMenu);
      this.fireButton?.addEventListener('click', this.onFireClick);
      this.el.addEventListener('enter-vr', this.cancel);
      this.el.addEventListener('feitico-reconhecido', this.onRecognized);
      this.el.addEventListener('feitico-disparado', this.onFired);
      this.el.addEventListener('feitico-falhou', this.onFailed);
      this.el.addEventListener('feitico-cancelado', this.onCancelled);
    },

    pause() {
      this.cancel();
      window.removeEventListener('mousedown', this.onMouseDown, true);
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseup', this.onMouseUp);
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('blur', this.onBlur);
      window.removeEventListener('contextmenu', this.onContextMenu);
      this.fireButton?.removeEventListener('click', this.onFireClick);
      this.el.removeEventListener('enter-vr', this.cancel);
      this.el.removeEventListener('feitico-reconhecido', this.onRecognized);
      this.el.removeEventListener('feitico-disparado', this.onFired);
      this.el.removeEventListener('feitico-falhou', this.onFailed);
      this.el.removeEventListener('feitico-cancelado', this.onCancelled);
    },

    tracado() { return this.el.components['tracado-varinha']; },

    isDesktop() { return !this.el.renderer?.xr.isPresenting; },

    isCanvas(target) { return target === this.el.canvas; },

    onMouseDown(event) {
      if (!this.isDesktop() || !this.isCanvas(event.target)) return;
      const drawButton = event.button === 2 || (event.button === 0 && event.shiftKey);
      if (!drawButton) return;
      // Impede que o look-controls gire a câmera durante o traço.
      event.stopPropagation();
      event.preventDefault();
      // O preventDefault mantém o foco no último botão clicado; sem isso, Espaço o acionaria.
      const focused = document.activeElement;
      if (focused && focused !== document.body && focused !== this.el.canvas) focused.blur();
      this.el.canvas.focus?.({preventScroll: true});
      this.pointer = {button: event.button, x: event.clientX, y: event.clientY, dragging: false};
    },

    onMouseMove(event) {
      const pointer = this.pointer;
      if (!pointer || !this.isDesktop()) return;
      if (!pointer.dragging) {
        if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < DRAG_PIXELS) return;
        pointer.dragging = true;
        this.el.classList.add('desenhando');
        this.fixPlane();
        if (this.project(pointer.x, pointer.y)) this.tracado()?.tracarMesa(this.point, true, event.timeStamp);
      }
      if (this.project(event.clientX, event.clientY)) {
        this.tracado()?.tracarMesa(this.point, true, event.timeStamp);
      }
    },

    onMouseUp(event) {
      const pointer = this.pointer;
      if (!pointer || event.button !== pointer.button) return;
      this.cancel();
      if (pointer.dragging) {
        this.project(event.clientX, event.clientY);
        this.tracado()?.tracarMesa(this.point, false, event.timeStamp);
      } else if (pointer.button === 2) {
        this.fire();
      }
    },

    onKeyDown(event) {
      if (event.code !== 'Space' || event.repeat || !this.isDesktop()) return;
      const tag = event.target?.tagName;
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      event.preventDefault();
      this.fire();
    },

    fire() {
      if (this.isDesktop()) this.tracado()?.dispararMesa();
    },

    // O plano fica fixo no mundo durante o traço, perpendicular ao olhar horizontal.
    fixPlane() {
      const camera = this.el.camera;
      camera.updateWorldMatrix(true, false);
      camera.getWorldPosition(this.origin);
      camera.getWorldDirection(this.forward);
      this.forward.y = 0;
      if (this.forward.lengthSq() < 1e-4) this.forward.set(0, 0, -1);
      this.forward.normalize();
      this.point.copy(this.origin).addScaledVector(this.forward, PLANE_METERS);
      this.plane.setFromNormalAndCoplanarPoint(this.forward, this.point);
    },

    project(clientX, clientY) {
      const rect = this.el.canvas.getBoundingClientRect();
      this.ndc.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
      this.raycaster.setFromCamera(this.ndc, this.el.camera);
      return Boolean(this.raycaster.ray.intersectPlane(this.plane, this.point));
    }
  });
})();
