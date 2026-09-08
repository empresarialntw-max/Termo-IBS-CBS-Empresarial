/**
 * TERMO DE CIÊNCIA E DECISÃO — IBS/CBS
 * Empresarial Assessoria Contábil
 *
 * Recebe o termo enviado pelo formulário publicado no GitHub Pages e faz três
 * coisas, nesta ordem:
 *   1. salva o PDF em uma pasta do Google Drive do escritório;
 *   2. registra uma linha na planilha de controle;
 *   3. envia o PDF por e-mail para contato@empresarialsc.com.br.
 *
 * Tudo roda na conta Google do escritório, sem servidor e sem custo.
 *
 * COMO PUBLICAR (leva uns 10 minutos, uma única vez):
 *   1. Crie uma planilha no Google Sheets e chame de "Controle Termos IBS-CBS".
 *   2. Nessa planilha: Extensões > Apps Script.
 *   3. Apague o conteúdo do editor e cole este arquivo inteiro.
 *   4. Ajuste as constantes do bloco CONFIGURAÇÃO logo abaixo.
 *   5. Salve e execute uma vez a função "prepararPlanilha": o Google vai pedir
 *      autorização — aceite (o aviso de "app não verificado" é esperado, é o
 *      seu próprio script).
 *   6. Implantar > Nova implantação > tipo "App da Web".
 *        Executar como: Eu
 *        Quem pode acessar: Qualquer pessoa
 *      Essas duas opções são obrigatórias: o cliente não tem conta Google.
 *   7. Copie a URL gerada (.../exec) e cole em ENDPOINT no arquivo
 *      assets/conteudo.js do site. Coloque MODO_DEMO como false.
 *
 * IMPORTANTE: sempre que alterar este script, faça uma NOVA implantação
 * (ou "Gerenciar implantações" > editar > nova versão). Sem isso, a URL
 * continua servindo a versão antiga.
 */

/* ------------------------------------------------------------------ */
/* CONFIGURAÇÃO                                                        */
/* ------------------------------------------------------------------ */

var CONFIG = {
  // Para quem o termo é enviado.
  EMAIL_DESTINO: 'contato@empresarialsc.com.br',

  // Cópia interna. Deixe '' se não quiser.
  EMAIL_COPIA: '',

  // Enviar também uma via ao responsável que assinou.
  ENVIAR_COPIA_CLIENTE: true,

  // Nome da pasta criada no Drive para guardar os PDFs.
  PASTA_DRIVE: 'Termos IBS-CBS',

  // Nome da aba da planilha usada como controle.
  ABA_CONTROLE: 'Termos recebidos'
};

/* ------------------------------------------------------------------ */
/* RECEBIMENTO                                                         */
/* ------------------------------------------------------------------ */

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);

    if (!dados.protocolo || !dados.empresa || !dados.arquivo) {
      return responder({ ok: false, erro: 'Dados incompletos.' });
    }

    // Evita registro duplicado quando o cliente clica duas vezes.
    if (protocoloJaRegistrado(dados.protocolo)) {
      return responder({ ok: true, protocolo: dados.protocolo, duplicado: true });
    }

    var pdf = Utilities.newBlob(
      Utilities.base64Decode(dados.arquivo.base64),
      'application/pdf',
      dados.arquivo.nome
    );

    var arquivo = salvarNoDrive(pdf);
    registrarNaPlanilha(dados, arquivo.getUrl());
    enviarEmails(dados, pdf);

    return responder({ ok: true, protocolo: dados.protocolo, arquivo: arquivo.getUrl() });
  } catch (erro) {
    // Registra a falha na própria planilha, para o escritório perceber.
    try {
      registrarFalha(erro);
    } catch (ignorado) {}
    return responder({ ok: false, erro: String(erro) });
  }
}

/** Resposta usada pelo formulário. */
function responder(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/* ------------------------------------------------------------------ */
/* DRIVE                                                               */
/* ------------------------------------------------------------------ */

function pastaDoDrive() {
  var pastas = DriveApp.getFoldersByName(CONFIG.PASTA_DRIVE);
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(CONFIG.PASTA_DRIVE);
}

function salvarNoDrive(pdf) {
  return pastaDoDrive().createFile(pdf);
}

/* ------------------------------------------------------------------ */
/* PLANILHA DE CONTROLE                                                */
/* ------------------------------------------------------------------ */

var COLUNAS = [
  'Nº',
  'Data/hora',
  'Protocolo',
  'Razão social',
  'CNPJ',
  'Nome fantasia',
  'Código interno',
  'Responsável',
  'CPF',
  'Cargo',
  'E-mail responsável',
  'E-mail empresa',
  'Telefone',
  'Decisão',
  'Código de verificação',
  'Versão do conteúdo',
  'PDF no Drive',
  'Navegador'
];

/** Cria a aba de controle com o cabeçalho. Rode uma vez na instalação. */
function prepararPlanilha() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(CONFIG.ABA_CONTROLE);

  if (!aba) aba = planilha.insertSheet(CONFIG.ABA_CONTROLE);

  if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS);
    aba.getRange(1, 1, 1, COLUNAS.length)
      .setFontWeight('bold')
      .setBackground('#272F6D')
      .setFontColor('#FFFFFF');
    aba.setFrozenRows(1);
    aba.autoResizeColumns(1, COLUNAS.length);
  }

  // Garante a pasta do Drive já na instalação.
  pastaDoDrive();

  SpreadsheetApp.getUi().alert(
    'Tudo pronto.\n\nAba "' + CONFIG.ABA_CONTROLE + '" criada e pasta "' +
      CONFIG.PASTA_DRIVE + '" disponível no Drive.\n\n' +
      'Agora publique em Implantar > Nova implantação > App da Web.'
  );
}

