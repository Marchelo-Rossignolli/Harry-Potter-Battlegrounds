# Ficha do Projeto — Harry Potter Battlegrounds

## Introdução

Esta ficha apresenta a experiência imersiva proposta para Harry Potter Battlegrounds. Seus seis eixos descrevem onde a experiência acontece, o que se pretende que o jogador sinta, por que a realidade virtual é adequada, como os limites da representação se tornam perceptíveis, como o corpo interage com o ambiente e quais reações os estímulos virtuais podem provocar. Esse registro orienta as decisões de desenvolvimento do campo de treino.

### Domínio

A experiência acontece em um campo de treino virtual em primeira pessoa. O jogador pratica a conjuração de feitiços com uma varinha e usa um boneco de palha como alvo.

### Sentir

O jogador deve sentir que seus gestos e suas palavras produzem efeitos no mundo virtual. O MVP inclui o reconhecimento da fala como parte da conjuração. A trajetória do feitiço e a reação do alvo tornam perceptível a relação entre a ação do jogador e seu efeito.

### Teste da tela

Em um monitor com mouse e teclado, coordenar o deslocamento, a consulta ao grimório, o traçado, a fala e o apontamento da varinha exigiria distribuir essas ações entre comandos de teclado e mouse. A realidade virtual sustenta a coordenação proposta ao rastrear as duas mãos e a cabeça de forma independente. Assim, o jogador pode manter o grimório na mão secundária, traçar e apontar com a dominante, mover-se pelo campo e pronunciar o feitiço durante a conjuração.

### Moldura

O campo de treino, o alvo, a varinha, o grimório e os efeitos dos feitiços compõem o espaço representado. As instruções de conjuração fazem parte desse espaço por meio das páginas do grimório que o jogador segura e consulta.

A linha de mira, quando exibida, pode assumir a forma de um rastro mágico que sai da ponta da varinha e indica a direção do feitiço. Em momentos de treino, uma guia gráfica pode tornar explícita a orientação oferecida pela interface.

Muros ou cercas sinalizam o limite do campo de treino dentro da ficção. Quando o visor exibe a grade de segurança, a moldura técnica se torna visível e indica o limite da área física rastreada.

### Corpo

O jogador ocupa o campo de treino em primeira pessoa. A mão dominante traça e aponta a varinha, a mão secundária consulta o grimório e a cabeça orienta a visão. O deslocamento no campo é controlado pelo joystick. A trajetória inicial segue uma linha que parte da ponta da varinha na direção apontada. Assim, o jogador pode lançar um feitiço contra um alvo lateral enquanto olha para outro ponto da cena.

### Risco

Efeitos sonoros e visuais podem fazer um acontecimento virtual parecer uma ameaça imediata. No campo de treino, a reação do boneco permite perceber que o feitiço acertou. Em um futuro duelo, o som e a trajetória de um feitiço que se aproxima do jogador podem provocar uma reação física de esquiva ou um impulso de se proteger, como se o impacto fosse iminente. O risco está em induzir essa reação também quando a trajetória passa ao lado do jogador ou quando o efeito sugere um perigo maior do que o representado.

## Conclusão

Os seis eixos indicam que a prioridade do MVP é tornar perceptível a relação entre o traçado da varinha, a palavra pronunciada, a direção do lançamento e a reação do alvo. Nos testes com o visor, será possível observar se o jogador consulta o grimório durante o treino, aponta a varinha com autonomia e distingue um acerto de um erro pela trajetória, pelo som e pela reação do boneco. Essas observações ajudam a identificar onde ajustar os controles, as instruções e os efeitos antes de ampliar o projeto para duelos.
