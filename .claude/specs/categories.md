# Spec: Categories & SubCategories

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Hierarquia de classificação de lançamentos — `Category` (nível 1) → `SubCategory` (nível 2). Toda transação aponta para uma subcategoria.

---

## 1. Visão geral

Categories e SubCategories formam a **hierarquia de dois níveis** usada para classificar transações e
alocações de orçamento. Uma `Category` é um agrupador (com nome e cor); uma `SubCategory` pertence a
exatamente uma categoria (via `CategoryId`) e carrega um emoji opcional. **Transações sempre se vinculam
a uma `SubCategory`** (nunca direto a uma `Category`) — ver `specs/transactions.md`.

Existem dois tipos de categoria/subcategoria:

- **De usuário** (`IsSystem = false`) — criadas no cadastro a partir de um seed e gerenciáveis pelo usuário
  (CRUD completo na tela de Categorias).
- **De sistema** (`IsSystem = true`) — criadas no cadastro para uso interno do app. Hoje são duas:
  `BalanceUpdate` (ajustes de saldo) e a categoria de transferência (`Outros`/`Other` → subcategoria
  `Transferência`/`Transfer`, usada por metas e transferências). **Não aparecem em nenhuma listagem e não
  podem ser editadas nem excluídas.**

Toda categoria/subcategoria é `OwnedEntity` (escopada por `UserId`) — não há catálogo global compartilhado;
cada usuário tem o seu conjunto, semeado na criação da conta.

Responsabilidades **fora** deste spec:
- Lançamentos que usam a subcategoria (criação/edição/listagem de transações) → `specs/transactions.md`.
- Alocação esperado vs. gasto por subcategoria dentro de um orçamento (`BudgetSubcategoryAllocation`) → `specs/budgets.md`.
- Saldo de conta e o ajuste de saldo que consome a subcategoria de sistema → `specs/accounts.md`.
- A entidade `Tag` (também `OwnedEntity`, many-to-many com transação) está documentada em `specs/transactions.md` — **não** é re-documentada aqui.
- Categorização automática por IA na importação de extrato (`ImportService`) → fora deste spec; apenas **consome** as subcategorias do usuário (não cria categorias).

---

## 2. Entidades

### `Category` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/Category.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK (de `BaseEntity`) |
| `UserId` | `int` | Dono (de `OwnedEntity`) |
| `Name` | `string` | Nome exibido. Sem unicidade garantida — ver gap G1 |
| `Color` | `string?` | Cor hex (ex.: `#4a9eff`). Opcional; o front gera fallback determinístico se nulo |
| `IsSystem` | `bool` | Default `false`. `true` = categoria interna (não listada, não editável, não deletável) |
| `SubCategories` | `ICollection<SubCategory>` | Filhas (1→N) |

### `SubCategory` (`OwnedEntity`)
`apps/api/FinanceControl.Domain/Entities/SubCategory.cs`

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK |
| `UserId` | `int` | Dono |
| `CategoryId` | `int` | Categoria pai (obrigatório) |
| `Name` | `string` | Nome exibido. Sem unicidade garantida — ver gap G1 |
| `Emoji` | `string?` | Emoji opcional (ex.: `🛒`). Coluna adicionada na migration `Add_SubCategoryEmoji` |
| `IsSystem` | `bool` | Default `false`. Herda o caráter de sistema da pai semeada |
| `Category` | `Category` | Navegação para a pai |
| `BudgetSubcategoryAllocations` | `ICollection<...>` | Alocações de orçamento que referenciam esta sub |
| `Transactions` | `ICollection<Transaction>` | Transações classificadas nesta sub |
| `RecurringTransactions` | `ICollection<RecurringTransaction>` | Templates recorrentes que usam esta sub |

### Hierarquia (2 níveis)

```
Category (nível 1)  ──1:N──►  SubCategory (nível 2)  ──1:N──►  Transaction
                                                      ──1:N──►  RecurringTransaction
                                                      ──1:N──►  BudgetSubcategoryAllocation
```

Não existe nível 3. A transação **nunca** referencia `CategoryId` diretamente — só `SubCategoryId`; a
categoria é derivada via `SubCategory.Category`.

### Mapeamento EF (`CategoryMap` / `SubcategoryMap`)
`apps/api/FinanceControl.Data/Mappings/CategoryMap.cs`, `SubCategoryMap.cs`

