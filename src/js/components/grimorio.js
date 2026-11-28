/* global AFRAME, THREE */
// Grimório aberto na mão oposta à varinha. Cada página dupla apresenta um feitiço:
// o traçado à esquerda e o nome e o efeito à direita. Folhear não interfere na
// conjuração: o reconhecedor continua aceitando qualquer feitiço conhecido.
// Quest: X ou A, na mão do livro, avança e o clique do analógico volta.
// Mesa: Q volta, E avança e G mostra ou oculta o livro.
(() => {
  const PAGINAS = [
    {feitico: 'levioso', nome: 'Levioso', cor: '#8b3dff',
      efeito: 'Uma aura roxa ergue o alvo, que fica suspenso e volta ao chão.'},
    {feitico: 'bombarda', nome: 'Bombarda', cor: '#ff3b1f',
      efeito: 'Uma explosão nasce no ponto atingido e faz o alvo recuar.'},
    {feitico: 'crucio', nome: 'Crucio', cor: '#2be84a',
      efeito: 'Um feixe verde provoca espasmos e deixa uma marca temporária.'},
    {feitico: 'expelliarmus', nome: 'Expelliarmus', cor: '#e6192e',
      efeito: 'Um raio vermelho arranca a varinha da mão do alvo.'}
  ];

  // O livro aberto segue a proporção 2:1 da textura de página dupla.
  const LARGURA = 0.32;
  const ALTURA = 0.16;
  const ABERTURA = THREE.MathUtils.degToRad(9);
  const TEXTURA = {largura: 2048, altura: 1024};
  // Índices do mapeamento xr-standard: 3 é o clique do analógico e 4 é X ou A.
  const BOTAO_VOLTAR = 3;
  const BOTAO_AVANCAR = 4;

  function isPhysicalController(input) {
    return (input.handedness === 'left' || input.handedness === 'right') &&
      input.targetRayMode === 'tracked-pointer' && input.gamepad && !input.hand;
  }

  function carregarImagem(src) {
    return new Promise((resolve, reject) => {
      const imagem = new Image();
      imagem.onload = () => resolve(imagem);
      imagem.onerror = reject;
      imagem.src = src;
    });
  }

  function quebrarLinhas(ctx, texto, largura) {
    const linhas = [];
    let linha = '';
    for (const palavra of texto.split(' ')) {
      const teste = linha ? `${linha} ${palavra}` : palavra;
      if (linha && ctx.measureText(teste).width > largura) {
        linhas.push(linha);
        linha = palavra;
      } else {
        linha = teste;
      }
    }
    if (linha) linhas.push(linha);
    return linhas;
  }

  // Página provisória, usada enquanto a arte final da página não estiver disponível.
  function desenharPagina(pagina, indice, total, tracado) {
    const canvas = document.createElement('canvas');
    canvas.width = TEXTURA.largura;
    canvas.height = TEXTURA.altura;
    const ctx = canvas.getContext('2d');
    const meia = TEXTURA.largura / 2;

    ctx.fillStyle = '#efe2c2';
    ctx.fillRect(0, 0, TEXTURA.largura, TEXTURA.altura);
    const lombada = ctx.createLinearGradient(meia - 140, 0, meia + 140, 0);
    lombada.addColorStop(0, 'rgba(92, 64, 32, 0)');
    lombada.addColorStop(0.5, 'rgba(92, 64, 32, 0.38)');
    lombada.addColorStop(1, 'rgba(92, 64, 32, 0)');
    ctx.fillStyle = lombada;
    ctx.fillRect(meia - 140, 0, 280, TEXTURA.altura);
    ctx.strokeStyle = '#9b7a4a';
    ctx.lineWidth = 6;
    ctx.strokeRect(60, 60, meia - 120, TEXTURA.altura - 120);
    ctx.strokeRect(meia + 60, 60, meia - 120, TEXTURA.altura - 120);

    if (tracado) {
      const lado = 720;
      ctx.drawImage(tracado, (meia - lado) / 2, (TEXTURA.altura - lado) / 2 - 20, lado, lado);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#6b5434';
    ctx.font = '48px Georgia, serif';
    ctx.fillText(`${indice + 1} / ${total}`, meia / 2, TEXTURA.altura - 100);

    const centro = meia + meia / 2;
    ctx.fillStyle = pagina.cor;
    ctx.fillRect(centro - 260, 250, 520, 10);
    ctx.fillStyle = '#2b1d10';
    ctx.font = 'bold 150px Georgia, serif';
    ctx.fillText(pagina.nome, centro, 210);
    ctx.font = '70px Georgia, serif';
    quebrarLinhas(ctx, pagina.efeito, meia - 280).forEach((linha, i) => {
      ctx.fillText(linha, centro, 410 + i * 96);
    });
    ctx.fillStyle = '#6b5434';
    ctx.font = 'italic 52px Georgia, serif';
    quebrarLinhas(ctx, 'Desenhe com o gatilho, solte, aponte e aperte o Grip.', meia - 280)
      .forEach((linha, i) => ctx.fillText(linha, centro, 740 + i * 64));
    ctx.font = '44px Georgia, serif';
    ctx.fillText('X ou A avança · analógico volta', centro, TEXTURA.altura - 100);
    return canvas;
  }

  AFRAME.registerComponent('grimorio', {
    schema: {
      // Arte final das páginas; {feitico} é substituído pelo identificador do feitiço.
      paginas: {default: 'assets/textures/grimorio/pagina-{feitico}.png'},
      tracados: {default: 'assets/textures/tracados/{feitico}.png'},
      // Pose do livro relativa à empunhadura do controle, em metros e graus.
      posicaoVR: {type: 'vec3', default: {x: 0, y: 0.07, z: -0.05}},
      rotacaoVR: {type: 'vec3', default: {x: -55, y: 0, z: 0}},
      // Pose na mesa, relativa ao jogador; X é espelhado conforme a mão da varinha.
      posicaoMesa: {type: 'vec3', default: {x: 0.27, y: 1.3, z: -0.6}}
    },

    init() {
      this.handSelect = document.getElementById('handedness');
      this.vrMenu = this.el.sceneEl.querySelector('#vr-menu');
      this.head = this.el.sceneEl.querySelector('#head');
      this.indice = 0;
      this.mostrar = true;
      this.ladoMesa = null;
      this.botoes = {voltar: false, avancar: false};
      this.fontes = new Map();
      this.texturas = new Map();
      this.offsetPos = new THREE.Vector3();
      this.offsetQuat = new THREE.Quaternion();
      this.olho = new THREE.Vector3();
      this.direcao = new THREE.Vector3();
      this.atualizarOffset();

      // Com o modelo final na entidade filha, as malhas pagina-esquerda e
      // pagina-direita recebem a textura inteira, já dividida pelas UVs.
      this.modelo = this.el.querySelector('[gltf-model]');
      this.paginasModelo = null;
      this.onModelo = () => {
        const mesh = this.modelo.getObject3D('mesh');
        const esquerda = mesh?.getObjectByName('pagina-esquerda');
        const direita = mesh?.getObjectByName('pagina-direita');
        if (!esquerda || !direita) return;
        this.paginasModelo = [esquerda, direita];
        for (const pagina of this.paginasModelo) {
          pagina.material = new THREE.MeshBasicMaterial({color: '#ffffff', fog: false});
        }
        this.aplicarPagina();
      };
      if (this.modelo) {
        this.modelo.addEventListener('model-loaded', this.onModelo);
        if (this.modelo.getObject3D('mesh')) this.onModelo();
      } else {
        this.criarProvisorio();
      }

      this.onKey = this.onKey.bind(this);
      this.onEnterVR = () => { this.botoes.voltar = this.botoes.avancar = true; };
      this.onExitVR = () => { this.ladoMesa = null; };
      this.aplicarPagina();
    },

    update() {
      this.atualizarOffset();
      this.ladoMesa = null;
    },

    play() {
      window.addEventListener('keydown', this.onKey);
      this.el.sceneEl.addEventListener('enter-vr', this.onEnterVR);
      this.el.sceneEl.addEventListener('exit-vr', this.onExitVR);
    },

    pause() {
      window.removeEventListener('keydown', this.onKey);
      this.el.sceneEl.removeEventListener('enter-vr', this.onEnterVR);
      this.el.sceneEl.removeEventListener('exit-vr', this.onExitVR);
    },

    remove() {
      this.modelo?.removeEventListener('model-loaded', this.onModelo);
      for (const textura of this.texturas.values()) {
        for (const item of Object.values(textura)) item.dispose();
      }
      this.el.removeObject3D('grimorio-provisorio');
    },

    atualizarOffset() {
      if (!this.offsetPos) return;
      const {posicaoVR, rotacaoVR} = this.data;
      const rad = THREE.MathUtils.degToRad;
      this.offsetPos.set(posicaoVR.x, posicaoVR.y, posicaoVR.z);
      this.offsetQuat.setFromEuler(new THREE.Euler(rad(rotacaoVR.x), rad(rotacaoVR.y), rad(rotacaoVR.z), 'YXZ'));
    },

    // Capa e duas páginas articuladas na lombada, que fica na origem da entidade.
    criarProvisorio() {
      const grupo = new THREE.Group();
      const capa = new THREE.Mesh(
        new THREE.BoxGeometry(LARGURA / 2 + 0.012, ALTURA + 0.016, 0.01),
        new THREE.MeshStandardMaterial({color: '#5b2f1d', roughness: 0.85}));
      this.folhas = [];
      for (const lado of [-1, 1]) {
        const dobra = new THREE.Group();
        dobra.rotation.y = -lado * ABERTURA;
        const metadeCapa = capa.clone();
        metadeCapa.position.set(lado * (LARGURA / 4 + 0.003), 0, -0.006);
        const folha = new THREE.Mesh(new THREE.PlaneGeometry(LARGURA / 2, ALTURA),
          new THREE.MeshBasicMaterial({color: '#ffffff', fog: false}));
        folha.position.x = lado * LARGURA / 4;
        dobra.add(metadeCapa, folha);
        grupo.add(dobra);
        this.folhas.push(folha);
      }
      this.el.setObject3D('grimorio-provisorio', grupo);
    },

    // A arte final tem prioridade; sem ela, a página é desenhada a partir do traçado.
    fonte(indice) {
      if (!this.fontes.has(indice)) {
        const pagina = PAGINAS[indice];
        const caminho = modelo => modelo.replace('{feitico}', pagina.feitico);
        const promessa = carregarImagem(caminho(this.data.paginas))
          .catch(() => carregarImagem(caminho(this.data.tracados))
            .catch(() => null)
            .then(tracado => desenharPagina(pagina, indice, PAGINAS.length, tracado)));
        this.fontes.set(indice, promessa);
      }
      return this.fontes.get(indice);
    },

    texturasDe(indice, imagem) {
      if (!this.texturas.has(indice)) {
        const criar = (flipY, offsetX, repeatX) => {
          const textura = imagem instanceof HTMLCanvasElement ?
            new THREE.CanvasTexture(imagem) : new THREE.Texture(imagem);
          textura.colorSpace = THREE.SRGBColorSpace;
          textura.flipY = flipY;
          textura.offset.x = offsetX;
          textura.repeat.x = repeatX;
          textura.anisotropy = 4;
          textura.needsUpdate = true;
          return textura;
        };
        this.texturas.set(indice, this.paginasModelo ?
          {inteira: criar(false, 0, 1)} :
          {esquerda: criar(true, 0, 0.5), direita: criar(true, 0.5, 0.5)});
      }
      return this.texturas.get(indice);
    },

    aplicarPagina() {
      const indice = this.indice;
      this.fonte(indice).then(imagem => {
        if (indice !== this.indice || (!this.paginasModelo && !this.folhas)) return;
        const texturas = this.texturasDe(indice, imagem);
        if (this.paginasModelo) {
          for (const pagina of this.paginasModelo) {
            pagina.material.map = texturas.inteira;
            pagina.material.needsUpdate = true;
          }
        } else if (this.folhas) {
          this.folhas[0].material.map = texturas.esquerda;
          this.folhas[1].material.map = texturas.direita;
          for (const folha of this.folhas) folha.material.needsUpdate = true;
        }
      });
      // Pré-carrega as páginas vizinhas para que a troca seja imediata.
      this.fonte((indice + 1) % PAGINAS.length);
      this.fonte((indice + PAGINAS.length - 1) % PAGINAS.length);
    },

    folhear(passo) {
      this.indice = (this.indice + passo + PAGINAS.length) % PAGINAS.length;
      this.aplicarPagina();
      this.el.sceneEl.emit('grimorio-pagina', {indice: this.indice, feitico: PAGINAS[this.indice].feitico}, false);
    },

    alternar() {
      this.mostrar = !this.mostrar;
    },

    onKey(event) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (this.el.sceneEl.renderer?.xr.isPresenting) return;
      const tag = event.target?.tagName;
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (event.code === 'KeyQ') this.folhear(-1);
      else if (event.code === 'KeyE') this.folhear(1);
      else if (event.code === 'KeyG') this.alternar();
    },

    ladoVarinha() {
      return this.handSelect?.value === 'left' ? -1 : 1;
    },

    // Na mesa, o livro fica do lado oposto à varinha e voltado para os olhos.
    posicionarMesa(lado) {
      const livro = this.el.object3D;
      const {posicaoMesa} = this.data;
      livro.position.set(-lado * posicaoMesa.x, posicaoMesa.y, posicaoMesa.z);
      this.olho.copy(this.head?.object3D.position ?? {x: 0, y: 1.6, z: 0});
      this.direcao.subVectors(this.olho, livro.position);
      livro.rotation.order = 'YXZ';
      livro.rotation.set(-Math.atan2(this.direcao.y, Math.hypot(this.direcao.x, this.direcao.z)),
        Math.atan2(this.direcao.x, this.direcao.z), 0);
      this.ladoMesa = lado;
    },

    tick() {
      const scene = this.el.sceneEl;
      const livro = this.el.object3D;
      const xr = scene.renderer?.xr;
      if (!xr?.isPresenting) {
        const lado = this.ladoVarinha();
        if (lado !== this.ladoMesa) this.posicionarMesa(lado);
        livro.visible = this.mostrar;
        return;
      }

      const maoLivro = this.ladoVarinha() === 1 ? 'left' : 'right';
      const source = Array.from(xr.getSession()?.inputSources ?? [])
        .find(input => isPhysicalController(input) && input.handedness === maoLivro);
      const space = xr.getReferenceSpace();
      const pose = source && space && scene.frame?.getPose(source.gripSpace ?? source.targetRaySpace, space);
      // Com o menu de escolha da mão aberto, o livro some para não encobri-lo.
      livro.visible = this.mostrar && Boolean(pose) && !this.vrMenu?.object3D.visible;
      if (pose) {
        const {position, orientation} = pose.transform;
        livro.quaternion.set(orientation.x, orientation.y, orientation.z, orientation.w);
        livro.position.copy(this.offsetPos).applyQuaternion(livro.quaternion).add(position);
        livro.quaternion.multiply(this.offsetQuat);
      }
      this.lerBotoes(source);
    },

    // Cada botão folheia uma vez por pressão, apenas com o livro visível.
    lerBotoes(source) {
      const gamepad = source?.gamepad;
      const xrStandard = gamepad?.mapping === 'xr-standard';
      const voltar = xrStandard && Boolean(gamepad.buttons[BOTAO_VOLTAR]?.pressed);
      const avancar = xrStandard && Boolean(gamepad.buttons[BOTAO_AVANCAR]?.pressed);
      const livre = this.el.object3D.visible;
      if (livre && voltar && !this.botoes.voltar) this.folhear(-1);
      if (livre && avancar && !this.botoes.avancar) this.folhear(1);
      this.botoes.voltar = voltar;
      this.botoes.avancar = avancar;
    }
  });
})();
