# Independent npm release

Use `v<package.json version>` after successful exact-source Node 22/24 main CI.
The tag workflow packs once without npm publication identity. The protected
`npm-public` stage job uploads exactly those bytes using stage-only OIDC; a
separate notification job records the stage, hash and run in an Issue/Summary.
CI never approves a stage. Publication becomes installable only after owner npm 2FA.

The initial package does not exist. npm trust configuration requires an existing
package. After approval of an exact tag-CI archive, the owner must bootstrap that
archive with local `npm stage publish`, which creates a public `0.0.0-stage`
placeholder. Then configure the owner workflow/Environment stage-only Trusted
Publisher, and approve the validated stage. No personal npm credential is copied
into CI. Do not replay an uncertain submission or create a dummy package/version.

Keep `REGISTRY_PUBLISH_ENABLED` disabled until the scoped Environment/publisher
settings are accepted. Future version tags use CI OIDC staging with the same owner
approval policy. Verify registry archive bytes and consumer behavior after approval.

Sources: https://docs.npmjs.com/staged-publishing/ and
https://docs.npmjs.com/cli/v11/commands/npm-trust/ .

After npm owner approval, the owner-local daily or manual `Verify published npm stage notices` workflow checks exact public bytes, the accepted source run and npm Sigstore provenance before closing the matching bot notification. It never approves or publishes a package, and retains pending/changed/unverified notices. No central collector or credential is used. Bootstrap releases without npm OIDC provenance require explicit manual evidence; they are not automatically accepted by this verifier.
