# Spec: Authentication

> **Status:** Descritivo (documenta o código atual em `apps/api` + `apps/web`) com seção de gaps.
> **Última sincronização com o código:** 2026-06-02.
> **Domínio:** Autenticação e gestão de sessão — registro, login, emissão e rotação de tokens (JWT + refresh), logout e recuperação de senha. Inclui proteção de conta (account lockout) e rate limiting.

---

## 1. Visão geral

Toda a autenticação vive no `UserController` (rota base `api/user`) e no `UserService`. O modelo é
**JWT Bearer** (access token, assinado HMAC-SHA512) + **refresh token opaco persistido no banco**
(`RefreshToken`). O access token carrega o `userId` (`ClaimTypes.NameIdentifier`) e é o que todos os
demais controllers leem via `BaseController.GetUserId()` — o `userId` **nunca** vem do corpo da
requisição.

Fluxos cobertos por este spec:

- **register** — cria o usuário, semeia dados padrão (categorias, conta Carteira, etc.) e já devolve o par de tokens.
- **login** — valida credenciais, aplica account lockout e devolve o par de tokens.
- **refresh** — troca um refresh token válido por um novo par (rotação: o antigo é revogado).
- **logout** — revoga o refresh token informado.
- **forgot-password / reset-password** — gera token de reset e troca a senha.

Responsabilidades **fora** deste spec:

- Edição de perfil (`GET/PATCH /api/user/profile`) e preferências (`GET/PATCH /api/user/preferences`) → `specs/profile-preferences.md`.
- Exclusão de conta (`DELETE /api/user/me`) e reset de dados financeiros (`POST /api/user/me/reset-data`) → `specs/profile-preferences.md`.

> Esses endpoints **vivem no mesmo `UserController`/`UserService`**, mas são de domínio de perfil/conta, não de autenticação. Aqui são apenas mencionados; o seeding de dados no registro também é detalhado em `specs/profile-preferences.md` / `specs/categories.md`.

---

## 2. Entidades

### `User` (`BaseEntity`)
`apps/api/FinanceControl.Domain/Entities/User.cs`

> **Atenção:** `User` herda `BaseEntity` (apenas `Id`, `CreatedAt`, `UpdatedAt`) e **não** `OwnedEntity` — o `User` é o próprio dono, não tem `UserId`. Ver `apps/api/CLAUDE.md` ("Entity hierarchy").

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK (de `BaseEntity`) |
| `CreatedAt` | `DateTime` | de `BaseEntity`; `now()` no banco, `ValueGeneratedOnAdd` |
| `UpdatedAt` | `DateTime?` | de `BaseEntity`; `ValueGeneratedOnAdd` |
| `Email` | `string` | Normalizado para **lowercase** em register/login (ver RN-AUTH-09) |
| `PasswordHash` | `string` | Hash do `PasswordHasher<User>` (ASP.NET Identity) — ver RN-AUTH-02 |
| `Name` | `string` | Nome de exibição |
| `IsActive` | `bool` | Default `true` (mapeado com `HasDefaultValue(1)`). **Não é verificado em nenhum fluxo de auth — ver gap G6** |
| `PasswordResetToken` | `string?` | Token de reset corrente (hex de 32 bytes); limpo após uso |
| `PasswordResetTokenExpiresAt` | `DateTime?` | Expiração do token de reset (`+1h`) |
| `FailedLoginAttempts` | `int` | Contador de tentativas falhas; default 0 (ver RN-AUTH-05) |
| `LockoutEnd` | `DateTime?` | UTC até quando a conta está bloqueada; `null` = não bloqueada |
| `PreferredCurrency` | `string` | Default `"BRL"`. **Domínio de preferences — ver gap G7** |
| `PreferredLanguage` | `string` | Default `"pt-BR"`; usado pelo seed para escolher idioma das categorias |
| `Country` | `string?` | ISO-2 (`HasMaxLength(2)`); domínio de preferences |

Mapeamento: `apps/api/FinanceControl.Data/Mappings/UserMap.cs` (tabela `Users`).

### `RefreshToken` (POCO simples — **não** herda `BaseEntity`)
`apps/api/FinanceControl.Domain/Entities/RefreshToken.cs`

