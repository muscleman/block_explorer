export namespace VisibilityInfos {
    export class Add {
        static readonly type = '[VisibilityInfos] Add'
        constructor(public payload: any) {}
    }

    export class Get {
        static readonly type = '[VisibilityInfos] Get'
        constructor() {}
    }
}
