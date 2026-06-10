# Converta

Web app para converter DOCX em PDF e PDF em DOCX, com autenticação Google, arquivos privados e histórico em tempo real.

## Arquitetura

```mermaid
flowchart LR
  U[Next.js no navegador] -->|Google Login| A[Firebase Auth]
  U -->|upload direto| S[Firebase Storage]
  U -->|metadados e onSnapshot| F[Cloud Firestore]
  U -->|ID token + conversion ID| V[Route Handler na Vercel]
  V -->|verifica token e propriedade| Admin[Firebase Admin]
  V -->|URL assinada temporária| C[CloudConvert]
  C -->|arquivo convertido| V
  V -->|salva resultado privado| S
  V -->|atualiza status| F
```

O arquivo original não atravessa o corpo da Function. Isso evita o limite de payload de 4,5 MB da Vercel. A Function recebe somente o ID da conversão, cria uma URL de leitura temporária e entrega essa referência ao provedor.

## Decisão do provedor

O adapter inicial é o **CloudConvert**. Ele suporta DOCX → PDF e PDF → DOCX, jobs assíncronos, importação por URL e exportação temporária. O plano gratuito informa até 10 conversões por dia.

O **ConvertAPI** também suporta os dois sentidos e é uma alternativa viável. CloudConvert foi escolhido porque seu modelo de jobs com `import/url` combina melhor com upload direto ao Firebase Storage e Functions da Vercel.

O contrato `ConversionProvider` isola o fornecedor em `src/lib/conversion`. A chave fica exclusivamente no servidor.

- [CloudConvert API](https://cloudconvert.com/api/v2)
- [CloudConvert pricing](https://cloudconvert.com/pricing)
- [ConvertAPI PDF to DOCX](https://www.convertapi.com/pdf-to-docx)
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations)

## Stack

- Next.js 16, React 19 e TypeScript
- Tailwind CSS 4
- Firebase Auth, Firestore, Storage e Admin SDK
- CloudConvert API v2
- Vitest
- Vercel

## Desenvolvimento

Requisitos: Node.js 20.9 ou superior e um projeto Firebase.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Em **Authentication > Sign-in method**, ative Google.
3. Crie o Firestore em modo de produção.
4. Ative o Storage e escolha uma região próxima dos usuários.
5. Registre um Web App e copie os valores públicos para `.env.local`.
6. Em **Project settings > Service accounts**, gere uma chave para o Admin SDK.
7. Cadastre `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL` e `FIREBASE_ADMIN_PRIVATE_KEY`.
8. Publique regras e índices:

```bash
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

Na Vercel, mantenha a chave privada em uma única linha, com quebras representadas por `\n`. O código converte essas sequências de volta para quebras reais.

Adicione `localhost` e o domínio final da Vercel em **Authentication > Settings > Authorized domains**.

## Configuração do CloudConvert

1. Crie uma conta no [CloudConvert](https://cloudconvert.com/).
2. Gere uma API key com permissões `task.read` e `task.write`.
3. Defina:

```env
CONVERSION_PROVIDER=cloudconvert
CONVERSION_API_KEY=sua-chave
```

As conversões reais só funcionam com essa credencial. O projeto não simula conversão nem troca apenas a extensão.

## Variáveis

Todas estão documentadas em `.env.example`. Variáveis `NEXT_PUBLIC_*` entram no bundle do navegador. Credenciais Admin e do provedor nunca usam esse prefixo.

O limite padrão é 20 MB e deve permanecer igual em:

- `NEXT_PUBLIC_MAX_FILE_SIZE_MB`
- `CONVERSION_MAX_FILE_SIZE_MB`
- `firestore.rules`
- `storage.rules`

## Segurança

- ID token validado em toda rota privada.
- UID sempre obtido do token, nunca do corpo.
- Propriedade conferida no Firestore.
- Claim transacional impede processamento duplicado.
- Extensão, tamanho, estado e ID são validados no servidor.
- Caminhos usam UID e conversion ID previsíveis e privados.
- Resultados só são escritos pelo Admin SDK.
- Downloads usam URLs assinadas por cinco minutos.
- Mensagens externas são reduzidas antes de chegar ao cliente.
- Tokens e conteúdo dos arquivos não são registrados.

As regras permitem ao cliente somente criar a conversão e concluir a etapa de upload. Campos de processamento, saída e conclusão pertencem ao servidor.

## Retenção

O documento recebe `expiresAt` sete dias após a conclusão e pode ser excluído manualmente no dashboard. Para produção, configure uma rotina diária (Vercel Cron ou Cloud Scheduler) que consulte `expiresAt <= now`, remova os dois arquivos e apague o documento. Não ative TTL do Firestore sozinho: ele não exclui objetos do Storage.

## Testes

```bash
npm run lint
npm test
npm run build
```

Os testes cobrem validação, tamanho, nomes de saída, transições, prevenção de reprocessamento e adapter do provider. O `firebase.json` prepara Auth, Firestore e Storage Emulator para uma futura suíte de regras.

## Deploy na Vercel

1. Crie um repositório GitHub sem incluir `.env.local`.
2. Importe o repositório em [Vercel](https://vercel.com/new).
3. Cadastre todas as variáveis de `.env.example`.
4. Faça o primeiro deploy.
5. Adicione o domínio Vercel aos domínios autorizados do Firebase Auth.
6. Atualize `NEXT_PUBLIC_APP_URL` com a URL final e publique novamente.
7. Valide login, upload nos dois formatos, conclusão, download, retry e exclusão.

O processamento usa `maxDuration = 300`. Confirme que o plano Vercel escolhido suporta essa duração. Arquivos de até 20 MB cabem na memória durante a gravação do resultado, mas conversões maiores devem migrar para um worker dedicado ou exportação direta para armazenamento compatível.

## GitHub

Antes de publicar:

```bash
git init
git add .
git status
git commit -m "feat: build Converta MVP"
```

Nenhum commit, repositório remoto ou push é criado automaticamente.

## Roadmap

- Limpeza automática de arquivos expirados
- Testes de regras com Firebase Emulator Suite
- Rate limiting distribuído
- Filtros e busca no histórico
- Conversão em lote
- PWA e analytics com consentimento

## Riscos conhecidos

PDF → DOCX é uma reconstrução e pode perder detalhes em layouts complexos, fontes incomuns ou documentos digitalizados. Os arquivos também são processados por um terceiro; documentos altamente sensíveis não devem ser enviados sem uma análise jurídica e contratual do provedor.
