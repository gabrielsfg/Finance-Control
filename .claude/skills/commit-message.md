# Skill: Gerar mensagem de commit

Gere uma mensagem de commit para as alterações atuais seguindo as instruções abaixo.

## Passos

1. Execute em paralelo:
   - `git diff --cached` para ver alterações staged
   - `git diff` para ver alterações unstaged
   - `git status` para listar arquivos modificados/novos/deletados
   - `git log --oneline -10` para entender o estilo de commits do projeto

2. Analise todas as mudanças e classifique o tipo principal:
   - `feat` — nova funcionalidade
   - `fix` — correção de bug
   - `refactor` — refatoração sem mudança de comportamento
   - `chore` — tarefas de manutenção, configs, dependências
   - `docs` — documentação
   - `test` — testes
   - `style` — formatação, sem mudança de lógica
   - `perf` — melhoria de performance

3. Identifique o escopo (opcional) — o módulo, página ou camada afetada (ex: `transactions`, `dashboard`, `auth`, `investments`).

4. Escreva a mensagem no formato:
   ```
   <tipo>(<escopo>): <resumo imperativo em inglês, máx 72 chars>

   - <detalhe 1>
   - <detalhe 2>
   - <detalhe N>
   ```
   - A linha de assunto deve estar em inglês, no imperativo ("Add", "Fix", "Remove", não "Added", "Fixed")
   - Os bullet points de detalhe devem descrever o **porquê** e o **o quê** de forma concisa
   - Omita bullet points se a mudança for trivial e o resumo já for suficiente
   - Não inclua "Co-Authored-By" — o usuário adiciona manualmente se quiser

5. Apresente a mensagem final em um bloco de código para fácil cópia.

## Regras

- Nunca execute `git commit` — apenas gere a mensagem
- Se não houver nenhuma alteração staged ou unstaged, informe o usuário
- Se as mudanças tocarem front e backend, mencione ambos no corpo
