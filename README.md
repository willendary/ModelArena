# ModelArena

**Laboratório de benchmark NVIDIA NIM com avaliador real de código, agendamento automático e extensão nativa para o OpenChamber.**

O objetivo do **ModelArena** é simples: abrir o **OpenChamber**, clicar em **Model Arena** e descobrir com dados objetivos qual modelo NVIDIA NIM merece ser o seu modelo principal de programação.

---

## Principais Recursos

- **Avaliador Real de Qualidade de Código (não apenas palavras-chave):**
  - **Python (`coding` e `debugging`):** validação estática AST (bloqueio de imports/chamadas perigosas) + execução isolada em subprocesso restrito (`python -I`) contra baterias reais de testes unitários (incluindo edge cases e imutabilidade).
  - **SQL ANSI & Firebird 2.5 (`coding`, `firebird`):** validação *read-only*, verificação de dialeto Firebird 2.5 (`NOT EXISTS`, `FIRST 5` / `ROWS 1 TO 5`, `COALESCE`, penalizando `LIMIT`/`TOP`) e **execução real em banco SQLite em memória** com massa de dados para detectar erros clássicos como `COUNT(*)` em clientes sem pedidos.
  - **C# / .NET (`csharp`):** análise estrutural de assinatura `async Task<int>`, proteção `null`, respeito ao `CancellationToken`, ausência de bloqueios síncronos (`.Result`/`.Wait()`), balanceamento sintático e agregação `StringComparer.OrdinalIgnoreCase`.
  - **Delphi 7 / Object Pascal (`delphi`):** validação técnica de fronteira de DLL (`stdcall`, `PChar`/`WideString`, `ShareMem`/gerenciador de memória) e análise estrutural de proteção contra vazamento (`TStringList.Create` + `try..finally..Free`, `FileExists`, balanceamento `begin`/`end`).
  - **Raciocínio Lógico (`reasoning`):** verificação programática das restrições de ordem e ordenação topológica real.
- **Cliente NVIDIA NIM Robusto:**
  - Separação automática de blocos `<think>...</think>` e `reasoning_content` para modelos de raciocínio (Nemotron, DeepSeek-R1, GLM, Qwen).
  - Retry automático com backoff exponencial em `429` / `5xx`.
  - Classificação inteligente do catálogo `/v1/models` (separando modelos de código/chat de embeddings, rerankers, áudio e guardrails).
  - Medição de latência e `tokens/s`.
- **Execução em Background, Agendamento Automático e Ranking Atualizado:**
  - Jobs assíncronos com progresso em tempo real e cancelamento.
  - Agendador persistente em SQLite (periodicidade configurável + descoberta automática dos modelos de código ou lista fixa).
  - **Nota Composta (0–100):** 75% qualidade real + 15% confiabilidade + 10% velocidade.
  - Card **"Modelo Principal Recomendado"** com campeões por stack, modelo mais rápido confiável e exportação Markdown/JSON.
- **Integração Nativa com OpenChamber (`@openchamber/sdk` v1):**
  - Painel lateral + Página completa (**Model Arena**) sincronizados com o tema do OpenChamber.
  - Detecta automaticamente o modelo NVIDIA ativo da sua sessão no OpenChamber (`console-nvidia/...`) para comparação direta.
  - Guest Service local autenticado (`service/main.js`) com proxy seguro para o backend e suporte ao hook nativo de cron (`/schedule`).
  - Botões para copiar a referência `console-nvidia/<modelo>` ou enviar o resumo do ranking diretamente para o chat.

---

## Início Rápido

### 1. Configurar a chave NVIDIA NIM
```bash
cp backend/.env.example backend/.env
# Edite backend/.env e informe sua chave em NVIDIA_API_KEY=...
```
> A chave `NVIDIA_API_KEY` fica **exclusivamente no backend local** e nunca é enviada ao navegador nem copiada das credenciais do OpenChamber.

### 2. Subir o ModelArena (1 comando)