- `IsSystem` → `HasDefaultValue(false).IsRequired()` em ambas.
- `CreatedAt` → `timestamp with time zone`, default `now()`, gerado on add. `UpdatedAt` gerado on add.
- `Category` → FK para `User` com `OnDelete(Cascade)` (deletar o usuário apaga categorias).
- `SubCategory` → FK para `User` **e** FK para `Category`, ambas `OnDelete(Cascade)` → **deletar uma
  categoria apaga em cascata suas subcategorias** (no banco). Ver gap G2.
- **Não há índice único** sobre `(UserId, Name)` em nenhuma das duas tabelas.

---

## 3. Endpoints (API)

Dois controllers. Ambos `[Authorize]`, herdam `BaseController`, e o `userId` vem sempre do JWT
(`GetUserId()`), nunca do corpo. Validadores registrados via `AddValidatorsFromAssemblyContaining<CreateCategoryValidator>()`
(`Program.cs`); serviços registrados como `Scoped` em `ServicesExtensions`.

### 3.1 `CategoryController` — rota base `api/category`

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `POST` | `/api/category` | Cria categoria | `201 Created` com a **lista completa** atualizada | `400` validação (Name vazio) |
| `GET` | `/api/category` | Lista categorias do usuário (com subcategorias aninhadas), `IsSystem` excluídas | `200` array | — |
| `PATCH` | `/api/category` | **Update em lote** de categorias (não recebe `{id}` na rota) | `200` lista atualizada | `400` validação · `404` id inexistente / categoria de sistema |
| `DELETE` | `/api/category/{id}` | Remove categoria (cascata p/ subcategorias) | `200` lista atualizada | `400` id ≤ 0 · `404` não encontrada / de sistema |

Observação: o `POST` retorna sempre `Created("/api/category", lista)` — o corpo é a **lista inteira** de
categorias do usuário (`GetAllCategoriesAsync`), não o item criado. O `DELETE` valida `id > 0` via
`this.ValidatePositiveId(id, "id")` antes de chamar o service.

### 3.2 `SubCategoryController` — rota base `api/subcategory`

| Método | Rota | Descrição | Sucesso | Falha |
|---|---|---|---|---|
| `POST` | `/api/subcategory` | Cria subcategoria | `201 Created` com lista completa de subs | `400` validação · `404` categoria pai inválida |
| `GET` | `/api/subcategory` | Lista **planas** todas as subs do usuário (não aninhadas), `IsSystem` excluídas | `200` array | — |
| `GET` | `/api/subcategory/{id}` | Detalhe de uma sub | `200` | `400` id ≤ 0 · `404` não encontrada |
| `PATCH` | `/api/subcategory/{id}` | Atualiza (pode re-parentear) | `200` lista atualizada | `400` validação / id ≤ 0 · `404` pai/sub inválida / de sistema |
| `DELETE` | `/api/subcategory/{id}` | Remove subcategoria | `200` lista atualizada | `400` id ≤ 0 · `404` não encontrada / de sistema |

No `PATCH`, o controller injeta `requestDto.Id = id` (a rota é a fonte da verdade do id; o corpo não
precisa repeti-lo).

### Request — `CreateCategoryRequestDto`
```
Name  : string        // obrigatório (NotEmpty)
Color : string?       // hex opcional; gravado como veio (sem normalização)
```

### Request — `UpdateCategoriesRequestDto` (update em lote)
```
Categories : UpdateCategoryRequestDto[]   // NotEmpty
```
### Request — `UpdateCategoryRequestDto` (item do lote)
```
Id    : int           // > 0
Name  : string        // obrigatório
Color : string?
```

### Request — `CreateSubCategoryRequestDto`
```
Name       : string   // obrigatório
Emoji      : string?  // opcional
CategoryId : int      // > 0; deve ser categoria do usuário e não-sistema
```

### Request — `UpdateSubCategoryRequestDto`
```
Id         : int      // preenchido pelo controller a partir da rota
Name       : string   // obrigatório
Emoji      : string?
CategoryId : int      // > 0; categoria de destino (permite re-parentear)
```

### Response — `CategoryResponseDto` (item do `GET /category` e de toda mutação de categoria)
```
Id            : int
Name          : string
Color         : string?
SubCategories : GetSubCategoryResponseDto[]   // só subs não-sistema do mesmo usuário
```

### Response — `GetSubCategoryResponseDto` (item do `GET /subcategory` e de toda mutação de sub)
```
Id            : int
CategoryId    : int
CategoryName  : string     // desnormalizado da pai
CategoryColor : string?    // desnormalizado da pai
Name          : string
Emoji         : string?
```

