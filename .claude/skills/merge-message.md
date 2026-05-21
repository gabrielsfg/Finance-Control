# Skill: Gerar mensagem de merge PR

Gere uma mensagem de merge/PR para a branch atual em comparação com a main.

## Passos

1. Execute em paralelo:
   - `git log main..HEAD --oneline` para listar todos os commits da branch
   - `git diff main...HEAD --stat` para ver os arquivos modificados e volume de mudanças
   - `git rev-parse --abbrev-ref HEAD` para obter o nome da branch atual
   - `git log main..HEAD --pretty=format:"%s" ` para listar os títulos dos commits

2. A partir do nome da branch, identifique o contexto geral (ex: `feat/connect-brapi` → integração com Brapi API).

3. Agrupe os commits por tema/área para montar um resumo coeso.

4. Gere a mensagem no formato de PR description:

   ```
   ## Summary

   <1-3 frases descrevendo o objetivo geral da branch>

   ## Changes

   ### <Área/Tema 1>
   - <mudança>
   - <mudança>

   ### <Área/Tema 2>
   - <mudança>

   ## Test plan

   - [ ] <item de teste 1>
   - [ ] <item de teste 2>
   - [ ] Sem regressões em <área relacionada>
   ```

   - O Summary deve explicar o **porquê** da branch, não apenas o quê
   - Agrupe mudanças relacionadas em seções nomeadas
   - O Test plan deve ser específico para as mudanças feitas
   - Escreva em inglês

5. Também gere um **título de PR** curto (máx 70 chars) no formato:
   ```
   <tipo>: <descrição imperativa>
   ```

6. Apresente título e body em blocos de código separados para fácil cópia.

## Regras

- Nunca execute `git merge`, `git push` ou `gh pr create` — apenas gere as mensagens
- Se a branch não tiver commits à frente de main, informe o usuário
- Baseie o Test plan nas áreas reais afetadas pelas mudanças
