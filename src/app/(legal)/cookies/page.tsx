import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY } from "@/lib/consent";
import { brand } from "@/lib/brand";

const storageDays = CONSENT_MAX_AGE_MS / (24 * 60 * 60 * 1000);

export const metadata: Metadata = {
  title: `Cookies y almacenamiento — ${brand.claim}`,
  description: "Información sobre preferencias locales y analítica opcional.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies y almacenamiento"
      intro="Este borrador describe el mecanismo técnico de consentimiento. GA4 y Microsoft Clarity permanecen bloqueados hasta una aceptación expresa y solo pueden activarse cuando el entorno contiene identificadores válidos."
      relatedHref="/privacidad/"
      relatedLabel="Política de privacidad"
    >
      <div className="alerta">
        <strong>Analítica desactivada por defecto</strong>
        Rechazar, cerrar el navegador o seguir navegando sin decidir no carga etiquetas ni
        genera solicitudes a Google o Microsoft. La publicidad permanece denegada en todos
        los estados de esta versión.
      </div>

      <h2>1. Preferencia técnica esencial</h2>
      <p>La web puede guardar una única preferencia en el almacenamiento local del navegador. No se transmite al servidor y sirve exclusivamente para recordar si se autorizó la categoría analítica.</p>
      <div className="ficha">
        <dl>
          <dt>Responsable</dt><dd>{brand.nombreLegal ?? "Sin dato"}</dd>
          <dt>Clave</dt><dd>{CONSENT_STORAGE_KEY}</dd>
          <dt>Origen</dt><dd>Primera parte</dd>
          <dt>Duración</dt><dd>{storageDays} días</dd>
          <dt>Finalidad</dt><dd>Recordar la elección de privacidad</dd>
        </dl>
      </div>

      <h2>2. Analítica opcional</h2>
      <p>Solo después de aceptar, la web consulta su configuración interna y puede cargar Google Analytics 4 y Microsoft Clarity. Los identificadores reales deben configurarse por separado en cada entorno y no están incorporados al código.</p>
      <ul>
        <li><strong>Google Analytics 4:</strong> medición agregada de páginas y eventos, con almacenamiento analítico autorizado y almacenamiento publicitario siempre denegado.</li>
        <li><strong>Microsoft Clarity:</strong> análisis de interacción sujeto a ConsentV2, sin identificadores personalizados y con los formularios enmascarados.</li>
      </ul>

      <h2>3. Aceptar, rechazar y retirar</h2>
      <p>El aviso inicial presenta aceptar y rechazar con la misma visibilidad. Tras decidir, el botón «Preferencias de privacidad» permite abrir de nuevo el panel. Si se retira una aceptación, se envía el estado denegado, se eliminan las cookies analíticas de primera parte detectables y se reinicia la página cuando ya se habían cargado proveedores para detener su ejecución.</p>

      <h2>4. Transferencias y revisión pendiente</h2>
      <p>La activación real exige completar la identidad del responsable, revisar las condiciones de Google y Microsoft, documentar conservación y transferencias internacionales y aprobar profesionalmente estos textos. Sin esa revisión, la puerta de publicación permanece cerrada.</p>
    </LegalPage>
  );
}