> Diferente das demais entidades: declara `Id`, `UserId` e `CreatedAt` como propriedades próprias (não herdadas). Ver `apps/api/CLAUDE.md` — `RefreshToken` é listada como exceção que tem `UserId` como FK simples.

| Campo | Tipo | Notas |
|---|---|---|
| `Id` | `int` | PK |
| `UserId` | `int` | FK → `User`; `OnDelete(Cascade)` (apaga tokens quando o user é removido) |
| `Token` | `string` | Valor opaco: 64 bytes aleatórios em Base64 (`IsRequired`). **Armazenado em texto puro — ver gap G3** |
| `ExpiresAt` | `DateTime` | UTC; `+30 dias` na criação |
| `CreatedAt` | `DateTime` | `now()` no banco, `ValueGeneratedOnAdd` |
| `IsRevoked` | `bool` | Default `false`; vira `true` no refresh (rotação) e no logout |
| `User` | `User` | Navegação (carregada via `Include` no refresh) |

Mapeamento: `apps/api/FinanceControl.Data/Mappings/RefreshTokenMap.cs` (tabela `RefreshTokens`).

### Outras estruturas

- **`LoginResult`** (`Dtos/Response/LoginResult.cs`) — discriminated result interno do login: `Success(auth)`, `Locked(remaining)`, `Failed()`. Não trafega no HTTP diretamente; o controller traduz em `200` / `423` / `400`.
- **`AuthResponseDto`** — `{ AccessToken, RefreshToken }`. Único payload de sucesso de register/login/refresh.

---

## 3. Endpoints (API)

Controller: `UserController` — rota base `api/user`. Os endpoints de autenticação são **anônimos**
(sem `[Authorize]`) e todos decorados com `[EnableRateLimiting("auth")]` (5 req / 15 min — ver RN-AUTH-08).
`logout` é a exceção: exige `[Authorize]`.

| Método | Rota | Auth | Rate limit | Descrição | Sucesso | Falha |
|---|---|---|---|---|---|---|
| `POST` | `/api/user/register` | anônimo | `auth` | Cria usuário + seed, devolve tokens | `200` `AuthResponseDto` | `400` validação · `400 "Email already exists."` |
| `POST` | `/api/user/login` | anônimo | `auth` | Autentica e devolve tokens | `200` `AuthResponseDto` | `400` validação · `400 "Invalid email or password."` · `423` conta bloqueada |
| `POST` | `/api/user/refresh` | anônimo | `auth` | Rotaciona refresh token | `200` `AuthResponseDto` | `400 "Refresh token is required."` · `401 "Invalid or expired refresh token."` |
| `POST` | `/api/user/logout` | **`[Authorize]`** | `general` | Revoga o refresh token informado | `204 No Content` | `400 "Refresh token is required."` |
| `POST` | `/api/user/forgot-password` | anônimo | `auth` | Gera token de reset | `200 { resetToken }` | `400 "Email is required."` |
| `POST` | `/api/user/reset-password` | anônimo | `auth` | Troca senha via token | `200 { message }` | `400` campos vazios · `400 "Invalid or expired reset token."` |

> Endpoints de perfil/preferences/conta no mesmo controller (`GET/PATCH profile`, `GET/PATCH preferences`, `DELETE me`, `POST me/reset-data`) → documentados em `specs/profile-preferences.md`.

### Request — `CreateUserRequestDto` (register)
```
Email    : string
Password : string
Name     : string
```

### Request — `UserLoginRequestDto` (login)
```
Email    : string
Password : string
```

### Request — `RefreshTokenRequestDto` (refresh)
```
RefreshToken : string   // default ""
```

### Request — `LogoutRequestDto` (logout)
```
RefreshToken : string   // default ""
```

### Request — `ForgotPasswordRequestDto`
```
Email : string
```

### Request — `ResetPasswordRequestDto`
```
Token       : string
NewPassword : string
```

### Response — `AuthResponseDto` (register / login / refresh)
```
AccessToken  : string   // JWT, HMAC-SHA512, expira em 30 min (ver gap G1)
RefreshToken : string   // 64 bytes Base64, expira em 30 dias
```

