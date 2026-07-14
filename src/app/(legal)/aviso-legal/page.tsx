import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Aviso legal — ${brand.claim}`,
  description: "Información legal del titular de esta web.",
};

function valueOrNoData(value: string | null): string {
  return value ?? "Sin dato";
}

export default function LegalNoticePage() {
  return (
    <LegalPage
      title="Aviso legal"
      intro="Este documento es un borrador de trabajo preparado para completar la información exigida al titular de una web empresarial establecida en España. Debe revisarse cuando exista la sociedad y antes de activar la publicación."
      relatedHref="/privacidad/"
      relatedLabel="Política de privacidad"
    >
      <div className="ficha">
        <dl>
          <dt>Titular o razón social</dt><dd>{valueOrNoData(brand.nombreLegal)}</dd>
          <dt>NIF/CIF</dt><dd>{valueOrNoData(brand.cif)}</dd>
          <dt>Domicilio</dt><dd>{valueOrNoData(brand.direccion)}</dd>
          <dt>Correo electrónico</dt><dd>{valueOrNoData(brand.email)}</dd>
          <dt>Dominio</dt><dd>{valueOrNoData(brand.dominio)}</dd>
          <dt>Registro Mercantil</dt><dd>Sin dato</dd>
        </dl>
      </div>

      <div className="alerta">
        <strong>Información imprescindible pendiente</strong>
        Faltan la identidad societaria, el domicilio validado, el CIF, el email, el dominio y,
        en su caso, los datos registrales. Este borrador no autoriza la publicación.
      </div>

      <h2>1. Objeto</h2>
      <p>Esta web tiene por objeto presentar servicios de reparación y tratamiento técnico de pavimentos industriales y facilitar el contacto para solicitar información o una propuesta adaptada a cada proyecto.</p>

      <h2>2. Condiciones de uso</h2>
      <p>El acceso a la web implica el uso diligente y lícito de sus contenidos. No está permitido utilizarla para dañar sistemas, introducir software malicioso, vulnerar derechos de terceros o realizar actividades contrarias a la ley.</p>

      <h2>3. Información comercial</h2>
      <p>Los contenidos tienen carácter informativo. El diagnóstico, el alcance, el precio, el plazo y las condiciones de ejecución se concretan para cada proyecto en su correspondiente propuesta y contrato.</p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>Salvo indicación contraria, los textos, diseños, elementos gráficos y materiales propios de la web pertenecen al titular o se utilizan con autorización. No pueden reproducirse, distribuirse o transformarse con fines comerciales sin permiso o cobertura legal suficiente.</p>

      <h2>5. Responsabilidad y enlaces externos</h2>
      <p>Se procura mantener la información correcta y disponible, pero no se garantiza la ausencia absoluta de errores o interrupciones. Los enlaces a servicios de terceros se facilitan, en su caso, como referencia; cada tercero responde de sus contenidos, disponibilidad y condiciones.</p>

      <h2>6. Legislación aplicable</h2>
      <p>Este aviso se rige por la legislación española. Cualquier controversia se someterá a los juzgados y tribunales que resulten competentes conforme a las normas imperativas aplicables.</p>

      <h2>7. Modificaciones</h2>
      <p>El titular podrá actualizar este aviso para reflejar cambios legales, técnicos o empresariales. La versión aplicable será la publicada en la web en cada momento.</p>
    </LegalPage>
  );
}
