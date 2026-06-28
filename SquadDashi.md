# SquadDashi - Guia de Desenvolvimento para Agentes IA

> **Super Skill para Agentes de IA trabalharem no projeto DashiControl**
> 
> Este documento reúne as melhores ferramentas, práticas e diretrizes do Antigravity Kit (.agent) especificamente configuradas para o projeto DashiControl.

---

## 📋 Sobre o Projeto DashiControl

**DashiControl** é um sistema CRM completo para gestão de leads, clientes, projetos e operações comerciais.

### Stack Tecnológico

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **UI/Design** | Shadcn/ui + Radix UI + Tailwind CSS v3 |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Estado** | React Query (@tanstack/react-query) + Context API |
| **Roteamento** | React Router DOM v6 |
| **Validação** | Zod + React Hook Form |
| **Build** | Vite + SWC (compilation) |
| **Lint** | ESLint 9 + TypeScript ESLint |

### Módulos Principais

- **CRM:** Leads, Clientes, Interações
- **Projetos:** Gestão de projetos, tarefas, marcos
- **Financeiro:** Registros financeiros, relatórios
- **Suporte:** Tickets, chat
- **Webhooks:** Integrações e endpoints
- **Operações:** Empilhadeiras, gás, manutenção, operadores
- **Institucional:** Página de landing da agência (/agency)

---

## 🎯 Quando Usar Este Guia

Use este guia **SEMPRE** que for:
- ✅ Implementar novas funcionalidades
- ✅ Refatorar código existente
- ✅ Corrigir bugs
- ✅ Otimizar performance
- ✅ Adicionar testes
- ✅ Fazer code review
- ✅ Trabalhar com o banco de dados
- ✅ Melhorar UI/UX

---

## 🤖 Agentes Recomendados para DashiControl

### Uso por Tipo de Tarefa

| Tarefa | Agente Principal | Skills Necessárias |
|--------|------------------|-------------------|
| **Criar componentes React** | `frontend-specialist` | react-patterns, tailwind-patterns, clean-code |
| **API/Supabase backend** | `backend-specialist` | database-design, api-patterns, nodejs-best-practices |
| **Schema do banco** | `database-architect` | database-design (SupabaseExpertSkill) |
| **Corrigir bugs** | `debugger` | systematic-debugging, clean-code |
| **Adicionar testes** | `test-engineer` | testing-patterns, tdd-workflow |
| **Otimizar performance** | `performance-optimizer` | performance-profiling, react-patterns |
| **Refatorar código legado** | `code-archaeologist` | clean-code, code-review-checklist |
| **Tarefas complexas** | `orchestrator` | parallel-agents, behavioral-modes |
| **Planejar features** | `project-planner` | plan-writing, brainstorming, architecture |
| **Criar documentação** | `documentation-writer` | documentation-templates |

### Como Invocar Agentes

```
# Exemplo de invocação mental (para agentes IA)
@agents/frontend-specialist 
Preciso criar um componente de tabela de dados reutilizável
com paginação, ordenação e filtros. Stack: React + Shadcn/ui.

@agents/backend-specialist
Preciso criar uma API para gerenciar tickets de suporte
no Supabase com RLS policies adequadas.

@agents/orchestrator
Preciso implementar um módulo completo de relatórios
financeiros com dashboard, gráficos e exportação PDF.
```

---

## 🧩 Skills Essenciais (Prioridade CRÍTICA)

### 1. Clean Code (SEMPRE ATIVO)

**Arquivo:** `.agent/skills/clean-code/SKILL.md`

**Princípios obrigatórios:**

| Princípio | Regra |
|-----------|-------|
| **SRP** | Uma responsabilidade por função/componente |
| **DRY** | Não repita código - extraia e reutilize |
| **KISS** | Solução mais simples que funciona |
| **YAGNI** | Não construa features não solicitadas |

**Regras de nomenclatura:**
- ✅ Variáveis: `userCount`, `isActive`, `hasPermission`
- ✅ Funções: `getUserById()`, `createProject()`, `deleteTicket()`
- ❌ Evitar: `n`, `data`, `temp`, `x`, `foo`