function abaControle() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(CONFIG.ABA_CONTROLE);
  if (!aba) {
    aba = planilha.insertSheet(CONFIG.ABA_CONTROLE);
    aba.appendRow(COLUNAS);
    aba.setFrozenRows(1);
  }
  return aba;
}

function protocoloJaRegistrado(protocolo) {
  var aba = abaControle();
  if (aba.getLastRow() < 2) return false;
  var coluna = aba.getRange(2, 3, aba.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < coluna.length; i += 1) {
    if (String(coluna[i][0]) === String(protocolo)) return true;
  }
  return false;
}

function registrarNaPlanilha(dados, urlArquivo) {
  var aba = abaControle();
  var proximo = aba.getLastRow(); // linha 1 é o cabeçalho

  aba.appendRow([
    proximo,
    dados.dataHoraTexto || new Date(),
    dados.protocolo,
    dados.empresa.razaoSocial,
    dados.empresa.cnpj,
    dados.empresa.nomeFantasia || '',
    dados.empresa.codigoInterno || '',
    dados.responsavel.nome,
    dados.responsavel.cpf,
    dados.responsavel.cargo,
    dados.responsavel.email,
    dados.empresa.email,
    dados.responsavel.telefone || dados.empresa.telefone || '',
    dados.decisao.titulo,
    dados.codigoVerificacao || '',
    dados.versaoConteudo || '',
    urlArquivo,
    dados.navegador || ''
  ]);
}

function registrarFalha(erro) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName('Falhas') || planilha.insertSheet('Falhas');
  if (aba.getLastRow() === 0) aba.appendRow(['Data/hora', 'Erro']);
  aba.appendRow([new Date(), String(erro)]);
}

/* ------------------------------------------------------------------ */
/* E-MAIL                                                              */
/* ------------------------------------------------------------------ */

function enviarEmails(dados, pdf) {
  var assunto =
    'Decisão IBS/CBS – ' + dados.empresa.razaoSocial + ' – ' + dados.empresa.cnpj;

  var corpo =
    'Prezados,\n\n' +
    'Foi formalizada uma decisão relacionada ao modelo de recolhimento do IBS e da CBS.\n\n' +
    'Empresa:\n' + dados.empresa.razaoSocial + '\n\n' +
    'CNPJ:\n' + dados.empresa.cnpj + '\n\n' +
    'Responsável:\n' + dados.responsavel.nome + ' — ' + dados.responsavel.cargo + '\n\n' +
    'Decisão:\n' + dados.decisao.titulo + '\n\n' +
    'Protocolo:\n' + dados.protocolo + '\n\n' +
    'Data e hora:\n' + dados.dataHoraTexto + '\n\n' +
    'Código de verificação:\n' + (dados.codigoVerificacao || '—') + '\n\n' +
    'O Termo de Ciência e Decisão segue anexado em PDF.\n\n' +
    'Empresarial Assessoria Contábil';

  MailApp.sendEmail({
    to: CONFIG.EMAIL_DESTINO,
    cc: CONFIG.EMAIL_COPIA || undefined,
    replyTo: dados.responsavel.email,
    subject: assunto,
    body: corpo,
    attachments: [pdf]
  });

  if (CONFIG.ENVIAR_COPIA_CLIENTE && dados.responsavel.email) {
    MailApp.sendEmail({
      to: dados.responsavel.email,
      subject: 'Comprovante da decisão IBS/CBS — ' + dados.protocolo,
      body:
        'Olá, ' + dados.responsavel.nome + '.\n\n' +
        'Recebemos a manifestação da empresa ' + dados.empresa.razaoSocial +
        ' quanto ao modelo de recolhimento do IBS e da CBS.\n\n' +
        'Protocolo: ' + dados.protocolo + '\n' +
        'Decisão: ' + dados.decisao.titulo + '\n' +
        'Data e hora: ' + dados.dataHoraTexto + '\n\n' +
        'Segue anexa a via do termo assinado.\n\n' +
        'Empresarial Assessoria Contábil',
      attachments: [pdf]
    });
  }
}

/* ------------------------------------------------------------------ */
/* TESTE                                                               */
/* ------------------------------------------------------------------ */

/**
 * Simula um envio, sem precisar do formulário. Rode para conferir se a
 * planilha, a pasta do Drive e o e-mail estão funcionando.
 */
function testarRecebimento() {
  var falso = {
    postData: {
      contents: JSON.stringify({
        protocolo: 'EMP-IBSCBS-TESTE-' + new Date().getTime(),
        dataHoraTexto: Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone(),
          'dd/MM/yyyy HH:mm'
        ),
        codigoVerificacao: 'TESTE-TESTE-TESTE-TESTE',
        versaoConteudo: 'teste',
        empresa: {
          razaoSocial: 'EMPRESA DE TESTE LTDA',
          cnpj: '11.222.333/0001-81',
          email: 'teste@exemplo.com.br'
        },
        responsavel: {
          nome: 'Responsável de Teste',
          cpf: '529.982.247-25',
          cargo: 'Sócio',
          email: CONFIG.EMAIL_DESTINO
        },
        decisao: { titulo: 'Teste de configuração — nenhuma decisão real' },
        arquivo: {
          nome: 'teste.pdf',
          base64: Utilities.base64Encode('%PDF-1.4\n% arquivo de teste\n')
        }
      })
    }
  };

  Logger.log(doPost(falso).getContent());
}
