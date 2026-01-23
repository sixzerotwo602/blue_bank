import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@blue-banker/shared';
declare const app: import("express-serve-static-core").Express;
export declare const httpServer: import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>;
export declare const io: Server<ClientToServerEvents, ServerToClientEvents, import("socket.io").DefaultEventsMap, any>;
export default app;
//# sourceMappingURL=app.d.ts.map