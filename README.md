# Termo de Ciência e Decisão — IBS e CBS

Formulário digital da **Empresarial Assessoria Contábil** para os clientes do
Simples Nacional registrarem a ciência e formalizarem a decisão sobre o modelo
de recolhimento do IBS e da CBS.

Mesmo formato do Formulário de Documentação do BPO: uma página publicada no
GitHub Pages, sem servidor para manter. O cliente abre o link, preenche em oito
etapas, assina na tela e confirma. A partir daí o próprio navegador gera o PDF
do termo e envia ao escritório, que recebe o documento por e-mail, guarda uma
cópia no Drive e vê a linha correspondente na planilha de controle.

---

## Como funciona

```
Cliente abre o link  →  preenche e assina  →  confirma
                                   ↓
                    o navegador gera o PDF do termo
                                   ↓
              envio para o Google Apps Script do escritório
                                   ↓
        PDF no Drive  +  linha na planilha  +  e-mail com anexo
                                   ↓
           cliente vê o protocolo e baixa a via dele
```

Nada trafega por servidor de terceiros: o PDF é montado no computador do
cliente e vai direto para a conta Google do escritório.

---

## Arquivos

```
index.html              a página do formulário
assets/conteudo.js      ← O ÚNICO ARQUIVO QUE VOCÊ EDITA: textos, datas e envio
assets/app.js           fluxo das etapas, validações e assinatura
assets/pdf.js           montagem do PDF no navegador
assets/styles.css       identidade visual
assets/logo.png         logotipo (tela)
assets/logo-pdf.png     logotipo (documento)
apps-script/Codigo.gs   o que roda na conta Google e recebe os termos
```

---

## Publicação — parte 1: a página

1. Crie um repositório no GitHub, por exemplo `Termo-IBS-CBS-Empresarial`.
2. Envie todos os arquivos desta pasta para a **raiz** do repositório (o
   `index.html` precisa ficar na raiz, não dentro de subpasta).
3. No repositório: **Settings → Pages**.
4. Em *Source*, escolha **Deploy from a branch**; em *Branch*, escolha `main` e
   a pasta `/ (root)`. Salve.
5. Em cerca de um minuto o endereço aparece na própria tela, no formato
   `https://SEU-USUARIO.github.io/Termo-IBS-CBS-Empresarial/`.

Nesse momento o formulário já funciona em **modo demonstração**: gera o PDF,
mas não envia nada. É assim que ele vem configurado, de propósito.

---

## Publicação — parte 2: o recebimento no Google

Isso é feito uma única vez, na conta Google do escritório.

1. Crie uma planilha no Google Sheets chamada **Controle Termos IBS-CBS**.
2. Nela, abra **Extensões → Apps Script**.
3. Apague o conteúdo do editor e cole todo o arquivo `apps-script/Codigo.gs`.
4. Confira o bloco `CONFIG` no início: e-mail de destino, cópia interna e se o
   cliente também recebe a via dele.
5. Salve e execute a função **`prepararPlanilha`** (menu de funções, botão
   *Executar*). O Google vai pedir autorização — aceite. O aviso de "app não
   verificado" é esperado: o script é seu, basta seguir em *Avançado → Acessar*.
6. **Implantar → Nova implantação → App da Web**, com:
   - *Executar como*: **Eu**
   - *Quem pode acessar*: **Qualquer pessoa**

   As duas opções são obrigatórias — o cliente não tem conta Google e precisa
   conseguir enviar sem fazer login.
7. Copie a URL gerada (termina em `/exec`).

Para testar antes de ligar no site, execute a função **`testarRecebimento`**:
ela simula um envio e você deve ver a linha na planilha, o arquivo no Drive e o
e-mail na caixa de entrada.

---

## Publicação — parte 3: ligar os dois

Abra `assets/conteudo.js` e altere as duas primeiras linhas do bloco `CONFIG`:

```js
MODO_DEMO: false,
ENDPOINT: 'https://script.google.com/macros/s/AKfycb...SEU_CODIGO.../exec',
```

Faça o commit. Em um minuto o GitHub Pages publica e o envio está no ar.
A faixa amarela de demonstração some sozinha quando `MODO_DEMO` vira `false`.

Faça um preenchimento de teste com uma empresa fictícia e confirme que o
e-mail chegou. Depois é só apagar a linha de teste da planilha.

---

## Como atualizar textos, prazos e base legal

Tudo está em **`assets/conteudo.js`**, em português e comentado. Formulário e
PDF leem do mesmo lugar, então não há risco de a tela dizer uma coisa e o
documento outra.

O que costuma mudar:

