import type { ReactNode } from "react";

export type DocumentProps = {
  lang?: string;
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogImageAlt: string;
  twitterCard?: "summary" | "summary_large_image";
  bodyClass?: string;
  stylesheetHref: string;
  extraStylesheets?: string[];
  extraScripts?: string[];
  extraModuleScripts?: string[];
  children?: ReactNode;
};

export function Document({
  lang = "en",
  title,
  description,
  canonical,
  ogImage,
  ogImageAlt,
  twitterCard = "summary",
  bodyClass,
  stylesheetHref,
  extraStylesheets = [],
  extraScripts = [],
  extraModuleScripts = [],
  children,
}: DocumentProps) {
  return (
    <html lang={lang}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={ogImageAlt} />
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        {extraStylesheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <link rel="stylesheet" href={stylesheetHref} />
        <link rel="stylesheet" href="/assets/accessibility.css" />
        {extraScripts.map((src) => (
          <script key={src} src={src} defer />
        ))}
        {extraModuleScripts.map((src) => (
          <script key={src} type="module" src={src} />
        ))}
      </head>
      <body className={bodyClass}>{children}</body>
    </html>
  );
}
