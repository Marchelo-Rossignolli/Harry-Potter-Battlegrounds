# Memória do projeto · Experiências Imersivas

Referência compartilhada da equipe para as discussões das próximas quatro semanas, consolidada a partir das aulas de 16/11/2026. O escopo e as mecânicas do jogo estão documentados no [GDD](../docs/gdd.md).

## 1. Genealogia da imersão (OP03 · Aula 1 · Prof. Bruno Rodilha)

- **Mimese (Platão vs. Aristóteles):**
  - **Platão (*República, Livro X*):** Mimese como *imitação/aparência*. A cama pintada está três graus distante da verdade (Ideia → Carpinteiro → Pintor). Quando a técnica oculta que se trata de uma imitação, configura-se um risco ético de enganar quem observa (**perigo platônico**).
  - **Aristóteles:** Mimese como *representação* e instrumento de aprendizado capaz de apresentar as possibilidades do mundo. Quando a moldura permanece visível, o público experimenta o prazer estético e cognitivo da representação.
- **A moldura e as formas de escondê-la:**
  - A moldura declara que *"isto está no lugar daquilo"* (imitação). A ilusão ocorre quando a imitação rompe a moldura para tornar-se presença (como em *Fugindo da Crítica*, Pere Borrell del Caso, 1874).
  - **Duas estratégias para ocultar a moldura:**
    1. ***Trompe-l'œil* (engana o olho):** A superfície finge profundidade a partir de um ponto fixo (experimento de espelhos de Brunelleschi, 1411; *Santíssima Trindade* de Masaccio, 1427; *O desenhista e a mira fixa* de Albrecht Dürer).
    2. **Presencialidade e *Faux Terrain* (engana o corpo):** O objeto ou a pintura envolve o corpo no mesmo espaço físico, misturando elementos reais e pintados.

| Exemplo da aula | O que acontece com o corpo do observador |
|---|---|
| *Villa dei Misteri* (Pompeia, c. 60 a.C.) | A pintura mural envolve os participantes de um ritual (êxtase, sair de si) e os situa dentro da cena; a finalidade do espaço dá sentido à ilusão. |
| *Drakelowe Hall* (Paul Sandby, 1793) | *Faux terrain*: o terreno falso pintado mistura-se aos objetos reais da sala de jantar. |
| Panoramas (Barker, 1787; Rotunda de Leicester Square, 1801) | Pinturas panorâmicas de 180° a 360° cercam o observador em plataformas centrais (como o relato de Eberhard saindo tonto e sem ter como escapar). |
| Panorama da Batalha de Sedan (Berlim, 1883) | A plataforma fixa o público a 12 metros da tela — limite em que o olho não distingue a pincelada — suspendendo a capacidade de relativizar o que se vê (o perigo de Platão como projeto). |
| Headset (Meta Quest 3) | Fixa a distância óptica entre olhos e visor e liberta o corpo dentro da área rastreada (*sweet spot*). |

- **Tese central da aula:** *"Toda imersão esconde a moldura e prende o corpo num ponto. Quem projeta decide o que a pessoa vai sentir, e para quê."*
- **Ficha de projeto (6 eixos obrigatórios):**
  1. **Domínio:** Onde a experiência acontece.
  2. **Sentir:** O quê, e para quê.
  3. **Teste da tela:** Por que não numa tela comum.
  4. **Moldura:** O que fica dentro, e se ela se mostra.
  5. **Corpo:** Onde fica e o que pode fazer.
  6. **Risco:** Como serviria para enganar.

## 2. Imersão, A-Frame e HTTPS com Caddy (Eletiva XR · Aula 01 · S1)

- **Imersão vs. Presença — Slater e Wilbur (1997), modelo FIVE:**
  - **Imersão (do sistema):** Propriedade objetiva e comparável do aparato técnico — envolve os sentidos (campo de visão, som, rastreamento) e responde ao corpo (virar a cabeça altera a visão).
  - **Presença (da pessoa):** Sensação subjetiva de *"estar lá"* dentro do ambiente virtual; varia entre pessoas e é sustentada por **interação e narrativa**, não apenas pelo hardware.