### Responses anônimas (objetos inline, sem DTO dedicado)
```
login bloqueado (423) : { message: "Account is locked. Try again later.", retryAfterSeconds: int }
forgot-password (200) : { resetToken: string | null }   // token devolvido direto — ver gap G2
reset-password (200)  : { message: "Password reset successfully." }
```

---

## 4. Regras de negócio

### RN-AUTH-01 — `userId` sempre do JWT
O access token carrega duas claims: `ClaimTypes.NameIdentifier` (= `user.Id`) e `ClaimTypes.Email`.
`BaseController.GetUserId()` lê `NameIdentifier` (fallback para uma claim `"userId"`, que **não** é
emitida hoje) e faz `int.Parse`. Nenhum endpoint aceita `userId` no corpo.

### RN-AUTH-02 — Hashing de senha
Senhas nunca são armazenadas em texto. Usa-se `PasswordHasher<User>` do ASP.NET Core Identity
(PBKDF2 com salt embutido no hash) tanto para gerar (`HashPassword`) quanto para verificar
(`VerifyHashedPassword`). Uma nova instância de `PasswordHasher<User>` é criada a cada chamada (register, login, reset, delete, reset-data) — funcional, mas ver gap G8.

### RN-AUTH-03 — Validação de registro (`CreateUserValidator`)
- `Email`: `NotEmpty` + `EmailAddress`.
- `Password`: `MinimumLength(8)` + ao menos 1 maiúscula `[A-Z]`, 1 minúscula `[a-z]`, 1 dígito `[0-9]` e 1 caractere especial `[^a-zA-Z0-9]`.
- `Name`: `NotEmpty`.

### RN-AUTH-04 — Validação de login (`UserLoginValidator`)
- `Email`: `NotEmpty` + `EmailAddress`.
- `Password`: `NotEmpty` + `MinimumLength(8)`.

> O login valida `MinimumLength(8)` mas **não** valida a complexidade da senha (diferente do register). Inofensivo, mas é uma assimetria de regras. Os endpoints `refresh`, `logout`, `forgot-password` e `reset-password` **não têm validator FluentValidation** — só checagens manuais de string vazia no controller.

### RN-AUTH-05 — Account lockout (login)
Constantes em `UserService.UserLoginAsync`: `maxFailedAttempts = 5`, `lockoutMinutes = 15`.

1. Se o usuário não existe → `LoginResult.Failed()` (mensagem genérica, sem revelar inexistência).
2. Se `LockoutEnd` está no futuro → `LoginResult.Locked(LockoutEnd - now)` **antes** de verificar a senha.
3. Senha incorreta → incrementa `FailedLoginAttempts`. Ao atingir 5, seta `LockoutEnd = now + 15min` **e zera `FailedLoginAttempts` de volta para 0**. Persiste e retorna `Failed()`.
4. Senha correta → zera `FailedLoginAttempts` e `LockoutEnd`, persiste, retorna `Success(tokens)`.

> Efeito de zerar o contador no momento do lockout: depois que o bloqueio de 15 min expira, o usuário tem **5 novas tentativas** (o contador não fica "estourado"). Comportamento provável-intencional, mas registrado em G5.

### RN-AUTH-06 — Emissão do access token (`CreateAccessToken`)
- Algoritmo: `HmacSha512` sobre `SymmetricSecurityKey` derivada de `AppSettings:Token`.
- Claims: `NameIdentifier` (id) + `Email`.
- `issuer`/`audience`: `AppSettings:Issuer` / `AppSettings:Audience`.
- **`expires: DateTime.UtcNow.AddMinutes(30)`** — valor **hardcoded**. O config `AppSettings:TokenValidityMins` **não é lido** em lugar nenhum (ver gap G1).

### RN-AUTH-07 — Refresh token & rotação
- Criação (`CreateRefreshTokenAsync`): `Token` = 64 bytes aleatórios (`RandomNumberGenerator.GetBytes(64)`) em Base64; `ExpiresAt = now + 30 dias`; `IsRevoked = false`. Persistido na tabela `RefreshTokens`.
- Um novo refresh token é gerado **toda vez** que `CreateAuthResponseAsync` roda — ou seja, em register, login **e** refresh.
- **Rotação no refresh** (`RefreshTokenAsync`): busca o token por valor (`Include(User)`); se for `null`, `IsRevoked` ou já expirado (`ExpiresAt <= now`) → retorna `null` (→ `401`). Caso válido, marca `IsRevoked = true`, persiste, e emite **novo par** de tokens. O token antigo nunca é reutilizável.
- **Logout** (`LogoutAsync`): busca por valor; se `null` ou já revogado, retorna `false` (mas o controller responde `204` de qualquer forma — ver gap G9); senão `IsRevoked = true`.

