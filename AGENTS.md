# Colaboração no Harry Potter Battlegrounds

Marcelo trabalha com Codex e Gemini Antigravity neste repositório. A comunicação entre sessões ocorre pelos arquivos versionados do projeto.

## Protocolo de coordenação entre agentes

1. Ao iniciar ou retomar uma tarefa, leia [o quadro de trabalho](.agents/coordenacao.md) e confira a branch e as alterações locais com `git status --short --branch`.
2. Para mudanças no projeto, registre no quadro o objetivo, o responsável, os arquivos previstos e como verificar o resultado. Se a tarefa já existir, atualize a mesma linha. Consultas rápidas dispensam esse registro.
3. Antes de editar, confira se outro agente assumiu os mesmos arquivos. Combine a divisão com Marcelo quando houver sobreposição e preserve alterações de terceiros. Para duas implementações simultâneas, utilize branches em *worktrees* distintas.
4. Ao concluir ou pausar, atualize a linha correspondente em [.agents/coordenacao.md](.agents/coordenacao.md) com o resultado, a verificação realizada e a próxima ação. Se houver dúvida que altere o escopo, registre a pergunta para Marcelo.
5. Consulte [o GDD](docs/gdd.md) para o escopo oficial do jogo e [as notas das aulas](.agents/memoria-aulas-imersao.md) para o contexto teórico e técnico da disciplina. Quando Marcelo aprovar uma decisão de design, atualize a seção correspondente do GDD e referencie-a no quadro.

Na mesma pasta de trabalho, releia [.agents/coordenacao.md](.agents/coordenacao.md) antes de salvá-lo para incorporar atualizações do outro agente. Em cópias ou *worktrees* diferentes, as atualizações chegam pela integração no Git; combine a divisão das tarefas na base comum antes de abrir as branches.

## Trava obrigatória de Git e versionamento

- **Nunca execute `git commit`, `git push`, `git merge` ou abra Pull Request sem autorização explícita de Marcelo.** Edite os arquivos localmente, verifique o resultado e aguarde aprovação antes de registrar ou publicar qualquer alteração.
- **Gitflow semanal:** Branches de trabalho partem de `develop` (`docs/<descricao>`, `feat/<descricao>`, `fix/<descricao>`, `refactor/<descricao>`), sempre em *kebab-case* sem acentos e descrevendo o objetivo técnico. As entregas são integradas em `develop` até sexta-feira da semana corrente e `develop` é integrada em `main` ao final da sexta-feira.
- **Conventional Commits (padrão `g01`):** `<tipo>(<escopo>): <descrição objetiva>`. Tipos usuais: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. Título em português, verbo no presente e sem ponto final. Não reescrever histórico compartilhado.

## Padrões de documentação e estrutura técnica

- **Documentação (padrão `g01`):** Adotar linguagem técnica, acadêmica, clara e impessoal. O documento deve ser compreensível de forma autônoma, sem referências a conversas de chat, links internos de sessão privada, IDs de tarefas ou falas informais. Converter decisões em requisitos verificáveis.
- **Stack e organização de referência da disciplina:**
  - `Caddyfile`: servidor local em HTTPS (`tls internal`) apontando para `public/`, necessário para WebXR, microfone e câmera no dispositivo.
  - `public/index.html`: cena A-Frame (`1.8.0`), utilizando metros como unidade e arquitetura Entidade-Componente-Sistema (ECS).
  - `public/js/components/`: um componente A-Frame por arquivo.
  - `public/assets/`: subdiretórios `models/`, `textures/` e `audio/`, com nomes em minúsculas e sem espaços.
  - `README.md`: instruções de execução, IP, dispositivo testado e decisões técnicas.
  - `docs/`: GDD, proposta (Entrega 01) e registros semanais.
