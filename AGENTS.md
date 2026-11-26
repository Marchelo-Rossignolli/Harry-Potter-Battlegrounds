# Colaboração no Harry Potter Battlegrounds

Marcelo trabalha com Codex, Gemini Antigravity e Claude Code neste repositório, orquestrados pelo Facade Code no VS Code. A coordenação de tarefas entre sessões ocorre pelo [Planning no GitHub Projects](https://github.com/users/Marchelo-Rossignolli/projects/1) (Projeto `#1` de `Marchelo-Rossignolli`), operado via GitHub CLI (`gh`), e o contexto técnico permanece nos arquivos versionados do repositório.

## Protocolo de coordenação entre agentes

1. Ao iniciar ou retomar uma tarefa, consulte o quadro no GitHub Projects com `gh project item-list 1 --owner Marchelo-Rossignolli --format json` (em sessões no Windows sem `gh` no `PATH`, use `C:\Program Files\GitHub CLI\gh.exe`) e confira a branch e as alterações locais com `git status --short --branch`.
2. Para mudanças no projeto, assuma o cartão existente (ou crie um novo via `gh project item-create 1 --owner Marchelo-Rossignolli --title "..." --body "..."`), usando o prefixo de responsável no título (`Codex · ...`, `Gemini · ...`, `Claude · ...` ou, em tarefas conjuntas, a lista dos responsáveis, como `Marcelo, Codex, Gemini e Claude · ...`), registrando objetivo, arquivos previstos e critério de verificação, e mova `Status` para `In progress`. Consultas rápidas dispensam registro.
3. Antes de editar, confira nos cartões em `In progress` se outro agente assumiu os mesmos arquivos. Combine a divisão com Marcelo quando houver sobreposição e preserve alterações de terceiros. Mantenha o código do jogo e suas provas de conceito no checkout principal deste repositório.
4. Ao concluir ou pausar, atualize o cartão (descrição do `DraftIssue` ou comentário na Issue vinculada) com os arquivos alterados, a branch ou o commit de referência, a verificação realizada (distinguindo o que foi testado no computador do que foi testado no dispositivo) e a próxima ação ou dúvida para Marcelo. Ao concluir, mova `Status` para `Done`.
5. Consulte [o GDD](docs/gdd.md) para o escopo oficial do jogo e [as notas das aulas](.agents/memoria-aulas-imersao.md) para o contexto teórico e técnico da disciplina. Quando Marcelo aprovar uma decisão de design, atualize a seção correspondente do GDD e referencie-a no cartão.
6. **Autonomia no GitHub Projects:** Marcelo autoriza os agentes a criar/atualizar cartões e mover `Status` no Projeto `#1` autonomamente. Essa autorização não altera a trava obrigatória de Git abaixo.

**Referência rápida do Projeto `#1` (`Planning`):**
- Owner: `Marchelo-Rossignolli` | Project ID: `PVT_kwHOCXULj84BsWoj`
- Campo `Status`: `PVTSSF_lAHOCXULj84BsWojzhqlK3I` (`Todo`: `f75ad846`, `In progress`: `47fc9ee4`, `Done`: `98236657`)
- Mover `Status`: `gh project item-edit --id <PVTI_...> --project-id PVT_kwHOCXULj84BsWoj --field-id PVTSSF_lAHOCXULj84BsWojzhqlK3I --single-select-option-id <OPTION_ID>`
- Editar título/descrição de `DraftIssue` (`content.id`): `gh project item-edit --id <DI_...> --title "..." --body "..."`

O arquivo [.agents/coordenacao.md](.agents/coordenacao.md) foi mantido apenas como registro histórico encerrado da Semana 1 e não deve receber novas tarefas.

## Trava obrigatória de Git e versionamento

- **Nunca execute `git commit`, `git push`, `git merge` ou abra Pull Request sem autorização explícita de Marcelo.** Edite os arquivos localmente, verifique o resultado e aguarde aprovação antes de registrar ou publicar qualquer alteração.
- **Gitflow semanal:** Branches de trabalho partem de `develop` (`docs/<descricao>`, `feat/<descricao>`, `fix/<descricao>`, `refactor/<descricao>`), sempre em *kebab-case* sem acentos e descrevendo o objetivo técnico. As entregas são integradas em `develop` até sexta-feira da semana corrente e `develop` é integrada em `main` ao final da sexta-feira.
- **Conventional Commits (padrão `g01`):** `<tipo>(<escopo>): <descrição objetiva>`. Tipos usuais: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. Título em português, verbo no presente e sem ponto final. Não reescrever histórico compartilhado.

## Padrões de documentação e estrutura técnica

- **Documentação (padrão `g01`):** Adotar linguagem técnica, acadêmica, clara e impessoal. O documento deve ser compreensível de forma autônoma, sem referências a conversas de chat, links internos de sessão privada, IDs de tarefas ou falas informais. Converter decisões em requisitos verificáveis.
- **Stack e organização do projeto:**
  - `Caddyfile`: servidor local em HTTPS (`tls internal`) apontando para `src/`, necessário para WebXR, microfone e câmera no dispositivo.
  - `src/index.html`: cena A-Frame (`1.8.0`), utilizando metros como unidade e arquitetura Entidade-Componente-Sistema (ECS).
  - `src/js/components/`: um componente A-Frame por arquivo.
  - `src/assets/`: subdiretórios `models/`, `textures/` e `audio/`, com nomes em minúsculas e sem espaços.
  - `README.md`: instruções de execução, IP, dispositivo testado e decisões técnicas.
  - `docs/`: GDD, proposta (Entrega 01) e registros semanais.
