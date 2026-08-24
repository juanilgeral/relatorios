# Relatórios Operacionais — Juanil Transportes Rodoviários

PWA para registro de ocorrências e relatórios operacionais das diferentes
unidades (CDs, frota, manutenção), com anexos de fotos e vídeo, prazos e
cobranças pela diretoria.

## Telas

| Arquivo | Função |
|---------|--------|
| `login.html` | Acesso com e-mail/senha + escolha Celular ou Computador |
| `index.html` | Lista de relatórios (busca, filtro por status e operação) |
| `form.html` | Cadastro / edição (título, operação, observação, até 2 fotos comprimidas + 1 vídeo ≤ 20 s) |
| `detalhe.html` | Visualização completa, impressão/PDF e cobranças da diretoria |

## Usuários e senhas

Crie **exatamente** estes e-mails no Firebase Authentication (método E-mail/senha)
com as senhas abaixo:

| E-mail | Senha | Papel |
|--------|-------|-------|
| `operacional@juanil.com.br` | `Lo9ple4kldsf` | **Administrador** — acesso total |
| `lucasoliveira.d3v@gmail.com` | `123456` | CD TELE-RIO |
| `juanil@juanil.com.br` | `@Juanil7` | **Diretoria** — só fiscaliza e registra cobranças (não cria relatórios) |

> Os demais usuários (operacional_2, suportefrota, manutencao, cd_cv, cd_hortifruti, cd_lasa) foram removidos do Authentication.

### Regras de permissão

- **Admin (OPERACIONAL):** cria, edita e exclui qualquer relatório de qualquer CD; registra cobranças.
- **Operacionais / CDs:** só veem e criam relatórios do **próprio CD** (veja abaixo); editam/excluem apenas os que eles mesmos criaram (enquanto não estiverem com status *Concluído*).
- **Diretoria:** visualiza todos os relatórios de todos os CDs; pode registrar **cobranças**, determinações, cobranças de produtividade ou agradecimentos, com **prazo de finalização**. Não cria nem altera o conteúdo principal do relatório.

### Acesso por CD/Operação (quem vê o quê)

Cada usuário operacional só enxerga e só consegue lançar relatórios do CD que
o **Admin** atribuiu a ele. Isso é feito **sem precisar de código**, direto no
Firebase Console:

1. Firestore Database → aba **Dados** → coleção **`usuarios`**.
2. Clique em **Adicionar documento**.
3. **ID do documento:** o e-mail exato do usuário (ex.: `lucasoliveira.d3v@gmail.com`).
4. Campos do documento:
   - `nome` (string) — nome de exibição, ex.: `CD TELE-RIO`
   - `operacao` (string) — precisa ser **idêntico** a um dos valores da lista:
     `CD C&V`, `CD TELE-RIO`, `CD HORTIFRUTI`, `CD LASA`, `FROTA`, `MANUTENÇÃO`, `GERAL`
5. Salvar. O usuário já passa a ver/lançar só naquele CD no próximo login (ou ao dar F5 na sessão atual).

> Um usuário autenticado que ainda **não tenha** esse documento vê a tela
> "Seu acesso ainda não foi configurado" e não consegue criar relatórios,
> até o Admin cadastrar o CD dele.

> Essa restrição é aplicada tanto na tela (campo Operação travado) quanto
> nas regras do Firestore (`firestore.rules`) — ou seja, mesmo editando a URL
> diretamente, o usuário não consegue ver ou criar relatórios de outro CD.

**Exemplo atual:**

| E-mail | Documento em `usuarios` |
|--------|--------------------------|
| `lucasoliveira.d3v@gmail.com` | `{ nome: "CD TELE-RIO", operacao: "CD TELE-RIO" }` |

## Funcionalidades

- Protocolo automático no formato `REL-2026-0001` (sequencial por ano).
- Até **2 fotos** por relatório (comprimidas no aparelho para economizar armazenamento).
- **1 vídeo** opcional, no máximo **20 segundos** e **15 MB** (limite para plano gratuito).
- Campo de **prazo** no relatório e prazos específicos em cada cobrança da diretoria.
- Layout responsivo; na tela de login o usuário escolhe se está no **celular** ou **computador** para ajuste de leitura.
- Botão **Imprimir / PDF** na tela de detalhe (usa a impressão do navegador).