> Não há limpeza/expiração ativa de refresh tokens antigos não-revogados além da checagem de `ExpiresAt` no uso — eles ficam na tabela. Cada login acumula uma linha nova. Ver G10.

### RN-AUTH-08 — Rate limiting (policy `auth`)
Definida em `Program.cs` via `AddFixedWindowLimiter("auth", …)`:
- `PermitLimit = 5`, `Window = 15 min`, `QueueLimit = 0`, `QueueProcessingOrder.OldestFirst`.
- Aplicada (via `[EnableRateLimiting("auth")]`) a: `register`, `login`, `refresh`, `forgot-password`, `reset-password`.
- Rejeição → `429 Too Many Requests` (`RejectionStatusCode`).
- Política default `"general"` (100 req / 1 min) é aplicada a **todos** os controllers via `app.MapControllers().RequireRateLimiting("general")`; portanto `logout` cai em `general`.

> A janela é **fixa** (não sliding) e o particionamento é **global** (não há `PartitionKey` por IP/usuário) — o limite de 5/15min é **compartilhado por todos os clientes** que batem nesses endpoints. Ver G4. Em especial, `refresh` estar sob `auth` interage mal com a expiração de 30 min do access token — ver G1/G4.

### RN-AUTH-09 — Normalização de e-mail
- Register e login fazem `requestDto.Email = requestDto.Email.ToLower()` antes de consultar/gravar.
- `forgot-password` consulta com `email.ToLower().Trim()`.
- A unicidade do e-mail é garantida no código (`AnyAsync(u => u.Email == ...)`), **não** por índice único no banco — `UserMap` não declara `HasIndex(...).IsUnique()`. Ver G11.

### RN-AUTH-10 — Registro semeia dados e já autentica
`RegisterUserAsync`: valida e-mail único → cria `User` com senha hasheada → cria `UserPreferences` → chama `SeedUserDataAsync` (categorias de sistema, categoria/subcategoria de transferência, categorias padrão por idioma, conta "Carteira") → retorna `CreateAuthResponseAsync` (tokens). Ou seja, o usuário já sai logado. Detalhe do seed → `specs/profile-preferences.md` / `specs/categories.md`.

### RN-AUTH-11 — Recuperação de senha
- `ForgotPasswordAsync(email)`: se o usuário existe, gera `PasswordResetToken` = 32 bytes aleatórios em **hex** (`Convert.ToHexString`), `PasswordResetTokenExpiresAt = now + 1h`, persiste e **retorna o token**. Se não existe, retorna `null`.
- O controller **sempre** responde `200 { resetToken }` (token ou `null`) — by design, para evitar **email enumeration**. Mas como o token vai no corpo, o anti-enumeration é parcialmente anulado (token presente ⇒ e-mail existe). Ver G2.
- `ResetPasswordAsync(token, newPassword)`: busca user por `PasswordResetToken == token && PasswordResetTokenExpiresAt > now`; se achar, re-hasheia a senha e limpa `PasswordResetToken`/`PasswordResetTokenExpiresAt`. Retorna `bool`.
- **Nenhuma validação de complexidade** é aplicada à `NewPassword` no reset (o `CreateUserValidator` não roda aqui). Ver G12.
- **O reset de senha não revoga refresh tokens existentes** — sessões antigas continuam válidas após troca de senha. Ver G13.

### RN-AUTH-12 — Validação do token no pipeline (`Program.cs`)
`AddJwtBearer` com `TokenValidationParameters`: `ValidateIssuer`, `ValidateAudience`, `ValidateLifetime`, `ValidateIssuerSigningKey` todos `true`; `ValidIssuer`/`ValidAudience` de config; `IssuerSigningKey` derivada de `AppSettings:Token`. No startup, `Program.cs` valida que `AppSettings:Token` tem ≥ 32 caracteres, senão lança `InvalidOperationException`.

