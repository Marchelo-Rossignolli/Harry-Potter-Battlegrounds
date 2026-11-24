AFRAME.registerComponent('carregamento-cenario', {
  init() {
    this.status = document.getElementById('scene-loading');
    this.models = Array.from(this.el.querySelectorAll('[gltf-model]'));
    this.updateReady = this.updateReady.bind(this);
    this.showError = () => {
      this.status.textContent = 'Falha ao carregar o cenário. Recarregue a página.';
    };
    this.el.addEventListener('model-loaded', this.updateReady);
    this.el.addEventListener('model-error', this.showError);
    this.updateReady();
  },

  remove() {
    this.el.removeEventListener('model-loaded', this.updateReady);
    this.el.removeEventListener('model-error', this.showError);
  },

  updateReady() {
    if (!this.models.every(model => model.getObject3D('mesh'))) return;
    this.status.hidden = true;
    this.el.setAttribute('xr-mode-ui', 'enabled', true);
  }
});
