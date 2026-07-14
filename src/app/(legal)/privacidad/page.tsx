import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Política de privacidad — ${brand.claim}`,
  description: "Información sobre el tratamiento previsto de datos personales.",
};

function valueOrNoData(value: string | null): string {
  return value ?? "Sin dato";
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      intro="Este borrador explica el tratamiento previsto de los datos personales recibidos mediante consultas comerciales. Debe completarse con la identidad y los proveedores definitivos antes de habilitar cualquier formulario."
      relatedHref="/aviso-legal/"
      relatedLabel="Aviso legal"
    >
      <div className="ficha">
        <dl>
          <dt>Responsable</dt><dd>{valueOrNoData(brand.nombreLegal)}</dd>
          <dt>NIF/CIF</dt><dd>{valueOrNoData(brand.cif)}</dd>
          <dt>Domicilio</dt><dd>{valueOrNoData(brand.direccion)}</dd>
          <dt>Contacto de privacidad</dt><dd>{valueOrNoData(brand.email)}</dd>
        </dl>
      </div>

      <div className="alerta">
        <strong>Formulario todavía desactivado</strong>
        No se ha seleccionado un proveedor de formulario. Antes de activarlo habrá que revisar
        contrato, ubicación, conservación y posibles transferencias internacionales, además de
        completar la información anterior.
      </div>

      <h2>1. Datos tratados</h2>
      <p>Cuando se habiliten los canales de contacto podrán tratarse datos identificativos y profesionales, datos de contacto, empresa, ubicación del proyecto, contenido de la consulta, fotografías o vídeos aportados voluntariamente y datos técnicos básicos de seguridad generados al utilizar la web.</p>

      <h2>2. Finalidades y bases jurídicas</h2>
      <ul>
        <li><strong>Atender consultas y preparar propuestas:</strong> aplicación de medidas precontractuales solicitadas por la persona interesada.</li>
        <li><strong>Gestionar una relación contractual:</strong> ejecución del contrato y cumplimiento de obligaciones legales.</li>
        <li><strong>Seguridad y prevención de abusos:</strong> interés legítimo en proteger la web, sus sistemas y sus usuarios.</li>
        <li><strong>Comunicaciones comerciales futuras:</strong> solo cuando exista una base jurídica válida y con un medio sencillo de oposición o baja.</li>
      </ul>

      <h2>3. Plazos de conservación</h2>
      <p>Las consultas se conservarán durante el tiempo necesario para responder y, si generan una relación comercial, durante su vigencia. Después podrán mantenerse bloqueadas durante los plazos legales de responsabilidad. Los registros técnicos se conservarán durante el periodo limitado que establezca el proveedor de alojamiento por motivos de seguridad.</p>

      <h2>4. Destinatarios y encargados</h2>
      <p>Los datos podrán ser tratados por proveedores necesarios para alojamiento, correo, soporte técnico o gestión de formularios, siempre bajo el correspondiente contrato de encargo. También podrán comunicarse a administraciones, juzgados o autoridades cuando exista obligación legal.</p>

      <h2>5. Transferencias internacionales</h2>
      <p>La configuración definitiva debe identificar si algún proveedor trata datos fuera del Espacio Económico Europeo y, en ese caso, documentar el mecanismo legal aplicable. La integración técnica de GA4 y Clarity permanece bloqueada antes del consentimiento y sin identificadores reales en el código; su activación exige completar esta revisión.</p>

      <h2>6. Derechos</h2>
      <p>Las personas interesadas pueden solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad cuando corresponda, así como retirar su consentimiento sin efectos retroactivos. El canal para ejercerlos permanece sin dato. También puede presentarse una reclamación ante la <a href="https://www.aepd.es/" rel="noopener">Agencia Española de Protección de Datos</a>.</p>

      <h2>7. Datos de terceros y menores</h2>
      <p>Quien facilite datos de otra persona debe estar autorizado para hacerlo. Los servicios se dirigen a profesionales y empresas, no a menores de edad.</p>

      <h2>8. Cookies</h2>
      <p>La web guarda localmente la preferencia de privacidad durante 180 días. GA4 y Clarity solo pueden cargarse tras aceptar analítica; rechazar no genera solicitudes a esos proveedores y la publicidad permanece denegada. La información técnica, la retirada y los proveedores previstos se detallan en <Link href="/cookies/">Cookies y almacenamiento</Link>.</p>

      <h2>9. Cambios en esta política</h2>
      <p>Esta política podrá actualizarse cuando cambien los canales, proveedores, tratamientos o requisitos legales. La fecha de revisión se indicará al final del documento.</p>
    </LegalPage>
  );
}