> Não há override de `ClockSkew`; o default do handler é **5 min**. Combinado com os 30 min hardcoded (RN-AUTH-06), a vida efetiva de um access token é ~35 min. Ver G1.

---

## 5. Front (Web)

- **Rota pública:** `/login` → `app/(public)/login/page.tsx` (re-export) → `features/auth/LoginPage.tsx`. Não há rota dedicada de registro: `LoginPage` alterna entre as abas **Entrar** / **Criar conta** via state local (`tab`).
- **Não existe** UI de recuperação de senha. O link "Esqueci minha senha" no `LoginForm` é um `<a href="#">` morto. Ver G2/G14.

### API client — `lib/api/auth.ts`
| Método | Endpoint | Observação |
|---|---|---|
| `login(data)` | `POST /user/login` | envia `{ email, password }`; retorna `AuthResponse` |
| `register(data)` | `POST /user/register` | envia `{ name, email, password }` (descarta `confirmPassword`) |
| `refresh(refreshToken)` | `POST /user/refresh` | retorna novo par |
| `logout(refreshToken)` | `POST /user/logout` | sem retorno |

> Não há client para `forgot-password` / `reset-password`.

### Tipos — `lib/types/auth.types.ts`
`LoginRequest`, `RegisterRequest` (`{ name, email, password, confirmPassword }`), `AuthResponse` (`{ accessToken, refreshToken }`), `AuthUser` (`{ id, name, email, plan: "Free" | "Premium" }`).

> `AuthUser.plan` **não existe no backend** — não há campo `plan`/`Plan` em `User` nem em nenhum DTO. É um tipo de front à frente da API. Ver G15.

### Store — `lib/stores/authStore.ts` (Zustand + `persist`)
- Estado: `accessToken`, `refreshToken`, `user`, `isAuthenticated`. Persistido em `localStorage` sob a chave **`controle-auth`** (`partialize` salva os 4 campos).
- `login(accessToken, refreshToken)`: grava ambos em `localStorage` (`accessToken`/`refreshToken`), seta um **cookie** `accessToken` (`path=/; max-age=604800` = 7 dias; `SameSite=Lax`) e atualiza o estado (`isAuthenticated = true`).
- `logout()`: chama `authApi.logout(refreshToken)` (best-effort, ignora erro), limpa `localStorage`, **zera o cookie** (`max-age=0`) e reseta o estado.
- `setUser(user)`: apenas seta `user`. **Nada chama `setUser` hoje** (não há fetch de `/user/profile` no boot) → `user` permanece `null`. Ver G16.

> **Dupla fonte de tokens:** os tokens vivem tanto no estado Zustand (persistido em `controle-auth`) quanto em chaves avulsas de `localStorage` (`accessToken`/`refreshToken`) **e** num cookie. O cookie é o que o middleware lê; o `localStorage` avulso é o que o interceptor Axios lê. Ver G17.

### Cliente HTTP / interceptors — `lib/api/axios.ts`
- `baseURL` = `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"`.
- **Request interceptor:** lê `localStorage.getItem("accessToken")` e injeta `Authorization: Bearer <token>` quando presente.
- **Response interceptor (401 → refresh → retry → logout):**
  1. Em `401` e se `original._retry` ainda não está marcado, marca `_retry = true`.
  2. Lê `refreshToken` do `localStorage`; se ausente, lança e cai no `catch`.
  3. Faz `POST /user/refresh` (via `axios` cru, **não** a instância `api`, para não recursar no interceptor).
  4. Grava o novo `accessToken`/`refreshToken` em `localStorage` e atualiza o **cookie** `accessToken` (`max-age=604800`).
  5. Reaplica o header e refaz a requisição original via `api(original)`.
  6. Em qualquer erro no fluxo: limpa `localStorage`, zera o cookie e `window.location.href = "/login"`.

> O interceptor escreve direto em `localStorage`/cookie mas **não** atualiza o `authStore` (Zustand) — o estado em memória fica defasado até um reload. Ver G17. Também **não** trata `429` (rate limit) de forma específica.

