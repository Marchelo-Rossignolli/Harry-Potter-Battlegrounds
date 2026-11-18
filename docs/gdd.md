# Game Design Document (GDD) — Harry Potter Battlegrounds

Este documento consolida a concepção inicial do projeto **Harry Potter Battlegrounds**, desenvolvido no contexto da Eletiva de Experiências Imersivas do Inteli (2026), estabelecendo os pilares de jogabilidade, controles imersivos, sistemas de combate mágico, interação ambiental, interface e requisitos funcionais verificáveis que orientarão a implementação.

## Sumário

- [1. Visão Geral do Projeto](#1-visão-geral-do-projeto)
  - [1.1. Conceito Central (*High Concept*)](#11-conceito-central-high-concept)
  - [1.2. Modos de Jogo](#12-modos-de-jogo)
- [2. Mecânicas de Controle, Locomoção e Imersão Física](#2-mecânicas-de-controle-locomoção-e-imersão-física)
  - [2.1. Lançamento Multimodal de Feitiços](#21-lançamento-multimodal-de-feitiços)
  - [2.2. Locomoção Híbrida e Esquiva Física](#22-locomoção-híbrida-e-esquiva-física)
  - [2.3. Mobilidade Tática (*Dash*)](#23-mobilidade-tática-dash)
- [3. Sistema de Combate e Magia](#3-sistema-de-combate-e-magia)
  - [3.1. Categorias Funcionais de Feitiços](#31-categorias-funcionais-de-feitiços)
  - [3.2. Combinação Simultânea de Feitiços](#32-combinação-simultânea-de-feitiços)
  - [3.3. Interação entre Feitiços Opositores](#33-interação-entre-feitiços-opositores)
  - [3.4. Sistema de Proteção (*Protego*) e Recarga Ativa](#34-sistema-de-proteção-protego-e-recarga-ativa)
- [4. Interação Ambiental e Destrutibilidade](#4-interação-ambiental-e-destrutibilidade)
  - [4.1. Manipulação de Cenário em Combate](#41-manipulação-de-cenário-em-combate)
- [5. Interface do Usuário (HUD/UI Diegética) e Recursos](#5-interface-do-usuário-hudui-diegética-e-recursos)
  - [5.1. Medidores de Recursos do Jogador](#51-medidores-de-recursos-do-jogador)
  - [5.2. Grimório na Mão Secundária](#52-grimório-na-mão-secundária)
- [6. Matriz de Requisitos Funcionais do Gameplay](#6-matriz-de-requisitos-funcionais-do-gameplay)

---

## 1. Visão Geral do Projeto

### 1.1. Conceito Central (*High Concept*)

**Harry Potter Battlegrounds** é uma experiência imersiva de combate mágico baseada em interação física e verbal direta. A premissa central consiste em exigir do jogador a execução de movimentos corporais e manuais específicos, combinados à pronúncia de comandos verbais, para desencadear reações mágicas específicas no ambiente virtual.

Ao substituir comandos abstratos de botões por gestos manuais com a varinha, comandos de voz, direcionamento pelo olhar e esquiva física, o jogo busca aproximar a resposta sistêmica da fantasia de um duelo bruxo em primeira pessoa.

### 1.2. Modos de Jogo

A estrutura inicial do jogo prevê dois modos principais, voltados respectivamente ao aprendizado das mecânicas e ao confronto competitivo ou contra inteligência artificial:

| Modo | Finalidade | Escopo Funcional |
| :--- | :--- | :--- |
| **Campo de Treino (*Training Ground*)** | Prática livre e calibração de execução | Ambiente controlado no qual o jogador pode treinar os movimentos de varinha, testar comandos verbais e observar as reações e efeitos individuais ou combinados dos feitiços sem pressão competitiva. |
| **Modo de Batalha (*Battle Mode*)** | Combate direto em arena | Confrontos entre duelistas em cenário interativo, com possibilidade de seleção entre **Jogador vs. Jogador (PvP)** e **Jogador vs. CPU (PvE)**. |

---

## 2. Mecânicas de Controle, Locomoção e Imersão Física

### 2.1. Lançamento Multimodal de Feitiços

O acionamento de cada magia depende de uma entrada multimodal composta por dois sinais simultâneos ou sequenciais validados pelo sistema, somados a um vetor de mira baseado na percepção visual do usuário:

1. **Entrada Gestual (Mão da Varinha):** O jogador deve executar o padrão de movimento específico associado ao feitiço desejado utilizando a mão que empunha a varinha.
2. **Entrada Verbal (Voz):** O jogador deve pronunciar as palavras correspondentes ao feitiço.
3. **Direcionamento pelo Olhar (*Eye-Tracking* / Direção Visual):** Uma vez reconhecidos o gesto e o comando verbal, o feitiço é lançado ao longo do vetor definido pela direção dos olhos do jogador no instante do disparo.

> [!NOTE]
> A especificação detalhada de tolerância de reconhecimento gestual, dicionário fonético/acústico dos feitiços e método de captura do olhar (rastreamento ocular nativo ou vetor frontal da câmera como alternativa de *fallback*) será definida na etapa de arquitetura técnica.

### 2.2. Locomoção Híbrida e Esquiva Física

A movimentação do personagem adota um modelo híbrido que separa o deslocamento macro pela arena da evasão reativa de curto alcance:

- **Deslocamento pelo Cenário:** O corpo do personagem é movimentado pelo espaço da arena por meio do *joystick* do controle.
- **Esquiva Física de Ataques na Cabeça:** Ataques direcionados à altura da cabeça do jogador exigem reação corporal real, permitindo a evasão por meio do deslocamento físico do tronco e da cabeça no espaço rastreado, sem depender exclusivamente do *joystick*.

### 2.3. Mobilidade Tática (*Dash*)

Complementando a locomoção contínua via *joystick* e a esquiva física de cabeça, o jogador dispõe de um **dash lateral**, destinado a reposicionamentos rápidos, quebra de linha de visão e evasão de projéteis ou efeitos de área. A disponibilidade dessa manobra é governada pelo Medidor de *Dash*.

---

## 3. Sistema de Combate e Magia

### 3.1. Categorias Funcionais de Feitiços

O arsenal mágico não se restringe a projéteis de dano direto. Os feitiços são estruturados em categorias funcionais complementares para estimular decisões táticas durante o duelo:

| Categoria | Papel no Combate |
| :--- | :--- |
| **Ataque Direto** | Feitiços ofensivos direcionados ao oponente ou a pontos vulneráveis do cenário. |
| **Defesa** | Feitiços destinados à interceptação, bloqueio ou mitigação de ataques recebidos (com destaque para o *Protego*). |
| **Mobilidade** | Feitiços voltados ao deslocamento, reposicionamento rápido ou alteração dinâmica de alcance na arena. |
| **Efeitos Diversos e Controle** | Feitiços com propriedades utilitárias, de controle de espaço, alteração de terreno ou aplicação de estados combináveis com outras magias. |

### 3.2. Combinação Simultânea de Feitiços

O sistema permite que o jogador **combine os efeitos de mais de um feitiço ao mesmo tempo**. Em vez de restringir o combate a ações isoladas em sequência rígida, os efeitos ativos podem coexistir ou se compor para gerar resultados emergentes no duelo (por exemplo, combinando efeito de controle/terreno com ataque ou mobilidade). As regras formais de composição, limites de empilhamento e catálogo de sinergias deverão ser especificadas na matriz de feitiços em iterações futuras.

### 3.3. Interação entre Feitiços Opositores

Quando feitiços lançados entram em trajetória de colisão, suas propriedades elementais ou funcionais interagem diretamente entre si antes de atingir um alvo. Feitiços de naturezas opostas podem se neutralizar ou modificar mutuamente:

- **Caso de referência:** Um feitiço de **fogo** interceptado por um feitiço de **água** é apagado pela colisão.

Essa mecânica estabelece contra-respostas ativas em tempo real, permitindo utilizar feitiços ofensivos ou ambientais também como ferramenta de anulação tática.

### 3.4. Sistema de Proteção (*Protego*) e Recarga Ativa

O feitiço defensivo **Protego** é regido por uma mecânica de gerenciamento de risco e recompensa que incentiva a ofensiva:

1. **Limite de Usos:** A conjuração de proteção possui uma quantidade máxima de utilizações disponíveis antes de se esgotar (monitorada pelo Medidor de *Protego*).
2. **Penalidade por Esgotamento (*Cooldown*):** Ao ultrapassar o limite de usos permitidos, o escudo entra em estado de recarga (*cooldown*), ficando temporariamente indisponível.
3. **Recarga Ativa por Acerto:** Acertar feitiços contra o oponente reduz ativamente o tempo de recarga restante do *Protego*, recompensando a precisão e evitando duelos excessivamente passivos.

---

## 4. Interação Ambiental e Destrutibilidade

### 4.1. Manipulação de Cenário em Combate

As arenas de batalha são concebidas como espaços dinâmicos e reativos ao uso da magia. O jogador pode direcionar feitiços diretamente contra elementos do cenário para obter vantagem tática sobre o oponente, contemplando ao menos três classes de interação ambiental:

- **Colapso Estrutural:** Derrubar pilastras e elementos arquitetônicos para obstruir passagens ou atingir o adversário.
- **Combustão de Estruturas:** Queimar partes inflamáveis da estrutura do local, alterando a cobertura disponível e criando zonas de risco.
- **Degradação do Terreno:** Modificar o solo com feitiços para tornar o terreno difícil de navegar, restringindo a mobilidade e o posicionamento do oponente.

---

## 5. Interface do Usuário (HUD/UI Diegética) e Recursos

### 5.1. Medidores de Recursos do Jogador

Para manter o jogador informado sobre sua condição física, capacidade defensiva e mobilidade sem comprometer a imersão, o sistema disponibiliza três medidores fundamentais:

| Medidor | Função |
| :--- | :--- |
| **Medidor de Vida** | Representa a integridade do personagem e determina a condição de vitória ou derrota no modo de batalha. |
| **Medidor de *Protego* (Escudo)** | Indica os usos restantes da magia defensiva e, quando esgotado, exibe o progresso do tempo de recarga (*cooldown*). |
| **Medidor de *Dash*** | Indica a disponibilidade ou carga disponível para execução do *dash* lateral. |

### 5.2. Grimório na Mão Secundária

A assistência ao jogador é integrada de forma diegética na mão que não empunha a varinha:

- **Referência Visual em Tempo Real:** O jogador segura um **grimório aberto** na mão secundária, exibindo o desenho/instrução do movimento específico necessário para cada feitiço.
- **Navegação Livre por Páginas:** O jogador pode folhear e trocar as páginas do grimório para consultar diferentes feitiços durante a experiência.
- **Execução Independente da Página Ativa:** A página exibida no grimório funciona apenas como guia de consulta; o jogador pode conjurar qualquer feitiço conhecido independentemente de qual página esteja aberta no momento.

---

## 6. Matriz de Requisitos Funcionais do Gameplay

A tabela a seguir converte as definições conceituais deste GDD em requisitos funcionais verificáveis para o desenvolvimento e a validação técnica do projeto:

| ID | Requisito Funcional | Critério de Verificação |
| :--- | :--- | :--- |
| **RF-01** | Reconhecimento multimodal para conjuração | O sistema dispara o feitiço correspondente somente quando reconhece a combinação válida do gesto manual específico com a varinha e da palavra pronunciada pelo jogador. |
| **RF-02** | Direcionamento de disparo pelo olhar | A trajetória inicial do feitiço lançado alinha-se ao vetor de direção visual definido pelos olhos do jogador no momento da conjuração. |
| **RF-03** | Locomoção híbrida e esquiva física de cabeça | O *joystick* desloca o personagem pela arena enquanto o deslocamento físico da cabeça do jogador retira a caixa de colisão craniana da trajetória de ataques altos. |
| **RF-04** | *Dash* lateral com controle de recurso | O acionamento do *dash* desloca o jogador lateralmente de forma rápida e consome carga do Medidor de *Dash*, bloqueando novos acionamentos quando o recurso estiver indisponível. |
| **RF-05** | Arsenal mágico multicategoria | O sistema implementa feitiços categorizados em ataque direto, defesa, mobilidade e efeitos adicionais de suporte/controle. |
| **RF-06** | Combinação simultânea de efeitos mágicos | O sistema permite que efeitos de dois ou mais feitiços permaneçam ativos e combinados simultaneamente sem cancelamento indevido. |
| **RF-07** | Colisão e interação entre feitiços opositores | Quando dois feitiços de propriedades opostas colidem em voo ou área ativa, ocorre interação determinística entre eles (ex.: feitiço de água apaga feitiço de fogo). |
| **RF-08** | Limite de *Protego* e recarga ativa por acerto | Ultrapassar o limite de usos do *Protego* aciona seu *cooldown* no medidor correspondente; cada acerto de feitiço contra o oponente reduz o tempo restante desse *cooldown*. |
| **RF-09** | Destrutibilidade e alteração tática do cenário | Feitiços aplicados ao ambiente derrubam pilastras, queimam estruturas inflamáveis e convertem áreas em terreno de navegação dificultada, afetando o combate contra o oponente. |
| **RF-10** | Medidores de estado e grimório diegético não restritivo | A interface exibe os medidores de Vida, *Protego* e *Dash*; a mão secundária exibe o grimório aberto com troca de páginas funcional, mantendo todos os feitiços conjuráveis independentemente da página aberta. |
| **RF-11** | Modos de Campo de Treino e Batalha (PvP e PvE) | O jogo oferece um Campo de Treino para prática livre de gestos e efeitos, além de um Modo de Batalha selecionável entre **Jogador vs. Jogador** e **Jogador vs. CPU**. |
