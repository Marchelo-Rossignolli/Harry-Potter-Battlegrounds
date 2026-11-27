# Harry-Potter-Battlegrounds

## Introdução

Projeto individual desenvolvido por Marcelo Rossignolli para a Eletiva de Experiências Imersivas do Inteli em 2026.

## Campo de treino

A prova de conceito de 27/11 verifica se o jogador consegue desenhar quatro feitiços, apontar a varinha para o boneco de palha a quatro metros e acertar seu peito mesmo ao olhar para uma das balizas douradas. [Checklist e evidências](docs/gdd.md#51-critérios-de-aceitação) · [Planta e corte](docs/gdd.md#15-planta-corte-e-calibração) · [GDD](docs/gdd.md)

[Registro da Semana 2](docs/gdd.md#5-entrega-02-e-registro-da-semana-2) · [Moodboard](docs/moodboard.md)

### Executar no computador

Na raiz do projeto, com Python 3 instalado, execute:

```powershell
python -m http.server 8000 --bind 127.0.0.1 --directory src
```

Abra [o campo de treino no PC](http://localhost:8000). Selecione a mão dominante e clique em **Mirar no boneco**. O botão reposiciona apenas a varinha. O primeiro carregamento requer acesso à distribuição do A-Frame 1.8.0 na internet.

O modo de mesa usa o mesmo reconhecedor e os mesmos efeitos da sessão VR:

| Ação | Comando no computador |
| --- | --- |
| Olhar | Arrastar com o botão esquerdo |
| Girar o punho da varinha | Setas do teclado |
| Desenhar | Arrastar com o botão direito, ou `Shift` + arrastar com o botão esquerdo |
| Disparar a magia preparada | `Espaço`, botão **Disparar** do painel ou clique direito sem arrastar |

O traço é projetado em um plano vertical a 1 m diante da câmera, fixado no início do arrasto. Durante o desenho, a câmera não gira. Ao soltar, a magia reconhecida fica preparada na ponta da varinha e o painel indica o feitiço. O disparo parte da ponta da varinha na direção do seu eixo, independentemente da orientação da câmera. O painel exibe os quatro traçados como referência.

### Executar no Quest

Com o computador e o visor na mesma rede Wi-Fi, consulte o endereço IPv4 do adaptador Wi-Fi em `ipconfig`. Na raiz do repositório, substitua o IP de exemplo pelo endereço consultado e execute os comandos com o Caddy 2 disponível no terminal.

```powershell
$env:HPB_HOST = '192.168.1.50'
caddy run --config Caddyfile
```

Abra no Meta Quest Browser o endereço HTTPS com o mesmo IP informado ao Caddy. Para estabelecer confiança no certificado HTTPS, a CA pública local do Caddy deve ser reconhecida pelo visor. Na execução padrão do Caddy para Windows, o certificado público fica em `%APPDATA%\Caddy\pki\authorities\local\root.crt`. A página do campo usa a porta TCP 443. [Instalação do Caddy](https://caddyserver.com/docs/install) · [HTTPS local com Caddy](https://caddyserver.com/docs/automatic-https#local-https)

O botão VR aparece no canto inferior direito quando os três modelos terminam de carregar. Se o painel exibir uma falha de carregamento, recarregue a página. Ao entrar em VR, aperte o gatilho do controle que vai usar para escolher a mão e fechar o menu de entrada. O controle físico dessa mão é obrigatório para usar a varinha. Se ele perder o rastreamento, o visor indicará qual controle ativar. A varinha volta quando o controle é rastreado novamente.

Durante o treino, aperte o botão **Menu** (três barras) do controle esquerdo para reabrir a seleção. O **Y esquerdo** também abre o menu, inclusive em versões do navegador que reservam o botão Menu. Confirme com o gatilho da mão que deseja usar.

### Conjurar no campo de treino

1. Após escolher a mão, solte o gatilho. Segure-o novamente e desenhe o símbolo no ar em um movimento contínuo. A ponta da varinha deixa um rastro.
2. Solte o gatilho ao terminar o desenho. A cor na ponta indica qual feitiço está pronto. A PoC de 27/11 permite conjurar sem pronunciar o nome.
3. Aponte a ponta para o peito do boneco. Aperte o botão lateral da empunhadura (**Grip**), o comando oficial de disparo. O toque curto no gatilho com a mão parada continua aceito como alternativa. É possível virar a cabeça entre o desenho e o disparo.

| Feitiço | Traçado | Efeito de um acerto |
| --- | --- | --- |
| Levioso · roxo | Cinco invertido, com a curva final para cima | Uma aura envolve o boneco, que sobe e volta ao chão. |
| Bombarda · vermelho-alaranjado | Triângulo quebrado com uma ponta voltada para dentro | A explosão espalha palha e faíscas. O boneco recua e retorna. |
| Crucio · verde | Zigue-zague em forma de Σ | Um feixe verde provoca espasmos e deixa uma marca temporária. |
| Expelliarmus · vermelho | Para a direita e depois para baixo, formando ┐ | Um raio desarma o boneco. A varinha descreve um arco e volta à mão. |

O menu de seleção da mão mostra os quatro desenhos. Um novo desenho substitui a magia preparada. Para cancelar, reabra o menu. Os feitiços param no primeiro elemento sólido no caminho: balizas, muros, piso ou estruturas do pátio. Fora do boneco, o contato produz um impacto na cor do feitiço, e *Bombarda* explode. Para ensaiar um erro de mira, dispare contra uma baliza: o efeito termina nela e o boneco fica imóvel. [Desenhos originais dos quatro feitiços](src/assets/conceito-feitico/)

### Implementação e dispositivo testado

A câmera e a mão pertencem ao mesmo jogador e têm transformações independentes. A sessão WebXR consulta a pose de apontamento do controle selecionado (`targetRaySpace`). A linha parte de um nó na ponta da varinha, a 0,35 m da origem local, e acompanha seu eixo longitudinal por 8 m. A cena carrega três modelos GLB locais. O piso ampliado mede 13 × 15,6 m. O castelo e a tribuna da Sonserina enquadram o boneco, que permanece a 4 m do jogador. [Vista do campo no computador](docs/assets/patio-campo-pc.png)

A validação em Windows usou Chrome 159 e o perfil Quest 3 do IWER 2.8.0. A gravação no Meta Quest 3 físico, em 26/11, documentou as quatro conjurações com o controle direito. Em 27/11 houve confirmação de colisão com o cenário no visor. [Resultados no computador](docs/gdd.md#52-resultados-no-computador) · [Ensaios no Quest físico](docs/gdd.md#53-ensaios-no-quest-físico)

## Conclusão

O campo de treino permite repetir o mesmo gesto no modo de mesa e no visor, observar o preparo na ponta e verificar onde o feitiço termina. No Quest, a demonstração usa o Grip para lançar com a mão apontada independentemente da cabeça. A retomada após perda do controle e o alinhamento do piso seguem como verificações físicas complementares. [Roteiro de cinco minutos](docs/gdd.md#54-demonstração-de-cinco-minutos)
