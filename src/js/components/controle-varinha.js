function isPhysicalController(input) {
  return (input.handedness === 'left' || input.handedness === 'right') &&
    input.targetRayMode === 'tracked-pointer' && input.gamepad && !input.hand;
}

// Índices adicionais ao xr-standard, definidos nos perfis Touch do WebXR.
const touchWithMenu = new Set(['meta-quest-touch-plus', 'meta-quest-touch-plus-v2',
  'meta-quest-touch-pro', 'oculus-touch-v3']);

function isLeftMenuPressed(input) {
  if (!input || input.gamepad.mapping !== 'xr-standard') return false;
  const buttons = input.gamepad.buttons;
  if (input.profiles.some(profile => touchWithMenu.has(profile))) {
    return buttons[7]?.pressed || buttons[5]?.pressed;
  }
  return input.profiles.some(profile => profile === 'oculus-touch' || profile === 'oculus-touch-v2') &&
    buttons[5]?.pressed;
}

AFRAME.registerComponent('controle-varinha', {
  init() {
    this.panel = document.querySelector('aside');
    this.handSelect = document.getElementById('handedness');
    this.resetButton = document.getElementById('reset-wand');
    this.grip = this.el.querySelector('#grip');
    this.controllerNotice = this.el.sceneEl.querySelector('#controller-required');
    this.controllerPrompt = this.controllerNotice.querySelector('a-text');
    this.vrMenu = this.el.sceneEl.querySelector('#vr-menu');
    this.keys = new Set();
    this.resetDesktop = this.resetDesktop.bind(this);
    this.onKey = this.onKey.bind(this);
    this.clearKeys = () => this.keys.clear();
    this.selectVRHand = ({inputSource}) => {
      if (!this.vrMenu.object3D.visible || !isPhysicalController(inputSource)) return;
      this.handSelect.value = inputSource.handedness;
      this.updateHand();
      this.vrMenu.object3D.visible = false;
    };
    this.enterVR = () => {
      const xr = this.el.sceneEl.renderer.xr;
      if (!xr.isPresenting) return;
      this.session = xr.getSession();
      this.menuPressed = false;
      this.session.addEventListener('select', this.selectVRHand);
      this.panel.hidden = true;
      this.vrMenu.object3D.visible = true;
      this.clearKeys();
      this.el.object3D.visible = false;
    };
    this.exitVR = () => {
      this.el.sceneEl.components['tracado-varinha']?.suspender();
      this.session?.removeEventListener('select', this.selectVRHand);
      this.session = null;
      this.resetDesktop();
    };
    this.el.object3D.rotation.order = 'YXZ';
    this.resetDesktop();
  },

  play() {
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    window.addEventListener('blur', this.clearKeys);
    this.handSelect.addEventListener('change', this.resetDesktop);
    this.resetButton.addEventListener('click', this.resetDesktop);
    this.el.sceneEl.addEventListener('enter-vr', this.enterVR);
    this.el.sceneEl.addEventListener('exit-vr', this.exitVR);
    this.session?.addEventListener('select', this.selectVRHand);
  },

  pause() {
    this.el.sceneEl.components['tracado-varinha']?.suspender();
    this.clearKeys();
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    window.removeEventListener('blur', this.clearKeys);
    this.handSelect.removeEventListener('change', this.resetDesktop);
    this.resetButton.removeEventListener('click', this.resetDesktop);
    this.el.sceneEl.removeEventListener('enter-vr', this.enterVR);
    this.el.sceneEl.removeEventListener('exit-vr', this.exitVR);
    this.session?.removeEventListener('select', this.selectVRHand);
  },

  updateHand() {
    const side = this.handSelect.value === 'right' ? 1 : -1;
    this.grip.object3D.scale.x = side;
    const direction = side === 1 ? 'direito' : 'esquerdo';
    this.controllerPrompt.setAttribute('value', `Ative o controle ${direction}.`);
    return side;
  },

  resetDesktop() {
    this.panel.hidden = false;
    this.controllerNotice.object3D.visible = false;
    this.vrMenu.object3D.visible = false;
    this.clearKeys();
    const side = this.updateHand();
    const hand = this.el.object3D;
    hand.position.set(side * 0.25, 1.15, -0.4);
    // Start both hands aimed at the chest, accounting for their lateral offset.
    hand.rotation.set(Math.atan2(0.05, Math.hypot(0.25, 3.6)), Math.atan2(side * 0.25, 3.6), 0);
    hand.visible = true;
  },

  onKey(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    if (event.type === 'keyup') {
      this.keys.delete(event.key);
      return;
    }
    if (event.target === this.handSelect || this.el.sceneEl.renderer.xr.isPresenting) return;
    event.preventDefault();
    this.keys.add(event.key);
  },

  tick(time, delta) {
    const scene = this.el.sceneEl;
    const hand = this.el.object3D;
    if (scene.renderer.xr.isPresenting) {
      const xr = scene.renderer.xr;
      const controllers = Array.from(xr.getSession()?.inputSources ?? []).filter(isPhysicalController);
      const left = controllers.find(input => input.handedness === 'left');
      const pressed = isLeftMenuPressed(left);
      if (pressed && !this.menuPressed) this.vrMenu.object3D.visible = true;
      this.menuPressed = pressed;
      const source = controllers.find(input => input.handedness === this.handSelect.value);
      const space = xr.getReferenceSpace();
      const pose = source && space && scene.frame?.getPose(source.targetRaySpace, space);
      hand.visible = Boolean(pose);
      this.controllerNotice.object3D.visible = !pose;
      if (pose) {
        hand.position.copy(pose.transform.position);
        hand.quaternion.copy(pose.transform.orientation);
      }
      const tracado = scene.components['tracado-varinha'];
      if (pose && !this.vrMenu.object3D.visible) {
        tracado?.atualizarControle(source, time);
      } else {
        tracado?.suspender();
      }
      return;
    }

    const step = THREE.MathUtils.degToRad(45) * Math.min(delta || 0, 100) / 1000;
    const pitch = hand.rotation.x + step * (this.keys.has('ArrowUp') - this.keys.has('ArrowDown'));
    hand.rotation.x = THREE.MathUtils.clamp(pitch, -Math.PI / 2, Math.PI / 2);
    hand.rotation.y += step * (this.keys.has('ArrowLeft') - this.keys.has('ArrowRight'));
  }
});