> **Nota:** não existe `IsSystem` em nenhum response DTO. A flag nunca trafega para o front (as de sistema
> já são filtradas no service). Ver gap G3.

---

## 4. Regras de negócio

### RN-CAT-01 — Escopo por usuário (ownership)
Toda query de categoria/subcategoria filtra por `UserId`. Não há catálogo global. `SubCategoryService`
valida a categoria pai com `ValidateCategoryByIdAsync(categoryId, userId)` exigindo
`UserId == userId && Id == categoryId && !IsSystem` — uma categoria de **outro** usuário ou de **sistema**
não pode ser usada como pai (retorna `"Mother Category not found."` → `404`).

### RN-CAT-02 — Listagens escondem itens de sistema
`GetAllCategoriesAsync` filtra `!c.IsSystem` e, dentro de cada categoria, `!s.IsSystem` nas subs.
`GetAllSubCategoryAsync` e `GetSubCategoryByIdAsync` filtram `!s.IsSystem`. Resultado: as categorias/subs
`BalanceUpdate` e de transferência **nunca** aparecem para o usuário, embora existam no banco e sejam
referenciadas internamente por transações de ajuste/transferência/meta.

### RN-CAT-03 — Categorias de sistema são imutáveis
`UpdateCategoriesAsync` e `DeleteCategoryByIdAsync` rejeitam qualquer item com `IsSystem == true`
(`"... is a system category and cannot be modified."` / `"System categories cannot be deleted."`).
O mesmo vale para subcategorias em `UpdateSubCategoryAsync` / `DeleteSubCategoryAsync`
(`"System subcategories cannot be modified/deleted."`). Todas essas falhas viram `404` no controller.

### RN-CAT-04 — Update de categorias é em lote e transacional-por-validação
`PATCH /category` recebe **uma lista**. O service carrega de uma vez as categorias do usuário cujos ids
estão na lista, e itera: se algum id não for encontrado **ou** for de sistema, retorna `Failure`
imediatamente — **antes** de `SaveChangesAsync`. Como o `SaveChanges` só roda ao final, uma falha no meio
não persiste nenhuma alteração do lote (efeito all-or-nothing pela ordem do código, sem `BeginTransaction`
explícito). Os campos atualizados são apenas `Name` e `Color`.

### RN-CAT-05 — Criação de categoria não valida unicidade nem normaliza
`CreateCategoryAsync` cria a `Category` direto com `Name`/`Color` como vieram e `IsSystem = false`, depois
retorna `GetAllCategoriesAsync`. Não há trim, não há checagem de nome duplicado, não há normalização de
cor. O único requisito é `Name` não-vazio (validator). Ver gaps G1 e G6.

### RN-CAT-06 — Criação/edição de subcategoria exige pai válida do usuário
Tanto `CreateSubCategoryAsync` quanto `UpdateSubCategoryAsync` chamam `ValidateCategoryByIdAsync` antes de
qualquer escrita. Falha → `"Mother Category not found."`. Campos persistidos: `Name`, `Emoji`, `CategoryId`.

### RN-CAT-07 — Re-parentear subcategoria é permitido
`UpdateSubCategoryAsync` aceita um `CategoryId` diferente do atual, movendo a sub para outra categoria do
usuário (desde que a nova pai seja válida e não-sistema). Não há restrição quanto a transações já
vinculadas — elas continuam apontando para a mesma sub, que apenas muda de pai.

### RN-CAT-08 — Mutações retornam a coleção completa
Padrão do projeto: `POST`/`PATCH`/`DELETE` de categoria retornam `GetAllCategoriesAsync` (categorias
aninhadas); de subcategoria retornam `GetAllSubCategoryAsync` (lista plana). O front usa isso para atualizar
o cache em uma única ida.

### RN-CAT-09 — Delete de categoria cascateia para subcategorias
Pela FK `Category → SubCategory` com `OnDelete(Cascade)`, remover uma categoria remove suas subcategorias no
banco. **Não há checagem de transações vinculadas** antes de excluir (nem em categoria nem em subcategoria).
Ver gap G2.

### RN-CAT-10 — Seed na criação (e na "limpeza") da conta
No `RegisterUserAsync` → `SeedUserDataAsync(userId, preferredLanguage)` (`UserService`), são criados, nesta
ordem:
1. **Categoria/sub de sistema `BalanceUpdate`** (`IsSystem = true`) — usada para ajustes de saldo.
2. **Categoria/sub de sistema de transferência** — categoria nomeada `"Outros"` (pt-BR) / `"Other"` (en-US),
   `IsSystem = true`, com sub `"Transferência"` / `"Transfer"`, `IsSystem = true`. Usada por aportes/retiradas
   de metas e transferências (`GoalService.GetSystemTransferSubCategoryIdAsync`).