### Middleware de rota — `proxy.ts`
- `publicRoutes = ["/", "/login"]`.
- Lê o **cookie** `accessToken` (`request.cookies.get("accessToken")`).
- Rota não-pública **sem** cookie → redireciona `/login`.
- `/login` **com** cookie → redireciona `/dashboard`.
- `matcher` exclui `_next/static`, `_next/image`, `favicon.ico`.

> O middleware só verifica **presença** do cookie, não validade/expiração do JWT. Como o cookie tem 7 dias mas o access token expira em ~30 min, há janela onde o middleware deixa passar mas a API responde `401` (recuperado pelo interceptor de refresh). Ver G18. Arquivo nomeado `proxy.ts` (não `middleware.ts`) — convenção desta versão do Next.js (ver `apps/web/AGENTS.md`).

### Fluxo de login/registro (`LoginForm` / `RegisterForm`)
- React Hook Form + Zod (`zod/v4`) com schemas em `features/auth/schemas/authSchema.ts`.
  - `loginSchema`: `email` (não vazio + `.email()`), `password` (não vazio).
  - `registerSchema`: `name` (≥ 2), `email`, `password` (≥ 8 + minúscula + maiúscula + dígito + especial — **espelha o backend**), `confirmPassword` (`.refine` igualdade).
  - `getPasswordStrength`: heurística de UI (fraca / média / forte) por nº de checks atendidos.
- Sucesso → `login(accessToken, refreshToken)` no store → `router.refresh()` → `router.push("/dashboard")`.
- **Tratamento de erro do login:** `423` → "Conta bloqueada temporariamente…"; qualquer outro → "E-mail ou senha inválidos." O `429` (rate limit) cai no genérico de credenciais inválidas — mensagem enganosa. Ver G4.
- **Tratamento de erro do registro:** qualquer falha → "Este e-mail já está em uso." — também engole `429` e erros de validação do servidor numa única mensagem. Ver G14.

---

## 6. Edge cases & gaps

### Edge cases cobertos
- E-mail com case/espaços variados → normalizado em register/login/forgot (RN-AUTH-09).
- 5 senhas erradas → lockout de 15 min com `423` + `retryAfterSeconds` (RN-AUTH-05).
- Refresh token revogado / expirado / inexistente → `401` (RN-AUTH-07).
- Token de reset expirado/inválido → `400` (RN-AUTH-11).
- `register` com e-mail já existente → `400 "Email already exists."`.
- Chave JWT < 32 chars → app não sobe (`Program.cs`).
- 401 numa request autenticada → refresh transparente + retry único no front (axios).

