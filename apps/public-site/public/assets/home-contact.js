/* Local enquiry and repair selection: prepares a mailto draft, never sends it. */
(() => {
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const enquiryForm = document.getElementById('enquiry-form');
const translateCopy = value => window.obraxenI18n?.translate(value) ?? value;
const enquiryButton = document.getElementById('enquiry-review');
const enquiryStatus = document.getElementById('enquiry-status');
const enquiryFields = [...enquiryForm.querySelectorAll('input, textarea')];
const enquiryChannel = document.querySelector('.contact-direct a[href^="mailto:"]');
const enquiryDestination = enquiryChannel?.getAttribute('href')?.replace(/^mailto:/i,'') || '';
enquiryButton.disabled = false;
function fieldMessage(field) {
 const value = field.value.trim();
 if (!value && field.required) return translateCopy({
  'enquiry-name':'Indica tu nombre.',
  'enquiry-contact':'Indica un correo electrónico o un teléfono.',
  'enquiry-message':'Describe qué necesita tu pavimento.'
 }[field.id] || 'Completa este campo.');
 if (field.maxLength > 0 && value.length > field.maxLength) return translateCopy('Utiliza como máximo ') + field.maxLength + translateCopy(' caracteres.');
 if (value && field.id === 'enquiry-contact') {
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const digits = value.replace(/\D/g, '');
  const phone = /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  if (!email && !phone) return translateCopy('Introduce un correo válido o un teléfono con prefijo si es internacional.');
 }
 if (value && field.minLength > 0 && value.length < field.minLength) return translateCopy('Escribe al menos ') + field.minLength + translateCopy(' caracteres.');
 return '';
}
function showFieldError(field) {
 const error = document.getElementById('error-' + field.id.replace('enquiry-', ''));
 const message = fieldMessage(field);
 field.setAttribute('aria-invalid', String(Boolean(message)));
 error.textContent = message;
 error.hidden = !message;
 return !message;
}
function clearEnquiryStatus() {
 enquiryStatus.replaceChildren();
 enquiryStatus.hidden = true;
}
function setEnquiryStatus(message, channel) {
 enquiryStatus.replaceChildren();
 const copy = document.createElement('p');
 copy.textContent = message;
 enquiryStatus.append(copy);
 if (channel?.href) {
  const link = document.createElement('a');
  link.className = 'button cta-text enquiry-channel-link';
  link.href = channel.href;
  link.textContent = channel.label;
  enquiryStatus.append(link);
  const note = document.createElement('span');
  note.className = 'enquiry-channel-note';
  note.textContent = translateCopy('Se abrirá tu aplicación de correo. El envío requiere tu confirmación.');
  enquiryStatus.append(note);
 }
 enquiryStatus.hidden = false;
}
enquiryFields.forEach(field => {
 field.addEventListener('blur', () => { if (field.value.trim() || field.getAttribute('aria-invalid') === 'true') showFieldError(field); });
 field.addEventListener('input', () => {
  if (field.hasAttribute('aria-invalid')) showFieldError(field);
  clearEnquiryStatus();
 });
});
function reviewEnquiry() {
 enquiryFields.forEach(showFieldError);
 const invalid = enquiryFields.find(field => fieldMessage(field));
 if (invalid) {
  setEnquiryStatus(translateCopy('Revisa los campos indicados. La consulta todavía no se ha preparado.'));
  invalid.focus();
  return;
 }
 if (!enquiryDestination) {
  setEnquiryStatus(translateCopy('La consulta está validada, pero el canal de recepción aún no está configurado.'));
  enquiryStatus.focus();
  return;
 }
 const context = enquiryContext.hidden ? '' : '\n\n' + enquiryContext.textContent;
 const subject = translateCopy('Consulta sobre pavimento');
 const body = [translateCopy('Nombre: ') + document.getElementById('enquiry-name').value.trim(), translateCopy('Contacto: ') + document.getElementById('enquiry-contact').value.trim(), '', document.getElementById('enquiry-message').value.trim() + context].join('\n');
 const href = 'mailto:' + enquiryDestination + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
 setEnquiryStatus(translateCopy('Consulta preparada. Revisa el contenido y decide si quieres enviarla.'), {href, label:translateCopy('Abrir borrador de correo')});
 enquiryStatus.focus();
}
enquiryForm.addEventListener('submit', event => { event.preventDefault(); reviewEnquiry(); });


/* Keep the selected use context without storing or changing the visitor's words. */
const enquiryContext = document.getElementById('enquiry-context');
const enquiryMessage = document.getElementById('enquiry-message');
const enquiryContextClear = document.getElementById('enquiry-context-clear');
enquiryContextClear.addEventListener('click',()=>{
 enquiryContext.hidden=true;enquiryContext.textContent='';
 enquiryContextClear.hidden=true;enquiryMessage.placeholder='';
 setEnquiryStatus(translateCopy('Selección eliminada. El texto de tu consulta se conserva.'));
 enquiryMessage.focus({preventScroll:true});
});
function setEnquiryContext(label,placeholder) {
 enquiryContext.textContent=label;
 enquiryContext.hidden=false;
 enquiryContextClear.hidden=false;
 enquiryMessage.placeholder=placeholder;
 clearEnquiryStatus();
}
const sectorPrompts = {
 logistica:'Describe juntas, fisuras o desgaste en zonas de carga y paso de carretillas.',
 industria:'Describe el daño y el uso de la zona: maquinaria, circulación o almacenamiento.',
 automocion:'Describe el estado del suelo en la zona de trabajo o paso de vehículos.',
 distribucion:'Describe el daño en pasillos, zonas de reposición o carga de mercancías.',
 alimentacion:'Describe el daño y si la zona está expuesta a humedad o limpieza frecuente.',
 aparcamientos:'Describe daños en plazas, rampas o zonas de circulación.'
};
document.querySelectorAll('.sector-card').forEach(link => link.addEventListener('click', () => {
 const panel=link.closest('.sector-panel');
 const sector=panel.id.replace('panel-','');
 setEnquiryContext(translateCopy('Sector: ')+panel.querySelector('h3').textContent+'.',translateCopy(sectorPrompts[sector] || ''));
}));

/* Native dialog provides focus containment and Escape dismissal. */
const repairTrigger = document.getElementById('hero-repair-trigger');
const repairMenu = document.getElementById('hero-repair-menu');
let repairSelectionMade=false;
repairTrigger.addEventListener('click', () => {
 repairSelectionMade=false;
 repairMenu.showModal();
 document.documentElement.classList.add('repair-menu-open');
});
repairMenu.addEventListener('close',()=>{
 document.documentElement.classList.remove('repair-menu-open');
 if(!repairSelectionMade) repairTrigger.focus({preventScroll:true});
});
repairMenu.querySelector('.repair-menu-close').addEventListener('click', () => repairMenu.close());
repairMenu.addEventListener('click', event => {
 const rect=repairMenu.getBoundingClientRect();
 if (event.target===repairMenu && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)) repairMenu.close();
});
repairMenu.querySelectorAll('[data-repair]').forEach(option => option.addEventListener('click', () => {
 repairSelectionMade=true;
 repairMenu.close();
 setEnquiryContext(translateCopy('Necesidad: ')+option.dataset.repair+'.',translateCopy('Cuéntanos qué observas, en qué zona ocurre y cómo se utiliza ese espacio.'));
 document.getElementById('contact').scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth',block:'start'});
 document.getElementById('enquiry-name').focus({preventScroll:true});
}));

})();
