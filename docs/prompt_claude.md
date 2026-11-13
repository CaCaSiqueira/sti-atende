**Aja como um Arquiteto de Software, Engenheiro DevOps e Especialista em IA Sênior.**

**OBJETIVO PRINCIPAL:**
Construir o sistema **STI Atende** (SEMA-MT), focado em um Agente de Suporte de IA com raciocínio aprimorado e atendimento humanizado. O sistema possui versões para usuário externo e interno. A IA atua como nível 1, resolvendo problemas conhecidos automaticamente ou roteando incidentes com base no SLA.

**DIRETRIZES DE TRABALHO (URGÊNCIA E AUTOMAÇÃO):**
1. **Zero Configuração Manual:** Você (Claude) deve inicializar o repositório, configurar Git, Next.js, Vercel e Supabase via CLI. Pare e peça minha ajuda apenas para login/chaves de API.
2. **Stack Tecnológico:** Next.js (App Router), Tailwind CSS (responsivo), Supabase (DB/Auth) e Vercel (Hospedagem). Tudo 100% Free/Open Source.
3. **Proatividade:** Modificações de arquitetura devem ser breves e requerem minha aprovação tácita ("posso prosseguir?").

**REQUISITOS DO SISTEMA (Baseado no Protótipo HTML anexo no repositório):**
- **Assistente IA (Chat Principal):** O analista de suporte IA. Pode resolver via POP (Procedimento Operacional Padrão) ou rotear. 
- **Consulta de Chamados:** Tela com busca por assunto/número para verificação de status e "Com Quem Está" o chamado.
- **Abertura Manual de Chamado:** Formulário tradicional para quem não quiser usar o bot.
- **Visão Geral (Dashboard):** Tela de indicadores gerenciais (volume, chamados abertos).
- **Configurações (Restrito):** Uma tela escondida sob o menu "Configurações" contendo a **"Saúde do Sistema"** (latência, status da API) e o **"Plano de Entrega"**. (Requisito chave para avaliação de concurso).

**REGRAS DE NEGÓCIO E SLA (ROTEAMENTO IA):**
- **Erro no CAR:** A IA deve exibir um POP com botão "Sincronizar", avisando que só pode ser feito 1x a cada 24h para proteger o banco Oracle.
- **Problemas de Hardware:** A IA direciona automaticamente o chamado para o setor **GATI** (Gerência de Atendimento Técnico).
- **Problemas de Sistemas (ex: SIGPAS):** A IA direciona para a **CSTI** (Coordenadoria de Sistemas de Tecnologia da Informação).
- **Problemas de Infraestrutura/Rede:** A IA direciona para a **Coordenação de Infraestrutura**.
- **Desconhecidos:** Triagem de nível 1.

**PLANO DE EXECUÇÃO (SPRINTS SCRUM):**
*O arquivo `index.html` anexo é o nosso Protótipo Aprovado (Sprint 0). Use-o como base fiel para o front-end.*

*   **Sprint 1: Setup:** Crie o projeto Next.js, configure o Tailwind, inicialize o Git e deixe a estrutura pronta.
*   **Sprint 2: Front-end Next.js:** Converta todo o `index.html` providenciado em componentes React no Next.js (Sidebar, Chat, Dashboard, Configurações de Saúde).
*   **Sprint 3: Backend e Banco (Supabase + IA):** Crie as tabelas de chamados no Supabase e a Rota de API da Inteligência Artificial. Implemente as regras de SLA descritas acima no prompt do sistema da IA.
*   **Sprint 4: Refinamento e Deploy:** Testes finais e deploy na Vercel.

Inicie executando a **Sprint 1** agora, lendo o arquivo `index.html` (caso eu tenha anexado) para entender a UI, e faça o setup completo do Next.js.
