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

  function renderSlots(date) {
    const dow = date.getDay();
    const slots = slotsForDay(dow);
    const dateLabel = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    slotsLabel.textContent = 'Créneaux du ' + dateLabel;
    slotsWrap.innerHTML = '';
    careType.style.display = 'none';
    durationType.style.display = 'none';
    form.style.display = 'none';
    confirmed.style.display = 'none';

    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = slot;
      btn.className = 'hoverable';
      btn.setAttribute('data-hover', 'background:#405035;color:#F6EEE0');
      btn.style.cssText = 'padding:9px 10px;border:1px solid #405035;color:#405035;background:#FDFBF6;border-radius:999px;font-family:"Work Sans",sans-serif;font-size:13px;cursor:pointer;text-align:center';
      btn.addEventListener('click', () => {
        selectedDateLabel = dateLabel;
        selectedSlot = slot;
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
      date: selectedDate.toISOString().slice(0, 10),
      heure: selectedSlot,
      statut: 'en_attente',
      source: 'site'
    };

    try {
      const sb = window.getSupabase();
      const { error } = await sb.from('rendez_vous').insert(payload);
      if (error) throw error;
      form.style.display = 'none';
      confirmed.style.display = 'block';
      confirmed.textContent = 'Demande envoyée, ' + recap.textContent + '. Vous recevrez une confirmation par email.';
    } catch (err) {
      errorEl.textContent = "Erreur d'envoi, réessayez ou appelez le cabinet.";
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmer la demande';
    }
  });

  renderCalendar();
})();
