/* ==================================================================
   Geração do Termo de Ciência e Decisão em PDF, no navegador.
   Empresarial Assessoria Contábil

   Usa jsPDF (carregado por CDN no index.html). O mesmo PDF é baixado
   pelo cliente e enviado ao escritório, então o documento que chega
   aqui é exatamente o que ele viu.

   Todo o texto vem de window.CONTEUDO — este arquivo cuida só da
   diagramação e não precisa ser editado para atualizar a legislação.
   ================================================================== */

(function () {
  'use strict';

  var COR = {
    navy: [39, 47, 109],
    azul: [29, 124, 192],
    texto: [26, 29, 38],
    suave: [74, 80, 97],
    linha: [201, 206, 221],
    bloco: [244, 246, 251],
    destaque: [234, 241, 249]
  };

  var A4 = { largura: 210, altura: 297 };
  var MARGEM = 18;
  var UTIL = A4.largura - MARGEM * 2;
  var LIMITE = A4.altura - 22; // acima do rodapé

  function novoDoc() {
    var jsPDF = window.jspdf.jsPDF;
    return new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  }

  /* ---------------------------------------------------------------- */

  function contexto(doc) {
    return {
      doc: doc,
      y: MARGEM,
      paginas: 1
    };
  }

  function novaPagina(ctx) {
    ctx.doc.addPage();
    ctx.paginas += 1;
    ctx.y = MARGEM;
  }

  function garantirEspaco(ctx, altura) {
    if (ctx.y + altura > LIMITE) novaPagina(ctx);
  }

  function texto(ctx, conteudoTexto, opcoes) {
    var o = opcoes || {};
    var doc = ctx.doc;
    var tamanho = o.tamanho || 9.5;
    var largura = o.largura || UTIL;
    var x = o.x || MARGEM;

    doc.setFont(o.fonte || 'times', o.estilo || 'normal');
    doc.setFontSize(tamanho);
    doc.setTextColor.apply(doc, o.cor || COR.texto);

    var linhas = doc.splitTextToSize(conteudoTexto, largura);
    var alturaLinha = tamanho * 0.44;

    for (var i = 0; i < linhas.length; i += 1) {
      garantirEspaco(ctx, alturaLinha + 2);
      doc.text(linhas[i], x, ctx.y, o.align === 'center' ? { align: 'center' } : undefined);
      ctx.y += alturaLinha;
    }

    ctx.y += o.espacoDepois === undefined ? 2 : o.espacoDepois;
  }

  /** Mede quantos milímetros um texto vai ocupar, sem desenhar. */
  function alturaDe(doc, conteudoTexto, tamanho, largura, fonte, estilo) {
    doc.setFont(fonte || 'times', estilo || 'normal');
    doc.setFontSize(tamanho);
    return doc.splitTextToSize(conteudoTexto, largura).length * (tamanho * 0.44);
  }

  /**
   * Título de seção. `espacoMinimo` reserva o bloco que vem logo abaixo, para
   * o título não ficar órfão no rodapé de uma página.
   */
  function tituloSecao(ctx, numero, rotulo, espacoMinimo) {
    garantirEspaco(ctx, espacoMinimo || 26);
    var doc = ctx.doc;

    doc.setFillColor.apply(doc, COR.azul);
    doc.rect(MARGEM, ctx.y - 3.4, 1.1, 4.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, COR.navy);
    doc.text((numero + '. ' + rotulo).toUpperCase(), MARGEM + 3, ctx.y);

    ctx.y += 2.2;
    doc.setDrawColor.apply(doc, COR.linha);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, ctx.y, MARGEM + UTIL, ctx.y);
    ctx.y += 4.5;
  }

  /** Dados em duas colunas: rótulo pequeno em cima, valor embaixo. */
  function campos(ctx, pares) {
    var doc = ctx.doc;
    var preenchidos = pares.filter(function (par) { return par[1]; });
    var larguraColuna = (UTIL - 6) / 2;

    for (var i = 0; i < preenchidos.length; i += 2) {
      var linha = preenchidos.slice(i, i + 2);
      var alturaValor = Math.max.apply(
        null,
        linha.map(function (par) {
          return alturaDe(doc, String(par[1]), 10, larguraColuna);
        })
      );
      var alturaLinha = 3.4 + alturaValor + 2.6;

      garantirEspaco(ctx, alturaLinha);
      var yBase = ctx.y;

      linha.forEach(function (par, coluna) {
        var x = MARGEM + coluna * (larguraColuna + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.4);
        doc.setTextColor.apply(doc, COR.suave);
        doc.text(String(par[0]).toUpperCase(), x, yBase);

        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor.apply(doc, COR.texto);
        doc.text(doc.splitTextToSize(String(par[1]), larguraColuna), x, yBase + 4.2);
      });

      ctx.y = yBase + alturaLinha;
    }

    ctx.y += 1;
  }

  /**
   * Caixa com fundo. `linhas` é uma lista de {texto, fonte, estilo, tamanho, cor}.
   * A caixa é medida antes de desenhar; se não couber, vai para a página seguinte.
   */
  function caixa(ctx, opcoes) {
    var doc = ctx.doc;
    var padding = 4;
    var larguraTexto = UTIL - padding * 2 - 1.5;

    var altura = padding;
    if (opcoes.titulo) altura += 5;
    opcoes.linhas.forEach(function (linha) {
      altura +=
        alturaDe(
          doc,
          linha.texto,
          linha.tamanho || 9,
          larguraTexto,
          linha.fonte || 'times',
          linha.estilo || 'normal'
        ) + 1.6;
    });
    altura += padding - 1.6;

    garantirEspaco(ctx, altura + 3);
    var yTopo = ctx.y - 4;

    doc.setFillColor.apply(doc, opcoes.fundo || COR.bloco);
    doc.rect(MARGEM, yTopo, UTIL, altura, 'F');
    doc.setFillColor.apply(doc, opcoes.borda || COR.azul);
    doc.rect(MARGEM, yTopo, 1.2, altura, 'F');

    var cursor = yTopo + padding + 1;

    if (opcoes.titulo) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor.apply(doc, COR.navy);
      doc.text(opcoes.titulo.toUpperCase(), MARGEM + padding + 1.5, cursor);
      cursor += 5;
    }

    opcoes.linhas.forEach(function (linha) {
      var tamanho = linha.tamanho || 9;
      doc.setFont(linha.fonte || 'times', linha.estilo || 'normal');
      doc.setFontSize(tamanho);
      doc.setTextColor.apply(doc, linha.cor || COR.texto);
      var partes = doc.splitTextToSize(linha.texto, larguraTexto);
      doc.text(partes, MARGEM + padding + 1.5, cursor);
      cursor += partes.length * (tamanho * 0.44) + 1.6;
    });

    ctx.y = yTopo + altura + 5;
  }

  /** Item confirmado pelo cliente, com marca de aceite desenhada. */
  function itemAceito(ctx, conteudoTexto) {
    var doc = ctx.doc;
    var alturaTexto = alturaDe(doc, conteudoTexto, 9, UTIL - 7);
    garantirEspaco(ctx, alturaTexto + 3);

    var yBase = ctx.y;
    doc.setDrawColor.apply(doc, COR.navy);
    doc.setLineWidth(0.25);
    doc.rect(MARGEM, yBase - 3, 3, 3);
    doc.setLineWidth(0.45);
    doc.line(MARGEM + 0.7, yBase - 1.6, MARGEM + 1.3, yBase - 0.8);
    doc.line(MARGEM + 1.3, yBase - 0.8, MARGEM + 2.4, yBase - 2.6);

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, COR.texto);
    doc.text(doc.splitTextToSize(conteudoTexto, UTIL - 7), MARGEM + 5.5, yBase);

    ctx.y = yBase + alturaTexto + 2;
  }

  function cabecalho(ctx, registro, conteudo) {
    var doc = ctx.doc;

    if (window.LOGO_PDF_BASE64) {
      doc.addImage(window.LOGO_PDF_BASE64, 'PNG', MARGEM, MARGEM - 4, 52, 13.9);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor.apply(doc, COR.navy);
      doc.text(conteudo.escritorio.nome, MARGEM, MARGEM + 4);
    }

    var direita = MARGEM + UTIL;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor.apply(doc, COR.suave);
    doc.text('Protocolo', direita, MARGEM - 2, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, COR.navy);
    doc.text(registro.protocolo, direita, MARGEM + 2.4, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor.apply(doc, COR.suave);
    doc.text('Emitido em ' + registro.dataHoraTexto, direita, MARGEM + 6.4, { align: 'right' });

    var y = MARGEM + 11;
    doc.setDrawColor.apply(doc, COR.navy);
    doc.setLineWidth(0.7);
    doc.line(MARGEM, y, MARGEM + UTIL, y);
    doc.setDrawColor.apply(doc, COR.azul);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, y + 1, MARGEM + UTIL, y + 1);

    ctx.y = y + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor.apply(doc, COR.navy);
    doc.text(conteudo.documento.titulo.toUpperCase(), A4.largura / 2, ctx.y, { align: 'center' });
    ctx.y += 6;

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.setTextColor.apply(doc, COR.texto);
    doc.text(conteudo.documento.subtitulo, A4.largura / 2, ctx.y, { align: 'center' });
    ctx.y += 4.4;

    doc.setFont('times', 'italic');
    doc.setFontSize(9.5);
    doc.setTextColor.apply(doc, COR.suave);
    doc.text(conteudo.documento.linhaFina, A4.largura / 2, ctx.y, { align: 'center' });
    ctx.y += 9;
  }

  function rodapes(doc, registro, conteudo) {
    var total = doc.getNumberOfPages();
    for (var pagina = 1; pagina <= total; pagina += 1) {
      doc.setPage(pagina);
      var y = A4.altura - 14;

      doc.setDrawColor.apply(doc, COR.linha);
      doc.setLineWidth(0.2);
      doc.line(MARGEM, y, MARGEM + UTIL, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.6);
      doc.setTextColor.apply(doc, COR.suave);
      doc.text(conteudo.pdf.rodape, A4.largura / 2, y + 4, { align: 'center' });
      doc.text(
        'Protocolo ' + registro.protocolo + ' · página ' + pagina + ' de ' + total,
        A4.largura / 2,
        y + 7.6,
        { align: 'center' }
      );
    }
  }

  /* ---------------------------------------------------------------- */

  /**
   * Monta o termo completo.
   * @param {object} registro dados preenchidos + protocolo + data/hora
   * @param {object} conteudo window.CONTEUDO
   * @returns {{blob: Blob, base64: string, nomeArquivo: string}}
   */
  function gerarTermo(registro, conteudo) {
    var doc = novoDoc();
    var ctx = contexto(doc);

    doc.setProperties({
      title: conteudo.documento.titulo + ' — ' + registro.protocolo,
      subject: conteudo.documento.subtitulo,
      author: conteudo.escritorio.nome,
      keywords: 'IBS, CBS, Simples Nacional, ' + registro.empresa.cnpj + ', ' + registro.protocolo
    });

    cabecalho(ctx, registro, conteudo);

    // 1 e 2 — identificação
    tituloSecao(ctx, 1, 'Identificação da empresa');
    campos(ctx, [
      ['Razão social', registro.empresa.razaoSocial],
      ['CNPJ', registro.empresa.cnpj],
      ['Nome fantasia', registro.empresa.nomeFantasia],
      ['Código interno', registro.empresa.codigoInterno],
      ['E-mail', registro.empresa.email],
      ['Telefone', registro.empresa.telefone]
    ]);

    tituloSecao(ctx, 2, 'Identificação do responsável');
    campos(ctx, [
      ['Nome completo', registro.responsavel.nome],
      ['CPF', registro.responsavel.cpf],
      ['Cargo / função', registro.responsavel.cargo],
      ['E-mail', registro.responsavel.email],
      ['Telefone', registro.responsavel.telefone]
    ]);

    // 3 — contexto
    tituloSecao(ctx, 3, 'Contexto da decisão');
    conteudo.pdf.resumoContexto.forEach(function (paragrafo) {
      texto(ctx, paragrafo, { espacoDepois: 3 });
    });

    caixa(ctx, {
      titulo: conteudo.baseLegal.titulo,
      linhas: conteudo.baseLegal.itens.map(function (item) {
        return { texto: item.norma + ' — ' + item.descricao, tamanho: 8.6 };
      })
    });

    var linhasPrazo = [
      {
        texto: conteudo.prazos.formalizacao.rotulo,
        fonte: 'helvetica',
        estilo: 'bold',
        tamanho: 9,
        cor: COR.navy
      },
      { texto: conteudo.prazos.formalizacao.observacao, tamanho: 8.6 }
    ];

    if (conteudo.prazos.reconsideracao.possuiPrazoDefinido) {
      linhasPrazo.push({
        texto:
          conteudo.prazos.reconsideracao.rotulo +
          ' (' + conteudo.prazos.reconsideracao.fundamento + ').',
        fonte: 'helvetica',
        estilo: 'bold',
        tamanho: 9,
        cor: COR.navy
      });
    }
    conteudo.reconsideracaoTexto.paragrafos.forEach(function (paragrafo) {
      linhasPrazo.push({ texto: paragrafo, tamanho: 8.6 });
    });

    caixa(ctx, { titulo: 'Prazos aplicáveis', fundo: COR.destaque, linhas: linhasPrazo });

    // 4 — ciência
    tituloSecao(ctx, 4, 'Termo de ciência');
    conteudo.ciencia.itens.forEach(function (item) {
      texto(ctx, item.declaracao, { espacoDepois: 2 });
      itemAceito(ctx, item.checkbox);
    });
    itemAceito(ctx, conteudo.alerta.checkbox);
    ctx.y += 2;

    // 5 — decisão
    tituloSecao(ctx, 5, 'Decisão formalizada pela empresa');
    texto(ctx, conteudo.formalizacao.chamada, { espacoDepois: 3 });
    caixa(ctx, {
      titulo: 'Opção manifestada',
      fundo: COR.destaque,
      borda: COR.navy,
      linhas: [
        {
          texto: registro.decisao.titulo.toUpperCase(),
          fonte: 'helvetica',
          estilo: 'bold',
          tamanho: 10.5,
          cor: COR.navy
        },
        { texto: registro.decisao.manifestacao, tamanho: 9 }
      ]
    });

    // 6 — declaração
    tituloSecao(ctx, 6, 'Declaração de ciência e decisão');
    conteudo.declaracaoFinal.paragrafos.forEach(function (paragrafo) {
      texto(ctx, paragrafo, { espacoDepois: 2.4 });
    });
    itemAceito(ctx, conteudo.declaracaoFinal.checkbox);
    itemAceito(ctx, conteudo.privacidade.checkboxRotulo);
    ctx.y += 3;

    // 7 — assinatura
    tituloSecao(ctx, 7, 'Assinatura do responsável', 60);
    garantirEspaco(ctx, 46);

    if (registro.assinatura.imagem) {
      var proporcao = registro.assinatura.proporcao || 3.2;
      var larguraAss = 72;
      var alturaAss = Math.min(24, larguraAss / proporcao);
      doc.addImage(registro.assinatura.imagem, 'PNG', MARGEM, ctx.y, larguraAss, alturaAss);
      ctx.y += alturaAss + 2;
    }

    doc.setDrawColor.apply(doc, COR.texto);
    doc.setLineWidth(0.3);
    doc.line(MARGEM, ctx.y, MARGEM + 80, ctx.y);
    ctx.y += 4.5;

    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor.apply(doc, COR.texto);
    doc.text(registro.assinatura.nome, MARGEM, ctx.y);
    ctx.y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor.apply(doc, COR.suave);
    doc.text(
      'CPF ' + registro.assinatura.cpf + ' — ' + registro.responsavel.cargo,
      MARGEM,
      ctx.y
    );
    ctx.y += 3.6;
    doc.text('Assinado em ' + registro.dataHoraTexto, MARGEM, ctx.y);
    ctx.y += 8;

    // 8 — registro
    tituloSecao(ctx, 8, 'Registro eletrônico', 55);
    caixa(ctx, {
      titulo: 'Registro e autenticidade',
      borda: COR.navy,
      linhas: [
        { texto: 'Protocolo: ' + registro.protocolo, fonte: 'helvetica', tamanho: 8.6 },
        {
          texto: 'Data e hora do preenchimento: ' + registro.dataHoraTexto,
          fonte: 'helvetica',
          tamanho: 8.6
        },
        {
          texto: 'Código de verificação: ' + registro.codigoVerificacao,
          fonte: 'helvetica',
          tamanho: 8.6
        },
        {
          texto: 'Versão do conteúdo lido pelo cliente: ' + (conteudo.versaoConteudo || '—'),
          fonte: 'helvetica',
          tamanho: 8.6
        },
        {
          texto: conteudo.pdf.avisoAutenticidade,
          fonte: 'times',
          estilo: 'italic',
          tamanho: 8,
          cor: COR.suave
        }
      ]
    });

    rodapes(doc, registro, conteudo);

    var nomeArquivo =
      'Termo_IBS_CBS_' + registro.empresa.cnpjNumeros + '_' + registro.protocolo + '.pdf';

    return {
      blob: doc.output('blob'),
      base64: doc.output('datauristring').split(',')[1],
      nomeArquivo: nomeArquivo
    };
  }

  window.TermoPDF = { gerarTermo: gerarTermo };
})();
