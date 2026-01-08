# Sistema de Autenticação - Integração com ASP.NET Core Identity

Este projeto agora possui um sistema completo de autenticação integrado com ASP.NET Core Identity API.

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `services/authService.ts` - Serviço de comunicação com API
- `context/AuthContext.tsx` - Context para gerenciamento de autenticação
- `pages/Register.tsx` - Página de registro
- `components/PrivateRoute.tsx` - Componente de proteção de rotas

### Arquivos Modificados:
- `pages/Login.tsx` - Atualizado para usar API real
- `App.tsx` - Integrado com sistema de autenticação
- `.env.example` e `.env.local` - Adicionada variável `VITE_API_URL`

## 🔧 Configuração

### 1. Configure a URL da API

No arquivo `.env.local`, defina a URL da sua API ASP.NET Core:

```env
VITE_API_URL=https://sua-api.com/api
```

### 2. Estrutura Esperada da API

A API deve ter os seguintes endpoints:

#### **POST** `/auth/register`
```json
Request:
{
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "name": "User Name" // opcional
}

Response (200):
{
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here", // opcional
  "expiration": "2026-01-08T10:00:00Z",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["User"] // opcional
  }
}
```

#### **POST** `/auth/login`
```json
Request:
{
  "email": "user@example.com",
  "password": "Password123!"
}

Response (200):
{
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here", // opcional
  "expiration": "2026-01-08T10:00:00Z",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["User"] // opcional
  }
}
```

#### **POST** `/auth/logout` (Opcional)
```json
Headers:
Authorization: Bearer {token}

Response (200): OK
```

#### **POST** `/auth/refresh` (Opcional - para refresh token)
```json
Request:
{
  "refreshToken": "refresh-token-here"
}

Response (200):
{
  "token": "new-jwt-token",
  "refreshToken": "new-refresh-token",
  "expiration": "2026-01-08T10:00:00Z",
  "user": { ... }
}
```

#### **GET** `/auth/me` (Opcional - para obter dados do usuário)
```json
Headers:
Authorization: Bearer {token}

Response (200):
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "roles": ["User"]
}
```

## 🚀 Como Usar

### No Frontend:

```tsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'pass' });
      // Usuário logado com sucesso
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Proteger Rotas:

As rotas já estão protegidas automaticamente no `App.tsx`. Todas as rotas dentro de `<PrivateRoute>` requerem autenticação.

### Fazer Requisições Autenticadas:

```typescript
import { authService } from './services/authService';

// Obter token do localStorage
const token = localStorage.getItem('authToken');

// Fazer requisição autenticada
const response = await fetch('https://sua-api.com/api/algum-endpoint', {
  headers: {
    ...authService.getAuthHeader(token),
    'Content-Type': 'application/json'
  }
});
```

## 🔐 Recursos Implementados

- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Proteção de rotas privadas
- ✅ Persistência de sessão (localStorage)
- ✅ Auto-refresh de token (se configurado)
- ✅ Logout
- ✅ Loading states
- ✅ Error handling

## 📝 Exemplo de Controller ASP.NET Core

```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var user = new ApplicationUser 
        { 
            UserName = request.Email, 
            Email = request.Email,
            Name = request.Name
        };
        
        var result = await _userManager.CreateAsync(user, request.Password);
        
        if (result.Succeeded)
        {
            var token = GenerateJwtToken(user);
            return Ok(new AuthResponse 
            { 
                Token = token,
                Expiration = DateTime.UtcNow.AddHours(24),
                User = new UserDto 
                { 
                    Id = user.Id, 
                    Email = user.Email,
                    Name = user.Name
                }
            });
        }
        
        return BadRequest(new { message = "Registration failed", errors = result.Errors });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        
        if (user != null)
        {
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            
            if (result.Succeeded)
            {
                var token = GenerateJwtToken(user);
                return Ok(new AuthResponse 
                { 
                    Token = token,
                    Expiration = DateTime.UtcNow.AddHours(24),
                    User = new UserDto 
                    { 
                        Id = user.Id, 
                        Email = user.Email,
                        Name = user.Name
                    }
                });
            }
        }
        
        return Unauthorized(new { message = "Invalid email or password" });
    }
}
```

## 🔄 Próximos Passos

1. Configure a variável `VITE_API_URL` no `.env.local`
2. Certifique-se de que sua API ASP.NET Core está rodando
3. Configure CORS na API para aceitar requisições do frontend
4. Teste o fluxo de registro e login
5. (Opcional) Implemente Google OAuth se necessário

## 🛠️ Troubleshooting

### Erro de CORS
Adicione no `Program.cs` da API:
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://seu-dominio.com")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

app.UseCors();
```

### Token não persiste
Verifique se o localStorage está funcionando e se a resposta da API inclui `expiration`.

### Rotas protegidas não funcionam
Verifique se o `AuthProvider` está envolvendo toda a aplicação no `App.tsx`.
