# Security Policy

## Status

BrokerFi is **archived, unaudited, testnet-only reference software**. It is not maintained, not production-ready, and must not be used with real funds, real user data, or mainnet deployments.

There is no bug bounty, no service-level commitment, and no guarantee that vulnerabilities will be fixed.

## Reporting a vulnerability

Please report security issues **privately**. Do not open a public issue containing exploit details, private keys, credentials, or step-by-step abuse instructions.

If this snapshot is published in a GitHub repository, use GitHub's **private vulnerability reporting / security advisory** feature for that repository. Otherwise, contact the maintainer or owner of the copy you obtained through their published private channel.

Include, where possible:

- the affected file, route, or component,
- steps to reproduce,
- the impact you believe it has,
- whether the issue also affects the related contracts, relayer, or FeatherEngine repositories.

## Known risk areas in this archived code

- **Session key storage:** session private keys are written to browser IndexedDB. This was testnet-grade handling and is not suitable for production.
- **Trusted backends:** the relayer, Grok agent, subgraph, RPC provider, and Pyth endpoints are trusted external services. A malicious or compromised backend can influence what the UI displays and signs.
- **No tests:** there is no automated security test suite.
- **Historical deployments:** contract addresses and endpoints in this repository are historical testnet values. Do not assume they are controlled by the current maintainer or are safe to interact with.
- **Third-party code:** `vendor/klinecharts-pro` is vendored third-party software. Review its license and provenance before reuse.

## Secrets

This snapshot intentionally contains no API tokens or private keys. Configuration is supplied through environment variables; see `.env.example`. If you find a committed secret, treat it as compromised and report it privately.
