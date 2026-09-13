import { ProjectCard } from "@/components/project-card";
import { ProjectFooter } from "@/components/project-footer";
import { ProjectHeader } from "@/components/project-header";
import { ProjectJsonLd } from "@/components/project-json-ld";
import { getDictionary, getPath, type Locale } from "@/lib/i18n";
import { emptyProjectsDescription } from "@/lib/seo-indexability";
import { getProjectsJsonLd } from "@/lib/project-pages";
import { publicProjects } from "@/lib/projects";

type SectionProjectsPageProps = {
  locale: Locale;
};

export function SectionProjectsPage({ locale }: SectionProjectsPageProps) {
  const dictionary = getDictionary(locale);

  return (
    <>
      <a className="skip" href="#projects-content">{dictionary.common.skipToContent}</a>
      <ProjectHeader variant="projects" locale={locale} />
      <main id="projects-content">
        <section className="projects-hero" aria-labelledby="projects-title">
          <div className="projects-wrap">
            <nav className="breadcrumbs" aria-label={dictionary.common.breadcrumbs}>
              <ol>
                <li><a href={getPath(locale, "home")}>{dictionary.common.home}</a></li>
                <li aria-current="page">{dictionary.common.projects}</li>
              </ol>
            </nav>
            <div className="projects-hero-grid">
              <div>
                <p className="projects-kicker">{dictionary.projectHub.kicker}</p>
                <h1 id="projects-title">
                  {publicProjects.length ? dictionary.projectHub.title : dictionary.common.projects}
                </h1>
              </div>
              <div className="projects-hero-copy">
                {publicProjects.length ? (
                  <>
                    <p>{dictionary.projectHub.intro}</p>
                    <p className="archive-note">
                      <strong>
                        {dictionary.projectHub.archiveNote.replace("{count}", String(publicProjects.length))}
                      </strong>
                    </p>
                  </>
                ) : (
                  <p>{emptyProjectsDescription[locale]}</p>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="projects-archive" aria-label={dictionary.projectHub.archiveAria}>
          <div className="projects-wrap">
            {publicProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} locale={locale} />
            ))}
          </div>
        </section>
      </main>
      <ProjectFooter variant="projects" locale={locale} />
      <ProjectJsonLd value={getProjectsJsonLd(locale)} />
    </>
  );
}