**Estrutura de código:**
- Máximo 20 linhas por função (ideal: 5-10)
- Máximo 3 argumentos por função
- Use guard clauses (early returns)
- Evite nested ifs (máx. 2 níveis)

**Anti-patterns a EVITAR:**
- ❌ Comentários óbvios
- ❌ Funções God (que fazem tudo)
- ❌ Magic numbers sem constantes
- ❌ Deep nesting (>2 níveis)
- ❌ Helpers de uma linha só
- ❌ Arquivos utils.ts genéricos

---

### 2. React Patterns

**Arquivo:** `.agent/skills/react-patterns/SKILL.md`

**Padrões obrigatórios para este projeto:**

#### Tipos de Componentes

| Tipo | Quando Usar | Exemplo no Projeto |
|------|-------------|-------------------|
| **Presentational** | UI pura, sem lógica | `Badge`, `Button`, `Card` |
| **Container** | Lógica + estado | `ClientTable`, `ProjectList` |
| **Layout** | Estrutura de página | `Sidebar`, `Header` |
| **Context Provider** | Estado compartilhado | `ThemeContext`, `UserContext` |

#### Hooks Personalizados

**Quando extrair hooks:**
- ✅ Lógica reutilizada em 2+ componentes
- ✅ Estado complexo com múltiplos useEffects
- ✅ Integração com APIs externas

**Exemplos no projeto:**
```typescript
// ✅ BOM
const { user, loading } = useUser();
const { theme, toggleTheme } = useTheme();
const { data, error, refetch } = useQuery({ ... });

// ❌ EVITAR hooks com lógica única
```

#### Gerenciamento de Estado

| Escopo | Solução | Exemplo |
|--------|---------|---------|
| **Local (1 componente)** | `useState` | Toggle sidebar |
| **Compartilhado local** | Props drilling | Parent → Child |
| **Subtree** | Context API | Theme, User |
| **Server state** | React Query | Dados do Supabase |
| **Global complexo** | Zustand (se necessário) | - |

#### Performance

| Técnica | Quando Usar |
|---------|-------------|
| **React.memo** | Componentes que re-renderizam sem mudança de props |
| **useMemo** | Cálculos pesados |
| **useCallback** | Funções passadas como props |
| **Lazy loading** | Rotas e componentes grandes |

```typescript
// ✅ Lazy load de páginas
const Projetos = lazy(() => import('./pages/Projetos'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
```

---

### 3. Tailwind Patterns (v3)

**Arquivo:** `.agent/skills/tailwind-patterns/SKILL.md`

**Padrões do projeto DashiControl:**

#### Sistema de Design

```typescript
// Cores principais (do Shadcn/ui)
background: "hsl(var(--background))"
foreground: "hsl(var(--foreground))"
primary: "hsl(var(--primary))"
secondary: "hsl(var(--secondary))"
muted: "hsl(var(--muted))"
accent: "hsl(var(--accent))"
destructive: "hsl(var(--destructive))"
```

#### Responsive Design

| Breakpoint | Min Width | Uso |
|------------|-----------|-----|
| `sm:` | 640px | Mobile landscape |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |
| `2xl:` | 1536px | Extra large |

**Padrão Mobile-First:**
```tsx
// ✅ BOM - Mobile primeiro
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-xl md:text-2xl lg:text-3xl">Título</h1>
</div>

// ❌ EVITAR - Desktop primeiro
<div className="p-8 md:p-6 sm:p-4">
```

#### Composição de Classes (cn utility)

```typescript
import { cn } from "@/lib/utils"

// ✅ SEMPRE use cn() para merge condicional
<Button className={cn(
  "base-classes",
  variant === "primary" && "primary-classes",
  disabled && "disabled-classes"
)} />
```

#### Organização de Classes

