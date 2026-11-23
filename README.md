# ModelArena

Benchmark local/independente para comparar modelos NVIDIA NIM compatíveis com a API OpenAI.

## Estado do projeto
MVP inicial: descoberta de modelos, execução de benchmarks textuais, persistência SQLite, ranking e dashboard React. A integração nativa dentro do código-fonte do OpenChamber ainda requer acesso ao repositório/estrutura da instalação; este MVP funciona como serviço independente e pode ser aberto ao lado do OpenChamber.

## Requisitos
- Python 3.11+
- Node.js 20+
- Chave NVIDIA API (NVIDIA_API_KEY)

## Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Configure NVIDIA_API_KEY no .env
uvicorn app.main:app --reload --port 8765
```
API: http://localhost:8765/docs

## Frontend
```bash
cd frontend
npm install
npm run dev
```
Dashboard: http://localhost:5173

## Benchmark
1. Configure `NVIDIA_API_KEY`.
2. Abra o dashboard e clique em **Atualizar modelos**.
3. Selecione modelos e categorias.
4. Execute o benchmark. Os testes enviam prompts padronizados e avaliam formato, critérios objetivos e latência.
5. Consulte o ranking e o histórico.

## Segurança e limites
- A chave é lida pelo backend; nunca é enviada ao browser.
- Não execute código retornado pelo modelo.
- Os testes deste MVP são textuais e usam verificações determinísticas simples; não afirmam compilação real de Delphi/C# nem execução SQL.
- A API de modelos pode listar modelos que não estão habilitados para sua conta/região. O teste de inferência confirma disponibilidade.
- Respeite rate limits, termos e custos do provedor.
- Não rode testes em paralelo por padrão; a concorrência é configurável.

## OpenChamber
O serviço é separado para não alterar arquivos/configurações do OpenChamber. A integração recomendada é adicionar um item/atalho "Model Arena" que abra `http://localhost:5173`, mantendo o backend em `localhost:8765`. Não copie credenciais do OpenChamber automaticamente. Configure a chave NVIDIA via variável de ambiente ou `.env` local.

## Desenvolvimento
```bash
cd backend
pytest
```
