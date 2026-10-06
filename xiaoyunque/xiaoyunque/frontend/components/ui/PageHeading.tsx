import type { ReactNode } from 'react';

export default function PageHeading({
  title, description, icon, actions, level = 1,
}: {
  title: string;
  description: ReactNode;
  icon?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  level?: 1 | 2;
}) {
  const Heading = level === 2 ? 'h2' : 'h1';
  return (
    <div className="ui-page-heading">
      <div className="ui-page-heading-copy">
        <div className="ui-page-title">{icon && <span className="ui-page-icon" aria-hidden="true">{icon}</span>}<Heading>{title}</Heading></div>
        <div className="ui-page-description">{description}</div>
      </div>
      {actions && <div className="ui-page-heading-actions">{actions}</div>}
    </div>
  );
}