```tsx
// ✅ BOM - Agrupado por categoria
className="
  // Layout
  flex items-center justify-between
  // Spacing
  p-4 gap-2
  // Visual
  bg-white rounded-lg shadow-sm
  // Typography
  text-sm font-medium
  // Interactive
  hover:bg-gray-50 transition-colors
"
```

---

### 4. Database Design (Supabase)

**Arquivo:** `.agent/skills/database-design/SupabaseExpertSkill.md`

**Estrutura do banco:** `supabase/estrutura_banco_dados.md`

#### Tabelas Principais

- `dashicontrol_leads`
- `dashicontrol_clientes`
- `dashicontrol_projetos`
- `dashicontrol_tarefas`
- `dashicontrol_registros_financeiros`
- `dashicontrol_tickets_suporte`
- `dashicontrol_webhooks`
- `dashicontrol_usuarios`
- `dashicontrol_notificacoes`

#### Padrões Obrigatórios

##### 1. Row Level Security (RLS)

```sql
-- ✅ SEMPRE habilite RLS
ALTER TABLE dashicontrol_clientes ENABLE ROW LEVEL SECURITY;

-- ✅ Crie policies específicas
CREATE POLICY "Usuários podem ver seus próprios clientes"
ON dashicontrol_clientes
FOR SELECT
USING (auth.uid() = responsavel_id);
```

##### 2. Client-side (TypeScript)

```typescript
// ✅ BOM - Tratamento de erro robusto
const { data, error } = await supabase
  .from('dashicontrol_clientes')
  .select('*')
  .eq('status', 'Ativo');

if (error) {
  console.error('Erro ao buscar clientes:', error);
  toast.error('Erro ao carregar clientes');
  return;
}

// ✅ Type-safe
type Cliente = Database['public']['Tables']['dashicontrol_clientes']['Row'];
```

##### 3. Realtime Subscriptions

```typescript
// ✅ Subscrição com cleanup
useEffect(() => {
  const channel = supabase
    .channel('clientes-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'dashicontrol_clientes' },
      (payload) => {
        console.log('Mudança detectada:', payload);
        refetch(); // React Query
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

##### 4. Otimização de Queries

```typescript
// ✅ BOM - Select específico
.select('id, nome, email, status')

// ❌ EVITAR - Select all
.select('*')

// ✅ BOM - Filtros no banco
.eq('status', 'Ativo')
.gte('valor_total', 10000)
.order('data_criacao', { ascending: false })
.limit(20)

// ❌ EVITAR - Filtros no JS
const filtered = data.filter(x => x.status === 'Ativo');
```

##### 5. Transactions e Batch Operations

```typescript
// ✅ BOM - Multiple inserts
const { data, error } = await supabase
  .from('dashicontrol_tarefas')
  .insert([
    { titulo: 'Tarefa 1', projeto_id: projetoId },
    { titulo: 'Tarefa 2', projeto_id: projetoId },
    { titulo: 'Tarefa 3', projeto_id: projetoId },
  ]);
```

---

### 5. API Patterns

**Arquivo:** `.agent/skills/api-patterns/SKILL.md`

#### Padrões para Supabase

##### Request/Response

```typescript
// ✅ BOM - Estrutura consistente de resposta
interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading?: boolean;
}

// ✅ Erro tipado
interface ApiError {
  message: string;
  code: string;
  details?: any;
}
```

##### Error Handling

```typescript
// ✅ BOM - Tratamento centralizado
const handleSupabaseError = (error: PostgrestError) => {
  switch (error.code) {
    case '23505': // unique violation
      return 'Este registro já existe';
    case '23503': // foreign key violation
      return 'Não é possível deletar: existem registros relacionados';
    case 'PGRST116': // not found
      return 'Registro não encontrado';
    default:
      return error.message;
  }
};
```

##### Loading States

```typescript
// ✅ BOM - React Query
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['clientes', filtros],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('dashicontrol_clientes')
      .select('*')
      .eq('status', filtros.status);
    
    if (error) throw error;
    return data;
  },
});

