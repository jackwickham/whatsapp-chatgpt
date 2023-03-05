interface XHubOptions {
    secret: string;
    algorithm?: string;
    limit?: string;
    encoding?: string;
    strict?: boolean;
    reviver?: (this: any, key: string, value: any) => any;
}

declare module "express-x-hub" {
    import { Handler } from "express";

    export default function (options: XHubOptions): Handler;

    export type XHubRequest = {
        isXHub: false,
    } | {
        isXHub: true,
        isXHubValid: () => boolean,
    }
}