3. **Categorias/subs padrão do usuário** (`IsSystem = false`) a partir de `UserSeedData.GetCategories(...)`.
4. **Conta Wallet/Carteira** padrão.

A mesma rotina roda ao "resetar" a conta (há um caminho que re-semeia "exatamente como o registro"). O seed
é **por idioma** (`preferredLanguage`), não por país — ver RN-CAT-11.

### RN-CAT-11 — Seed é localizado por idioma (`pt-BR` / `en-US`)
`UserSeedData` (`apps/api/FinanceControl.Services/Seeds/UserSeedData.cs`) define:
- Uma **estrutura** fixa de 14 categorias (10 de despesa + 4 de receita) com cor hex e chaves de
  subcategoria, ex.: `("food", "#f5a623", ["grocery","restaurant","delivery","bakery","fastFood"])`.
- Um dicionário de **emojis** por chave de subcategoria (independente de idioma).
- Um dicionário de **labels** por locale (`pt-BR`, `en-US`), com fallback para `en-US` em locale desconhecido.

`GetCategories(lang)` materializa `(CategoryName, Color, (SubName, Emoji)[])[]`. As categorias semeadas têm
`Color` definido; o `Emoji` vem só nas subs. Não há vínculo com país/moeda — apenas idioma. As categorias de
**sistema** (BalanceUpdate / transferência) **não** vêm desse arquivo; são criadas inline em `SeedUserDataAsync`.

### RN-CAT-12 — Consumo interno das categorias de sistema
- `GoalService.GetSystemTransferSubCategoryIdAsync(context, userId)` busca a sub de sistema por nome
  (`"Transferência"` ou `"Transfer"`, `IsSystem == true`). Se não achar, **cria sob demanda** (fallback para
  contas legadas que não passaram pelo seed): categoria `"Outros"` (`IsSystem = true`) + sub `"Transferência"`.
- `AccountService` (ajuste de saldo / saldo inicial) busca subs de receita/despesa **por nome literal** para
  lançar a transação de diferença. Aqui há uma inconsistência de nomes — ver gap G4.

---

## 5. Front (Web)

- **Rota:** `/categories` → `app/(app)/categories/page.tsx` (re-export de uma linha) →
  `features/categories/CategoriesPage.tsx`.
- **Página:** `CategoriesPage.tsx` concentra a árvore (categoria → subs expansíveis), os cards de estatística
  (nº de categorias, nº de subs, categorias sem sub) e orquestra os 6 modais. Usa
  `usePageNova("Nova categoria", ...)` para o botão global de criar.

### API client — `lib/api/categories.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `categoriesApi.getAll()` | `GET /category` | retorna `Category[]` (aninhado) |
| `categoriesApi.create(data)` | `POST /category` | retorna a lista atualizada |
| `categoriesApi.updateBatch(data)` | `PATCH /category` | corpo `{ categories: [...] }` |
| `categoriesApi.delete(id)` | `DELETE /category/{id}` | |
| `subCategoriesApi.create(data)` | `POST /subcategory` | retorna `SubCategory[]` |
| `subCategoriesApi.update(id, data)` | `PATCH /subcategory/{id}` | |
| `subCategoriesApi.delete(id)` | `DELETE /subcategory/{id}` | |

> Há **outro** client de subcategoria, em `lib/api/subcategories.ts` (`subcategoriesApi.getAll()` →
> `GET /subcategory`), usado pelo módulo de Transações com o tipo `SubCategoryItem`. Ver gap G5.

### Tipos — `lib/types/categories.types.ts`
`Category` (inclui um campo `isSystem: boolean` **que o backend nunca envia** — ver G3), `SubCategory`,
e os DTOs de request (`CreateCategoryRequest`, `UpdateCategoryRequest`, `UpdateCategoriesRequest`,
`CreateSubCategoryRequest`, `UpdateSubCategoryRequest`).

### Hooks — `features/categories/hooks/useCategories.ts`
- `useCategories()` — query `["categories"]`, `staleTime: 60_000`.
- `useCreateCategory` / `useUpdateCategory` / `useDeleteCategory` — mutations; no `onSuccess` fazem
  `setQueryData(["categories"], updated)` **e** `invalidateQueries(["subcategories"])`.