- **Espectro de imersão:** PC (janela 3D; mouse, teclado, webcam) → Celular (olhar ao redor; giroscópio, toque, câmera) → Celular no suporte (visor simples 3DoF) → Quest (imersão total 6DoF, cabeça e corpo no espaço). Mais imersão exige maior cuidado com conforto e desempenho.
- **A-Frame (`1.8.0`) e HTTPS local com Caddy:**
  - Em A-Frame, cada tag HTML (`<a-scene>`, `<a-sphere>`, `<a-plane>`, `<a-sky>`) representa uma entidade, atributos configuram componentes e a unidade de medida padrão é o **metro**.
  - **WebXR, microfone e câmera só funcionam em contexto seguro (`HTTPS`)**; `localhost` é a única exceção. No acesso por IP da rede local (`https://SEU-IP`), utiliza-se o Caddy com `tls internal` (`root * ./public`, `file_server`), aceitando o certificado ou instalando o `root.crt` da CA local do Caddy uma vez por dispositivo (Quest ou celular).
- **Estrutura de referência do repositório e diário:**
  - `Caddyfile`, `public/index.html`, `public/js/components/` (um componente por arquivo, ex.: `lancador.js`), `public/assets/` (`models/`, `textures/` e `audio/`, em minúsculas e sem espaços), `README.md` (como rodar, IP, dispositivo testado e decisões) e `docs/` (proposta e registros das sextas-feiras).
  - **Diário de Aprendizado:** 1. *O que aprendi hoje* (conceito da aula e sinal de presença desejado na experiência); 2. *Onde travei* (bloqueio atual e próxima tentativa); 3. *Evidência no projeto* (commit, captura de tela ou trecho de código).
- **Desafio da Aula 01 ("lançar sem usar as mãos"):** Formas exploradas na disciplina incluem **Olhar** (mirar e confirmar com o tempo), **Voz** (uma palavra dispara), **Sopro** (volume vira força), **Cabeça** (movimento rápido lança) e **Corpo** (pé, joelho ou tronco na webcam), sob o contrato comum `lancar(forca)`.

| Entrega da disciplina em 2026 | Evidência esperada no repositório |
|---|---|
| 19/11 · Entrega 01 — Proposta | Conceito, público, plataforma, mecânica de lançamento sem mãos, papéis e Ficha do Projeto. |
| 27/11 · Entrega 02 — Prova de Conceito | Demonstração mínima verificando a viabilidade técnica de uma tecnologia escolhida no projeto. |
| 04/12 · Entrega 03 — Assets e Moodboard | Conceito visual (*Moodboard*) e seleção/criação dos *assets* utilizados. |
| 11/12 · Entrega 04 — Vertical Slice | Uma etapa da experiência projetada funcionando de ponta a ponta. |
| 18/12 · Entrega 05 — Apresentação Final | Documentação finalizada e demonstração completa no repositório. |

## 3. Regra de conjuração do campo de treino

O lançamento sem usar as mãos aparece no desafio da Aula 01 e nos itens da Entrega 01 anotados na seção anterior. Para o HPB, o [GDD](../docs/gdd.md#21-conjuração-por-movimento-da-varinha-desenho-do-feitiço) estabelece que todo feitiço exige o traçado e o lançamento com a varinha. O reconhecimento da fala integra o MVP, e a trajetória inicial do feitiço segue a direção apontada pela varinha.

Para observar **presença** nos testes do campo de treino, vale verificar se o jogador acompanha espontaneamente a trajetória do feitiço até o boneco de palha e se consegue descrever o que aconteceu pelo áudio, pelo trajeto visual e pela reação física/elemental do alvo.
