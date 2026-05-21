# Skill: Auditoria de cobertura API (front ↔ backend)

Faça uma leitura completa do frontend e backend e produza um relatório identificando:
- Endpoints do backend não utilizados pelo frontend
- Chamadas do frontend sem endpoint correspondente no backend
- DTOs, services, métodos, entidades não utilizados
- DTOs, services, métodos, entidades faltando

## Estrutura do projeto

- **Backend (API):** `apps/api/` — .NET 9 / ASP.NET Core
  - Controllers: `FinanceControl.WebApi/Controllers/`
  - Services: `FinanceControl.Services/Services/`
  - Interfaces: `FinanceControl.Domain/Interfaces/Services/`
  - Entities: `FinanceControl.Domain/Entities/`
  - DTOs Request: `FinanceControl.Shared/Dtos/Request/`
  - DTOs Response: `FinanceControl.Shared/Dtos/Response/`
  - Mappings: `FinanceControl.Data/Mappings/`

- **Frontend (Web):** `apps/web/` — Next.js / React
  - Hooks (react-query): `lib/hooks/`
  - Services/fetch: `lib/services/` ou diretamente nos hooks
  - Features/pages: `app/` e `features/`

## Passos

### 1 — Mapear endpoints do backend

Para cada controller em `apps/api/FinanceControl.WebApi/Controllers/`, colete:
- Nome do controller → rota base (`[Route("api/[controller]")]` → `api/<controller>`)
- Cada action method → método HTTP + rota completa + DTO de request/response

Produza uma lista: `METHOD /api/route → ControllerName.ActionName(RequestDto) → ResponseDto`

### 2 — Mapear chamadas do frontend

Faça grep recursivo em `apps/web/` buscando:
- Padrões de fetch/axios/api calls: `fetch(`, `axios.`, `api.get`, `api.post`, `api.put`, `api.delete`, `api.patch`, `"/api/`, `\`/api/`
- Arquivos de hooks em `lib/hooks/` e serviços em `lib/services/`

Para cada chamada, extraia: método HTTP + URL (mesmo que parcialmente dinâmica).

### 3 — Cruzar endpoints

Produza três listas:
- **Endpoints usados:** presentes no backend E chamados pelo frontend
- **Endpoints mortos (backend):** definidos no backend mas nunca chamados pelo frontend
- **Chamadas órfãs (frontend):** chamadas no frontend sem endpoint correspondente no backend

### 4 — Auditar DTOs

- Liste todos os DTOs em `Dtos/Request/` e `Dtos/Response/`
- Verifique quais são referenciados em controllers/services vs. quais não têm referência (`grep -r "ClassName" apps/api/`)
- Marque os não utilizados

### 5 — Auditar Services e Interfaces

- Liste todos os `IXxxService` em `Domain/Interfaces/Services/`
- Liste todos os `XxxService` em `Services/Services/`
- Verifique se cada interface tem implementação e se cada implementação está registrada em `ServicesExtensions.cs`
- Verifique se cada service é injetado em algum controller ou worker

### 6 — Auditar Entities e Mappings

- Liste entidades em `Domain/Entities/`
- Verifique se cada entidade tem `DbSet` em `ApplicationDbContext.cs`
- Verifique se cada entidade tem mapping em `Data/Mappings/`
- Identifique entidades sem uso em nenhum service

### 7 — Relatório final

Apresente o resultado em seções markdown:

```
## API Coverage Audit Report

### Endpoints mortos (backend sem uso no frontend)
| Método | Rota | Controller |
|--------|------|------------|
...

### Chamadas órfãs (frontend sem endpoint no backend)
| Método | URL | Arquivo |
|--------|-----|---------|
...

### DTOs não utilizados
- `NomeDtoRequestDto.cs` — sem referência em controllers/services
...

### Services/Interfaces com problemas
- `IXxxService` sem implementação
- `XxxService` sem registro em ServicesExtensions
- `XxxService` sem injeção em nenhum controller
...

### Entities com problemas
- `XxxEntity` sem DbSet em ApplicationDbContext
- `XxxEntity` sem mapping em Data/Mappings/
...

### Resumo executivo
- X endpoints mortos
- X chamadas órfãs
- X DTOs não utilizados
- X issues de services/interfaces
- X issues de entidades
```

## Regras

- Use `grep -r` e `find` para varrer os arquivos — não tente ler cada arquivo manualmente
- Para rotas dinâmicas como `/api/account/{id}`, normalize como `/api/account/:id` para comparação
- Se uma chamada do frontend usar uma variável de URL construída dinamicamente, informe o padrão detectado
- Se o volume de arquivos for grande, use o agente Explore para buscas paralelas
- Ao final, sugira qual item tem maior impacto para limpeza/implementação