- `useUpdateCategory` envia sempre um lote de um item: `updateBatch({ categories: [data] })`.
- `useCreateSubCategory` / `useUpdateSubCategory` / `useDeleteSubCategory` — mutations; `setQueryData(["subcategories"], updatedSubs)`
  **e** `invalidateQueries(["categories"])`.

> Estes hooks seguem a convenção do `web/CLAUDE.md` (atualizar cache com `setQueryData`, já que o backend
> devolve a lista). Note o cross-invalidate entre `categories` e `subcategories` para manter as duas
> projeções coerentes (a de categoria é aninhada, a de sub é plana).

### Componentes principais
- `CreateCategoryModal` / `EditCategoryModal` — drawer lateral; campos Nome + `CategoryColorPicker`. Cor
  default no create é `#00C98D`. Submit bloqueado se nome vazio.
- `CreateSubCategoryModal` — drawer com dropdown de **categoria pai** (busca normalizada via
  `includesNormalized`), campo Nome, `EmojiPicker`, e atalho "Nova categoria" que abre o `CreateCategoryModal`
  empilhado (z-index +10). `defaultCategoryId` pré-seleciona a pai quando aberto a partir de uma categoria.
- `EditSubCategoryModal` — drawer com `<select>` simples de categoria pai (re-parentear), Nome, `EmojiPicker`.
- `DeleteCategoryModal` / `DeleteSubCategoryModal` — `Dialog` de confirmação. O de categoria avisa que
  "irá remover todas as subcategorias vinculadas" (coerente com a cascata do backend).
- `CategoryColorPicker` — paleta fixa de 12 cores hex (clicável). Não há input de cor livre.

### Cores — `lib/config/categoryColors.ts`
`getCategoryColor(color, name)`: se a API mandou `color`, usa; senão deriva uma cor determinística por hash
do nome a partir de uma `DEFAULT_PALETTE` de 10 cores; fallback final `FALLBACK_COLOR = "#8A95A3"`. A página
exibe o hex literal ao lado de cada categoria. Observação: a paleta do `CategoryColorPicker` (12 cores) e a
`DEFAULT_PALETTE` do fallback (10 cores) **não são a mesma lista**.

---

## 6. Edge cases & gaps

### Edge cases cobertos
- Criar sub sem pai válida / com pai de outro usuário / de sistema → `"Mother Category not found."`.
- Editar/excluir categoria ou sub de sistema → bloqueado (RN-CAT-03).
- Update em lote com id inexistente no meio → falha sem persistir (RN-CAT-04).
- Categoria sem cor → front gera cor por hash do nome (não quebra UI).
- Deletar categoria → confirma e cascateia para subs (UI avisa).

### Gaps / dúvidas a confirmar
- **G1 — Sem unicidade de nome:** nem os validators nem o EF impõem unicidade de `Name` por usuário, em
  categoria **ou** subcategoria (diferente de `Tag`, que é única case-insensitive por usuário). É possível
  criar duas categorias "Alimentação" idênticas. Confirmar se é intencional ou se falta um índice único
  `(UserId, Name)` + validação.
- **G2 — Delete não checa transações vinculadas:** o domínio diz "não dá para excluir categoria/sub com
  transações vinculadas", mas **nenhum** dos services faz essa checagem. `DeleteSubCategoryAsync` remove a sub
  direto; `DeleteCategoryByIdAsync` remove a categoria e cascateia as subs. Como `Transaction.SubCategoryId`
  é obrigatório, excluir uma sub com transações tende a falhar por violação de FK (vira `500` via
  `GlobalExceptionMiddleware`) ou, se a FK permitir cascata/órfão, corromper dados. **Confirmar o
  comportamento real do banco e implementar uma checagem explícita** (ex.: `Result.Failure` amigável quando
  houver transações/recorrências/alocações vinculadas).
- **G3 — `isSystem` no tipo do front sem origem no backend:** `Category` (TS) tem `isSystem: boolean`, mas
  `CategoryResponseDto` não expõe esse campo e as categorias de sistema já são filtradas no service. Hoje
  `isSystem` chega sempre `undefined`. Decidir: ou remover do tipo, ou passar a expor `IsSystem` (e talvez
  parar de filtrá-las, deixando o front decidir o que renderizar).
