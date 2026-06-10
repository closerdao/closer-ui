# Closer

Closer is infrastructure for regenerative land projects that operate shared places, member journeys, and governance as part of a federation.

## Language

**Village**:
A land-based community or regenerative project that runs on Closer.
_Avoid_: Client, tenant, customer

**Village App**:
A generic deployable, brand-editable Closer app package that can launch many Villages without bespoke application code.
_Avoid_: Blank application, starter app, client app, whitelabel app

**Village Deployment**:
A deployed instance of the Village App connected to one Village's backend data, domain, environment, and editable configuration.
_Avoid_: Copied app, client app

**Coming Soon State**:
The neutral public state shown by a Village Deployment before a Village has published homepage content.
_Avoid_: Broken empty page, required seed homepage

**Village CMS**:
The editable content and brand layer a Village uses to manage its homepage, public pages, navigation, media, and presentation without code changes.
_Avoid_: Hardcoded pages, app-specific content

**Village Brand Kit**:
The editable identity settings for a Village, including name, logos, colors, approved font choice, navigation, primary calls to action, footer links, contact, social, and legal basics.
_Avoid_: Custom CSS, app-specific React components, arbitrary theme code

## Decisions

**Village Deployability vs Launch Readiness**:
A Village Deployment must be deployable before homepage content exists. If no homepage is available from the Village CMS, the public homepage shows the Coming Soon State and marks itself `noindex`.

Launch readiness is a stricter operational state: a Village needs valid brand configuration and either a published CMS homepage or an intentional Coming Soon State. Missing homepage data should not block deployment.
