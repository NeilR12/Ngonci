# Security Policy

Konci is a personal project, **not an audited product**. It is shared so people can
read, learn from, and improve it. Even so, security reports are very welcome — the
whole point of the project is to handle passwords carefully.

## Reporting a vulnerability

If you find a security issue, **please do not open a public GitHub issue.** Doing so
exposes the problem to everyone before it can be fixed.

Instead, report it privately to:

**aurionnusadigital@gmail.com**

Please include:

- A description of the issue and where it lives (file, endpoint, or screen).
- Steps to reproduce, or a small proof of concept.
- The potential impact as you see it.

You can expect an acknowledgement within **7 days**. I will keep you updated while the
issue is investigated and fixed, and I'm happy to credit you once it's resolved (unless
you prefer to stay anonymous).

## Scope

This policy covers the code in this repository. Issues worth reporting include, for
example:

- Anything that could expose vault contents or the master password.
- Authentication or session problems in the optional cloud-sync mode.
- Weaknesses in how data is encrypted, stored, or transmitted.

Out of scope: vulnerabilities in third-party dependencies (please report those upstream),
and issues that require an already-compromised device.

## A note on the threat model

Konci is designed so that the master password never leaves your device and the server
only ever stores ciphertext. If you believe you've found a way to break that guarantee,
that is exactly the kind of report I most want to hear about.

Thank you for helping keep the project honest.
