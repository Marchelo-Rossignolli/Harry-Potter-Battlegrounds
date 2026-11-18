# Game Design Document (GDD) — Harry Potter Battlegrounds

Este documento estabelece as especificações de design do projeto **Harry Potter Battlegrounds**, desenvolvido no contexto da Eletiva de Experiências Imersivas do Inteli (2026). A arquitetura funcional do jogo é organizada em duas frentes complementares: o **Escopo do Produto Mínimo Viável (MVP)**, focado na validação do ciclo central de desenho gestual e lançamento de feitiços em campo de treinamento, e o **Backlog de Evolução**, que consolida as mecânicas de combate em tempo real para desenvolvimento incremental conforme a disponibilidade de cronograma.

## Sumário

- [1. Visão Geral e Recorte de Escopo](#1-visão-geral-e-recorte-de-escopo)
  - [1.1. Conceito Central (*High Concept*)](#11-conceito-central-high-concept)
  - [1.2. Escopo do MVP — Campo de Treinamento](#12-escopo-do-mvp--campo-de-treinamento)
  - [1.3. Diretriz de Priorização e Evolução Incremental](#13-diretriz-de-priorização-e-evolução-incremental)
  - [1.4. Inspirações e Referências](#14-inspirações-e-referências)
- [2. Mecânicas Centrais do MVP (*Core Loop*)](#2-mecânicas-centrais-do-mvp-core-loop)
  - [2.1. Conjuração por Movimento da Varinha (Desenho do Feitiço)](#21-conjuração-por-movimento-da-varinha-desenho-do-feitiço)
  - [2.2. Alvo de Treinamento (Boneco de Palha) e Reações Específicas](#22-alvo-de-treinamento-boneco-de-palha-e-reações-específicas)
  - [2.3. Grimório Diegético na Mão Secundária](#23-grimório-diegético-na-mão-secundária)
  - [2.4. Posicionamento e Controle Base](#24-posicionamento-e-controle-base)
- [3. Backlog de Evolução (Funcionalidades Pós-MVP)](#3-backlog-de-evolução-funcionalidades-pós-mvp)
  - [3.1. Combinação e Criação de Feitiços e Interação entre Opositores](#31-combinação-e-criação-de-feitiços-e-interação-entre-opositores)
  - [3.2. Mobilidade e Defesa de Combate (*Dash*, *Protego* e Esquiva Física)](#32-mobilidade-e-defesa-de-combate-dash-protego-e-esquiva-física)
  - [3.3. Recursos de Combate (Medidores de Vida, *Protego* e *Dash*)](#33-recursos-de-combate-medidores-de-vida-protego-e-dash)
  - [3.4. Interação Ambiental de Arena](#34-interação-ambiental-de-arena)
  - [3.5. Modo de Batalha em Tempo Real (PvP e PvE)](#35-modo-de-batalha-em-tempo-real-pvp-e-pve)
- [4. Matriz de Requisitos e Priorização](#4-matriz-de-requisitos-e-priorização)
  - [4.1. Requisitos Funcionais do MVP (Prioridade Alta — Escopo Atual)](#41-requisitos-funcionais-do-mvp-prioridade-alta--escopo-atual)
  - [4.2. Requisitos do Backlog (Prioridade Secundária — Expansão Futura)](#42-requisitos-do-backlog-prioridade-secundária--expansão-futura)

---

## 1. Visão Geral e Recorte de Escopo

### 1.1. Conceito Central (*High Concept*)

**Harry Potter Battlegrounds** é uma experiência imersiva em primeira pessoa em que o jogador traça feitiços no ar com uma varinha, pronuncia palavras de conjuração e aponta a varinha para lançar feitiços e observar suas reações no ambiente virtual.

### 1.2. Escopo do MVP — Campo de Treinamento

Para garantir profundidade técnica e solidez na mecânica principal antes da introdução de sistemas competitivos complexos, o escopo inicial do projeto concentra-se integralmente no **Campo de Treino (*Training Ground*)**:

- **Cenário Controlado:** Um ambiente de treinamento fechado ou delimitado, estruturado para calibração de gestos, leitura espacial e feedback sensorial imediato.
- **Alvo Dedicado (Boneco de Palha):** Um boneco de palha (*training dummy*) posicionado à frente do jogador funciona como receptor principal das magias lançadas.
- **Ciclo Principal (*Core Loop*):**
  1. O jogador consulta ou recorda o traçado do feitiço desejado.
  2. Desenha o movimento específico no espaço com a varinha na mão dominante e pronuncia as palavras de conjuração.
  3. Lança o feitiço a partir da ponta da varinha, na direção em que ela estiver apontada.
  4. O boneco de palha apresenta uma resposta física e visual compatível com o feitiço acertado, permitindo ao jogador validar precisão e efeito.

### 1.3. Diretriz de Priorização e Evolução Incremental

A estratégia de entrega adota construção incremental sobre uma base validada: primeiro consolida-se a captura confiável do movimento da varinha, o disparo direcionado e as reações distintas no boneco de palha; somente após a estabilização desse núcleo passam a ser incorporados os módulos de duelo em tempo real, defesa ativa, mobilidade tática, criação/combinação avançada de feitiços e suporte *multiplayer* listados na Seção 3.

### 1.4. Inspirações e Referências

#### Hogwarts Legacy — A sensação de aprender magia

![Boneco de treino suspenso pelo feitiço Levioso durante uma aula em Hogwarts.](https://static.actugaming.net/media/2023/02/hogwarts-legacy-cours-defense-forces-mal-5.jpg)

Ao conjurar *Levioso*, o aprendiz vê o boneco de treino subir. A cena inspira a ambientação do HPB no universo de Harry Potter e o papel do boneco de palha no campo de treino. Pela reação do alvo, o jogador pode reconhecer o efeito do feitiço que acabou de conjurar. [Captura da aula de Defesa Contra as Artes das Trevas · ActuGaming](https://www.actugaming.net/soluce-cours-defense-forces-mal-hogwarts-legacy-544187/) · [Página oficial de Hogwarts Legacy](https://www.hogwartslegacy.com/en-ie/faq)

#### War of Wizards — Desenhar o feitiço no ar

![Símbolo mágico luminoso entre o jogador e o adversário em uma arena de realidade virtual.](https://cdn.akamai.steamstatic.com/steam/apps/2009460/ss_57dfec2d1eb9eb9ad56fd621e30a31b332fe3e75.1920x1080.jpg?t=1693891720)

O símbolo luminoso ocupa o espaço entre a mão do jogador e o adversário. A cena ilustra como o jogador pode acompanhar o próprio traçado enquanto mantém o alvo à vista. O jogo serve de referência para os futuros duelos e para o uso da varinha no HPB, tanto no traçado quanto na direção do lançamento. [Galeria oficial na Steam](https://store.steampowered.com/app/2009460/War_of_Wizards/) · [Página oficial de War of Wizards](https://www.altlabvr.com/war-of-wizards)

#### Mage Arena — Consultar o repertório e pronunciar o feitiço

![Grimório aberto na página de Magic Missile, com o projétil visível à frente do jogador.](https://xboxplay.games/uploadStream/66020.jpg)

O grimório aberto exibe *Magic Missile* enquanto o projétil segue em direção aos adversários. A palavra escrita no livro permite associar o nome pronunciado ao efeito produzido. No HPB, essa referência orienta o uso da voz na conjuração e a consulta ao grimório com o alvo ainda no campo de visão. [Fonte da imagem · XboxPlay](https://xboxplay.games/mage-arena/how-to-get-more-spells-in-mage-arena-66020) · [Descrição oficial da conjuração por voz](https://store.steampowered.com/app/3716600/Mage_Arena/)

#### Waltz of the Wizard — Sentir que o mundo escuta

![Anel mágico sobre um pedestal na oficina, em imagem de divulgação da atualização de interação por voz.](https://storage.ghost.io/c/2a/2f/2a2f38f0-4b71-407a-9c7e-18a9e2541980/content/images/2021/12/Aldin-Reality-Ring-Voice.jpg)

A imagem apresenta a atualização de interação por voz. Na demonstração do estúdio, é possível ouvir o comando e observar a mudança que ele provoca no ambiente. Ao pronunciar um feitiço durante o gesto da varinha, o jogador deve poder perceber a consequência de suas palavras na trajetória da magia e na reação do alvo. [Fonte da imagem · UploadVR](https://www.uploadvr.com/waltz-of-the-wizard-voice-interactions/) · [Demonstração dos poderes de voz · Aldin](https://www.youtube.com/watch?v=OvWaiuMWG6M) · [Página oficial na Steam](https://store.steampowered.com/app/1094390/Waltz_of_the_Wizard/)

---

## 2. Mecânicas Centrais do MVP (*Core Loop*)

### 2.1. Conjuração por Movimento da Varinha (Desenho do Feitiço)

A entrada principal do MVP baseia-se no reconhecimento geométrico e cinemático do movimento realizado com a mão da varinha:

**Regra de conjuração.** Todo feitiço exige o uso da varinha para traçar o padrão correspondente e efetuar o lançamento.

1. **Desenho Gestual:** O jogador traça o padrão específico correspondente a cada feitiço utilizando o controlador ou rastreamento da mão que segura a varinha.
2. **Comando de Voz:** O MVP reconhece as palavras pronunciadas pelo jogador e as associa ao feitiço correspondente durante a conjuração.
3. **Mira:** A direção inicial de lançamento segue uma linha que parte da ponta da varinha e acompanha a orientação da varinha no momento do lançamento. A câmera acompanha a cabeça de forma independente da mira.
4. **Feedback de Conjuração:** Ao reconhecer o traçado válido e atender às condições de conjuração, o sistema emite o efeito visual e sonoro da magia na ponta da varinha e projeta o feitiço na direção indicada pela mira.

> [!NOTE]
> As tolerâncias do reconhecimento de traçado, as palavras de conjuração e o catálogo inicial de feitiços de treino serão detalhados na especificação técnica e na matriz de feitiços.

### 2.2. Alvo de Treinamento (Boneco de Palha) e Reações Específicas

O boneco de palha atua como ponto focal de validação das mecânicas do MVP, devendo responder de forma diferenciada e legível a cada feitiço implementado:

- **Reações Físicas:** Oscilação por impacto, repulsão, queda ou estabilização após o golpe.
- **Reações Elementais e de Estado:** Efeitos visuais específicos na superfície ou estrutura do boneco (por exemplo, combustão/chamuscamento, congelamento, atordoamento ou marcas de energia mágica), garantindo que movimentos diferentes causem consequências perceptivelmente distintas.

### 2.3. Grimório Diegético na Mão Secundária

Na mão oposta à que empunha a varinha, o jogador carrega um **grimório aberto** como elemento diegético de auxílio:

- **Guia Visual de Traçado:** As páginas exibem os movimentos específicos exigidos para desenhar cada feitiço disponível no campo de treinamento.
- **Troca Livre de Páginas:** O jogador pode folhear o grimório para consultar diferentes feitiços a qualquer momento.
- **Conjuração Desacoplada:** A execução de um feitiço não fica condicionada à página aberta; o jogador pode desenhar e lançar qualquer feitiço conhecido independentemente da página exibida no momento.

### 2.4. Posicionamento e Controle Base

O deslocamento pelo campo de treinamento ocorre por meio do *joystick* para ajuste de distância e ângulo em relação ao boneco de palha, mantendo a câmera em primeira pessoa alinhada à movimentação física natural da cabeça no ambiente imersivo.

---

## 3. Backlog de Evolução (Funcionalidades Pós-MVP)

As funcionalidades a seguir compõem a visão expandida do projeto e permanecem preservadas em *backlog*, com implementação condicionada à conclusão prévia do MVP e à disponibilidade de tempo no cronograma da disciplina.

### 3.1. Combinação e Criação de Feitiços e Interação entre Opositores

- **Combinação e Criação de Feitiços:** Capacidade de combinar os efeitos de mais de um feitiço simultaneamente ou compor variações mágicas a partir de propriedades acumuladas.
- **Arsenal Multicategoria:** Expansão dos feitiços para além do ataque direto, incorporando categorias dedicadas a defesa, mobilidade e aplicação de efeitos táticos diversos.
- **Interação entre Feitiços Opositores:** Resolução sistêmica quando feitiços de naturezas contrárias colidem em trajetória (por exemplo, um feitiço de fogo sendo apagado ao ser interceptado por um feitiço de água).

### 3.2. Mobilidade e Defesa de Combate (*Dash*, *Protego* e Esquiva Física)

- ***Dash* Lateral:** Manobra rápida de deslocamento lateral para evasão de projéteis e reposicionamento em duelo.
- **Esquiva Física de Cabeça:** Desvio corporal físico do jogador no espaço rastreado para evitar ataques direcionados à altura da cabeça, enquanto o *joystick* controla a locomoção geral do corpo.
- **Feitiço de Proteção (*Protego*) e Recarga Ativa:** Escudo defensivo com limite máximo de utilizações consecutivas; ao ultrapassar esse limite, entra em tempo de recarga (*cooldown*). Acertar feitiços no oponente reduz ativamente o tempo restante de recarga do *Protego*.

### 3.3. Recursos de Combate (Medidores de Vida, *Protego* e *Dash*)

Para sustentar duelos competitivos, a interface passará a incluir três medidores operacionais dedicados:

| Medidor | Finalidade no Backlog |
| :--- | :--- |
| **Medidor de Vida** | Controle de integridade dos duelistas e condição de vitória/derrota em batalha. |
| **Medidor de *Protego* (Escudo)** | Controle de cargas restantes de proteção e contagem regressiva de *cooldown*. |
| **Medidor de *Dash*** | Controle de disponibilidade para execução do *dash* lateral. |

### 3.4. Interação Ambiental de Arena

Evolução do cenário de treinamento estático para arenas interativas em que os feitiços afetam elementos estruturais contra o adversário:

- **Derrubada de Pilastras:** Colapso físico de estruturas para bloquear linhas de visão ou atingir o oponente.
- **Queima de Estruturas:** Propagação de fogo em elementos inflamáveis do local.
- **Alteração de Terreno:** Modificação do piso para tornar áreas difíceis de navegar e restringir o deslocamento inimigo.

### 3.5. Modo de Batalha em Tempo Real (PvP e PvE)

Adição do **Modo de Batalha** sobre a base do sistema de conjuração, contemplando duas modalidades de confronto em tempo real:

- **Jogador vs. Jogador (PvP / *Multiplayer*):** Duelos em rede ou arena compartilhada entre dois participantes.
- **Jogador vs. CPU (PvE):** Duelos contra oponente controlado por inteligência artificial.

---

## 4. Matriz de Requisitos e Priorização

### 4.1. Requisitos Funcionais do MVP (Prioridade Alta — Escopo Atual)

| ID | Requisito Funcional | Critério de Verificação |
| :--- | :--- | :--- |
| **RF-MVP-01** | Campo de Treinamento com boneco de palha | O jogador inicia em um cenário de treinamento contendo um boneco de palha posicionado à sua frente como alvo funcional. |
| **RF-MVP-02** | Desenho e reconhecimento do movimento da varinha | O sistema exige um traçado válido com a varinha para identificar e lançar o feitiço. |
| **RF-MVP-03** | Lançamento direcionado e reação específica no alvo | O feitiço parte da ponta da varinha na direção em que ela aponta, inclusive quando o jogador olha para outro ponto. Ao atingir o boneco de palha, desencadeia a reação física e visual associada. |
| **RF-MVP-04** | Grimório diegético com troca livre de páginas | A mão secundária exibe o grimório aberto com os movimentos de cada feitiço e permite trocar páginas livremente, sem impedir a conjuração de feitiços de outras páginas. |
| **RF-MVP-05** | Locomoção base no campo de treino | O jogador movimenta o personagem pelo campo de treinamento por meio do *joystick* em visão em primeira pessoa. |
| **RF-MVP-06** | Reconhecimento de voz na conjuração | Durante a conjuração, o sistema reconhece as palavras pronunciadas pelo jogador e as associa ao feitiço correspondente. |

### 4.2. Requisitos do Backlog (Prioridade Secundária — Expansão Futura)

| ID | Requisito Funcional | Critério de Verificação |
| :--- | :--- | :--- |
| **RF-BKL-01** | Categorias estendidas, criação e combinação de feitiços | O sistema suporta feitiços de defesa, mobilidade e controle, além da combinação simultânea ou criação de efeitos compostos entre múltiplas magias. |
| **RF-BKL-02** | Colisão entre feitiços opositores | Feitiços de propriedades contrárias interagem ao se interceptarem (ex.: feitiço de água apaga feitiço de fogo). |
| **RF-BKL-03** | *Dash* lateral e esquiva física de cabeça | O jogador executa *dash* lateral pelo controle e evita ataques direcionados à cabeça por meio do deslocamento físico real. |
| **RF-BKL-04** | Sistema *Protego* com limite e recarga ativa | O escudo entra em *cooldown* ao exceder seu limite de usos e tem o tempo restante reduzido a cada feitiço acertado no oponente. |
| **RF-BKL-05** | Medidores de combate e destrutibilidade de arena | A interface exibe os medidores de Vida, *Protego* e *Dash*; feitiços aplicados ao cenário derrubam pilastras, queimam estruturas e dificultam a navegação do terreno. |
| **RF-BKL-06** | Modo de Batalha em tempo real (PvP e PvE) | O jogo disponibiliza confrontos em tempo real selecionáveis entre **Jogador vs. Jogador (*Multiplayer*)** e **Jogador vs. CPU**. |
