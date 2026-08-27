(function () {
  var ROOT = window.TR_ROOT || '';

  var HTML = ''
    + '<button id="tr-chat-toggle" aria-label="Ouvrir le chat" style="position:fixed;bottom:22px;right:22px;width:58px;height:58px;border-radius:50%;background:#405035;color:#F6EEE0;border:none;box-shadow:0 6px 18px rgba(29,34,24,.28);font-size:24px;cursor:pointer;z-index:60;display:flex;align-items:center;justify-content:center;transition:transform .2s ease">💬</button>'
    + '<div id="tr-chat-window" style="display:none;position:fixed;bottom:90px;right:22px;width:min(360px,92vw);height:min(520px,72vh);background:#F6EEE0;border:1px solid #E0D7C4;border-radius:14px;box-shadow:0 16px 40px rgba(29,34,24,.28);z-index:60;flex-direction:column;overflow:hidden;font-family:\'Work Sans\',system-ui,sans-serif">'
    +   '<div style="background:#405035;color:#F6EEE0;padding:14px 16px;display:flex;align-items:center;gap:10px">'
    +     '<div style="width:34px;height:34px;border-radius:50%;background:rgba(246,238,224,.16);display:flex;align-items:center;justify-content:center;font-size:16px">✦</div>'
    +     '<div style="flex:1"><div style="font-family:\'Libre Caslon Display\',serif;font-size:15px">Assistante TR Réflexologie</div><div style="font-size:11px;color:#C9CBB6">Répond à vos questions, prend RDV</div></div>'
    +     '<button id="tr-chat-close" aria-label="Fermer" style="background:none;border:none;color:#F6EEE0;font-size:20px;cursor:pointer;padding:4px">×</button>'
    +   '</div>'
    +   '<div id="tr-chat-messages" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#FDFBF6"></div>'
    +   '<div id="tr-chat-suggestions" style="display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px">'
    +     '<button type="button" class="tr-chat-sugg" style="padding:7px 12px;background:#EDE7D7;border:1px solid #E0D7C4;border-radius:999px;font-size:12px;color:#3E4335;cursor:pointer">Vos tarifs ?</button>'
    +     '<button type="button" class="tr-chat-sugg" style="padding:7px 12px;background:#EDE7D7;border:1px solid #E0D7C4;border-radius:999px;font-size:12px;color:#3E4335;cursor:pointer">Je veux réserver</button>'
    +     '<button type="button" class="tr-chat-sugg" style="padding:7px 12px;background:#EDE7D7;border:1px solid #E0D7C4;border-radius:999px;font-size:12px;color:#3E4335;cursor:pointer">Vos horaires ?</button>'
    +   '</div>'
    +   '<form id="tr-chat-form" style="display:flex;gap:8px;padding:12px;border-top:1px solid #E0D7C4;background:#F6EEE0">'
    +     '<input id="tr-chat-input" type="text" autocomplete="off" placeholder="Posez votre question…" style="flex:1;padding:11px 12px;border:1px solid #D8CEB9;border-radius:999px;font-family:\'Work Sans\',sans-serif;font-size:13.5px;background:#FDFBF6;color:#23281E">'
    +     '<button type="submit" aria-label="Envoyer" style="width:40px;height:40px;border-radius:50%;background:#405035;color:#F6EEE0;border:none;cursor:pointer;font-size:16px">➤</button>'
    +   '</form>'
    + '</div>';

  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.createElement('div');
    wrap.innerHTML = HTML;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    var toggleBtn = document.getElementById('tr-chat-toggle');
    var closeBtn = document.getElementById('tr-chat-close');
    var win = document.getElementById('tr-chat-window');
    var messagesEl = document.getElementById('tr-chat-messages');
    var form = document.getElementById('tr-chat-form');
    var input = document.getElementById('tr-chat-input');
    var history = [];
    var opened = false;

    function addBubble(text, role) {
      var el = document.createElement('div');
      var isUser = role === 'user';
      el.style.cssText = 'max-width:82%;padding:10px 13px;border-radius:14px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;align-self:' + (isUser ? 'flex-end' : 'flex-start') + ';background:' + (isUser ? '#405035' : '#EDE7D7') + ';color:' + (isUser ? '#F6EEE0' : '#2F3B27') + (isUser ? ';border-bottom-right-radius:4px' : ';border-bottom-left-radius:4px');
      el.textContent = text;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return el;
    }

    function addTyping() {
      var el = document.createElement('div');
      el.style.cssText = 'align-self:flex-start;background:#EDE7D7;padding:10px 14px;border-radius:14px;border-bottom-left-radius:4px;display:flex;gap:4px';
      el.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#8A8B78;display:inline-block;animation:tr-chat-blink 1s infinite"></span><span style="width:6px;height:6px;border-radius:50%;background:#8A8B78;display:inline-block;animation:tr-chat-blink 1s infinite .2s"></span><span style="width:6px;height:6px;border-radius:50%;background:#8A8B78;display:inline-block;animation:tr-chat-blink 1s infinite .4s"></span>';
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return el;
    }

    if (!document.getElementById('tr-chat-anim')) {
      var style = document.createElement('style');
      style.id = 'tr-chat-anim';
      style.textContent = '@keyframes tr-chat-blink{0%,60%,100%{opacity:.3}30%{opacity:1}}';
      document.head.appendChild(style);
    }

    function openChat() {
      win.style.display = 'flex';
      toggleBtn.textContent = '×';
      if (!opened) {
        opened = true;
        addBubble('Bonjour ! Je suis l\'assistante du cabinet TR Réflexologie. Je peux répondre à vos questions sur les soins, les tarifs, ou prendre votre rendez-vous directement ici. Comment puis-je vous aider ?', 'bot');
      }
      input.focus();
    }
    function closeChat() {
      win.style.display = 'none';
      toggleBtn.textContent = '💬';
    }

    toggleBtn.addEventListener('click', function () {
      if (win.style.display === 'flex') closeChat(); else openChat();
    });
    closeBtn.addEventListener('click', closeChat);

    document.querySelectorAll('.tr-chat-sugg').forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.textContent;
        form.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    });

    async function sendToBot(text) {
      history.push({ role: 'user', content: text });
      var typing = addTyping();
      try {
        var res = await fetch(window.SUPABASE_URL + '/functions/v1/chat-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: window.SUPABASE_KEY },
          body: JSON.stringify({ messages: history })
        });
        var data = await res.json();
        typing.remove();
        if (!res.ok || data.error) throw new Error(data.error || 'unavailable');
        addBubble(data.reply, 'bot');
        history.push({ role: 'assistant', content: data.reply });
        if (data.booked) {
          var confirm = document.createElement('div');
          confirm.style.cssText = 'align-self:center;background:#405035;color:#F6EEE0;padding:8px 14px;border-radius:999px;font-size:11.5px;letter-spacing:.04em';
          confirm.textContent = '✓ Demande de rendez-vous enregistrée';
          messagesEl.appendChild(confirm);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      } catch (err) {
        typing.remove();
        addBubble('Désolée, je ne suis pas disponible pour le moment. Vous pouvez appeler le cabinet au 06 29 56 34 70 ou réserver directement via le calendrier du site.', 'bot');
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      addBubble(text, 'user');
      input.value = '';
      sendToBot(text);
    });
  });
})();