- **G4 — Nomes divergentes no ajuste de saldo (bug provável):** `AccountService` procura a subcategoria de
  despesa por `"Other expense"` / `"Outras despesas"`, mas o seed cria a sub com a chave `otherExpenses` →
  rótulos `"Other expenses"` / `"Outros gastos"`. Os nomes **não batem**, então ajustes de saldo que geram
  **despesa** não encontram subcategoria e a transação de diferença é **silenciosamente não criada** (o
  código só lança se `subCategoryId.HasValue`). O caminho de **receita** (`"Other income"` / `"Outras
  receitas"`) bate com o seed e funciona. Confirmar e alinhar os literais (idealmente buscar por chave, não
  por rótulo localizado).
- **G5 — Dois clients e dois tipos para subcategoria:** `lib/api/categories.ts#subCategoriesApi` (tipo
  `SubCategory`, usado na tela de Categorias) e `lib/api/subcategories.ts#subcategoriesApi` (tipo
  `SubCategoryItem` de `transactions.types`, usado nos selects de Transações) batem no **mesmo** `GET
  /subcategory`, mas mapeiam para tipos diferentes e usam a **mesma** query key `["subcategories"]`. Risco de
  inconsistência de shape no cache compartilhado. Confirmar se devem ser unificados.
- **G6 — Sem trim/normalização na criação:** `CreateCategoryAsync` grava `Name`/`Color` exatamente como
  recebidos. O front faz `name.trim()` antes de enviar, mas a API aceitaria nome com espaços ou cor em
  formato arbitrário se chamada diretamente. Confirmar se a normalização deveria estar no backend.
- **G7 — Colisão de nome entre categoria de sistema e de usuário:** a categoria de transferência de sistema
  é nomeada `"Outros"`/`"Other"`, **mesmo nome** da categoria de usuário `otherExpense` (`"Outros"`/`"Other"`).
  As buscas internas distinguem por `IsSystem`, então não há bug funcional hoje, mas o fallback
  `GetSystemTransferSubCategoryIdAsync` cria `"Outros"` fixo (não localizado) para contas legadas. Confirmar
  se a duplicidade de rótulo é aceitável para o usuário.

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/CategoryController.cs`, `SubCategoryController.cs`
- `FinanceControl.Services/Services/CategoryService.cs`, `SubCategoryService.cs`
- `FinanceControl.Services/Services/UserService.cs` (`SeedUserDataAsync` — criação das categorias de sistema e do seed)
- `FinanceControl.Services/Seeds/UserSeedData.cs` (estrutura/labels/emojis do seed por idioma)
- `FinanceControl.Services/Services/GoalService.cs` (`GetSystemTransferSubCategoryIdAsync` — consumo da sub de transferência)
- `FinanceControl.Services/Services/AccountService.cs` (uso das subs de receita/despesa no ajuste de saldo — ver G4)
- `FinanceControl.Services/Validations/CreateCategoryValidator.cs`, `UpdateCategoryValidator.cs` (contém também `UpdateCategoriesValidator`), `CreateSubCategoryValidator.cs`, `UpdateSubCategoryValidator.cs`
- `FinanceControl.Domain/Entities/Category.cs`, `SubCategory.cs`
- `FinanceControl.Data/Mappings/CategoryMap.cs`, `SubCategoryMap.cs`
- `FinanceControl.Shared/Dtos/Request/CreateCategoryRequestDto.cs`, `UpdateCategoryRequestDto.cs`, `UpdateCategoriesRequestDto.cs`, `CreateSubCategoryRequestDto.cs`, `UpdateSubCategoryRequestDto.cs`
- `FinanceControl.Shared/Dtos/Response/CategoryResponseDto.cs`, `GetSubCategoryResponseDto.cs`
- `FinanceControl.Tests/Unit/Validators/OtherValidatorsTests.cs` (testes de `CreateCategoryValidator` / `CreateSubCategoryValidator`)
- Migrations relevantes: `AddIsSystemToCategories`, `AddColorToCategory`, `Add_SubCategoryEmoji`

**Web**
- `features/categories/CategoriesPage.tsx`
- `features/categories/components/CreateCategoryModal.tsx`, `EditCategoryModal.tsx`, `CreateSubCategoryModal.tsx`, `EditSubCategoryModal.tsx`, `DeleteCategoryModal.tsx`, `DeleteSubCategoryModal.tsx`, `CategoryColorPicker.tsx`
- `features/categories/hooks/useCategories.ts`
- `lib/api/categories.ts`, `lib/api/subcategories.ts` (ver G5)
- `lib/types/categories.types.ts`
- `lib/config/categoryColors.ts`