**Windows (PowerShell):**
```powershell
.\scripts\start-modelarena.ps1
```

**Linux / macOS:**
```bash
./scripts/start-modelarena.sh
```

O script cria o ambiente virtual Python, compila o dashboard React (`frontend/dist`) e inicia o servidor em:
- **Dashboard Web:** `http://127.0.0.1:8765/`
- **Documentação API (Swagger):** `http://127.0.0.1:8765/docs`

---

## Instalação Nativa no OpenChamber

O repositório já é um pacote de extensão nativo compatível com **OpenChamber `>= 2.0.0`** (com `panel/main.js` e `service/main.js` pré-compilados e validados pelo `@openchamber/sdk`).

No OpenChamber, abra **Settings → Extensions → Add** e escolha uma das 3 opções:

1. **Via GitHub (recomendado para atualizações automáticas):**
   ```text
   https://github.com/willendary/ModelArena
   ```
2. **Via pasta local (ideal para desenvolvimento):**
   Selecione a pasta local do repositório (ex.: `D:\Dados\Projetos\ModelArena`).
3. **Via arquivo `.zip` da Release:**
   Baixe `model-arena-openchamber-extension-v1.0.0.zip` na página de [Releases](https://github.com/willendary/ModelArena/releases) e importe em **Settings → Extensions**.

Ao instalar, aprove o serviço local (`service`) quando solicitado pelo OpenChamber. Depois basta clicar no ícone **Model Arena** na barra lateral direita (ou abrir como página completa em *Extension pages*).

---

## Desenvolvimento e Testes

### Backend (FastAPI + SQLAlchemy + Pytest)
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
pytest -v
uvicorn app.main:app --reload --port 8765
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173 (com proxy para :8765)
npm run build     # gera frontend/dist servido automaticamente pelo backend
```

### Extensão OpenChamber (`@openchamber/sdk`)
```bash
npm install
npm run check           # typecheck + bundle IIFE/CJS + testes Node + validação do manifesto
npm run pack:extension  # gera o .zip pronto para distribuição
```

---

## Principais Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Status do serviço, versão, chave NVIDIA e agendador |
| `GET` | `/api/categories` | Suítes de benchmark e tarefas disponíveis |
| `GET` | `/api/models` | Catálogo NVIDIA NIM classificado (`?coding_only=true&search=...`) |
| `POST` | `/api/provider/test` | Testa conexão com a API NVIDIA NIM (e probe opcional de modelo) |
| `POST` | `/api/benchmarks/jobs` | Inicia benchmark assíncrono em background |
| `GET` | `/api/benchmarks/jobs/{id}` | Progresso em tempo real e resultados do job |
| `POST` | `/api/benchmarks/jobs/{id}/cancel` | Cancela job em andamento |
| `GET` | `/api/ranking` | Ranking composto, matriz por categoria e delta (`?category=...`) |
| `GET` | `/api/recommendation` | Modelo principal recomendado, mais rápido e campeões por stack |
| `GET` | `/api/ranking/export` | Exportação em `markdown` ou `json` |
| `GET` | `/api/runs/{id}` | Inspeção completa de uma execução com rubrica critério a critério |
| `GET/PUT` | `/api/schedule` | Consulta e configura execução automática periódica |
| `POST` | `/api/schedule/run-now` | Executa o benchmark agendado imediatamente |

---

## Segurança e Boas Práticas

- A chave `NVIDIA_API_KEY` nunca é exposta ao frontend nem ao iframe da extensão.
- O avaliador Python executa um gate estático AST bloqueando imports/chamadas perigosas antes de rodar testes unitários em subprocesso isolado (`python -I`) com built-ins restritos e timeout rígido.
- O avaliador SQL valida consultas estritamente *read-only* antes de executá-las em SQLite `:memory:`.
- Concorrência padrão conservadora (`MAX_CONCURRENCY=1`) para respeitar rate limits da NVIDIA NIM.
