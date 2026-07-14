import { LogoMark } from "./logo-mark";

type SiteFooterProps = {
  brandName: string | null;
  serviceAreaLabel: string;
  priorityMarketsLabel: string;
  hasContactChannel: boolean;
  contact: {
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    schedule: string | null;
  };
  legal: {
    businessName: string | null;
    taxId: string | null;
    address: string | null;
    legalUrl: string | null;
    privacyUrl: string | null;
  };
};

export function SiteFooter({
  brandName,
  serviceAreaLabel,
  priorityMarketsLabel,
  hasContactChannel,
  contact,
  legal,
}: SiteFooterProps) {
  const phoneHref = contact.phone?.replace(/[^+\d]/g, "");
  const whatsappHref = contact.whatsapp?.replace(/\D/g, "");

  return (
    <footer className="cierre" id="contacto">
      {hasContactChannel ? (
        <div className="cta-fila">
          <div>
            <p className="kicker">Contacto</p>
            <h2>¿Tu pavimento está frenando tu operativa?</h2>
            <p>Cuéntanos qué ocurre. Revisaremos la información y te indicaremos los próximos pasos.</p>
          </div>
          {contact.email ? (
            <form
              className="form"
              action={`mailto:${contact.email}`}
              method="post"
              encType="text/plain"
              aria-describedby="contacto-ayuda"
              data-clarity-mask="true"
            >
              <label htmlFor="f-nombre">Nombre</label>
              <input id="f-nombre" name="nombre" type="text" autoComplete="name" required />
              <label htmlFor="f-email">Correo electrónico</label>
              <input id="f-email" name="email" type="email" autoComplete="email" required />
              <label htmlFor="f-msg">¿Qué le pasa a tu pavimento?</label>
              <textarea id="f-msg" name="mensaje" required />
              <button className="btn btn-acento" type="submit">
                Preparar solicitud por email
              </button>
              <small id="contacto-ayuda">Al continuar se abrirá tu aplicación de correo.</small>
            </form>
          ) : (
            <div className="form form-pendiente">
              <p className="form-estado">Canales disponibles</p>
              <h3>Cuéntanos qué ocurre en el pavimento</h3>
              {contact.whatsapp && whatsappHref ? (
                <a href={`https://wa.me/${whatsappHref}`} rel="noopener">
                  WhatsApp
                </a>
              ) : null}
              {contact.phone && phoneHref ? <a href={`tel:${phoneHref}`}>{contact.phone}</a> : null}
            </div>
          )}
        </div>
      ) : null}

      <div className="foot">
        <div className="marca">
          <LogoMark brandName={brandName} className="logo logo-footer" />
          <p>Reparación de pavimentos industriales en {serviceAreaLabel}.</p>
          <p>Mercados principales: {priorityMarketsLabel}.</p>
          <p className="legal-details">
            {legal.businessName ? (
              <>
                <strong>Razón social:</strong> {legal.businessName}
                <br />
              </>
            ) : null}
            {legal.taxId ? (
              <>
                <strong>CIF:</strong> {legal.taxId}
                <br />
              </>
            ) : null}
            {legal.address ? (
              <>
                <strong>Domicilio:</strong> {legal.address}
                <br />
              </>
            ) : null}
            <strong>Actividad:</strong> Reparación y tratamiento técnico de pavimentos industriales de hormigón
          </p>
        </div>
        <div>
          <h3>General</h3>
          <ul>
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#empresa">Empresa</a></li>
            <li><a href="#proceso">Proceso</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </div>
        <div>
          <h3>Servicios</h3>
          <ul>
            <li><a href="#servicios">Juntas</a></li>
            <li><a href="#servicios">Fisuras</a></li>
            <li><a href="#servicios">Recrecidos</a></li>
            <li><a href="#servicios">Superficiales</a></li>
          </ul>
        </div>
        {contact.email || contact.phone || contact.whatsapp || contact.schedule ? (
          <div>
            <h3>{hasContactChannel ? "Contacto" : "Horario"}</h3>
            <ul>
              {contact.email ? <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li> : null}
              {contact.whatsapp && whatsappHref ? <li><a href={`https://wa.me/${whatsappHref}`} rel="noopener">WhatsApp</a></li> : null}
              {contact.phone && phoneHref ? <li><a href={`tel:${phoneHref}`}>{contact.phone}</a></li> : null}
              {contact.schedule ? <li>{contact.schedule}</li> : null}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="legal">
        <span>
          {brandName
            ? `© 2026 ${brandName}. Todos los derechos reservados.`
            : "Reparación y tratamiento técnico de pavimentos industriales."}
        </span>
        <span>
          {legal.legalUrl ? <a href={legal.legalUrl}>Aviso legal</a> : null}
          {legal.legalUrl && legal.privacyUrl ? " · " : null}
          {legal.privacyUrl ? <a href={legal.privacyUrl}>Privacidad</a> : null}
          {legal.legalUrl || legal.privacyUrl ? " · " : null}
          <a href="/cookies/">Cookies</a>
        </span>
      </div>
    </footer>
  );
}
