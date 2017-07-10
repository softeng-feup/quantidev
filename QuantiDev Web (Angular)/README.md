# QuantiDev Web
---

### Development Prerequisites

- Node.js (tested with 7.x and 8.x, other versions may or may not work)
- @angular/cli (tested with 1.0rc2 and 1.1.0, other versions may or may not work)

### Deployment Prerequisites

- HTTP server (Apache, lightppd, nginx, ...)

### Installation

1. Clone the repository;
2. Edit *src/environments/environment.ts* and *src/environments/environment.prod.ts* to point to the public URL of quantiserver;
3. Compile with ```ng build```;
4. Copy the *dist* folder to a public folder on your http server.
5. Make sure to configure your http server, as described in [Angular documentation - Server configuration](https://angular.io/guide/deployment#server-configuration)

### License

MIT