### Lógicas de qualidade e auditoria

1. **Mídia com contexto** — Antes de abrir a câmera ou o seletor de arquivo, o app exibe um aviso obrigatório pedindo que a foto/vídeo mostre a **etiqueta do produto**, o **dano** ou a **placa do equipamento**. Evita anexos genéricos.

2. **Geolocalização automática** — No momento do salvamento o app captura GPS (latitude, longitude, precisão e horário). Fica gravado no relatório e aparece na tela de detalhe com link para o Google Maps. Se o usuário negar a permissão, o salvamento continua, mas a falha fica registrada.

3. **Obrigatoriedade condicional (regras de negócio)**  
   - Se **Houve avaria = Sim** → é obrigatório anexar **pelo menos 1 foto**.  
   - Se a **meta realizada** estiver **abaixo de 80%** da meta esperada → é obrigatório preencher o **motivo**.  
   O botão Salvar só libera o envio depois dessas checagens.

4. **Assinatura digital (touch)** — Canvas no final do formulário para o encarregado assinar com o dedo (ou mouse). A imagem da assinatura e o horário são gravados no relatório.

## Plano gratuito (sem custo no Firebase)

O app foi calibrado para o **plano Spark (gratuito)**:

| Recurso | Limite no app | Por quê |
|---------|---------------|---------|
| Fotos por relatório | **2** | Storage e tráfego |
| Compressão de foto | máx. 1280 px, JPEG ~68% | Cada foto fica ~100–350 KB |
| Vídeo | **1**, até **20 s** e **15 MB** | Vídeo é o que mais consome cota |
| Storage (regra) | máx. **20 MB** por arquivo | Proteção no servidor |

**Dicas para não sair do gratuito:**
1. Crie o projeto no Firebase e use o plano **Spark** enquanto a cota bastar.
2. Se o console exigir Blaze só para ativar Storage, ative Blaze **com orçamento/alerta de US$ 0 ou US$ 1** — o uso típico de uma operação pequena com compressão tende a ficar em R$ 0.
3. Não envie vídeo se a foto já documenta a avaria.
4. Apague relatórios de teste e arquivos antigos no Storage periodicamente.
5. Authentication + Firestore no volume de dezenas/centenas de relatórios/mês normalmente cabem na cota free.

**Importante:** o código HTML/JS hospedado no GitHub Pages é gratuito. O eventual custo seria só Firebase (Storage/Firestore) se estourar cota — os limites acima evitam isso no uso normal.

## Como colocar no ar

1. **Criar projeto no Firebase**  
   https://console.firebase.google.com → Adicionar projeto.

2. **Ativar serviços**  
   - Firestore (modo produção, região `southamerica-east1` recomendada)  
   - Storage  
   - Authentication → método **E-mail/senha**

3. **Criar os 9 usuários** listados na tabela acima (Authentication → Users → Add user).

4. **Credenciais Web**  
   Configurações do projeto → Seus apps → ícone Web → copiar `firebaseConfig`  
   e colar em `firebase-config.js` (substituindo os valores de exemplo).

5. **Publicar regras**  
   - Conteúdo de `firestore.rules` → Firestore → Regras → Publicar  
   - Conteúdo de `storage.rules` → Storage → Regras → Publicar  

6. **Publicar o site**  
   - Subir todos os arquivos desta pasta no GitHub Pages (ou Firebase Hosting, Netlify etc.).  
   - Acesse `login.html` e entre com um dos usuários.

## Estrutura dos anexos no Storage

```
relatorios/{protocolo}/fotos/{timestamp}_{nome}
relatorios/{protocolo}/video/{timestamp}_{nome}
```

## Limitações conhecidas

- A validação de duração do vídeo é feita no navegador (cliente). Arquivos corrompidos ou formatos não suportados pelo browser podem falhar na checagem.
- Não há notificação push automática de cobranças; a diretoria e o operacional veem o alerta na lista (“⚠ Cobrança”).
- O botão de PDF usa a impressão do navegador (sem geração server-side).

## Nome do projeto

**RELATÓRIOS OPERACIONAIS**