### Gaps / dúvidas a confirmar
- **G1 — `TokenValidityMins` é config morta + expiração hardcoded:** `CreateAccessToken` usa `DateTime.UtcNow.AddMinutes(30)` fixo. O config `AppSettings:TokenValidityMins` **nunca é lido** (e está inconsistente entre fontes: `apps/api/CLAUDE.md` e `appsettings.Development.json` dizem `10`; o `apps/api/README.md` diz `60`). Com o `ClockSkew` default de 5 min, a vida real é ~35 min. **Confirmar a expiração desejada e ligar o config (ou remover o config morto).** *(Security/consistency)*
- **G2 — Reset token devolvido no corpo (sem e-mail):** `forgot-password` retorna `{ resetToken }` direto na resposta HTTP (`UserController` comenta "dev mode — replace with email delivery in production"; `apps/web/CLAUDE.md` lista isso como pendência conhecida — "endpoint existe mas entrega o token direto na resposta (dev)"). Qualquer um que chame o endpoint recebe um token válido por 1h para **qualquer e-mail existente** — bypassa o anti-enumeration e permite tomada de conta. **Integrar entrega por e-mail (SendGrid/Mailgun) e parar de retornar o token antes de produção.** *(Security — crítico)*
- **G3 — Refresh tokens em texto puro no banco:** `RefreshToken.Token` é gravado sem hash. Vazamento da tabela `RefreshTokens` = sessões sequestráveis por 30 dias. Access tokens são stateless (ok), mas refresh tokens deveriam ser armazenados como hash. **Confirmar se haverá hashing (ex.: SHA-256) dos refresh tokens.** *(Security)*
- **G4 — Rate limiting global, sem partição, e `429` mal tratado no front:** a policy `auth` (RN-AUTH-08) usa janela fixa **sem `PartitionKey`** — os 5 req/15min são **compartilhados entre todos os usuários**, então poucos logins simultâneos no sistema todo já estouram o limite (DoS trivial / bloqueio cruzado). Além disso, `refresh` está sob `auth`: um usuário que renova o token a cada ~30 min some no orçamento compartilhado. No front, `429` é exibido como "E-mail ou senha inválidos" (login) / "e-mail já em uso" (registro). **Confirmar particionamento por IP/usuário e tratamento explícito de `429`.** *(Security/UX)*
- **G5 — Contador de lockout zera ao bloquear:** ao atingir 5 falhas, `FailedLoginAttempts` é resetado para 0 junto com o set de `LockoutEnd`. Após os 15 min, o usuário recomeça com 5 tentativas. Provavelmente intencional, mas **confirmar** se não deveria haver backoff progressivo / contagem persistente. *(Confirmar comportamento)*
- **G6 — `IsActive` nunca é verificado no login:** o campo existe (default `true`) mas `UserLoginAsync`/`RefreshTokenAsync` não o checam. Um usuário "desativado" continua autenticando e renovando tokens normalmente. **Confirmar se desativação de conta deve bloquear login/refresh.** *(Security)*
- **G7 — `PreferredCurrency` órfão:** `User.PreferredCurrency` (default `"BRL"`) existe na entidade, mas as preferências reais de moeda vivem em `UserPreferences.CurrencyCode` (lido/escrito por `Get/UpdatePreferencesAsync`). O campo no `User` parece legado/duplicado. **Confirmar fonte da verdade da moeda** (provavelmente domínio de `specs/profile-preferences.md`). *(Tech debt)*
- **G8 — `new PasswordHasher<User>()` instanciado por chamada:** funcional, mas o ideal é injetar `IPasswordHasher<User>` via DI (singleton). Sem impacto de segurança, apenas alocação/consistência. *(Tech debt)*
- **G9 — `logout` sempre responde `204`:** `LogoutAsync` retorna `false` para token inexistente/já-revogado, mas o controller ignora o retorno e responde `204` sempre. Comportamento aceitável (logout idempotente), mas o retorno `bool` do service fica sem uso. *(Inconsistência menor)*
- **G10 — Sem limpeza de refresh tokens:** cada register/login/refresh insere uma linha em `RefreshTokens`; tokens não-revogados acumulam até `ExpiresAt`. Não há job de limpeza nem revogação em massa por usuário. **Confirmar se há (ou deveria haver) expurgo periódico** (ver `specs/background-jobs.md`). *(Tech debt)*
- **G11 — E-mail único só no código, sem índice único no banco:** `UserMap` não declara índice único em `Email`. A unicidade depende exclusivamente do `AnyAsync` em `RegisterUserAsync`/`UpdateProfileAsync` — sujeito a corrida sob concorrência (dois registros simultâneos do mesmo e-mail). **Adicionar `HasIndex(u => u.Email).IsUnique()` (migration).** *(Data integrity)*
- **G12 — Reset de senha sem regras de complexidade:** `ResetPasswordAsync` aceita qualquer `NewPassword` não vazia — as regras do `CreateUserValidator` (8+, maiúscula, etc.) não são aplicadas. Permite definir senha fraca via reset. **Confirmar e aplicar a mesma política de senha.** *(Security)*
- **G13 — Reset de senha não invalida sessões:** após troca de senha, refresh tokens previamente emitidos continuam válidos por até 30 dias. Em cenário de conta comprometida, trocar a senha não expulsa o atacante. **Confirmar se reset deve revogar todos os refresh tokens do usuário.** *(Security)*
- **G14 — Sem fluxo de recuperação de senha no front:** endpoints `forgot-password`/`reset-password` existem na API, mas não há tela, client (`auth.ts`) nem rota no web; o link "Esqueci minha senha" é `href="#"`. Mensagens de erro de register/login também colapsam casos distintos (validação, `429`, e-mail duplicado) numa única string. **Implementar UI quando a entrega por e-mail (G2) existir.** *(Funcionalidade pendente)*
- **G15 — `AuthUser.plan` não existe no backend:** o tipo TS (`"Free" | "Premium"`) não tem contraparte em `User` nem em DTO. Ou o front está à frente (feature de planos futura) ou é campo fantasma. **Confirmar origem do `plan`.** *(Frontend ↔ backend)*
- **G16 — `user` nunca é populado:** `authStore.setUser` existe mas nada o chama; não há fetch de `/user/profile` no boot. `user` fica `null` apesar de persistido. Componentes que dependam de `user` (nome/e-mail) não terão dado. **Confirmar onde o profile deve ser carregado** (provavelmente em `specs/profile-preferences.md`). *(Frontend)*
- **G17 — Tokens em três lugares, store desalinhada:** os tokens vivem em (a) estado Zustand persistido (`controle-auth`), (b) chaves avulsas `localStorage` (`accessToken`/`refreshToken`) e (c) cookie `accessToken`. O interceptor de refresh atualiza (b) e (c) mas **não** (a) — o Zustand fica defasado até reload. Risco de inconsistência e de tokens em `localStorage` (exposição a XSS). **Unificar a fonte da verdade dos tokens.** *(Security/consistency)*
- **G18 — Middleware valida só presença do cookie:** `proxy.ts` checa apenas se `accessToken` existe no cookie, não sua validade/expiração; o cookie dura 7 dias vs. ~30 min do JWT. Há janela em que o middleware deixa passar mas a API retorna `401`. Aceitável (o interceptor recupera), mas a "proteção" do middleware é fraca por design. **Confirmar se é o comportamento desejado.** *(Security/UX)*
- **G19 — Fallback de claim `"userId"` nunca emitido:** `BaseController.GetUserId()` tem fallback para `User.FindFirst("userId")`, mas `CreateAccessToken` só emite `NameIdentifier` e `Email`. O fallback é código morto; se `NameIdentifier` faltar, `int.Parse(null)` estoura `NullReferenceException` (capturado pelo `GlobalExceptionMiddleware`). *(Tech debt menor)*

