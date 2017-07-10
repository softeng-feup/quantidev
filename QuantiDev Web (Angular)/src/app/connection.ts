export class NameKeyPair {
    name: string;
    key: string;
}

export class Service {
    name : string;
    internal : string;
    fields: [NameKeyPair];
    tip: string;
}

export class Connection {
    valid : boolean;
    username : string;
    service : Service;
}
