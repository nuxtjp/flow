# Security policy

## Reporting a vulnerability

Please do not put exploit instructions, credentials, personal data, or details
of an unpatched vulnerability in a public issue or pull request.

If the repository's **Security** tab offers **Report a vulnerability**, use
that private reporting channel. If it is unavailable, open a minimal issue
asking maintainers how to contact them privately, without disclosing the
vulnerability. No dedicated security email address is currently documented.

In a private report, include:

- Affected module, Nuxt, Vue, and Vue Flow versions
- A minimal reproduction with synthetic data
- Expected impact and the conditions needed to reproduce it
- Any known workaround or proposed fix

Do not test against systems or data you do not have permission to access.

## Scope and support

This project is in pre-release development. There is no guaranteed response
time or long-term security-support window. Compatibility ranges describe
technical requirements, not a promise to maintain every matching version.

Report Nuxt integration or lifecycle issues here. A vulnerability in
`@vue-flow/core` or another dependency should also be reported through that
upstream project's documented security channel. Coordinate disclosure before
publishing a reproduction that affects multiple projects.

## Application responsibilities

The module does not provide authentication, authorization, data validation,
or sanitization for application-defined nodes and edges. Treat graph data
as untrusted input. Validate it before persistence and avoid rendering
untrusted HTML in custom node or edge components.

Client-only rendering is not an access-control boundary. Do not include
secrets in graph data, page payloads, or fallback content sent to a browser.
