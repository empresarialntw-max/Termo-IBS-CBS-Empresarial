/* ==================================================================
   Termo de Ciência e Decisão — IBS/CBS
   Empresarial Assessoria Contábil

   Todo o texto jurídico é carregado de /api/conteudo (config/content.json).
   Este arquivo cuida do fluxo, das validações de interface e da captura da
   assinatura. A validação que vale é a do servidor; esta aqui existe para
   o cliente não descobrir um erro só no fim.
   ================================================================== */

(function () {
  'use strict';

  var TOTAL_ETAPAS = 8;
  var ROTULOS_TRILHA = [
    'Empresa',
    'Responsável',
    'Contexto',
    'Ciência',
    'Decisão',
    'Declaração',
    'Assinatura',
    'Revisão'
  ];

  var conteudo = null;
  var etapaAtual = 1;
  var enviando = false;
  var idsCiencia = [];

  var $ = function (seletor) { return document.querySelector(seletor); };

  /**
   * Valor de um campo pelo id, tolerante a campo ausente.
   * Se o HTML e o JS ficarem em versões diferentes (um arquivo atualizado e o
   * outro não), o formulário continua funcionando em vez de travar.
   */
  var valorDe = function (id) {
    var campo = document.getElementById(id);
    return campo ? String(campo.value || '').trim() : '';
  };
  var $$ = function (seletor) { return Array.prototype.slice.call(document.querySelectorAll(seletor)); };

  /* ---------------------------------------------------------------- */
  /* Utilidades                                                        */
  /* ---------------------------------------------------------------- */

  function digitos(valor) { return String(valor || '').replace(/\D+/g, ''); }

  function mascaraCNPJ(valor) {
    var d = digitos(valor).slice(0, 14);
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  function mascaraCPF(valor) {
    var d = digitos(valor).slice(0, 11);
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function mascaraTelefone(valor) {
    var d = digitos(valor).slice(0, 11);
    if (d.length <= 10) {
      return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  }

  function validarCPF(entrada) {
    var cpf = digitos(entrada);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    var soma = 0;
    var i;
    for (i = 0; i < 9; i += 1) soma += Number(cpf[i]) * (10 - i);
    var dv = (soma * 10) % 11;
    if (dv === 10) dv = 0;
    if (dv !== Number(cpf[9])) return false;
    soma = 0;
    for (i = 0; i < 10; i += 1) soma += Number(cpf[i]) * (11 - i);
    dv = (soma * 10) % 11;
    if (dv === 10) dv = 0;
    return dv === Number(cpf[10]);
  }

  function validarCNPJ(entrada) {
    var cnpj = digitos(entrada);
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    function calcular(base) {
      var peso = base.length - 7;
      var soma = 0;
      for (var i = 0; i < base.length; i += 1) {
        soma += Number(base[i]) * peso;
        peso -= 1;
        if (peso < 2) peso = 9;
      }
      var resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    }
    if (calcular(cnpj.slice(0, 12)) !== Number(cnpj[12])) return false;
    return calcular(cnpj.slice(0, 13)) === Number(cnpj[13]);
  }

  function validarEmail(valor) {
    return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(String(valor || '').trim());
  }

  function dataBR(data) {
    var d = data || new Date();
    var dois = function (n) { return String(n).padStart(2, '0'); };
    return dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function dataHoraBR(iso) {
    var d = new Date(iso);
    var dois = function (n) { return String(n).padStart(2, '0'); };
    return dataBR(d) + ' às ' + dois(d.getHours()) + ':' + dois(d.getMinutes());
  }

  function formatarDataISO(iso) {
    if (!iso) return '';
    var partes = String(iso).split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
  }

  function mostrarErro(chave, mensagem) {
    var alvo = document.querySelector('[data-erro="' + chave + '"]');
    if (alvo) alvo.textContent = mensagem || '';
  }

  function limparErros(etapa) {
    $$('.etapa[data-etapa="' + etapa + '"] .erro').forEach(function (el) {
      el.textContent = '';
    });
    $$('.etapa[data-etapa="' + etapa + '"] [aria-invalid]').forEach(function (el) {
      el.removeAttribute('aria-invalid');
    });
  }

  function marcarInvalido(id) {
    var campo = document.getElementById(id);
    if (campo) campo.setAttribute('aria-invalid', 'true');
  }

  var temporizadorAviso = null;
  function avisar(mensagem, itens) {
    var caixa = $('#avisoErro');
    var html = '<strong>' + mensagem + '</strong>';
    if (itens && itens.length) {
      html += '<ul>' + itens.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
    }
    caixa.innerHTML = html;
    caixa.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(function () { caixa.hidden = true; }, 9000);
  }

  /* ---------------------------------------------------------------- */
  /* Carregamento do conteúdo                                          */
  /* ---------------------------------------------------------------- */

  /**
   * Carrega o conteúdo jurídico de window.CONTEUDO (assets/conteudo.js).
   * Não há servidor: tudo o que o formulário mostra está publicado junto
   * com a página.
   */
  function carregarConteudo() {
    if (!window.CONTEUDO) {
      return Promise.reject(new Error('Arquivo de conteúdo não carregado.'));
    }
    conteudo = window.CONTEUDO;
    idsCiencia = conteudo.ciencia.itens.map(function (item) { return item.id; });
    try {
      renderizarConteudo();
    } catch (falha) {
      avisar('Parte do conteúdo não pôde ser exibida.', [
        'Recarregue a página. Se continuar, avise o escritório.'
      ]);
    }
    return Promise.resolve();
  }

  /** Escreve em um elemento só se ele existir — protege contra HTML de outra versão. */
  function definirTexto(seletor, texto) {
    var alvo = $(seletor);
    if (alvo) alvo.textContent = texto;
    return alvo;
  }

  function definirHtml(seletor, html) {
    var alvo = $(seletor);
    if (alvo) alvo.innerHTML = html;
    return alvo;
  }

  function paragrafosPara(elemento, lista) {
    if (!elemento) return;
    elemento.innerHTML = lista
      .map(function (texto) { return '<p>' + texto + '</p>'; })
      .join('');
  }

  function caixaAceite(id, rotulo) {
    return (
      '<label class="aceite__rotulo">' +
      '<input type="checkbox" id="' + id + '">' +
      '<span>' + rotulo + '</span>' +
      '</label>'
    );
  }

  function renderizarConteudo() {
    // Etapa 3 — contexto
    paragrafosPara($('#contextoParagrafos'), conteudo.contexto.paragrafos);
    $('.etapa[data-etapa="3"] .etapa__titulo').textContent = conteudo.contexto.titulo;

    $('#baseLegalTitulo').textContent = conteudo.baseLegal.titulo;
    $('#baseLegalItens').innerHTML = conteudo.baseLegal.itens
      .map(function (item) {
        return '<dt>' + item.norma + '</dt><dd>' + item.descricao + '</dd>';
      })
      .join('');

    $('#decisaoChamada').innerHTML = '<p>' + conteudo.decisao.chamada + '</p>';

    $('#alternativas').innerHTML = conteudo.decisao.opcoes
      .map(function (opcao) {
        return (
          '<article class="alternativa">' +
          '<p class="alternativa__letra">Opção ' + opcao.letra + '</p>' +
          '<h3 class="alternativa__titulo">' + opcao.titulo + '</h3>' +
          '<p class="alternativa__texto">' + opcao.explicativo + '</p>' +
          '</article>'
        );
      })
      .join('');

    $('#prazoRotulo').textContent = conteudo.prazos.formalizacao.rotulo;
    $('#prazoObservacao').textContent = conteudo.prazos.formalizacao.observacao;

    $('#reconsideracaoTitulo').textContent = conteudo.reconsideracaoTexto.titulo;
    if (conteudo.prazos.reconsideracao.possuiPrazoDefinido) {
      var alvoData = $('#reconsideracaoData');
      alvoData.textContent =
        conteudo.prazos.reconsideracao.rotulo +
        ' (' + conteudo.prazos.reconsideracao.fundamento + ').';
      alvoData.hidden = false;
    }
    paragrafosPara($('#reconsideracaoParagrafos'), conteudo.reconsideracaoTexto.paragrafos);
    if (conteudo.reconsideracaoTexto.aviso) {
      var alvoAviso = definirTexto('#reconsideracaoAviso', conteudo.reconsideracaoTexto.aviso);
      if (alvoAviso) alvoAviso.hidden = false;
    }

    $('#alertaTitulo').textContent = conteudo.alerta.titulo;
    paragrafosPara($('#alertaParagrafos'), conteudo.alerta.paragrafos);
    $('#aceiteContexto').innerHTML = caixaAceite('chkContexto', conteudo.alerta.checkbox);

    // Etapa 4 — ciência
    $('.etapa[data-etapa="4"] .etapa__titulo').textContent = conteudo.ciencia.titulo;
    $('#cienciaItens').innerHTML = conteudo.ciencia.itens
      .map(function (item) {
        return (
          '<div class="ciencia-item">' +
          '<p class="ciencia-item__declaracao">' + item.declaracao + '</p>' +
          '<div class="aceite">' + caixaAceite('chk_' + item.id, item.checkbox) + '</div>' +
          '</div>'
        );
      })
      .join('');

    // Etapa 5 — decisão
    $('.etapa[data-etapa="5"] .etapa__titulo').textContent = conteudo.formalizacao.titulo;
    $('#formalizacaoChamada').innerHTML = '<p>' + conteudo.formalizacao.chamada + '</p>';
    $('#opcoesDecisao').insertAdjacentHTML(
      'beforeend',
      conteudo.decisao.opcoes
        .map(function (opcao) {
          return (
            '<label class="opcao">' +
            '<span class="opcao__cabeca">' +
            '<input type="radio" name="decisao" value="' + opcao.id + '">' +
            '<span class="opcao__titulo">' + opcao.titulo + '</span>' +
            '</span>' +
            '<span class="opcao__texto">' + opcao.manifestacao + '</span>' +
            '</label>'
          );
        })
        .join('')
    );
    $('#decisaoAtencao').textContent = conteudo.decisao.atencao;

    // Etapa 6 — declaração
    $('.etapa[data-etapa="6"] .etapa__titulo').textContent = conteudo.declaracaoFinal.titulo;
    paragrafosPara($('#declaracaoParagrafos'), conteudo.declaracaoFinal.paragrafos);
    $('#aceiteDeclaracao').innerHTML = caixaAceite(
      'chkDeclaracao',
      conteudo.declaracaoFinal.checkbox
    );
    $('#privacidadeAviso').textContent = conteudo.privacidade.aviso;
    $('#aceitePrivacidade').innerHTML = caixaAceite(
      'chkPrivacidade',
      conteudo.privacidade.checkboxRotulo
    );
  }

  /* ---------------------------------------------------------------- */
  /* Trilha de etapas                                                  */
  /* ---------------------------------------------------------------- */

  function montarTrilha() {
    $('#trilha').innerHTML = ROTULOS_TRILHA.map(function (rotulo, indice) {
      return (
        '<li class="trilha__item" data-passo="' + (indice + 1) + '">' +
        '<span class="trilha__num">' + (indice + 1) + '</span>' +
        '<span>' + rotulo + '</span>' +
        '</li>'
      );
    }).join('');
  }

  function atualizarTrilha() {
    $$('.trilha__item').forEach(function (item) {
      var passo = Number(item.dataset.passo);
      var estado = passo === etapaAtual ? 'atual' : passo < etapaAtual ? 'concluida' : 'pendente';
      item.dataset.estado = estado;
      if (estado === 'atual') item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });

    var concluido = Math.min(etapaAtual - 1, TOTAL_ETAPAS);
    $('#progresso').style.width = (concluido / TOTAL_ETAPAS) * 100 + '%';

    var lista = $('#trilha');
    var atual = document.querySelector('.trilha__item[data-estado="atual"]');
    // Só rola quando a trilha não cabe inteira — em telas largas, rolar
    // esconderia as primeiras etapas sem necessidade.
    if (atual && atual.scrollIntoView && lista.scrollWidth > lista.clientWidth + 4) {
      atual.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }

  function irPara(etapa) {
    etapaAtual = etapa;
    $$('.etapa').forEach(function (secao) {
      var numero = Number(secao.dataset.etapa);
      secao.hidden = numero !== etapa;
      if (numero === etapa) {
        secao.dataset.entrando = '1';
        setTimeout(function () { delete secao.dataset.entrando; }, 260);
      }
    });

    if (etapa <= TOTAL_ETAPAS) atualizarTrilha();
    else {
      $('#progresso').style.width = '100%';
      $$('.trilha__item').forEach(function (item) { item.dataset.estado = 'concluida'; });
    }

    if (etapa === TOTAL_ETAPAS) montarRevisao();
    if (etapa === 7) prepararAssinatura();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    var titulo = document.querySelector('.etapa[data-etapa="' + etapa + '"] .etapa__titulo');
    if (titulo) {
      titulo.setAttribute('tabindex', '-1');
      titulo.focus({ preventScroll: true });
    }
  }

  /* ---------------------------------------------------------------- */
  /* Validação por etapa                                               */
  /* ---------------------------------------------------------------- */

  function validarEtapa(etapa) {
    limparErros(etapa);
    var erros = [];

    if (etapa === 1) {
      if (valorDe('razaoSocial').length < 3) {
        mostrarErro('razaoSocial', 'Informe a razão social da empresa.');
        marcarInvalido('razaoSocial');
        erros.push('Razão social');
      }
      if (!validarCNPJ(valorDe('cnpj'))) {
        mostrarErro('cnpj', 'CNPJ inválido. Confira os números digitados.');
        marcarInvalido('cnpj');
        erros.push('CNPJ');
      }
      if (!validarEmail(valorDe('emailEmpresa'))) {
        mostrarErro('emailEmpresa', 'Informe um e-mail válido.');
        marcarInvalido('emailEmpresa');
        erros.push('E-mail da empresa');
      }
    }

    if (etapa === 2) {
      var nome = valorDe('nomeResponsavel');
      if (nome.length < 5 || nome.indexOf(' ') === -1) {
        mostrarErro('nomeResponsavel', 'Informe o nome completo (nome e sobrenome).');
        marcarInvalido('nomeResponsavel');
        erros.push('Nome do responsável');
      }
      if (!validarCPF(valorDe('cpf'))) {
        mostrarErro('cpf', 'CPF inválido. Confira os números digitados.');
        marcarInvalido('cpf');
        erros.push('CPF');
      }
      if (valorDe('cargo').length < 2) {
        mostrarErro('cargo', 'Informe o cargo ou função.');
        marcarInvalido('cargo');
        erros.push('Cargo');
      }
      if (!validarEmail(valorDe('emailResponsavel'))) {
        mostrarErro('emailResponsavel', 'Informe um e-mail válido.');
        marcarInvalido('emailResponsavel');
        erros.push('E-mail do responsável');
      }
      // O telefone é o canal de contato do escritório durante a campanha.
      if (digitos(valorDe('telefoneResponsavel')).length < 10) {
        mostrarErro('telefoneResponsavel', 'Informe um telefone com DDD.');
        marcarInvalido('telefoneResponsavel');
        erros.push('Telefone do responsável');
      }
    }

    if (etapa === 3 && !$('#chkContexto').checked) {
      mostrarErro('aceiteContexto', 'Confirme a ciência do contexto e dos prazos para continuar.');
      erros.push('Ciência do contexto');
    }

    if (etapa === 4) {
      var faltando = idsCiencia.filter(function (id) {
        return !document.getElementById('chk_' + id).checked;
      });
      if (faltando.length) {
        mostrarErro('ciencia', 'Confirme todos os itens do termo de ciência para continuar.');
        erros.push('Termo de ciência');
      }
    }

    if (etapa === 5 && !document.querySelector('input[name="decisao"]:checked')) {
      mostrarErro('decisao', 'Selecione uma das opções para formalizar a decisão.');
      erros.push('Decisão');
    }

    if (etapa === 6) {
      if (!$('#chkDeclaracao').checked) {
        mostrarErro('aceiteDeclaracao', 'É necessário concordar com a declaração para continuar.');
        erros.push('Declaração final');
      }
      if (!$('#chkPrivacidade').checked) {
        mostrarErro('aceitePrivacidade', 'Confirme a ciência sobre o tratamento de dados.');
        erros.push('Tratamento de dados');
      }
    }

    if (etapa === 7) {
      if (valorDe('assinaturaNome').length < 5) {
        mostrarErro('assinaturaNome', 'Informe o nome completo.');
        marcarInvalido('assinaturaNome');
        erros.push('Nome da assinatura');
      }
      if (!validarCPF(valorDe('assinaturaCpf'))) {
        mostrarErro('assinaturaCpf', 'CPF inválido.');
        marcarInvalido('assinaturaCpf');
        erros.push('CPF da assinatura');
      }
      if (!assinatura.temTraco()) {
        mostrarErro('assinatura', 'A assinatura é obrigatória. Assine no campo acima.');
        erros.push('Assinatura');
      }
    }

    if (erros.length) {
      avisar('Verifique os campos destacados antes de continuar.');
      var primeiro = document.querySelector(
        '.etapa[data-etapa="' + etapa + '"] [aria-invalid="true"]'
      );
      if (primeiro) primeiro.focus();
    }

    return erros.length === 0;
  }

  /* ---------------------------------------------------------------- */
  /* Assinatura em canvas                                              */
  /* ---------------------------------------------------------------- */

  var assinatura = (function () {
    var canvas = null;
    var ctx = null;
    var papel = null;
    var tracos = [];      // [[{x,y}, ...], ...] em coordenadas CSS
    var atual = null;
    var desenhando = false;
    var comprimento = 0;
    var preparado = false;

    function dimensionar() {
      var proporcao = window.devicePixelRatio || 1;
      var caixa = canvas.getBoundingClientRect();
      canvas.width = Math.round(caixa.width * proporcao);
      canvas.height = Math.round(caixa.height * proporcao);
      ctx.setTransform(proporcao, 0, 0, proporcao, 0, 0);
      redesenhar();
    }

    function estiloTraco() {
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#101433';
    }

    function redesenhar() {
      var caixa = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, caixa.width, caixa.height);
      estiloTraco();
      tracos.forEach(function (traco) {
        if (traco.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(traco[0].x, traco[0].y);
        for (var i = 1; i < traco.length; i += 1) ctx.lineTo(traco[i].x, traco[i].y);
        ctx.stroke();
      });
    }

    function posicao(evento) {
      var caixa = canvas.getBoundingClientRect();
      return { x: evento.clientX - caixa.left, y: evento.clientY - caixa.top };
    }

    function iniciarTraco(evento) {
      evento.preventDefault();
      desenhando = true;
      canvas.setPointerCapture(evento.pointerId);
      atual = [posicao(evento)];
      tracos.push(atual);
      papel.dataset.assinado = 'sim';
    }

    function continuarTraco(evento) {
      if (!desenhando) return;
      evento.preventDefault();
      var ponto = posicao(evento);
      var anterior = atual[atual.length - 1];
      comprimento += Math.hypot(ponto.x - anterior.x, ponto.y - anterior.y);
      atual.push(ponto);

      estiloTraco();
      ctx.beginPath();
      ctx.moveTo(anterior.x, anterior.y);
      ctx.lineTo(ponto.x, ponto.y);
      ctx.stroke();

      mostrarErro('assinatura', '');
    }

    function encerrarTraco(evento) {
      if (!desenhando) return;
      desenhando = false;
      if (evento && evento.pointerId !== undefined) {
        try { canvas.releasePointerCapture(evento.pointerId); } catch (e) { /* ignora */ }
      }
    }

    function preparar() {
      if (preparado) {
        dimensionar();
        return;
      }
      canvas = document.getElementById('canvasAssinatura');
      papel = canvas.parentElement;
      ctx = canvas.getContext('2d');

      canvas.addEventListener('pointerdown', iniciarTraco);
      canvas.addEventListener('pointermove', continuarTraco);
      canvas.addEventListener('pointerup', encerrarTraco);
      canvas.addEventListener('pointercancel', encerrarTraco);
      canvas.addEventListener('pointerleave', encerrarTraco);

      window.addEventListener('resize', function () {
        clearTimeout(canvas.dataset.tempo);
        canvas.dataset.tempo = setTimeout(dimensionar, 150);
      });

      preparado = true;
      dimensionar();
    }

    function limpar() {
      tracos = [];
      comprimento = 0;
      papel.dataset.assinado = 'nao';
      redesenhar();
    }

    /** Considera assinado quando há traço com extensão mínima razoável. */
    function temTraco() {
      return comprimento > 120 && tracos.length > 0;
    }

    /**
     * Exporta a assinatura recortada no seu conteúdo, com margem, em PNG
     * de fundo transparente e resolução alta o bastante para o PDF.
     */
    function exportar() {
      if (!temTraco()) return null;

      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      tracos.forEach(function (traco) {
        traco.forEach(function (ponto) {
          if (ponto.x < minX) minX = ponto.x;
          if (ponto.y < minY) minY = ponto.y;
          if (ponto.x > maxX) maxX = ponto.x;
          if (ponto.y > maxY) maxY = ponto.y;
        });
      });

      var margem = 14;
      minX -= margem; minY -= margem;
      maxX += margem; maxY += margem;

      var largura = Math.max(maxX - minX, 40);
      var altura = Math.max(maxY - minY, 24);

      // Escala para largura final de ~900px (nitidez no PDF impresso).
      var escala = Math.min(4, Math.max(2, 900 / largura));

      var saida = document.createElement('canvas');
      saida.width = Math.round(largura * escala);
      saida.height = Math.round(altura * escala);

      var saidaCtx = saida.getContext('2d');
      saidaCtx.scale(escala, escala);
      saidaCtx.translate(-minX, -minY);
      saidaCtx.lineWidth = 2.1;
      saidaCtx.lineCap = 'round';
      saidaCtx.lineJoin = 'round';
      saidaCtx.strokeStyle = '#101433';

      tracos.forEach(function (traco) {
        if (traco.length < 2) return;
        saidaCtx.beginPath();
        saidaCtx.moveTo(traco[0].x, traco[0].y);
        for (var i = 1; i < traco.length; i += 1) saidaCtx.lineTo(traco[i].x, traco[i].y);
        saidaCtx.stroke();
      });

      return saida.toDataURL('image/png');
    }

    return {
      preparar: preparar,
      limpar: limpar,
      temTraco: temTraco,
      exportar: exportar
    };
  })();

  function prepararAssinatura() {
    assinatura.preparar();
    var campoNome = $('#assinaturaNome');
    var campoCpf = $('#assinaturaCpf');
    if (!campoNome.value) campoNome.value = valorDe('nomeResponsavel');
    if (!campoCpf.value) campoCpf.value = mascaraCPF(valorDe('cpf'));
    $('#assinaturaData').value = dataBR();
  }

  /* ---------------------------------------------------------------- */
  /* Revisão                                                           */
  /* ---------------------------------------------------------------- */

  function linhaRevisao(rotulo, valor) {
    if (!valor) return '';
    return (
      '<div class="revisao__linha">' +
      '<span class="revisao__rotulo">' + rotulo + '</span>' +
      '<span class="revisao__valor">' + valor + '</span>' +
      '</div>'
    );
  }

  function opcaoEscolhida() {
    var selecionado = document.querySelector('input[name="decisao"]:checked');
    if (!selecionado) return null;
    return conteudo.decisao.opcoes.filter(function (opcao) {
      return opcao.id === selecionado.value;
    })[0];
  }

  function montarRevisao() {
    try {
      montarRevisaoInterna();
    } catch (falha) {
      $('#revisao').innerHTML =
        '<div class="revisao__bloco"><p class="revisao__decisao-texto">' +
        'Não foi possível montar o resumo. Volte às etapas anteriores e confira os dados.' +
        '</p></div>';
    }
  }

  function montarRevisaoInterna() {
    var opcao = opcaoEscolhida();
    var itensCiencia = conteudo.ciencia.itens.map(function (item) {
      return '<li>' + item.checkbox + '</li>';
    });
    itensCiencia.push('<li>' + conteudo.alerta.checkbox + '</li>');
    itensCiencia.push('<li>' + conteudo.declaracaoFinal.checkbox + '</li>');
    itensCiencia.push('<li>' + conteudo.privacidade.checkboxRotulo + '</li>');

    var imagem = assinatura.exportar();

    $('#revisao').innerHTML =
      '<div class="revisao__bloco">' +
      '<h2 class="revisao__titulo">Empresa</h2>' +
      linhaRevisao('Razão social', valorDe('razaoSocial')) +
      linhaRevisao('Nome fantasia', valorDe('nomeFantasia')) +
      linhaRevisao('CNPJ', mascaraCNPJ(valorDe('cnpj'))) +
      linhaRevisao('E-mail', valorDe('emailEmpresa')) +
      linhaRevisao('Telefone', valorDe('telefoneEmpresa')) +
      '</div>' +

      '<div class="revisao__bloco">' +
      '<h2 class="revisao__titulo">Responsável</h2>' +
      linhaRevisao('Nome', valorDe('nomeResponsavel')) +
      linhaRevisao('CPF', mascaraCPF(valorDe('cpf'))) +
      linhaRevisao('Cargo / função', valorDe('cargo')) +
      linhaRevisao('E-mail', valorDe('emailResponsavel')) +
      linhaRevisao('Telefone', valorDe('telefoneResponsavel')) +
      '</div>' +

      '<div class="revisao__bloco revisao__bloco--decisao">' +
      '<h2 class="revisao__titulo">Decisão</h2>' +
      '<p class="revisao__decisao">' + (opcao ? opcao.titulo : '—') + '</p>' +
      '<p class="revisao__decisao-texto">' + (opcao ? opcao.manifestacao : '') + '</p>' +
      '</div>' +

      '<div class="revisao__bloco">' +
      '<h2 class="revisao__titulo">Ciência e declarações confirmadas</h2>' +
      '<ul class="revisao__itens">' + itensCiencia.join('') + '</ul>' +
      '</div>' +

      '<div class="revisao__bloco">' +
      '<h2 class="revisao__titulo">Assinatura</h2>' +
      (imagem
        ? '<div class="revisao__assinatura"><img src="' + imagem + '" alt="Assinatura capturada"></div>'
        : '<p class="revisao__decisao-texto">Assinatura não capturada.</p>') +
      linhaRevisao('Assinado por', valorDe('assinaturaNome')) +
      linhaRevisao('CPF', mascaraCPF(valorDe('assinaturaCpf'))) +
      linhaRevisao('Data', valorDe('assinaturaData')) +
      '</div>';
  }

  /* ---------------------------------------------------------------- */
  /* Envio                                                             */
  /* ---------------------------------------------------------------- */

  function montarPayload() {
    function marcado(id) {
      var campo = document.getElementById(id);
      return !!(campo && campo.checked);
    }

    var aceites = { contexto: marcado('chkContexto') };
    idsCiencia.forEach(function (id) {
      aceites[id] = marcado('chk_' + id);
    });
    aceites.declaracaoFinal = marcado('chkDeclaracao');
    aceites.privacidade = marcado('chkPrivacidade');

    var opcao = opcaoEscolhida();

    return {
      empresa: {
        razaoSocial: valorDe('razaoSocial'),
        nomeFantasia: valorDe('nomeFantasia'),
        cnpj: digitos(valorDe('cnpj')),
        email: valorDe('emailEmpresa'),
        telefone: valorDe('telefoneEmpresa')
      },
      responsavel: {
        nome: valorDe('nomeResponsavel'),
        cpf: digitos(valorDe('cpf')),
        cargo: valorDe('cargo'),
        email: valorDe('emailResponsavel'),
        telefone: valorDe('telefoneResponsavel')
      },
      decisao: opcao ? opcao.id : '',
      aceites: aceites,
      assinatura: {
        nome: valorDe('assinaturaNome'),
        cpf: digitos(valorDe('assinaturaCpf')),
        data: valorDe('assinaturaData'),
        imagem: assinatura.exportar()
      },
      versaoConteudo: conteudo.versaoConteudo
    };
  }

  /* ---------------------------------------------------------------- */
  /* Finalização: protocolo, PDF e envio ao escritório                 */
  /* ---------------------------------------------------------------- */

  var resultadoAtual = null; // guarda o PDF gerado, para o botão de download

  /**
   * Protocolo no formato EMP-IBSCBS-AAAA-DDDNNN.
   * DDD é o dia do ano (001 a 366) e NNN um sufixo aleatório, o que deixa o
   * número ordenável por data e praticamente sem risco de repetição. O
   * controle definitivo é a planilha do escritório, que numera cada linha.
   */
  function gerarProtocolo(agora) {
    var inicioAno = new Date(agora.getFullYear(), 0, 0);
    var diaDoAno = Math.floor((agora - inicioAno) / 86400000);
    var sufixo = Math.floor(Math.random() * 1000);
    return (
      (conteudo.documento.prefixoProtocolo || 'EMP-IBSCBS') +
      '-' + agora.getFullYear() +
      '-' + String(diaDoAno).padStart(3, '0') + String(sufixo).padStart(3, '0')
    );
  }

  /** Código de verificação do documento (SHA-256 quando disponível). */
  function gerarCodigoVerificacao(base) {
    function formatar(hex) {
      return hex.slice(0, 32).toUpperCase().replace(/(.{8})(?=.)/g, '$1-');
    }

    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      return window.crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(base))
        .then(function (buffer) {
          var hex = Array.prototype.map
            .call(new Uint8Array(buffer), function (b) {
              return b.toString(16).padStart(2, '0');
            })
            .join('');
          return formatar(hex);
        });
    }

    // Sem contexto seguro (arquivo aberto direto do disco): hash simples.
    var h1 = 0x811c9dc5;
    var h2 = 0x1000193;
    for (var i = 0; i < base.length; i += 1) {
      h1 = ((h1 ^ base.charCodeAt(i)) * 16777619) >>> 0;
      h2 = ((h2 + base.charCodeAt(i) * (i + 7)) * 2654435761) >>> 0;
    }
    var texto = (h1.toString(16) + h2.toString(16)).padStart(16, '0').repeat(2);
    return Promise.resolve(formatar(texto));
  }

  /** Proporção da assinatura, para o PDF não distorcer o traço. */
  function proporcaoAssinatura(dataUrl) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img.width / img.height); };
      img.onerror = function () { resolve(3.2); };
      img.src = dataUrl;
    });
  }

  /** Monta o registro que alimenta o PDF, o e-mail e a planilha. */
  function montarRegistro(dados, opcao, protocolo, agora, codigo, proporcao) {
    return {
      protocolo: protocolo,
      dataHoraISO: agora.toISOString(),
      dataHoraTexto: dataHoraBR(agora.toISOString()),
      codigoVerificacao: codigo,
      versaoConteudo: conteudo.versaoConteudo,
      empresa: {
        razaoSocial: dados.empresa.razaoSocial,
        nomeFantasia: dados.empresa.nomeFantasia,
        cnpj: mascaraCNPJ(dados.empresa.cnpj),
        cnpjNumeros: dados.empresa.cnpj,
        email: dados.empresa.email,
        telefone: dados.empresa.telefone
      },
      responsavel: {
        nome: dados.responsavel.nome,
        cpf: mascaraCPF(dados.responsavel.cpf),
        cargo: dados.responsavel.cargo,
        email: dados.responsavel.email,
        telefone: dados.responsavel.telefone
      },
      decisao: {
        id: opcao.id,
        titulo: opcao.titulo,
        manifestacao: opcao.manifestacao
      },
      aceites: dados.aceites,
      assinatura: {
        nome: dados.assinatura.nome,
        cpf: mascaraCPF(dados.assinatura.cpf),
        imagem: dados.assinatura.imagem,
        proporcao: proporcao
      }
    };
  }

  /**
   * Envia o termo ao escritório.
   *
   * O corpo vai como text/plain de propósito: assim o navegador trata a
   * requisição como simples e não dispara a verificação prévia (preflight),
   * que o Google Apps Script não responde. O Apps Script lê o conteúdo bruto
   * e faz o JSON.parse do outro lado.
   */
  function enviarAoEscritorio(registro, pdf) {
    var endereco = (window.CONFIG && window.CONFIG.ENDPOINT) || '';

    if (!endereco) {
      return Promise.resolve({ status: 'sem-endereco' });
    }

    var corpo = JSON.stringify({
      protocolo: registro.protocolo,
      dataHoraISO: registro.dataHoraISO,
      dataHoraTexto: registro.dataHoraTexto,
      codigoVerificacao: registro.codigoVerificacao,
      versaoConteudo: registro.versaoConteudo,
      empresa: registro.empresa,
      responsavel: registro.responsavel,
      decisao: registro.decisao,
      aceites: registro.aceites,
      origem: window.location.href,
      navegador: navigator.userAgent.slice(0, 200),
      arquivo: { nome: pdf.nomeArquivo, base64: pdf.base64 }
    });

    // Duas salvaguardas aprendidas na prática:
    //   1) tempo limite — sem ele, uma resposta que nunca chega deixa o
    //      cliente preso na tela "gerando o termo";
    //   2) segunda tentativa em modo no-cors — se o navegador bloquear a
    //      leitura da resposta, o envio em si ainda acontece; o termo chega
    //      ao escritório mesmo sem confirmação de volta.
    var LIMITE_MS = 20000;

    function comTempoLimite(promessa, controlador) {
      return new Promise(function (resolve, reject) {
        var relogio = setTimeout(function () {
          if (controlador) controlador.abort();
          reject(new Error('tempo-esgotado'));
        }, LIMITE_MS);

        promessa.then(
          function (valor) { clearTimeout(relogio); resolve(valor); },
          function (erro) { clearTimeout(relogio); reject(erro); }
        );
      });
    }

    function tentativaCega() {
      // Sem leitura de resposta: serve para garantir a entrega quando a
      // tentativa normal esbarra em bloqueio do navegador.
      return fetch(endereco, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: corpo
      })
        .then(function () {
          return { status: 'enviado-sem-confirmacao' };
        })
        .catch(function (erro) {
          return { status: 'falhou', detalhe: erro.message };
        });
    }

    var controlador = window.AbortController ? new AbortController() : null;

    var tentativa = fetch(endereco, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: corpo,
      signal: controlador ? controlador.signal : undefined
    })
      .then(function (resposta) {
        return resposta.json().catch(function () { return { ok: true }; });
      })
      .then(function (retorno) {
        if (retorno && retorno.ok === false) {
          return { status: 'falhou', detalhe: retorno.erro || 'Erro no destino.' };
        }
        return { status: 'enviado', registro: retorno };
      });

    return comTempoLimite(tentativa, controlador).catch(function () {
      return tentativaCega();
    });
  }

  function enviar() {
    if (enviando) return;

    // Revalida tudo antes de gerar o documento.
    for (var etapa = 1; etapa <= 7; etapa += 1) {
      if (!validarEtapa(etapa)) {
        irPara(etapa);
        return;
      }
    }

    enviando = true;
    $('#modal').hidden = true;
    $('#processando').hidden = false;
    $('#btnConfirmar').disabled = true;

    var agora = new Date();
    var dados, opcao, protocolo;

    // Falha aqui não pode deixar o cliente preso na tela de processamento.
    try {
      dados = montarPayload();
      opcao = opcaoEscolhida();
      protocolo = gerarProtocolo(agora);
    } catch (falha) {
      enviando = false;
      $('#processando').hidden = true;
      $('#btnConfirmar').disabled = false;
      avisar('Não foi possível montar o termo.', [
        'Recarregue a página e tente novamente. Se persistir, avise o escritório.'
      ]);
      return;
    }

    var baseCodigo = [
      protocolo,
      agora.toISOString(),
      dados.empresa.cnpj,
      dados.responsavel.cpf,
      opcao.id
    ].join('|');

    Promise.all([
      gerarCodigoVerificacao(baseCodigo),
      proporcaoAssinatura(dados.assinatura.imagem)
    ])
      .then(function (valores) {
        var registro = montarRegistro(dados, opcao, protocolo, agora, valores[0], valores[1]);
        var pdf = window.TermoPDF.gerarTermo(registro, conteudo);
        resultadoAtual = { registro: registro, pdf: pdf };

        if (window.CONFIG && window.CONFIG.MODO_DEMO) {
          return { status: 'demo', registro: registro, pdf: pdf };
        }

        return enviarAoEscritorio(registro, pdf).then(function (envio) {
          return { status: envio.status, detalhe: envio.detalhe, registro: registro, pdf: pdf };
        });
      })
      .then(function (resultado) {
        mostrarSucesso(resultado);
      })
      .catch(function (falha) {
        avisar('Não foi possível gerar o termo.', [
          falha.message || 'Tente novamente ou entre em contato com o escritório.'
        ]);
      })
      .finally(function () {
        enviando = false;
        $('#processando').hidden = true;
        $('#btnConfirmar').disabled = false;
      });
  }

  function baixarPdf() {
    if (!resultadoAtual) return;
    var url = URL.createObjectURL(resultadoAtual.pdf.blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = resultadoAtual.pdf.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function mostrarSucesso(resultado) {
    var registro = resultado.registro;

    $('#comprovante').innerHTML =
      '<dt>Empresa</dt><dd>' + registro.empresa.razaoSocial + '</dd>' +
      '<dt>CNPJ</dt><dd>' + registro.empresa.cnpj + '</dd>' +
      '<dt>Protocolo</dt><dd class="protocolo">' + registro.protocolo + '</dd>' +
      '<dt>Data e hora</dt><dd>' + registro.dataHoraTexto + '</dd>' +
      '<dt>Decisão registrada</dt><dd>' + registro.decisao.titulo + '</dd>' +
      '<dt>Código de verificação</dt><dd>' + registro.codigoVerificacao + '</dd>';

    var aviso = $('#avisoEmail');
    aviso.hidden = false;
    aviso.classList.remove('aviso-email--erro');

    if (resultado.status === 'demo') {
      aviso.textContent =
        'Modo demonstração: o termo foi gerado, mas nada foi enviado ao escritório. ' +
        'Desative o modo demonstração no arquivo assets/conteudo.js antes de divulgar o link.';
    } else if (resultado.status === 'enviado') {
      aviso.textContent =
        'O termo foi enviado à Empresarial Assessoria Contábil. Guarde o número do protocolo; ' +
        'baixe também uma via em PDF para os seus arquivos.';
    } else if (resultado.status === 'enviado-sem-confirmacao') {
      aviso.textContent =
        'O termo foi enviado à Empresarial Assessoria Contábil. Guarde o número do protocolo e ' +
        'baixe uma via em PDF; se o escritório não confirmar o recebimento, encaminhe o arquivo ' +
        'por e-mail informando o protocolo.';
    } else {
      aviso.classList.add('aviso-email--erro');
      aviso.textContent =
        'O termo foi gerado, mas o envio automático não se completou. Baixe o PDF no botão ' +
        'abaixo e encaminhe para ' +
        ((window.CONFIG && window.CONFIG.EMAIL_ESCRITORIO) || 'o escritório') +
        ', informando o protocolo.';
    }

    var mensagem = $('#mensagemSucesso');
    if (mensagem && resultado.status === 'enviado') {
      mensagem.textContent =
        'Sua manifestação foi registrada e encaminhada para a Empresarial Assessoria Contábil.';
    }

    irPara(9);
  }


  /* ---------------------------------------------------------------- */
  /* Ligações de interface                                             */
  /* ---------------------------------------------------------------- */

  function ligarMascaras() {
    function aplicar(id, funcao) {
      var campo = document.getElementById(id);
      campo.addEventListener('input', function () {
        var posicaoFim = campo.selectionStart === campo.value.length;
        campo.value = funcao(campo.value);
        if (posicaoFim) campo.setSelectionRange(campo.value.length, campo.value.length);
      });
    }
    aplicar('cnpj', mascaraCNPJ);
    aplicar('cpf', mascaraCPF);
    aplicar('assinaturaCpf', mascaraCPF);
    aplicar('telefoneEmpresa', mascaraTelefone);
    aplicar('telefoneResponsavel', mascaraTelefone);
  }

  function ligarEventos() {
    $$('[data-avancar]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        var etapa = Number(botao.closest('.etapa').dataset.etapa);
        if (validarEtapa(etapa)) irPara(etapa + 1);
      });
    });

    $$('[data-voltar]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        var etapa = Number(botao.closest('.etapa').dataset.etapa);
        irPara(Math.max(1, etapa - 1));
      });
    });

    // Limpa a mensagem de erro assim que o cliente corrige o campo.
    document.addEventListener('input', function (evento) {
      var campo = evento.target;
      if (campo.id) mostrarErro(campo.id, '');
      campo.removeAttribute('aria-invalid');
    });

    document.addEventListener('change', function (evento) {
      if (evento.target.type === 'checkbox' || evento.target.type === 'radio') {
        limparErros(etapaAtual);
      }
    });

    $('#limparAssinatura').addEventListener('click', function () {
      assinatura.limpar();
      mostrarErro('assinatura', '');
    });

    $('#btnConfirmar').addEventListener('click', function () {
      if (!validarEtapa(7)) { irPara(7); return; }
      var opcao = opcaoEscolhida();
      $('#modalDecisao').textContent = opcao ? opcao.titulo : '';
      $('#modal').hidden = false;
      $('#modalConfirmar').focus();
    });

    $('#modalVoltar').addEventListener('click', function () {
      $('#modal').hidden = true;
      $('#btnConfirmar').focus();
    });

    $('#modalConfirmar').addEventListener('click', enviar);

    document.addEventListener('keydown', function (evento) {
      if (evento.key === 'Escape' && !$('#modal').hidden) {
        $('#modal').hidden = true;
      }
    });

    $('#baixarPdf').addEventListener('click', baixarPdf);

    $('#btnFinalizar').addEventListener('click', function () {
      window.location.reload();
    });

    // Impede saída acidental com dados preenchidos e não formalizados.
    window.addEventListener('beforeunload', function (evento) {
      if (etapaAtual > 1 && etapaAtual <= TOTAL_ETAPAS && !enviando) {
        evento.preventDefault();
        evento.returnValue = '';
      }
    });
  }

  /* ---------------------------------------------------------------- */

  /** Converte o logotipo em base64 para o jsPDF conseguir desenhá-lo. */
  function prepararLogo() {
    return fetch('assets/logo-pdf.png')
      .then(function (resposta) { return resposta.blob(); })
      .then(function (blob) {
        return new Promise(function (resolve) {
          var leitor = new FileReader();
          leitor.onload = function () {
            window.LOGO_PDF_BASE64 = leitor.result;
            resolve();
          };
          leitor.onerror = function () { resolve(); };
          leitor.readAsDataURL(blob);
        });
      })
      .catch(function () { /* sem logo o PDF sai com o nome do escritório */ });
  }

  function iniciar() {
    if (window.CONFIG && window.CONFIG.MODO_DEMO) {
      var faixa = document.getElementById('faixaDemo');
      if (faixa) faixa.hidden = false;
    }
    prepararLogo();
    montarTrilha();
    ligarMascaras();
    ligarEventos();
    $('#assinaturaData').value = dataBR();

    carregarConteudo()
      .then(function () { irPara(1); })
      .catch(function () {
        avisar('Não foi possível carregar o formulário.', [
          'Recarregue a página. Se o problema continuar, entre em contato com o escritório.'
        ]);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  // Exposto apenas para os testes manuais descritos no README.
  window.__termo = { formatarDataISO: formatarDataISO };
})();