---

## 7. Arquivos de referência

**API**
- `FinanceControl.WebApi/Controllers/UserController.cs`
- `FinanceControl.WebApi/Controllers/Base/BaseController.cs` (`GetUserId()`)
- `FinanceControl.WebApi/Program.cs` (JWT bearer, rate limiting `auth`/`general`, CORS `WebApp`, validação da chave no startup)
- `FinanceControl.Services/Services/UserService.cs` (register, login+lockout, refresh+rotação, logout, forgot/reset, `CreateAccessToken`, `CreateRefreshTokenAsync`)
- `FinanceControl.Services/Validations/CreateUserValidator.cs`, `UserLoginValidator.cs`
- `FinanceControl.Domain/Interfaces/Services/IUserService.cs`
- `FinanceControl.Domain/Entities/User.cs`, `RefreshToken.cs`
- `FinanceControl.Data/Mappings/UserMap.cs`, `RefreshTokenMap.cs`
- `FinanceControl.Shared/Dtos/Request/CreateUserRequestDto.cs`, `UserLoginRequestDto.cs`, `RefreshTokenRequestDto.cs`, `LogoutRequestDto.cs`, `ForgotPasswordRequestDto.cs`, `ResetPasswordRequestDto.cs`
- `FinanceControl.Shared/Dtos/Response/AuthResponseDto.cs`, `LoginResult.cs`
- `apps/api/appsettings.Development.json` (`AppSettings:Token/Issuer/Audience/TokenValidityMins`)

**Web**
- `features/auth/LoginPage.tsx`, `features/auth/components/LoginForm.tsx`, `RegisterForm.tsx`
- `features/auth/schemas/authSchema.ts`
- `lib/api/auth.ts`, `lib/api/axios.ts` (interceptors 401→refresh→retry→logout)
- `lib/stores/authStore.ts` (persistência `controle-auth`, sync token↔cookie)
- `lib/types/auth.types.ts`
- `src/proxy.ts` (middleware de proteção de rotas)

**Specs relacionados**
- `specs/profile-preferences.md` — perfil (`GET/PATCH profile`), preferências (`GET/PATCH preferences`), exclusão de conta (`DELETE me`), reset de dados (`POST me/reset-data`), seeding.
- `specs/transactions.md` — domínio protegido por `[Authorize]` + `GetUserId()`.