// UI handling
if (isLoading) return <Spinner />;
if (error) return <ErrorState error={error} />;
if (!data?.length) return <EmptyState />;
```

---

### 6. Testing Patterns

**Arquivo:** `.agent/skills/testing-patterns/SKILL.md`

#### Pirâmide de Testes

```
        /\          E2E (Poucos)
       /  \         Fluxos críticos
      /----\
     /      \       Integration (Alguns)
    /--------\      API, Supabase
   /          \
  /------------\    Unit (Muitos)
                    Funções, hooks
```

#### Padrão AAA

```typescript
// ✅ Arrange - Act - Assert
describe('ClientCard', () => {
  it('deve renderizar informações do cliente', () => {
    // Arrange
    const cliente = {
      id: '1',
      nome: 'Empresa Teste',
      status: 'Ativo'
    };
    
    // Act
    render(<ClientCard cliente={cliente} />);
    
    // Assert
    expect(screen.getByText('Empresa Teste')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });
});
```

#### O que Testar

| Teste | Não Teste |
|-------|-----------|
| ✅ Lógica de negócio | ❌ Código de framework |
| ✅ Casos extremos | ❌ Bibliotecas de terceiros |
| ✅ Tratamento de erros | ❌ Getters/setters simples |
| ✅ Transformações de dados | ❌ Mocks vazios |

---

### 7. Code Review Checklist

**Arquivo:** `.agent/skills/code-review-checklist/SKILL.md`

#### Checklist Obrigatório Antes de Commit

##### ✅ Clean Code
- [ ] Nomes descritivos e claros
- [ ] Funções com 1 responsabilidade
- [ ] Máximo 20 linhas por função
- [ ] Sem código comentado (use git)
- [ ] Sem magic numbers

##### ✅ TypeScript
- [ ] Tipos explícitos (não `any`)
- [ ] Interfaces bem definidas
- [ ] Enums para valores fixos
- [ ] Generics quando apropriado

##### ✅ React
- [ ] Componentes pequenos e focados
- [ ] Props tipadas
- [ ] Hooks no topo
- [ ] useEffect com cleanup
- [ ] Memoização quando necessário

##### ✅ Supabase
- [ ] RLS habilitado
- [ ] Erro tratado
- [ ] Queries otimizadas
- [ ] Cleanup de subscriptions

##### ✅ Segurança
- [ ] Sem credentials hardcoded
- [ ] Validação de inputs
- [ ] Sanitização de dados
- [ ] HTTPS only

##### ✅ Performance
- [ ] Imagens otimizadas
- [ ] Lazy loading implementado
- [ ] Debounce em searches
- [ ] Paginação em listas grandes

##### ✅ Acessibilidade
- [ ] Labels em inputs
- [ ] Alt text em imagens
- [ ] ARIA quando necessário
- [ ] Navegação por teclado

---

## 🔄 Workflows Principais

### Comandos Rápidos

| Comando | Descrição | Quando Usar |
|---------|-----------|-------------|
| `/create` | Criar nova feature | Novo módulo/funcionalidade |
| `/enhance` | Melhorar código existente | Adicionar recursos |
| `/debug` | Debugar problemas | Investigar bugs |
| `/test` | Executar testes | Garantir qualidade |
| `/plan` | Planejar tarefas | Quebrar tarefas complexas |
| `/brainstorm` | Brainstorm de soluções | Explorar opções |
| `/status` | Verificar status | Checkup do projeto |

**Arquivos:** `.agent/workflows/*.md`

---

## 📊 Scripts de Validação

**Localizados em:** `.agent/scripts/`

### Scripts Disponíveis

#### 1. checklist.py (Validação Rápida)

```bash
python .agent/scripts/checklist.py .
```

**Verifica:**
- ✅ Vulnerabilidades de segurança
- ✅ Code quality (lint, types)
- ✅ Validação de schema
- ✅ Suite de testes
- ✅ Auditoria UX
- ✅ SEO check

**Usar:** Durante desenvolvimento, antes de commit

#### 2. verify_all.py (Validação Completa)

```bash
python .agent/scripts/verify_all.py . --url http://localhost:3000
```

**Verifica:**
- ✅ Tudo do checklist.py MAIS:
- ✅ Lighthouse (Core Web Vitals)
- ✅ Playwright E2E
- ✅ Bundle analysis
- ✅ Mobile audit
- ✅ i18n check

**Usar:** Antes de deploy, em releases

---

## 🎨 Padrões de UI/UX (Shadcn/ui)

### Componentes Disponíveis

**Instalados no projeto:**
```
accordion, alert, alert-dialog, aspect-ratio, avatar, badge,
button, card, checkbox, collapsible, command, context-menu,
dialog, dropdown-menu, form, hover-card, input, label,
menubar, navigation-menu, popover, progress, radio-group,
scroll-area, select, separator, sheet, slider, switch,
table, tabs, textarea, toast, toggle, toggle-group,
tooltip, sonner
```

### Padrões de Uso

#### 1. Formulários

```tsx
// ✅ BOM - React Hook Form + Zod
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const formSchema = z.object({
  nome: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { nome: "", email: "" },
})

<Form {...form}>
  <FormField
    control={form.control}
    name="nome"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Nome</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

#### 2. Diálogos

```tsx
// ✅ BOM - Controlled dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button>Abrir</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descrição</DialogDescription>
    </DialogHeader>
    {/* Conteúdo */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancelar
      </Button>
      <Button onClick={handleSubmit}>Confirmar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### 3. Toast Notifications

```tsx
// ✅ BOM - Sonner
import { toast } from "sonner"

// Success
toast.success('Cliente criado com sucesso!')

// Error
toast.error('Erro ao criar cliente')

// Loading
const toastId = toast.loading('Salvando...')
// Depois:
toast.success('Salvo!', { id: toastId })
```

#### 4. Tabelas de Dados

```tsx
// ✅ BOM - Tabela com Shadcn/ui
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {clientes.map((cliente) => (
      <TableRow key={cliente.id}>
        <TableCell className="font-medium">{cliente.nome}</TableCell>
        <TableCell>
          <Badge variant={cliente.status === 'Ativo' ? 'default' : 'secondary'}>
            {cliente.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 🚀 Performance Best Practices

### 1. Code Splitting

```typescript
// ✅ BOM - Lazy load pages
import { lazy, Suspense } from 'react';

const Projetos = lazy(() => import('./pages/Projetos'));
const Financeiro = lazy(() => import('./pages/Financeiro'));

// No Router
<Route path="/projetos" element={
  <Suspense fallback={<LoadingSpinner />}>
    <Projetos />
  </Suspense>
} />
```

### 2. Otimização de Imagens

```tsx
// ✅ BOM - Lazy loading nativo
<img 
  src="/image.jpg" 
  alt="Description"
  loading="lazy"
  width={800}
  height={600}
/>
```

### 3. Debounce em Searches

```typescript
// ✅ BOM - Debounced search
import { useDebouncedValue } from '@/hooks/use-debounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebouncedValue(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 4. Paginação

```typescript
// ✅ BOM - Pagination no Supabase
const PAGE_SIZE = 20;

const { data, error } = await supabase
  .from('dashicontrol_clientes')
  .select('*', { count: 'exact' })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  .order('data_criacao', { ascending: false });
```

---

## 🔒 Segurança

### Checklist de Segurança

#### ✅ Autenticação
- [ ] Usar Supabase Auth
- [ ] Protected routes implementadas
- [ ] Session management adequado
- [ ] Logout funcional

#### ✅ Autorização
- [ ] RLS policies habilitadas
- [ ] Verificar permissões no client
- [ ] Validar no server (RLS)

#### ✅ Dados
- [ ] Validar inputs (Zod)
- [ ] Sanitizar dados
- [ ] Escapar SQL (Supabase faz automaticamente)
- [ ] HTTPS only

#### ✅ Secrets
- [ ] Usar variáveis de ambiente
- [ ] `.env` no `.gitignore`
- [ ] Nunca commitar credentials
- [ ] Rotacionar keys regularmente

#### ✅ XSS/CSRF
- [ ] React escapa automaticamente
- [ ] Não usar `dangerouslySetInnerHTML` sem sanitização
- [ ] Configurar CSP headers

---

## 📁 Estrutura de Arquivos

### Organização Recomendada

```
src/
├── components/         # Componentes reutilizáveis
│   ├── ui/            # Shadcn/ui base components
│   ├── layout/        # Layout components (Sidebar, Header)
│   ├── common/        # Componentes compartilhados
│   ├── clientes/      # Feature-specific components
│   ├── projetos/
│   └── ...
├── pages/             # Page components (rotas)
├── hooks/             # Custom hooks
├── contexts/          # Context providers
├── lib/               # Utilities (utils.ts)
├── types/             # TypeScript types
├── integrations/      # Supabase client
└── App.tsx            # Root component
```

### Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| **Componentes** | PascalCase | `ClientCard.tsx` |
| **Hooks** | camelCase com 'use' | `useUser.ts` |
| **Utils** | camelCase | `formatDate.ts` |
| **Types** | PascalCase | `Cliente`, `Projeto` |
| **Constantes** | SCREAMING_SNAKE | `API_URL`, `MAX_ITEMS` |

---

## 🎓 Regras de Ouro para Agentes IA

### 1. SEMPRE Leia o Contexto Primeiro

```yaml
ANTES de qualquer alteração:
  ✅ Leia o arquivo completo
  ✅ Entenda o que importa este arquivo
  ✅ Entenda o que este arquivo importa
  ✅ Verifique se há testes
  ✅ Verifique componentes compartilhados
```

### 2. Pergunte Quando Incerto

```yaml
SE requisição é vaga:
  ❌ NÃO assuma
  ✅ PERGUNTE ao usuário
  
Exemplo:
  "Preciso esclarecer antes de prosseguir:
   1. Qual é o escopo? (módulo inteiro / arquivo específico)
   2. Há preferências de design/UI?
   3. Existem restrições de prazo?"
```

### 3. Faça Mudanças Incrementais

```yaml
✅ BOM: Mudanças pequenas e testáveis
❌ EVITAR: Reescrever tudo de uma vez

Processo:
  1. Faça uma mudança
  2. Teste
  3. Commit
  4. Próxima mudança
```

### 4. Seja Direto e Conciso

```yaml
✅ BOM:
  "Vou criar o componente ClientForm com validação Zod."
  [código]
  "Pronto. Teste com: npm run dev"

❌ EVITAR:
  "Primeiro vou analisar... depois vou pensar... 
   então vou considerar... finalmente vou..."
```

### 5. Use as Skills Corretas

```yaml
Tarefa: Criar componente React
  → Carregar: react-patterns, clean-code, tailwind-patterns

Tarefa: Criar API Supabase
  → Carregar: database-design, api-patterns, nodejs-best-practices

Tarefa: Debugar
  → Carregar: systematic-debugging, clean-code

Tarefa: Refatorar
  → Carregar: clean-code, code-review-checklist, react-patterns
```

---

## 📚 Referências Rápidas

### Arquivos Importantes

| Arquivo | Propósito |
|---------|-----------|
| `.agent/ARCHITECTURE.md` | Visão geral do Antigravity Kit |
| `.agent/skills/clean-code/SKILL.md` | Padrões de código limpo |
| `.agent/skills/react-patterns/SKILL.md` | Padrões React |
| `.agent/skills/tailwind-patterns/SKILL.md` | Padrões Tailwind |
| `.agent/skills/database-design/SupabaseExpertSkill.md` | Expertise Supabase |
| `.agent/skills/api-patterns/SKILL.md` | Padrões de API |
| `.agent/skills/testing-patterns/SKILL.md` | Padrões de teste |
| `supabase/estrutura_banco_dados.md` | Estrutura do banco |
| `components.json` | Configuração Shadcn/ui |
| `tailwind.config.ts` | Configuração Tailwind |
| `package.json` | Dependências do projeto |

### Links Úteis

- **Supabase Docs:** https://supabase.com/docs
- **Shadcn/ui:** https://ui.shadcn.com
- **React Query:** https://tanstack.com/query/latest
- **Tailwind CSS:** https://tailwindcss.com
- **Zod:** https://zod.dev
- **React Hook Form:** https://react-hook-form.com

---

## 🎯 Checklist Final (Antes de Entregar)

### Para Agentes IA: Verifique TUDO antes de marcar como concluído

#### ✅ Código
- [ ] Clean code principles aplicados
- [ ] TypeScript sem erros
- [ ] ESLint sem warnings
- [ ] Componentes pequenos e focados
- [ ] Nomes descritivos

#### ✅ Funcionalidade
- [ ] Feature funciona como solicitado
- [ ] Edge cases tratados
- [ ] Erros tratados graciosamente
- [ ] Loading states implementados
- [ ] Validação de inputs

#### ✅ UI/UX
- [ ] Responsivo (mobile/tablet/desktop)
- [ ] Acessível (labels, ARIA)
- [ ] Feedback visual (toasts, loading)
- [ ] Design consistente com Shadcn/ui

#### ✅ Performance
- [ ] Lazy loading quando apropriado
- [ ] Memoização se necessário
- [ ] Queries otimizadas
- [ ] Sem memory leaks

#### ✅ Segurança
- [ ] RLS habilitado
- [ ] Inputs validados
- [ ] Sem credentials hardcoded
- [ ] Tratamento de erros sem expor detalhes

#### ✅ Database
- [ ] Migrations criadas (se necessário)
- [ ] RLS policies corretas
- [ ] Índices adequados
- [ ] Queries otimizadas

#### ✅ Testes (quando aplicável)
- [ ] Testes unitários passando
- [ ] Casos críticos cobertos
- [ ] Mock de APIs externas

#### ✅ Documentação
- [ ] Comentários em lógica complexa
- [ ] JSDoc em funções públicas
- [ ] README atualizado (se necessário)
- [ ] Tipos exportados

---

## 🚦 Como Usar Este Documento

### Para Agentes IA

1. **Antes de começar qualquer tarefa:**
   - Leia a seção relevante deste documento
   - Carregue as skills necessárias
   - Entenda o contexto do código existente

2. **Durante o desenvolvimento:**
   - Siga os padrões estabelecidos
   - Use os componentes e utils existentes
   - Mantenha consistência com o código atual

3. **Antes de finalizar:**
   - Execute o checklist final
   - Verifique se não quebrou nada
   - Teste a funcionalidade

4. **Na entrega:**
   - Seja claro e conciso
   - Explique decisões importantes
   - Indique como testar

### Para Desenvolvedores Humanos

Use este documento como:
- ✅ Guia de estilo do projeto
- ✅ Referência rápida de padrões
- ✅ Checklist de code review
- ✅ Onboarding para novos membros
- ✅ Documentação de decisões arquiteturais

---

## 📞 Suporte e Feedback

Este documento é vivo e deve evoluir com o projeto.

**Quando atualizar:**
- ✅ Novos padrões adotados
- ✅ Novas dependências importantes
- ✅ Mudanças na arquitetura
- ✅ Lições aprendidas
- ✅ Feedback da equipe

**Mantenha atualizado:** Sempre que houver mudanças significativas no projeto ou nas práticas da equipe.

---

## 🎉 Conclusão

**SquadDashi** é sua super skill para trabalhar eficientemente no DashiControl.

### Lembre-se:

1. **Clean Code** é sempre prioridade #1
2. **Pergunte** quando não tiver certeza
3. **Teste** antes de entregar
4. **Seja consistente** com o código existente
5. **Segurança e performance** não são opcionais

### Mantra do DashiControl:

> **"Código limpo, componentes pequenos, performance medida, segurança rigorosa."**

---

**Versão:** 1.0  
**Última atualização:** 2026-03-10  
**Mantido por:** Squad Dashi

---

*Este documento é parte do Antigravity Kit - Sistema de capacitação para agentes de IA*