| Onde | O que é |
|---|---|
| `prazos.formalizacao` | Janela de opção (hoje 01/09/2026 a 30/09/2026) |
| `prazos.reconsideracao` | Prazo de cancelamento (hoje até 30/11/2026) |
| `prazos.reconsideracao.possuiPrazoDefinido` | Ponha `false` se a norma deixar de prever prazo: o quadro passa a exibir só o texto genérico, sem data |
| `baseLegal.itens` | Lista de normas do quadro |
| `contexto.paragrafos` | Texto explicativo da etapa 3 |
| `ciencia.itens` | Declarações e caixas de confirmação |
| `decisao.opcoes` | As duas alternativas |
| `versaoConteudo` | Suba a versão a cada alteração relevante — ela é impressa no PDF e gravada na planilha, o que mostra qual redação o cliente leu ao assinar |

Depois de editar, salve, faça o commit e aguarde um minuto.

### Situação normativa desta versão

O conteúdo reflete a **Resolução CGSN nº 186/2026**: a opção pelo regime
regular de IBS/CBS é exercida no Portal do Simples Nacional entre
**01/09/2026 e 30/09/2026**, produz efeitos a partir de 01/01/2027 e vale para
o período de janeiro a junho de 2027; o cancelamento é admitido até
**30/11/2026**.

Existe também a **Resolução CGSN nº 190/2026**, que trata da exclusão do IBS e
da CBS recolhidos pelo regime regular da base de cálculo do Simples Nacional.
Ela não foi incluída no quadro de base legal. Para acrescentar, adicione ao
array `baseLegal.itens`:

```js
{
  "norma": "Resolução CGSN nº 190/2026",
  "descricao": "Dispõe sobre os reflexos da opção pelo regime regular do IBS e da CBS na apuração do Simples Nacional."
}
```

Confirme a redação vigente antes de cada campanha: o sistema apenas reproduz o
que estiver escrito no arquivo.

---

## O controle do escritório

Cada termo recebido gera:

- **uma linha na planilha**, com número sequencial, data, protocolo, razão
  social, CNPJ, responsável, CPF, cargo, decisão, código de verificação, versão
  do conteúdo e o link do PDF no Drive;
- **um PDF na pasta "Termos IBS-CBS"** do Drive;
- **um e-mail** para contato@empresarialsc.com.br com o PDF anexado e o
  protocolo no assunto.

O **protocolo** segue o formato `EMP-IBSCBS-2026-DDDNNN`, em que DDD é o dia do
ano e NNN um sufixo aleatório. O **código de verificação** é um resumo
criptográfico dos dados do termo: se um cliente apresentar um PDF depois,
confira o código contra o que está na planilha.

Envio repetido não vira registro duplicado — o Apps Script reconhece o
protocolo já gravado e ignora a segunda chamada.

Para acompanhar quem ainda não respondeu, mantenha ao lado da planilha uma aba
com a relação dos clientes do Simples e cruze pelo CNPJ.

---

## LGPD

O formulário coleta CPF e assinatura, então:

- o cliente confirma um aviso específico de tratamento de dados antes de
  assinar, e esse aceite fica registrado no termo;
- o GitHub Pages serve tudo por HTTPS;
- os dados vão direto do navegador do cliente para a conta Google do
  escritório, sem passar por serviço intermediário;
- a pasta do Drive e a planilha herdam o controle de acesso da conta —
  compartilhe apenas com quem precisa;
- inclua a base de tratamento e o prazo de guarda na política de privacidade do
  escritório.

---

## Problemas comuns

| Sintoma | O que verificar |
|---|---|
| A tela final avisa que o envio não se completou | `ENDPOINT` vazio ou errado; ou a implantação não está como "Qualquer pessoa". O cliente ainda consegue baixar o PDF e enviar por e-mail |
| Alterei o `Codigo.gs` e nada mudou | É preciso fazer nova implantação (ou nova versão da existente); a URL antiga continua servindo o código antigo |
| A faixa amarela continua aparecendo | `MODO_DEMO` ainda está `true` em `assets/conteudo.js` |
| O PDF sai sem o logotipo | O arquivo `assets/logo-pdf.png` não subiu para o repositório |
| O e-mail não chega | Cota diária do Gmail atingida (100 mensagens/dia em conta gratuita, 1.500 no Workspace); confira a aba "Falhas" da planilha |
| A página não abre no celular do cliente | Confirme o endereço do GitHub Pages e se o repositório é público |

---

Empresarial Assessoria Contábil — R. dos Guajajaras, 40, sala 605 — Centro,
Belo Horizonte/MG · contato@empresarialsc.com.br
