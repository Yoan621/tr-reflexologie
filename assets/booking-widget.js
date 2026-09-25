// Calendly-style booking widget (front-end only, wired to Supabase table `rendez_vous`).
// Set window.TR_PRESELECT_CARE before this script runs to skip the "quel soin ?" step
// (used on individual service pages).
(function () {
  const grid = document.getElementById('cal-grid');
  const monthLabel = document.getElementById('cal-month-label');
  const slotsWrap = document.getElementById('cal-slots');
  const slotsLabel = document.getElementById('slots-label');
  const form = document.getElementById('booking-form');
  const recap = document.getElementById('booking-recap');
  const confirmed = document.getElementById('booking-confirmed');
  if (!grid || !monthLabel) return;

  const PRESELECT_CARE = window.TR_PRESELECT_CARE || '';

  const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();
  let selectedDate = null;

  function slotsForDay(dow) {
    // dow: 0=dim 1=lun 2=mar 3=mer 4=jeu 5=ven 6=sam
    if (dow >= 2 && dow <= 5) {
      const s = [];
      for (let h = 10; h < 20; h++) { s.push(h + 'h00'); s.push(h + 'h30'); }
      return s;
    }
    if (dow === 6) return ['9h00', '9h30', '10h00', '10h30', '11h00', '11h30'];
    return [];
  }

  function renderCalendar() {
    monthLabel.textContent = MONTHS[viewMonth] + ' ' + viewYear;
    grid.innerHTML = '';
    const firstDay = new Date(viewYear, viewMonth, 1);
    let startOffset = firstDay.getDay() - 1; // Monday = 0
    if (startOffset < 0) startOffset = 6;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('span');
      grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dow = date.getDay();
      const isPast = date < today;
      const isOpen = slotsForDay(dow).length > 0;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(d);
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime();
      const disabled = isPast || !isOpen;
      btn.disabled = disabled;
      btn.style.cssText = 'aspect-ratio:1;border-radius:50%;border:none;font-family:"Work Sans",sans-serif;font-size:13px;cursor:' + (disabled ? 'default' : 'pointer') + ';background:' + (isSelected ? '#405035' : 'transparent') + ';color:' + (isSelected ? '#F6EEE0' : (disabled ? '#C7C2AE' : '#3E4335')) + ';transition:background .15s ease,color .15s ease';
      if (!disabled) {
        btn.addEventListener('mouseenter', () => { if (!isSelected) btn.style.background = '#DED4BF'; });
        btn.addEventListener('mouseleave', () => { if (!isSelected) btn.style.background = 'transparent'; });
        btn.addEventListener('click', () => {
          selectedDate = date;
          renderCalendar();
          renderSlots(date);
          const panel = document.getElementById('slots-panel');
          if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      grid.appendChild(btn);
    }
  }

  document.getElementById('cal-prev')?.addEventListener('click', () => {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  const careType = document.getElementById('care-type');
  const durationType = document.getElementById('duration-type');
  let selectedDateLabel = '';
  let selectedSlot = '';
  let selectedCare = PRESELECT_CARE;

  function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // "17h30" -> 1050 (minutes depuis minuit)
  function toMin(h) {
    const m = /^\s*(\d{1,2})\s*[h:]\s*(\d{0,2})/.exec(h || '');
    return m ? Number(m[1]) * 60 + Number(m[2] || 0) : null;
  }
  // "30 minutes · 35 €" -> 30, "2 heures · 75 €" -> 120, "Forfait 3 séances d'1 heure" -> 60
  function durMin(d) {
    const mn = /(\d+)\s*min/.exec(d || '');
    if (mn) return Number(mn[1]);
    const hr = /(\d+)\s*heure/.exec(d || '');
    return hr ? Number(hr[1]) * 60 : 60;
  }

  let dayRanges = [];   // plages occupees du jour affiche : [[debut, fin], ...] en minutes
  let dayClose = 0;     // heure de fermeture du jour affiche (minutes)

  // Creneaux deja pris (RDV non annules, duree comprise) ou bloques a la main par la praticienne.
  async function blockedSlots(date) {
    try {
      const sb = window.getSupabase();
      const { data, error } = await sb
        .from('disponibilite_bloquee')
        .select('heure,duree_min')
        .eq('date', dateKey(date));
      if (error) throw error;
      const ranges = [];
      let fullDay = false;
      (data || []).forEach(r => {
        if (r.heure == null) { fullDay = true; return; }
        const s = toMin(r.heure);
        if (s != null) ranges.push([s, s + (r.duree_min || 30)]);
      });
      return { ranges, fullDay };
    } catch (_) {
      return { ranges: [], fullDay: false }; // erreur reseau : la base refusera quand meme un doublon a l'insertion
    }
  }

  function isFree(start, minutes) {
    const end = start + minutes;
    if (end > dayClose) return false;
    return !dayRanges.some(([s, e]) => s < end && e > start);
  }

  // Grise les durees qui depasseraient sur un RDV suivant ou sur la fermeture.
  function refreshDurations() {
    const start = toMin(selectedSlot);
    durationType?.querySelectorAll('.duration-option').forEach(btn => {
      const ok = start != null && isFree(start, durMin(btn.getAttribute('data-duration')));
      btn.disabled = !ok;
      btn.style.opacity = ok ? '' : '.4';
      btn.style.pointerEvents = ok ? '' : 'none';
      btn.title = ok ? '' : 'Durée non disponible à cette heure';
    });
  }

  async function renderSlots(date, keepMessage) {
    const dow = date.getDay();
    const dateLabel = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    slotsLabel.textContent = 'Créneaux du ' + dateLabel;
    slotsWrap.innerHTML = '<span style="font-size:13px;color:#8A8B78">Chargement…</span>';
    careType.style.display = 'none';
    durationType.style.display = 'none';
    form.style.display = 'none';
    if (!keepMessage) confirmed.style.display = 'none';
    errorEl.style.display = 'none';

    const { ranges, fullDay } = await blockedSlots(date);
    const all = slotsForDay(dow);
    dayRanges = ranges;
    dayClose = all.length ? toMin(all[all.length - 1]) + 30 : 0;
    slotsWrap.innerHTML = '';
    if (fullDay || !all.length) {
      slotsWrap.innerHTML = '<span style="font-size:13px;color:#8A8B78">Aucun créneau disponible ce jour. Choisissez une autre date.</span>';
      return;
    }

    all.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = slot;
      if (!isFree(toMin(slot), 30)) {
        // Creneau deja reserve : affiche mais non cliquable.
        btn.disabled = true;
        btn.title = 'Non disponible, un client a déjà réservé cet horaire';
        btn.setAttribute('aria-label', slot + ' — non disponible');
        btn.innerHTML = '<span style="text-decoration:line-through">' + slot + '</span><span style="display:block;font-size:10px;letter-spacing:.02em">Non disponible</span>';
        btn.style.cssText = 'padding:5px 6px;border:1px dashed #C7C2AE;color:#A9A590;background:#EFE9DC;border-radius:999px;font-family:"Work Sans",sans-serif;font-size:13px;line-height:1.15;cursor:not-allowed;text-align:center';
        slotsWrap.appendChild(btn);
        return;
      }
      btn.style.cssText = 'padding:9px 10px;border:1px solid #405035;color:#405035;background:#FDFBF6;border-radius:999px;font-family:"Work Sans",sans-serif;font-size:13px;cursor:pointer;text-align:center;transition:background .15s ease,color .15s ease';
      // Survol : vert sapin plein pour reperer le creneau vise (btn cree dynamiquement,
      // le handler global .hoverable de index.html ne l'attrape pas).
      btn.addEventListener('mouseenter', () => { btn.style.background = '#405035'; btn.style.color = '#F6EEE0'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = '#FDFBF6'; btn.style.color = '#405035'; });
      btn.addEventListener('click', () => {
        selectedDateLabel = dateLabel;
        selectedSlot = slot;
        refreshDurations();
        if (PRESELECT_CARE) {
          selectedCare = PRESELECT_CARE;
          careType.style.display = 'none';
          durationType.style.display = 'flex';
          form.style.display = 'none';
          confirmed.style.display = 'none';
          durationType.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          careType.style.display = 'flex';
          durationType.style.display = 'none';
          form.style.display = 'none';
          confirmed.style.display = 'none';
          careType.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
      slotsWrap.appendChild(btn);
    });
  }

  careType?.querySelectorAll('.care-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCare = btn.getAttribute('data-care');
      careType.style.display = 'none';
      durationType.style.display = 'flex';
      form.style.display = 'none';
      confirmed.style.display = 'none';
      durationType.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  let selectedDuration = '';
  durationType?.querySelectorAll('.duration-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      selectedDuration = btn.getAttribute('data-duration');
      recap.textContent = selectedCare + ' (' + selectedDuration + '), le ' + selectedDateLabel + ' à ' + selectedSlot;
      durationType.style.display = 'none';
      form.style.display = 'flex';
      confirmed.style.display = 'none';
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  const errorEl = document.getElementById('booking-error');
  const submitBtn = document.getElementById('booking-submit-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    errorEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Envoi...';

    const priceMatch = selectedDuration.match(/(\d+)\s*€/);
    const prix = priceMatch ? Number(priceMatch[1]) : null;

    const payload = {
      nom_client: document.getElementById('booking-nom').value,
      telephone: document.getElementById('booking-tel').value,
      email: document.getElementById('booking-email').value,
      soin: selectedCare,
      duree: selectedDuration,
      prix,
      date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
      heure: selectedSlot,
      statut: 'en_attente',
      source: 'site'
    };

    try {
      const sb = window.getSupabase();
      const { error } = await sb.from('rendez_vous').insert(payload);
      if (error) throw error;
      form.reset();
      confirmed.style.display = 'block';
      confirmed.textContent = 'Demande envoyée, ' + recap.textContent + '. Vous recevrez une confirmation par email.';
      // Recharge les creneaux : celui qui vient d'etre pris passe en "Non disponible".
      renderSlots(selectedDate, true);
    } catch (err) {
      if (/CRENEAU_INDISPONIBLE/.test(err?.message || '')) {
        // Quelqu'un a reserve ce creneau entre-temps : on rafraichit la liste.
        // (message affiche dans `confirmed` : `errorEl` est dans le formulaire, masque par renderSlots)
        await renderSlots(selectedDate);
        confirmed.textContent = 'Désolé, ce créneau vient d’être réservé par un autre client. Merci d’en choisir un autre.';
        confirmed.style.display = 'block';
        confirmed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      errorEl.textContent = "Erreur d'envoi, réessayez ou appelez le cabinet.";
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmer la demande';
    }
  });

  renderCalendar();
})();
