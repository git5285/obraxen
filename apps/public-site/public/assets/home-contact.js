/* Local enquiry and repair selection: prepares a mailto draft, never sends it. */
(() => {
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const enquiryForm = document.getElementById('enquiry-form');
const message = (key, params) => window.obraxenI18n.message(key, params);
const enquiryButton = document.getElementById('enquiry-review');
const enquiryStatus = document.getElementById('enquiry-status');
const enquiryFields = [...enquiryForm.querySelectorAll('input, textarea')];
const enquiryChannel = document.querySelector('.contact-direct a[href^="mailto:"]');
const enquiryDestination = enquiryChannel?.getAttribute('href')?.replace(/^mailto:/i,'') || '';
enquiryButton.disabled = false;
function fieldMessage(field) {
 const value = field.value.trim();
 if (!value && field.required) return message({
  'enquiry-name':'contact.required.name',
  'enquiry-contact':'contact.required.contact',
  'enquiry-message':'contact.required.message'
 }[field.id] || 'contact.required.field');
 if (field.maxLength > 0 && value.length > field.maxLength) return message('contact.maxLength', { count: field.maxLength });
 if (value && field.id === 'enquiry-contact') {
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const digits = value.replace(/\D/g, '');
  const phone = /^\+?[\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  if (!email && !phone) return message('contact.invalidContact');
 }
 if (value && field.minLength > 0 && value.length < field.minLength) return message('contact.minLength', { count: field.minLength });
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
function setEnquiryStatus(text, channel) {
 enquiryStatus.replaceChildren();
 const copy = document.createElement('p');
 copy.textContent = text;
 enquiryStatus.append(copy);
 if (channel?.href) {
  const link = document.createElement('a');
  link.className = 'button cta-text enquiry-channel-link';
  link.href = channel.href;
  link.textContent = channel.label;
  enquiryStatus.append(link);
  const note = document.createElement('span');
  note.className = 'enquiry-channel-note';
  note.textContent = message('contact.confirmation');
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
  setEnquiryStatus(message('contact.review'));
  invalid.focus();
  return;
 }
 if (!enquiryDestination) {
  setEnquiryStatus(message('contact.unconfigured'));
  enquiryStatus.focus();
  return;
 }
 const context = enquiryContext.hidden ? '' : '\n\n' + enquiryContext.textContent;
 const subject = message('contact.subject');
 const body = [message('contact.nameLabel') + document.getElementById('enquiry-name').value.trim(), message('contact.contactLabel') + document.getElementById('enquiry-contact').value.trim(), '', document.getElementById('enquiry-message').value.trim() + context].join('\n');
 const href = 'mailto:' + enquiryDestination + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
 setEnquiryStatus(message('contact.prepared'), {href, label:message('contact.open')});
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
 setEnquiryStatus(message('contact.cleared'));
 enquiryMessage.focus({preventScroll:true});
});
function setEnquiryContext(label,placeholder) {
 enquiryContext.textContent=label;
 enquiryContext.hidden=false;
 enquiryContextClear.hidden=false;
 enquiryMessage.placeholder=placeholder;
 clearEnquiryStatus();
}
document.querySelectorAll('.sector-card').forEach(link => link.addEventListener('click', () => {
 const panel=link.closest('.sector-panel');
 const sector=panel.id.replace('panel-','');
 setEnquiryContext(message('contact.sector', { name: panel.querySelector('h3').textContent }), message('contact.prompt.' + sector));
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
 setEnquiryContext(message('contact.need', { name: option.dataset.repair }), message('contact.prompt.repair'));
 document.getElementById('contact').scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth',block:'start'});
 document.getElementById('enquiry-name').focus({preventScroll:true});
}));

})();
